import { describe, expect, it } from 'vitest';
import {
    buildQuestionPanelWebviewModel,
    QUESTION_PANEL_COPY,
    validateRequiredFields,
} from './questionsPresentation';
import type { PendingHumanQuestion } from '../../temporal/workflowRunProjection';

const pendingQuestion: PendingHumanQuestion = {
    question_id: 'q1',
    node_id: 'human-1',
    node_name: 'Verify scope',
    title: 'Verify scope',
    input_mode: 'single_text',
    prompts: [{ field_id: 'answer', label: 'Confirm the API contract', required: true }],
};

describe('buildQuestionPanelWebviewModel', () => {
    it('marks submit disabled when recovery is pending', () => {
        const model = buildQuestionPanelWebviewModel({
            workflowName: 'refine-issue',
            pendingQuestion,
            drafts: {},
            entryRecoveryState: 'recovery_pending',
            projection: {
                recoveryState: 'recovery_pending',
                waitingNodeId: 'human-1',
            } as never,
        });

        expect(model.submitDisabled).toBe(true);
        expect(model.submitDisabledReason).toBe(QUESTION_PANEL_COPY.submitBlockedRecovery);
    });

    it('returns validation copy for empty required answers', () => {
        expect(validateRequiredFields(pendingQuestion, { answer: '   ' })).toBe(
            QUESTION_PANEL_COPY.requiredField('Confirm the API contract')
        );
    });
});
