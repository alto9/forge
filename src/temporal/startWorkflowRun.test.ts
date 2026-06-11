import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    resetWorkflowStartInFlightGuardForTests,
} from './workflowStartInFlightGuard';
import { startWorkflowRun } from './startWorkflowRun';
import type { TemporalWorkflowStartClient } from './startWorkflowRun';
import {
    gateTemporalReadiness,
    TemporalConfigurationInvalidError,
} from './temporalReadinessGate';
import { validateWorkflowForRun } from '../workflows/validateWorkflowForRun';

vi.mock('./temporalReadinessGate', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./temporalReadinessGate')>();
    return {
        ...actual,
        gateTemporalReadiness: vi.fn(async () => undefined),
    };
});

vi.mock('../workflows/validateWorkflowForRun', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../workflows/validateWorkflowForRun')>();
    return {
        ...actual,
        validateWorkflowForRun: vi.fn(actual.validateWorkflowForRun),
    };
});

function createTempGlobalStorage(): { root: string; windowId: string } {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-start-run-'));
    const windowId = `window-${path.basename(root)}`;
    return { root, windowId };
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
    it('passes normalized run_inputs to Temporal and returns Temporal identity', async () => {
        const { root, windowId } = createTempGlobalStorage();

        const outcome = await startWorkflowRun({
            repositoryRoot: process.cwd(),
            workflowId: 'refine-issue',
            submittedRunInputs: {
                issue_ref: 'https://github.com/alto9/forge/issues/75',
            },
            globalStoragePath: root,
            windowId,
            createStartClient: async () => createMockStartClient(),
            now: () => new Date('2026-06-11T12:00:00.000Z'),
        });

        expect(outcome.ok).toBe(true);
        if (!outcome.ok) {
            return;
        }

        expect(outcome).toMatchObject({
            runId: 'run-test-1',
            namespace: expect.any(String),
            taskQueue: expect.any(String),
            mode: expect.any(String),
            definitionVersion: expect.any(String),
            repositoryRoot: process.cwd(),
            run_inputs: {
                issue_ref: 'https://github.com/alto9/forge/issues/75',
            },
            startedAt: '2026-06-11T12:00:00.000Z',
        });
        expect(outcome.startInputSummary).toContain('issue_ref:');
        expect(validateWorkflowForRun).toHaveBeenCalled();
        expect(gateTemporalReadiness).toHaveBeenCalled();

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

        const { root, windowId } = createTempGlobalStorage();
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
            createStartClient: startClient,
        });

        expect(outcome).toEqual(
            expect.objectContaining({
                ok: true,
                runId: 'run-empty-1',
            })
        );
        expect(startClient).toHaveBeenCalled();
        fs.rmSync(workspaceRoot, { recursive: true, force: true });
        fs.rmSync(root, { recursive: true, force: true });
    });

    it('blocks before Temporal readiness when required run inputs are missing', async () => {
        const { root, windowId } = createTempGlobalStorage();
        const startClient = vi.fn(async () => createMockStartClient());

        const outcome = await startWorkflowRun({
            repositoryRoot: process.cwd(),
            workflowId: 'refine-issue',
            submittedRunInputs: {},
            globalStoragePath: root,
            windowId,
            createStartClient: startClient,
        });

        expect(outcome).toEqual({
            ok: false,
            diagnostics: expect.arrayContaining([
                expect.objectContaining({
                    code: 'run_input.required_missing',
                    path: '/run_inputs/issue_ref',
                }),
            ]),
        });
        expect(gateTemporalReadiness).not.toHaveBeenCalled();
        expect(startClient).not.toHaveBeenCalled();

        fs.rmSync(root, { recursive: true, force: true });
    });

    it('blocks undeclared submitted keys before Temporal start', async () => {
        const { root, windowId } = createTempGlobalStorage();
        const startClient = vi.fn(async () => createMockStartClient());
        const secretValue = 'undeclared-secret-value-xyz';

        const outcome = await startWorkflowRun({
            repositoryRoot: process.cwd(),
            workflowId: 'refine-issue',
            submittedRunInputs: {
                issue_ref: 'https://github.com/alto9/forge/issues/76',
                rogue_key: secretValue,
            },
            globalStoragePath: root,
            windowId,
            createStartClient: startClient,
        });

        expect(outcome.ok).toBe(false);
        if (outcome.ok) {
            return;
        }

        expect(outcome.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'run_input.undeclared_key',
                    path: '/run_inputs/rogue_key',
                }),
            ])
        );
        expect(JSON.stringify(outcome.diagnostics)).not.toContain(secretValue);
        expect(gateTemporalReadiness).not.toHaveBeenCalled();
        expect(startClient).not.toHaveBeenCalled();

        fs.rmSync(root, { recursive: true, force: true });
    });

    it('returns readiness diagnostics instead of throwing when Temporal readiness fails', async () => {
        const { root, windowId } = createTempGlobalStorage();
        vi.mocked(gateTemporalReadiness).mockRejectedValueOnce(
            new TemporalConfigurationInvalidError([
                {
                    code: 'forge.temporal.configuration_invalid',
                    severity: 'error',
                    path: 'forge.temporal.worker',
                    message: 'Worker is not ready.',
                    validator_id: 'forge.temporal.readiness',
                },
            ])
        );

        const outcome = await startWorkflowRun({
            repositoryRoot: process.cwd(),
            workflowId: 'refine-issue',
            submittedRunInputs: {
                issue_ref: 'https://github.com/alto9/forge/issues/75',
            },
            globalStoragePath: root,
            windowId,
            createStartClient: async () => createMockStartClient(),
        });

        expect(outcome).toEqual({
            ok: false,
            diagnostics: [
                expect.objectContaining({
                    code: 'forge.temporal.configuration_invalid',
                    path: 'forge.temporal.worker',
                }),
            ],
        });

        fs.rmSync(root, { recursive: true, force: true });
    });

    it('blocks duplicate in-flight starts for the same workflow and payload', async () => {
        const { root, windowId } = createTempGlobalStorage();
        let resolveStart: (() => void) | undefined;
        const startGate = new Promise<void>((resolve) => {
            resolveStart = resolve;
        });

        vi.mocked(gateTemporalReadiness).mockImplementationOnce(async () => {
            await startGate;
        });

        const firstStart = startWorkflowRun({
            repositoryRoot: process.cwd(),
            workflowId: 'refine-issue',
            submittedRunInputs: {
                issue_ref: 'https://github.com/alto9/forge/issues/75',
            },
            globalStoragePath: root,
            windowId,
            createStartClient: async () => createMockStartClient(),
        });

        const duplicate = await startWorkflowRun({
            repositoryRoot: process.cwd(),
            workflowId: 'refine-issue',
            submittedRunInputs: {
                issue_ref: 'https://github.com/alto9/forge/issues/75',
            },
            globalStoragePath: root,
            windowId,
            createStartClient: async () => createMockStartClient(),
        });

        expect(duplicate).toEqual({
            ok: false,
            inFlight: true,
            diagnostics: [
                expect.objectContaining({
                    code: 'forge.workflow.start_in_flight',
                }),
            ],
        });

        resolveStart?.();
        await firstStart;

        fs.rmSync(root, { recursive: true, force: true });
    });

    it('returns definition validation diagnostics without calling Temporal readiness', async () => {
        const { root, windowId } = createTempGlobalStorage();
        vi.mocked(validateWorkflowForRun).mockReturnValueOnce({
            valid: false,
            diagnostics: [
                {
                    code: 'forge.workflow.schema_invalid',
                    severity: 'error',
                    path: '.ai/workflows/broken.json',
                    message: 'Schema validation failed.',
                    validator_id: 'forge.workflow.schema',
                },
            ],
            workflow_id: 'broken',
            path: '.ai/workflows/broken.json',
        });

        const outcome = await startWorkflowRun({
            repositoryRoot: process.cwd(),
            workflowId: 'broken',
            submittedRunInputs: {},
            globalStoragePath: root,
            windowId,
        });

        expect(outcome.ok).toBe(false);
        if (outcome.ok) {
            return;
        }

        expect(outcome.diagnostics[0]?.code).toBe('forge.workflow.schema_invalid');
        expect(gateTemporalReadiness).not.toHaveBeenCalled();

        fs.rmSync(root, { recursive: true, force: true });
    });
});
