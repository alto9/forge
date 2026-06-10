import { describe, expect, it } from 'vitest';
import {
    handleHumanAnswerUpdate,
    validateHumanAnswerUpdatePayload,
} from './humanAnswerUpdateHandler';

describe('humanAnswerUpdateHandler', () => {
    it('accepts a valid human answer update payload', () => {
        const payload = {
            envelope_version: '1.0.0',
            question_id: 'user_verification_batch',
            node_id: 'user_verification_batch',
            workflow_run_id: 'run-1',
            answers: { q1: 'yes' },
            submitted_at: '2026-06-10T12:00:00.000Z',
        };

        expect(validateHumanAnswerUpdatePayload(payload)).toEqual({ accepted: true });
        expect(handleHumanAnswerUpdate(payload)).toEqual({ accepted: true });
    });

    it('rejects unsupported envelope versions', () => {
        expect(
            validateHumanAnswerUpdatePayload({
                envelope_version: '2.0.0',
                question_id: 'user_verification_batch',
                node_id: 'user_verification_batch',
                workflow_run_id: 'run-1',
                answers: { q1: 'yes' },
                submitted_at: '2026-06-10T12:00:00.000Z',
            })
        ).toEqual({
            accepted: false,
            reason: 'Unsupported human answer envelope version.',
        });
    });
});
