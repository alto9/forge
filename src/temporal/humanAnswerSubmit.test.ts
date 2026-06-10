import { status as grpcStatus } from '@grpc/grpc-js';
import { describe, expect, it, vi } from 'vitest';
import {
    DEFAULT_HUMAN_ANSWER_UPDATE,
    HUMAN_ANSWER_ENVELOPE_VERSION,
    buildHumanAnswerSubmitPayload,
    createHumanAnswerSubmitClient,
    mapTemporalHumanAnswerError,
    resolveHumanAnswerUpdateName,
    submitHumanAnswer,
} from './humanAnswerSubmit';
import type { TemporalRecoveryClient } from './temporalRecoveryScan';

function createGrpcServiceError(code: grpcStatus, message: string): Error {
    return Object.assign(new Error(message), {
        code,
        details: message,
        metadata: {},
    });
}

describe('humanAnswerSubmit', () => {
    it('routes answer submission through the declared Temporal workflow update', async () => {
        const executeWorkflowUpdate = vi.fn(async () => undefined);
        const recoveryClient: TemporalRecoveryClient = {
            describeWorkflow: vi.fn(),
            fetchHistory: vi.fn(),
            terminateWorkflow: vi.fn(),
            executeWorkflowUpdate,
            close: vi.fn(),
        };

        const client = createHumanAnswerSubmitClient(recoveryClient);

        await submitHumanAnswer(client, {
            namespace: 'forge-local',
            workflowId: 'wf-1',
            runId: 'run-1',
            payload: {
                question_id: 'user_verification_batch',
                node_id: 'human-1',
                answers: { q1: 'yes' },
            },
            submittedAt: '2026-06-10T12:00:00.000Z',
        });

        expect(executeWorkflowUpdate).toHaveBeenCalledWith(
            'forge-local',
            'wf-1',
            'run-1',
            DEFAULT_HUMAN_ANSWER_UPDATE,
            {
                envelope_version: HUMAN_ANSWER_ENVELOPE_VERSION,
                question_id: 'user_verification_batch',
                node_id: 'human-1',
                workflow_run_id: 'run-1',
                answers: { q1: 'yes' },
                submitted_at: '2026-06-10T12:00:00.000Z',
            }
        );
    });

    it('honors resume_update override from pending question metadata', () => {
        expect(
            resolveHumanAnswerUpdateName({
                resume_update: 'custom.human_answer.submit',
            })
        ).toBe('custom.human_answer.submit');
        expect(resolveHumanAnswerUpdateName({})).toBe(DEFAULT_HUMAN_ANSWER_UPDATE);
    });

    it('builds the serialization contract payload shape', () => {
        expect(
            buildHumanAnswerSubmitPayload({
                questionId: 'user_verification_batch',
                nodeId: 'user_verification_batch',
                runId: 'run-1',
                answers: { q1: 'yes' },
                submittedAt: '2026-06-10T12:00:00.000Z',
            })
        ).toEqual({
            envelope_version: '1.0.0',
            question_id: 'user_verification_batch',
            node_id: 'user_verification_batch',
            workflow_run_id: 'run-1',
            answers: { q1: 'yes' },
            submitted_at: '2026-06-10T12:00:00.000Z',
        });
    });

    it('maps Temporal validation errors to panel-facing reasons', () => {
        const mapped = mapTemporalHumanAnswerError(
            createGrpcServiceError(grpcStatus.INVALID_ARGUMENT, 'invalid answers')
        );
        expect(mapped.panelReason).toBe('The submitted answers were rejected by the workflow.');
    });
});
