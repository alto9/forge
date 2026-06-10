// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuestionPanelForm } from './QuestionPanelForm';
import {
    getPromptAccessibleName,
    getSubmitDisabledReason,
    QUESTION_PANEL_COPY,
    validateRequiredFields,
} from './questionsPresentation';
import type { PendingHumanQuestion } from '../../temporal/workflowRunProjection';

const pendingQuestion: PendingHumanQuestion = {
    question_id: 'user_verification_batch',
    node_id: 'user_verification_batch',
    node_name: 'User verification (Phase C)',
    title: 'User verification (Phase C)',
    input_mode: 'markdown_batch',
    prompts: [
        {
            field_id: 'q1',
            label: 'Should authentication use SSO only?',
            required: true,
        },
        {
            field_id: 'q2',
            label: 'Is audit logging required?',
            required: true,
            blocker: true,
        },
    ],
    batch_policy: {
        max_per_submit: 5,
        blockers_first: true,
    },
};

describe('questionsPresentation helpers', () => {
    it('formats required-field validation copy', () => {
        expect(validateRequiredFields(pendingQuestion, { q1: 'yes', q2: 'no' })).toBeUndefined();
        expect(validateRequiredFields(pendingQuestion, { q1: '', q2: 'no' })).toBe(
            QUESTION_PANEL_COPY.requiredField('Should authentication use SSO only?')
        );
    });

    it('includes Blocker badge text in accessible names', () => {
        expect(getPromptAccessibleName(pendingQuestion.prompts[1])).toBe(
            'Is audit logging required?, Blocker'
        );
    });

    it('blocks submit during recovery with contract copy', () => {
        expect(
            getSubmitDisabledReason({
                entryRecoveryState: 'recovery_pending',
                projection: {
                    recoveryState: 'recovery_pending',
                } as never,
                pendingQuestion,
            })
        ).toBe(QUESTION_PANEL_COPY.submitBlockedRecovery);
    });
});

describe('QuestionPanelForm', () => {
    it('renders prompts and batch footer', () => {
        render(
            <QuestionPanelForm
                model={{
                    header: 'refine-issue — User verification (Phase C) (user_verification_batch)',
                    workflowName: 'refine-issue',
                    pendingQuestion,
                    drafts: {},
                    batchTotal: 6,
                }}
                onDraftChange={() => undefined}
                onSubmit={() => undefined}
                onDiscardDraft={() => undefined}
            />
        );

        expect(
            screen.getByRole('textbox', {
                name: 'Should authentication use SSO only?',
            })
        ).toBeTruthy();
        expect(
            screen.getByRole('textbox', {
                name: 'Is audit logging required?, Blocker',
            })
        ).toBeTruthy();
        expect(screen.getByText('Showing 2 of 6 questions')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Submit answers' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Discard draft' })).toBeTruthy();
    });

    it('shows validation message for empty required fields', () => {
        render(
            <QuestionPanelForm
                model={{
                    header: 'refine-issue — User verification (Phase C) (user_verification_batch)',
                    workflowName: 'refine-issue',
                    pendingQuestion,
                    drafts: {},
                    validationError: QUESTION_PANEL_COPY.requiredField(
                        'Should authentication use SSO only?'
                    ),
                }}
                onDraftChange={() => undefined}
                onSubmit={() => undefined}
                onDiscardDraft={() => undefined}
            />
        );

        expect(
            screen.getByText(
                QUESTION_PANEL_COPY.requiredField('Should authentication use SSO only?')
            )
        ).toBeTruthy();
    });

    it('disables submit during recovery and shows helper text', () => {
        render(
            <QuestionPanelForm
                model={{
                    header: 'refine-issue — User verification (Phase C) (user_verification_batch)',
                    workflowName: 'refine-issue',
                    pendingQuestion,
                    drafts: {},
                    submitDisabled: true,
                    submitDisabledReason: QUESTION_PANEL_COPY.submitBlockedRecovery,
                }}
                onDraftChange={() => undefined}
                onSubmit={() => undefined}
                onDiscardDraft={() => undefined}
            />
        );

        expect(screen.getByRole('button', { name: 'Submit answers' })).toHaveProperty(
            'disabled',
            true
        );
        expect(screen.getByText(QUESTION_PANEL_COPY.submitBlockedRecovery)).toBeTruthy();
    });

    it('shows stale banner when question is no longer active', () => {
        render(
            <QuestionPanelForm
                model={{
                    header: 'refine-issue — User verification (Phase C) (user_verification_batch)',
                    workflowName: 'refine-issue',
                    pendingQuestion,
                    drafts: {},
                    stale: true,
                    submitDisabled: true,
                    submitDisabledReason: QUESTION_PANEL_COPY.staleQuestion,
                }}
                onDraftChange={() => undefined}
                onSubmit={() => undefined}
                onDiscardDraft={() => undefined}
            />
        );

        expect(screen.getByText(QUESTION_PANEL_COPY.staleQuestion)).toBeTruthy();
    });
});
