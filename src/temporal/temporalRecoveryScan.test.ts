import { status as grpcStatus } from '@grpc/grpc-js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    classifyTemporalRefreshError,
    markNonTerminalIndexEntriesUnreachable,
    refreshIndexedRunFromTemporal,
    runRecoveryScan,
    type TemporalRecoveryClient,
} from './temporalRecoveryScan';
import { readWorkflowRunProjection, resolveProjectionPath } from './workflowRunProjection';
import { WorkflowRunIndexStore } from './workflowRunIndex';

const tempDirs: string[] = [];

function createTempGlobalStorage(): { globalStoragePath: string; windowId: string } {
    const globalStoragePath = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-recovery-scan-'));
    tempDirs.push(globalStoragePath);
    return { globalStoragePath, windowId: 'window-recovery-1' };
}

function createGrpcServiceError(code: grpcStatus, message: string): Error {
    return Object.assign(new Error(message), {
        code,
        details: message,
        metadata: {},
    });
}

function createMockClient(
    behavior: Partial<TemporalRecoveryClient> = {}
): TemporalRecoveryClient {
    return {
        describeWorkflow: vi.fn(async () => ({
            status: { name: 'RUNNING', code: 1 },
            closeTime: undefined,
        })),
        fetchHistory: vi.fn(async () => ({ events: [] })),
        close: vi.fn(async () => undefined),
        ...behavior,
    };
}

afterEach(() => {
    while (tempDirs.length > 0) {
        const tempDir = tempDirs.pop();
        if (tempDir) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
});

describe('temporalRecoveryScan', () => {
    it('classifies NOT_FOUND as orphaned and other errors as refresh_failed', () => {
        expect(
            classifyTemporalRefreshError(
                createGrpcServiceError(grpcStatus.NOT_FOUND, 'workflow not found')
            ).recoveryState
        ).toBe('orphaned');

        expect(
            classifyTemporalRefreshError(
                createGrpcServiceError(grpcStatus.PERMISSION_DENIED, 'permission denied')
            ).recoveryState
        ).toBe('refresh_failed');
    });

    it('marks non-terminal entries unreachable when readiness is not satisfied', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        store.appendRunStartEntry({
            namespace: 'forge-local',
            workflowId: 'wf-1',
            runId: 'run-1',
            taskQueue: 'forge-workflows',
            workflow_id: 'refine-issue',
            repositoryRoot: '/repo',
            mode: 'managedLocal',
        });

        const logs: string[] = [];
        const updated = markNonTerminalIndexEntriesUnreachable(store, {
            windowId,
            log: (line) => logs.push(line),
        });

        expect(updated).toBe(1);
        expect(store.getEntry('forge-local:wf-1:run-1')?.recoveryState).toBe('unreachable');
        expect(logs.some((line) => line.includes('recoveryState=unreachable'))).toBe(true);
    });

    it('refreshes a non-terminal entry to synced and overwrites stale projection', async () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        const entry = store.appendRunStartEntry({
            namespace: 'forge-local',
            workflowId: 'wf-1',
            runId: 'run-1',
            taskQueue: 'forge-workflows',
            workflow_id: 'refine-issue',
            repositoryRoot: '/repo',
            mode: 'managedLocal',
        });

        const projectionPath = resolveProjectionPath(
            globalStoragePath,
            windowId,
            'forge-local:wf-1:run-1'
        );
        fs.mkdirSync(path.dirname(projectionPath), { recursive: true });
        fs.writeFileSync(
            projectionPath,
            JSON.stringify({
                ...entry,
                recoveryState: 'recovery_pending',
                lastSyncedAt: '2020-01-01T00:00:00.000Z',
                temporalStatus: 'UNKNOWN',
                completedNodeIds: [],
                skippedNodeIds: [],
                cancelled: false,
                validationSummaries: [],
                pendingHumanQuestions: [],
            })
        );

        const client = createMockClient();
        const logs: string[] = [];

        const outcome = await refreshIndexedRunFromTemporal(entry, {
            indexStore: store,
            globalStoragePath,
            windowId,
            client,
            log: (line) => logs.push(line),
            now: () => new Date('2026-06-10T12:00:00.000Z'),
        });

        expect(outcome.recoveryState).toBe('synced');
        expect(store.getEntry('forge-local:wf-1:run-1')?.recoveryState).toBe('synced');
        expect(store.getEntry('forge-local:wf-1:run-1')?.lastSyncedAt).toBe('2026-06-10T12:00:00.000Z');

        const projection = readWorkflowRunProjection(projectionPath);
        expect(projection?.recoveryState).toBe('synced');
        expect(projection?.lastSyncedAt).toBe('2026-06-10T12:00:00.000Z');
        expect(projection?.temporalStatus).toBe('RUNNING');
        expect(client.describeWorkflow).toHaveBeenCalledOnce();
        expect(client.fetchHistory).toHaveBeenCalledOnce();
        expect(logs.some((line) => line.includes('recoveryState=synced'))).toBe(true);
    });

    it('sets orphaned when Temporal reports workflow not found', async () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        const entry = store.appendRunStartEntry({
            namespace: 'forge-local',
            workflowId: 'wf-missing',
            runId: 'run-missing',
            taskQueue: 'forge-workflows',
            workflow_id: 'refine-issue',
            repositoryRoot: '/repo',
            mode: 'managedLocal',
        });

        const client = createMockClient({
            describeWorkflow: vi.fn(async () => {
                throw createGrpcServiceError(grpcStatus.NOT_FOUND, 'workflow not found');
            }),
        });

        const outcome = await refreshIndexedRunFromTemporal(entry, {
            indexStore: store,
            globalStoragePath,
            windowId,
            client,
            log: () => undefined,
        });

        expect(outcome.recoveryState).toBe('orphaned');
        expect(store.getEntry('forge-local:wf-missing:run-missing')?.recoveryState).toBe('orphaned');
    });

    it('runs recovery scan for each non-terminal entry and closes the Temporal client', async () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        store.appendRunStartEntry({
            namespace: 'forge-local',
            workflowId: 'wf-1',
            runId: 'run-1',
            taskQueue: 'forge-workflows',
            workflow_id: 'refine-issue',
            repositoryRoot: '/repo',
            mode: 'managedLocal',
        });

        const client = createMockClient();

        await runRecoveryScan({
            windowId,
            globalStoragePath,
            indexStore: store,
            log: () => undefined,
            createClient: async () => client,
        });

        expect(client.describeWorkflow).toHaveBeenCalledOnce();
        expect(client.close).toHaveBeenCalledOnce();
        expect(store.getEntry('forge-local:wf-1:run-1')?.recoveryState).toBe('synced');
    });
});
