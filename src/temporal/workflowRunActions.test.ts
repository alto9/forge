import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    cancelWorkflowRun,
    dismissOrphanedWorkflowRun,
    evaluateHumanInputSubmit,
    evaluateWorkflowRunAction,
    isHumanInputRequired,
} from './workflowRunActions';
import { readWorkflowRunProjection, resolveProjectionPath } from './workflowRunProjection';
import { WorkflowRunIndexStore } from './workflowRunIndex';
import type { TemporalRecoveryClient } from './temporalRecoveryScan';
import {
    formatHumanInputBlockedMessage,
    formatRunActionsBlockedMessage,
} from './temporalPresentation';

const tempDirs: string[] = [];

function createTempGlobalStorage(): { globalStoragePath: string; windowId: string } {
    const globalStoragePath = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-actions-'));
    tempDirs.push(globalStoragePath);
    return { globalStoragePath, windowId: 'window-actions-1' };
}

function createEntry(store: WorkflowRunIndexStore) {
    return store.appendRunStartEntry({
        namespace: 'forge-local',
        workflowId: 'wf-1',
        runId: 'run-1',
        taskQueue: 'forge-workflows',
        workflow_id: 'refine-issue',
        repositoryRoot: '/repo',
        mode: 'managedLocal',
    });
}

function createMockClient(): TemporalRecoveryClient {
    return {
        describeWorkflow: vi.fn(async () => ({
            status: { name: 'TERMINATED', code: 5 },
            closeTime: new Date('2026-06-10T12:00:00.000Z'),
        })),
        fetchHistory: vi.fn(async () => ({ events: [] })),
        terminateWorkflow: vi.fn(async () => undefined),
        executeWorkflowUpdate: vi.fn(async () => undefined),
        close: vi.fn(async () => undefined),
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

describe('workflowRunActions', () => {
    it('blocks cancel, dismiss, and human input while recovery is pending', () => {
        const entry = {
            namespace: 'forge-local',
            workflowId: 'wf-1',
            runId: 'run-1',
            taskQueue: 'forge-workflows',
            workflow_id: 'refine-issue',
            repositoryRoot: '/repo',
            mode: 'managedLocal' as const,
            startedAt: '2026-06-01T00:00:00.000Z',
            recoveryState: 'recovery_pending' as const,
            terminal: false,
        };

        expect(evaluateWorkflowRunAction(entry, 'cancel').reason).toBe(
            formatRunActionsBlockedMessage()
        );
        expect(evaluateWorkflowRunAction(entry, 'dismiss').allowed).toBe(false);
        expect(evaluateHumanInputSubmit(entry).reason).toBe(formatHumanInputBlockedMessage());
    });

    it('allows cancel only for synced non-terminal runs', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        const entry = createEntry(store);

        expect(evaluateWorkflowRunAction(entry, 'cancel').allowed).toBe(false);

        store.updateEntry('forge-local:wf-1:run-1', { recoveryState: 'synced' });
        const synced = store.getEntry('forge-local:wf-1:run-1')!;
        expect(evaluateWorkflowRunAction(synced, 'cancel').allowed).toBe(true);
    });

    it('allows dismiss only for orphaned entries', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        const entry = createEntry(store);

        expect(evaluateWorkflowRunAction(entry, 'dismiss').allowed).toBe(false);

        store.updateEntry('forge-local:wf-1:run-1', { recoveryState: 'orphaned' });
        const orphaned = store.getEntry('forge-local:wf-1:run-1')!;
        expect(evaluateWorkflowRunAction(orphaned, 'dismiss').allowed).toBe(true);
    });

    it('detects human input required from pending questions on synced runs', () => {
        const projection = {
            namespace: 'forge-local',
            workflowId: 'wf-1',
            runId: 'run-1',
            taskQueue: 'forge-workflows',
            workflow_id: 'refine-issue',
            repositoryRoot: '/repo',
            mode: 'managedLocal' as const,
            recoveryState: 'synced' as const,
            lastSyncedAt: '2026-06-10T00:00:00.000Z',
            terminal: false,
            temporalStatus: 'RUNNING' as const,
            completedNodeIds: [],
            skippedNodeIds: [],
            cancelled: false,
            validationSummaries: [],
            pendingHumanQuestions: [
                {
                    question_id: 'user_verification_batch',
                    node_id: 'human-1',
                    node_name: 'Verify answers',
                },
            ],
        };

        expect(isHumanInputRequired(projection)).toBe(true);
        expect(
            evaluateHumanInputSubmit(
                {
                    ...projection,
                    startedAt: projection.lastSyncedAt,
                    recoveryState: 'synced',
                    terminal: false,
                },
                projection
            ).allowed
        ).toBe(true);
    });

    it('cancels a synced run through Temporal terminate and marks the index terminal', async () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        const entry = createEntry(store);
        store.updateEntry('forge-local:wf-1:run-1', { recoveryState: 'synced' });
        const synced = store.getEntry('forge-local:wf-1:run-1')!;
        const client = createMockClient();

        await cancelWorkflowRun(synced, {
            indexStore: store,
            globalStoragePath,
            windowId,
            client,
            now: () => new Date('2026-06-10T12:00:00.000Z'),
        });

        expect(client.terminateWorkflow).toHaveBeenCalledOnce();
        expect(store.getEntry('forge-local:wf-1:run-1')?.terminal).toBe(true);
        const projection = readWorkflowRunProjection(
            resolveProjectionPath(globalStoragePath, windowId, 'forge-local:wf-1:run-1')
        );
        expect(projection?.temporalStatus).toBe('TERMINATED');
    });

    it('dismisses orphaned entries and removes projection files without Temporal calls', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        const entry = createEntry(store);
        store.updateEntry('forge-local:wf-1:run-1', { recoveryState: 'orphaned' });
        const orphaned = store.getEntry('forge-local:wf-1:run-1')!;
        const projectionPath = resolveProjectionPath(
            globalStoragePath,
            windowId,
            'forge-local:wf-1:run-1'
        );
        fs.mkdirSync(path.dirname(projectionPath), { recursive: true });
        fs.writeFileSync(projectionPath, '{}');

        expect(
            dismissOrphanedWorkflowRun(orphaned, {
                indexStore: store,
                globalStoragePath,
                windowId,
            })
        ).toBe(true);
        expect(store.listEntries()).toHaveLength(0);
        expect(fs.existsSync(projectionPath)).toBe(false);
    });
});
