import { describe, expect, it, vi } from 'vitest';
import {
    DEFAULT_HUMAN_ANSWER_UPDATE,
    createHumanAnswerSubmitClient,
    submitHumanAnswer,
} from './humanAnswerSubmit';
import type { TemporalRecoveryClient } from './temporalRecoveryScan';

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
        const payload = {
            question_id: 'user_verification_batch',
            node_id: 'human-1',
            answers: { q1: 'yes' },
        };

        await submitHumanAnswer(client, {
            namespace: 'forge-local',
            workflowId: 'wf-1',
            runId: 'run-1',
            payload,
        });

        expect(executeWorkflowUpdate).toHaveBeenCalledWith(
            'forge-local',
            'wf-1',
            'run-1',
            DEFAULT_HUMAN_ANSWER_UPDATE,
            payload
        );
    });
});
