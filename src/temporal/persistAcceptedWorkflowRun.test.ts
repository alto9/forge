import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { persistAcceptedWorkflowRun } from './persistAcceptedWorkflowRun';
import {
    buildRunIndexKey,
    readWorkflowRunIndexFile,
    resolveRunIndexPath,
    WorkflowRunIndexStore,
} from './workflowRunIndex';
import * as workflowRunRecoveryService from './workflowRunRecoveryService';
import type { StartWorkflowRunOutcome } from './startWorkflowRun';

function createTempGlobalStorage(): { globalStoragePath: string; windowId: string } {
    const globalStoragePath = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-persist-run-'));
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
        run_inputs: { issue_ref: 'https://github.com/alto9/forge/issues/79' },
        startedAt: '2026-06-11T12:00:00.000Z',
        startInputSummary: 'issue_ref: https://github.com/alto9/forge/issues/79',
        ...overrides,
    };
}

describe('persistAcceptedWorkflowRun', () => {
    const tempRoots: string[] = [];

    afterEach(() => {
        vi.restoreAllMocks();
        for (const root of tempRoots.splice(0)) {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    it('appends a recovery_pending entry and notifies the Workflow Runs view', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        tempRoots.push(globalStoragePath);
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        const notifySpy = vi.spyOn(workflowRunRecoveryService, 'notifyWorkflowRunIndexChanged');

        const outcome = persistAcceptedWorkflowRun({
            workflow_id: 'refine-issue',
            startOutcome: createSuccessfulStartOutcome(),
            indexStore: store,
        });

        expect(outcome).toEqual({
            ok: true,
            indexKey: 'forge-local:refine-issue-abc:run-test-1',
        });
        expect(notifySpy).toHaveBeenCalledTimes(1);

        const index = readWorkflowRunIndexFile(resolveRunIndexPath(globalStoragePath, windowId));
        expect(index.entries['forge-local:refine-issue-abc:run-test-1']).toMatchObject({
            namespace: 'forge-local',
            workflowId: 'refine-issue-abc',
            runId: 'run-test-1',
            taskQueue: 'forge',
            workflow_id: 'refine-issue',
            repositoryRoot: '/repo/forge',
            mode: 'managedLocal',
            startedAt: '2026-06-11T12:00:00.000Z',
            startInputSummary: 'issue_ref: https://github.com/alto9/forge/issues/79',
            recoveryState: 'recovery_pending',
            terminal: false,
        });
    });

    it('does not append when the index already contains the Temporal identity key', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        tempRoots.push(globalStoragePath);
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        const startOutcome = createSuccessfulStartOutcome();
        const notifySpy = vi.spyOn(workflowRunRecoveryService, 'notifyWorkflowRunIndexChanged');
        const logs: string[] = [];

        store.appendRunStartEntry({
            namespace: startOutcome.namespace,
            workflowId: startOutcome.workflowId,
            runId: startOutcome.runId,
            taskQueue: startOutcome.taskQueue,
            workflow_id: 'refine-issue',
            repositoryRoot: startOutcome.repositoryRoot,
            mode: startOutcome.mode,
            startedAt: startOutcome.startedAt,
        });
        notifySpy.mockClear();

        const outcome = persistAcceptedWorkflowRun({
            workflow_id: 'refine-issue',
            startOutcome,
            indexStore: store,
            log: (line) => logs.push(line),
        });

        expect(outcome.ok).toBe(false);
        if (outcome.ok) {
            return;
        }

        expect(outcome.diagnostics[0]).toMatchObject({
            code: 'forge.workflow.run_index.duplicate_key',
            validator_id: 'forge.workflow.run_index',
        });
        expect(notifySpy).not.toHaveBeenCalled();
        expect(logs.join('\n')).toContain('workflowId=refine-issue-abc');
        expect(logs.join('\n')).toContain('runId=run-test-1');

        const index = readWorkflowRunIndexFile(resolveRunIndexPath(globalStoragePath, windowId));
        expect(Object.keys(index.entries)).toHaveLength(1);
    });

    it('reports a post-start diagnostic when index persistence fails after Temporal accepted the run', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        tempRoots.push(globalStoragePath);
        const indexPath = resolveRunIndexPath(globalStoragePath, windowId);
        fs.mkdirSync(path.dirname(indexPath), { recursive: true });
        fs.writeFileSync(indexPath, '{"version":1,"entries":{}}\n', 'utf8');
        fs.chmodSync(path.dirname(indexPath), 0o555);

        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        const notifySpy = vi.spyOn(workflowRunRecoveryService, 'notifyWorkflowRunIndexChanged');
        const logs: string[] = [];

        const outcome = persistAcceptedWorkflowRun({
            workflow_id: 'refine-issue',
            startOutcome: createSuccessfulStartOutcome(),
            indexStore: store,
            log: (line) => logs.push(line),
        });

        fs.chmodSync(path.dirname(indexPath), 0o755);

        expect(outcome.ok).toBe(false);
        if (outcome.ok) {
            return;
        }

        expect(outcome.diagnostics[0]).toMatchObject({
            code: 'forge.workflow.run_index.write_failed',
            validator_id: 'forge.workflow.run_index',
        });
        expect(notifySpy).not.toHaveBeenCalled();
        expect(logs.join('\n')).toContain('taskQueue=forge');
        expect(readWorkflowRunIndexFile(indexPath).entries).toEqual({});
    });

    it('exposes the indexed entry for recovery projection lookup by Temporal identity', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        tempRoots.push(globalStoragePath);
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        const startOutcome = createSuccessfulStartOutcome({
            workflowId: 'wf-recovery',
            runId: 'run-recovery',
            namespace: 'default',
        });

        const outcome = persistAcceptedWorkflowRun({
            workflow_id: 'refine-issue',
            startOutcome,
            indexStore: store,
        });

        expect(outcome.ok).toBe(true);
        if (!outcome.ok) {
            return;
        }

        const key = buildRunIndexKey('default', 'wf-recovery', 'run-recovery');
        expect(store.getEntry(key)).toMatchObject({
            workflow_id: 'refine-issue',
            recoveryState: 'recovery_pending',
            terminal: false,
        });
    });
});
