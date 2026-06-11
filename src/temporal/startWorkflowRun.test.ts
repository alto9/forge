import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkflowRunIndexStore } from './workflowRunIndex';
import {
    resetWorkflowStartInFlightGuardForTests,
} from './workflowStartInFlightGuard';
import { startWorkflowRun } from './startWorkflowRun';
import type { TemporalWorkflowStartClient } from './startWorkflowRun';
import { gateTemporalReadiness } from './temporalReadinessGate';
import { gateWorkflowRunStart } from '../workflows/validateWorkflowForRun';

vi.mock('./temporalReadinessGate', () => ({
    gateTemporalReadiness: vi.fn(async () => undefined),
}));

vi.mock('../workflows/validateWorkflowForRun', () => ({
    gateWorkflowRunStart: vi.fn(() => ({
        valid: true,
        diagnostics: [],
        workflow_id: 'refine-issue',
        path: '.ai/workflows/refine-issue.json',
    })),
}));

function createIndexStore(): { store: WorkflowRunIndexStore; root: string; windowId: string } {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-start-run-index-'));
    const windowId = `window-${path.basename(root)}`;
    return {
        store: new WorkflowRunIndexStore(root, windowId),
        root,
        windowId,
    };
}

function createMockStartClient(): TemporalWorkflowStartClient {
    return {
        async startWorkflow(input) {
            expect(input.workflowType).toBe('forgeDataDefinedWorkflow');
            expect(input.args[0]).toMatchObject({
                workflow_id: 'refine-issue',
                repositoryRoot: process.cwd(),
                run_inputs: {
                    issue_ref: 'https://github.com/alto9/forge/issues/75',
                },
            });

            return {
                workflowId: input.workflowId,
                runId: 'run-test-1',
            };
        },
        async close() {
            return undefined;
        },
    };
}

afterEach(() => {
    resetWorkflowStartInFlightGuardForTests();
    vi.clearAllMocks();
});

describe('startWorkflowRun', () => {
    it('passes normalized run_inputs to Temporal and appends a run index entry', async () => {
        const { store: indexStore, root, windowId } = createIndexStore();

        const outcome = await startWorkflowRun({
            repositoryRoot: process.cwd(),
            workflowId: 'refine-issue',
            submittedRunInputs: {
                issue_ref: 'https://github.com/alto9/forge/issues/75',
            },
            globalStoragePath: root,
            windowId,
            indexStore,
            createStartClient: async () => createMockStartClient(),
            now: () => new Date('2026-06-11T12:00:00.000Z'),
        });

        expect(outcome.ok).toBe(true);
        if (!outcome.ok) {
            return;
        }

        expect(outcome.runId).toBe('run-test-1');
        expect(outcome.startInputSummary).toContain('issue_ref:');
        expect(gateWorkflowRunStart).toHaveBeenCalled();
        expect(gateTemporalReadiness).toHaveBeenCalled();

        const entries = indexStore.listEntries();
        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({
            workflow_id: 'refine-issue',
            runId: 'run-test-1',
            startInputSummary: expect.stringContaining('issue_ref:'),
        });

        fs.rmSync(root, { recursive: true, force: true });
    });

    it('uses the no-parameters fast path with an empty run_inputs object', async () => {
        const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-start-run-empty-'));
        const workflowsDir = path.join(workspaceRoot, '.ai', 'workflows');
        fs.mkdirSync(workflowsDir, { recursive: true });
        const fixture = JSON.parse(
            fs.readFileSync(
                path.join(process.cwd(), 'src/workflows/__fixtures__/valid-minimal.json'),
                'utf8'
            )
        );
        fs.writeFileSync(
            path.join(workflowsDir, 'test-minimal.json'),
            `${JSON.stringify(fixture, null, 2)}\n`,
            'utf8'
        );

        const { store: indexStore, root, windowId } = createIndexStore();
        const startClient = vi.fn(async () => ({
            async startWorkflow(input: {
                args: [{ run_inputs: Record<string, string> }];
            }) {
                expect(input.args[0].run_inputs).toEqual({});
                return { workflowId: 'test-minimal-abc', runId: 'run-empty-1' };
            },
            async close() {
                return undefined;
            },
        }));

        const outcome = await startWorkflowRun({
            repositoryRoot: workspaceRoot,
            workflowId: 'test-minimal',
            submittedRunInputs: {},
            globalStoragePath: root,
            windowId,
            indexStore,
            createStartClient: startClient,
        });

        expect(outcome).toEqual(
            expect.objectContaining({
                ok: true,
            })
        );
        expect(startClient).toHaveBeenCalled();
        fs.rmSync(workspaceRoot, { recursive: true, force: true });
        fs.rmSync(root, { recursive: true, force: true });
    });

});
