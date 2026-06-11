import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkflowRunListProvider } from './WorkflowRunListProvider';
import { persistAcceptedWorkflowRun } from './persistAcceptedWorkflowRun';
import {
    registerWorkflowRunRecoveryContext,
    type WorkflowRunRecoveryContext,
} from './workflowRunRecoveryService';
import { WorkflowRunIndexStore } from './workflowRunIndex';
import type { StartWorkflowRunOutcome } from './startWorkflowRun';
import * as workflowRunRecoveryService from './workflowRunRecoveryService';

function createTempGlobalStorage(): { globalStoragePath: string; windowId: string } {
    const globalStoragePath = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-list-'));
    const windowId = `window-${path.basename(globalStoragePath)}`;
    return { globalStoragePath, windowId };
}

function createSuccessfulStartOutcome(
    overrides: Partial<Extract<StartWorkflowRunOutcome, { ok: true }>> = {}
): Extract<StartWorkflowRunOutcome, { ok: true }> {
    return {
        ok: true,
        workflowId: 'refine-issue-abc',
        runId: 'run-test-1',
        namespace: 'forge-local',
        taskQueue: 'forge',
        mode: 'managedLocal',
        definitionVersion: '1.0.0',
        repositoryRoot: '/repo/forge',
        run_inputs: { issue_ref: 'https://github.com/alto9/forge/issues/81' },
        startedAt: '2026-06-11T12:00:00.000Z',
        ...overrides,
    };
}

function registerRecoveryContext(
    globalStoragePath: string,
    windowId: string,
    indexStore?: WorkflowRunIndexStore
): WorkflowRunRecoveryContext {
    const context: WorkflowRunRecoveryContext = {
        windowId,
        globalStoragePath,
        log: vi.fn(),
        indexStore: indexStore ?? new WorkflowRunIndexStore(globalStoragePath, windowId),
        createRecoveryClient: vi.fn(),
        isReady: () => true,
    };
    registerWorkflowRunRecoveryContext(context);
    return context;
}

describe('WorkflowRunListProvider', () => {
    const tempRoots: string[] = [];
    const providers: WorkflowRunListProvider[] = [];

    afterEach(() => {
        vi.restoreAllMocks();
        while (providers.length > 0) {
            providers.pop()?.dispose();
        }
        for (const root of tempRoots.splice(0)) {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    function createProvider(): WorkflowRunListProvider {
        const provider = new WorkflowRunListProvider();
        providers.push(provider);
        return provider;
    }

    it('starts empty when no runs are indexed', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        tempRoots.push(globalStoragePath);
        registerRecoveryContext(globalStoragePath, windowId);
        const provider = createProvider();

        expect(provider.getChildren()).toEqual([]);
    });

    it('refreshes after a successful start persists a recovery_pending entry', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        tempRoots.push(globalStoragePath);
        const context = registerRecoveryContext(globalStoragePath, windowId);
        const provider = createProvider();
        const refreshEvents: unknown[] = [];
        provider.onDidChangeTreeData(() => refreshEvents.push(undefined));

        expect(provider.getChildren()).toEqual([]);

        persistAcceptedWorkflowRun({
            workflow_id: 'refine-issue',
            startOutcome: createSuccessfulStartOutcome(),
            indexStore: context.indexStore,
        });

        expect(refreshEvents).toHaveLength(1);

        const items = provider.getChildren();
        expect(items).toHaveLength(1);
        expect(items[0]?.indexKey).toBe('forge-local:refine-issue-abc:run-test-1');
        expect(items[0]?.description).toContain('Recovering');
        expect(items[0]?.contextValue).toBe('recoveryPending');
    });

    it('orders runs by startedAt with the newest entry first', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        tempRoots.push(globalStoragePath);
        const context = registerRecoveryContext(globalStoragePath, windowId);
        const provider = createProvider();

        persistAcceptedWorkflowRun({
            workflow_id: 'refine-issue',
            startOutcome: createSuccessfulStartOutcome({
                workflowId: 'older-run',
                runId: 'run-old',
                startedAt: '2026-06-10T12:00:00.000Z',
            }),
            indexStore: context.indexStore,
        });
        persistAcceptedWorkflowRun({
            workflow_id: 'refine-issue',
            startOutcome: createSuccessfulStartOutcome({
                workflowId: 'newer-run',
                runId: 'run-new',
                startedAt: '2026-06-11T12:00:00.000Z',
            }),
            indexStore: context.indexStore,
        });

        const items = provider.getChildren();
        expect(items.map((item) => item.indexKey)).toEqual([
            'forge-local:newer-run:run-new',
            'forge-local:older-run:run-old',
        ]);
    });

    it('does not refresh when index persistence fails after Temporal accepted the run', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        tempRoots.push(globalStoragePath);
        const indexPath = path.join(globalStoragePath, 'temporal', windowId, 'run-index.json');
        fs.mkdirSync(path.dirname(indexPath), { recursive: true });
        fs.writeFileSync(indexPath, '{"version":1,"entries":{}}\n', 'utf8');
        fs.chmodSync(path.dirname(indexPath), 0o555);

        const context = registerRecoveryContext(globalStoragePath, windowId);
        const provider = createProvider();
        const refreshEvents: unknown[] = [];
        provider.onDidChangeTreeData(() => refreshEvents.push(undefined));

        const outcome = persistAcceptedWorkflowRun({
            workflow_id: 'refine-issue',
            startOutcome: createSuccessfulStartOutcome(),
            indexStore: context.indexStore,
        });

        fs.chmodSync(path.dirname(indexPath), 0o755);

        expect(outcome.ok).toBe(false);
        expect(refreshEvents).toHaveLength(0);
        expect(provider.getChildren()).toEqual([]);
    });

    it('does not refresh when a blocked or failed start never persists an index entry', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        tempRoots.push(globalStoragePath);
        registerRecoveryContext(globalStoragePath, windowId);
        const provider = createProvider();
        const refreshEvents: unknown[] = [];
        provider.onDidChangeTreeData(() => refreshEvents.push(undefined));
        const notifySpy = vi.spyOn(workflowRunRecoveryService, 'notifyWorkflowRunIndexChanged');

        expect(provider.getChildren()).toEqual([]);
        expect(notifySpy).not.toHaveBeenCalled();
        expect(refreshEvents).toHaveLength(0);
    });
});
