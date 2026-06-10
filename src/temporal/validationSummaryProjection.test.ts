import { describe, expect, it } from 'vitest';
import {
    appendValidationSummary,
    mapRuntimeValidationResultToSummary,
} from './validationSummaryProjection';
import type { WorkflowRunProjection } from './workflowRunProjection';

function baseProjection(): WorkflowRunProjection {
    return {
        namespace: 'forge-local',
        workflowId: 'wf-1',
        runId: 'run-1',
        taskQueue: 'forge-workflows',
        workflow_id: 'refine-issue',
        repositoryRoot: '/repo',
        mode: 'managedLocal',
        recoveryState: 'synced',
        lastSyncedAt: '2026-06-10T00:00:00.000Z',
        terminal: false,
        temporalStatus: 'RUNNING',
        completedNodeIds: [],
        skippedNodeIds: [],
        cancelled: false,
        validationSummaries: [],
        pendingHumanQuestions: [],
    };
}

describe('validationSummaryProjection', () => {
    it('maps RuntimeValidationResult to ValidationSummary with redacted diagnostics', () => {
        const summary = mapRuntimeValidationResultToSummary(
            {
                valid: false,
                node_id: 'validate_triage_artifacts',
                workflow_run_id: 'run-1',
                source_activity_node_id: 'triage_questions',
                validated_at: '2026-06-10T12:00:00.000Z',
                diagnostics: [
                    {
                        code: 'forge.artifact.missing',
                        severity: 'error',
                        message: 'artifact user_questions not found',
                        validator_id: 'forge.artifact.exists',
                        path: 'user_questions',
                    },
                ],
                validator_outcomes: [
                    {
                        validator_id: 'forge.artifact.exists',
                        type: 'artifact',
                        target: 'user_questions',
                        passed: false,
                        blocking: true,
                        diagnostics: [
                            {
                                code: 'forge.artifact.missing',
                                severity: 'error',
                                message: 'artifact user_questions not found',
                                validator_id: 'forge.artifact.exists',
                                path: 'user_questions',
                            },
                        ],
                    },
                ],
            },
            'Validate triage artifacts'
        );

        expect(summary.node_name).toBe('Validate triage artifacts');
        expect(summary.valid).toBe(false);
        expect(summary.source_activity_node_id).toBe('triage_questions');
        expect(summary.validator_outcomes).toEqual([
            {
                validator_id: 'forge.artifact.exists',
                type: 'artifact',
                target: 'user_questions',
                passed: false,
                blocking: true,
            },
        ]);
        expect(summary.diagnostics).toEqual([
            {
                code: 'forge.artifact.missing',
                severity: 'error',
                message: 'artifact user_questions not found',
                validator_id: 'forge.artifact.exists',
                path: 'user_questions',
            },
        ]);
    });

    it('appends validation summaries and sets failedNodeId on validation failure', () => {
        const summary = mapRuntimeValidationResultToSummary(
            {
                valid: false,
                node_id: 'validate_exit_criteria',
                workflow_run_id: 'run-1',
                validated_at: '2026-06-10T12:00:00.000Z',
                diagnostics: [],
                validator_outcomes: [],
            },
            'Validate refine-issue exit criteria'
        );

        const updated = appendValidationSummary(baseProjection(), summary);

        expect(updated.validationSummaries).toHaveLength(1);
        expect(updated.validationSummaries[0]?.node_id).toBe('validate_exit_criteria');
        expect(updated.failedNodeId).toBe('validate_exit_criteria');
    });

    it('does not set failedNodeId when validation passes', () => {
        const summary = mapRuntimeValidationResultToSummary(
            {
                valid: true,
                node_id: 'validate_triage_artifacts',
                workflow_run_id: 'run-1',
                validated_at: '2026-06-10T12:00:00.000Z',
                diagnostics: [],
                validator_outcomes: [],
            },
            'Validate triage artifacts'
        );

        const updated = appendValidationSummary(baseProjection(), summary);

        expect(updated.validationSummaries).toHaveLength(1);
        expect(updated.failedNodeId).toBeUndefined();
    });
});
