import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    hasRecoveryScanCompletedThisSession,
    registerTemporalRecoveryCoordinator,
    resetRecoveryScanSessionForTests,
} from './temporalRecoveryCoordinator';
import type { TemporalRecoveryClient } from './temporalRecoveryScan';
import { WorkflowRunIndexStore } from './workflowRunIndex';

const tempDirs: string[] = [];

function createTempGlobalStorage(): { globalStoragePath: string; windowId: string } {
    const globalStoragePath = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-recovery-coordinator-'));
    tempDirs.push(globalStoragePath);
    return { globalStoragePath, windowId: 'window-coordinator-1' };
}

function createMockClient(): TemporalRecoveryClient {
    return {
        describeWorkflow: vi.fn(async () => ({
            status: { name: 'RUNNING', code: 1 },
            closeTime: undefined,
        })),
        fetchHistory: vi.fn(async () => ({ events: [] })),
        close: vi.fn(async () => undefined),
    };
}

afterEach(() => {
    resetRecoveryScanSessionForTests();
    while (tempDirs.length > 0) {
        const tempDir = tempDirs.pop();
        if (tempDir) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
});

describe('temporalRecoveryCoordinator', () => {
    it('marks entries unreachable before combined readiness and scans once when ready', async () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        const seedStore = new WorkflowRunIndexStore(globalStoragePath, windowId);
        seedStore.appendRunStartEntry({
            namespace: 'forge-local',
            workflowId: 'wf-1',
            runId: 'run-1',
            taskQueue: 'forge-workflows',
            workflow_id: 'refine-issue',
            repositoryRoot: '/repo',
            mode: 'managedLocal',
        });

        const client = createMockClient();
        const createRecoveryClient = vi.fn(async () => client);

        const coordinator = registerTemporalRecoveryCoordinator(
            {
                subscriptions: [],
            } as import('vscode').ExtensionContext,
            {
                windowId,
                globalStoragePath,
                log: () => undefined,
                createRecoveryClient,
            }
        );

        const readStore = () => new WorkflowRunIndexStore(globalStoragePath, windowId);

        coordinator.onReadinessChanged({ temporalReady: false, workerReady: false });
        expect(readStore().getEntry('forge-local:wf-1:run-1')?.recoveryState).toBe('unreachable');

        coordinator.onReadinessChanged({ temporalReady: true, workerReady: true });
        await vi.waitFor(() => {
            expect(hasRecoveryScanCompletedThisSession()).toBe(true);
        });

        expect(readStore().getEntry('forge-local:wf-1:run-1')?.recoveryState).toBe('synced');
        expect(createRecoveryClient).toHaveBeenCalledOnce();

        coordinator.onReadinessChanged({ temporalReady: true, workerReady: true });
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(createRecoveryClient).toHaveBeenCalledOnce();
    });
});
