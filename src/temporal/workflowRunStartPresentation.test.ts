import { describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { TEMPORAL_READINESS_VALIDATOR_ID } from './temporalReadinessGate';
import {
    WORKFLOW_START_IN_FLIGHT_VALIDATOR_ID,
    type StartWorkflowRunOutcome,
} from './startWorkflowRun';
import { WORKFLOW_RUN_INPUT_VALIDATOR_ID } from '../workflows/validateSubmittedRunInputs';
import {
    classifyWorkflowRunStartFailure,
    formatWorkflowRunStartCatalogMessage,
    presentWorkflowRunStartFailure,
} from './workflowRunStartPresentation';

function failedOutcome(
    overrides: Partial<Extract<StartWorkflowRunOutcome, { ok: false }>> = {}
): Extract<StartWorkflowRunOutcome, { ok: false }> {
    return {
        ok: false,
        diagnostics: [],
        ...overrides,
    };
}

describe('workflowRunStartPresentation', () => {
    it('classifies blocked and failed start outcomes', () => {
        expect(
            classifyWorkflowRunStartFailure(
                failedOutcome({
                    diagnostics: [
                        {
                            code: 'forge.workflow.schema_invalid',
                            severity: 'error',
                            path: '.ai/workflows/broken.json',
                            message: 'Schema validation failed.',
                            validator_id: 'forge.workflow.schema',
                        },
                    ],
                })
            )
        ).toBe('definition_invalid');

        expect(
            classifyWorkflowRunStartFailure(
                failedOutcome({
                    diagnostics: [
                        {
                            code: 'forge.workflow.run_input.required',
                            severity: 'error',
                            path: '/run_inputs/issue_ref',
                            message: 'Required run input "issue_ref" is missing or empty.',
                            validator_id: WORKFLOW_RUN_INPUT_VALIDATOR_ID,
                        },
                    ],
                })
            )
        ).toBe('run_input_invalid');

        expect(
            classifyWorkflowRunStartFailure(
                failedOutcome({
                    diagnostics: [
                        {
                            code: 'forge.temporal.configuration_invalid',
                            severity: 'error',
                            path: 'forge.temporal.managedLocal',
                            message: 'Temporal is not ready.',
                            validator_id: TEMPORAL_READINESS_VALIDATOR_ID,
                        },
                    ],
                })
            )
        ).toBe('temporal_not_ready');

        expect(
            classifyWorkflowRunStartFailure(
                failedOutcome({
                    diagnostics: [
                        {
                            code: 'forge.temporal.configuration_invalid',
                            severity: 'error',
                            path: 'forge.temporal.worker',
                            message: 'Worker is not ready.',
                            validator_id: TEMPORAL_READINESS_VALIDATOR_ID,
                        },
                    ],
                })
            )
        ).toBe('worker_not_ready');

        expect(
            classifyWorkflowRunStartFailure(
                failedOutcome({
                    inFlight: true,
                    diagnostics: [
                        {
                            code: 'forge.workflow.start_in_flight',
                            severity: 'error',
                            path: '/run_inputs',
                            message: 'Already in progress.',
                            validator_id: WORKFLOW_START_IN_FLIGHT_VALIDATOR_ID,
                        },
                    ],
                })
            )
        ).toBe('start_in_flight');

        expect(
            classifyWorkflowRunStartFailure(
                failedOutcome({
                    diagnostics: [
                        {
                            code: 'forge.temporal.start_failed',
                            severity: 'error',
                            path: 'forge.temporal',
                            message: 'Task queue unavailable.',
                            validator_id: TEMPORAL_READINESS_VALIDATOR_ID,
                        },
                    ],
                })
            )
        ).toBe('temporal_start_failed');
    });

    it('uses contract catalog copy for each failure kind', () => {
        expect(
            formatWorkflowRunStartCatalogMessage(
                failedOutcome({
                    diagnostics: [
                        {
                            code: 'forge.workflow.schema_invalid',
                            severity: 'error',
                            path: '.ai/workflows/broken.json',
                            message: 'Schema validation failed.',
                            validator_id: 'forge.workflow.schema',
                        },
                    ],
                })
            )
        ).toBe('Fix validation errors before starting a run.');

        expect(
            formatWorkflowRunStartCatalogMessage(
                failedOutcome({
                    diagnostics: [
                        {
                            code: 'forge.workflow.run_input.required',
                            severity: 'error',
                            path: '/run_inputs/issue_ref',
                            message: 'Required run input "issue_ref" is missing or empty.',
                            validator_id: WORKFLOW_RUN_INPUT_VALIDATOR_ID,
                        },
                    ],
                })
            )
        ).toBe('Complete required inputs before starting this workflow.');

        expect(
            formatWorkflowRunStartCatalogMessage(
                failedOutcome({
                    diagnostics: [
                        {
                            code: 'forge.temporal.configuration_invalid',
                            severity: 'error',
                            path: 'forge.temporal.worker',
                            message: 'Worker is not ready.',
                            validator_id: TEMPORAL_READINESS_VALIDATOR_ID,
                        },
                    ],
                })
            )
        ).toBe(
            'Workflow runs are blocked until the Forge worker is ready. See Forge Temporal output for details.'
        );

        expect(
            formatWorkflowRunStartCatalogMessage(
                failedOutcome({
                    inFlight: true,
                    diagnostics: [
                        {
                            code: 'forge.workflow.start_in_flight',
                            severity: 'error',
                            path: '/run_inputs',
                            message: 'Already in progress.',
                            validator_id: WORKFLOW_START_IN_FLIGHT_VALIDATOR_ID,
                        },
                    ],
                })
            )
        ).toBe('Starting workflow run…');

        expect(
            formatWorkflowRunStartCatalogMessage(
                failedOutcome({
                    diagnostics: [
                        {
                            code: 'forge.temporal.start_failed',
                            severity: 'error',
                            path: 'forge.temporal',
                            message: 'Task queue unavailable.',
                            validator_id: TEMPORAL_READINESS_VALIDATOR_ID,
                        },
                    ],
                })
            )
        ).toBe('Could not start workflow run — Task queue unavailable.');
    });

    it('logs diagnostics and shows notifications without double-notifying readiness blockers', () => {
        const log = vi.fn();

        const readiness = presentWorkflowRunStartFailure({
            workflowId: 'refine-issue',
            outcome: failedOutcome({
                diagnostics: [
                    {
                        code: 'forge.temporal.configuration_invalid',
                        severity: 'error',
                        path: 'forge.temporal.managedLocal',
                        message: 'Temporal is not ready.',
                        validator_id: TEMPORAL_READINESS_VALIDATOR_ID,
                    },
                ],
            }),
            log,
        });

        expect(readiness.catalogMessage).toBe(
            'Workflow runs are blocked until Temporal is ready. See Forge Temporal output for details.'
        );
        expect(readiness.inFlight).toBe(false);
        expect(log).toHaveBeenCalledWith(expect.stringContaining('[forge.workflow.start]'));
        expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
        expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();

        vi.mocked(vscode.window.showWarningMessage).mockClear();
        vi.mocked(vscode.window.showErrorMessage).mockClear();
        log.mockClear();

        const definitionBlocked = presentWorkflowRunStartFailure({
            workflowId: 'broken',
            outcome: failedOutcome({
                diagnostics: [
                    {
                        code: 'forge.workflow.schema_invalid',
                        severity: 'error',
                        path: '.ai/workflows/broken.json',
                        message: 'Schema validation failed.',
                        validator_id: 'forge.workflow.schema',
                    },
                ],
            }),
            log,
        });

        expect(definitionBlocked.catalogMessage).toBe(
            'Fix validation errors before starting a run.'
        );
        expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
            'Fix validation errors before starting a run.'
        );

        vi.mocked(vscode.window.showWarningMessage).mockClear();
        log.mockClear();

        const failedStart = presentWorkflowRunStartFailure({
            workflowId: 'refine-issue',
            outcome: failedOutcome({
                diagnostics: [
                    {
                        code: 'forge.temporal.start_failed',
                        severity: 'error',
                        path: 'forge.temporal',
                        message: 'Task queue unavailable.',
                        validator_id: TEMPORAL_READINESS_VALIDATOR_ID,
                    },
                ],
            }),
            log,
        });

        expect(failedStart.catalogMessage).toBe(
            'Could not start workflow run — Task queue unavailable.'
        );
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
            'Could not start workflow run — Task queue unavailable.'
        );
        expect(log).toHaveBeenCalledWith(expect.stringContaining('code=forge.temporal.start_failed'));
    });
});
