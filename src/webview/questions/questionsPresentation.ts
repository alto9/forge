import type { RecoveryState } from '../../temporal/workflowRunIndex';
import type {
    PendingHumanQuestion,
    PendingHumanQuestionPrompt,
    WorkflowRunProjection,
} from '../../temporal/workflowRunProjection';

export type QuestionPanelEmptyState = 'no_pending' | 'terminal' | 'no_run';

export type QuestionPanelWebviewModel = {
    header: string;
    workflowName: string;
    pendingQuestion?: PendingHumanQuestion;
    drafts: Record<string, string>;
    emptyState?: QuestionPanelEmptyState;
    stale?: boolean;
    recoveryState?: RecoveryState;
    submitDisabled?: boolean;
    submitDisabledReason?: string;
    validationError?: string;
    statusMessage?: string;
    batchTotal?: number;
    submitting?: boolean;
};

export const QUESTION_PANEL_COPY = {
    requiredField: (label: string) => `Answer required for: ${label}`,
    submitBlockedRecovery: 'Submit answers after the run finishes recovering.',
    submitSuccess: 'Answers submitted — run resuming.',
    submitRejected: (reason: string) => `Could not submit answers — ${reason}. Try again.`,
    staleQuestion: 'This question is no longer active for this run.',
    runTerminal: 'This run has finished — question panel closed.',
    noPending: 'No questions are waiting for this run.',
    blockerBadge: 'Blocker',
    submitAnswers: 'Submit answers',
    discardDraft: 'Discard draft',
    batchFooter: (shown: number, total: number) => `Showing ${shown} of ${total} questions`,
} as const;

export function formatQuestionPanelHeader(
    workflowName: string,
    question: PendingHumanQuestion
): string {
    return `${workflowName} — ${question.node_name} (${question.question_id})`;
}

export function getPromptAccessibleName(prompt: PendingHumanQuestionPrompt): string {
    if (prompt.blocker) {
        return `${prompt.label}, ${QUESTION_PANEL_COPY.blockerBadge}`;
    }
    return prompt.label;
}

export function validateRequiredFields(
    question: PendingHumanQuestion,
    answers: Record<string, string>
): string | undefined {
    for (const prompt of question.prompts) {
        if (!prompt.required) {
            continue;
        }
        const value = answers[prompt.field_id]?.trim() ?? '';
        if (value.length === 0) {
            return QUESTION_PANEL_COPY.requiredField(prompt.label);
        }
    }
    return undefined;
}

export function getSubmitDisabledReason(input: {
    entryRecoveryState: RecoveryState;
    projection?: WorkflowRunProjection;
    pendingQuestion?: PendingHumanQuestion;
    stale?: boolean;
    submitting?: boolean;
}): string | undefined {
    if (input.submitting) {
        return undefined;
    }

    if (input.stale) {
        return QUESTION_PANEL_COPY.staleQuestion;
    }

    if (
        input.entryRecoveryState === 'recovery_pending' ||
        input.entryRecoveryState === 'refresh_failed' ||
        input.entryRecoveryState === 'unreachable' ||
        input.entryRecoveryState !== 'synced'
    ) {
        return QUESTION_PANEL_COPY.submitBlockedRecovery;
    }

    if (input.projection?.terminal) {
        return QUESTION_PANEL_COPY.runTerminal;
    }

    if (!input.pendingQuestion) {
        return QUESTION_PANEL_COPY.noPending;
    }

    if (
        input.projection?.waitingNodeId &&
        input.projection.waitingNodeId !== input.pendingQuestion.node_id
    ) {
        return QUESTION_PANEL_COPY.staleQuestion;
    }

    return undefined;
}

export function shouldShowBatchFooter(
    question: PendingHumanQuestion,
    batchTotal?: number
): boolean {
    if (question.input_mode !== 'markdown_batch' || batchTotal === undefined) {
        return false;
    }
    return batchTotal > question.prompts.length;
}

export function buildQuestionPanelWebviewModel(input: {
    workflowName: string;
    projection?: WorkflowRunProjection;
    pendingQuestion?: PendingHumanQuestion;
    drafts: Record<string, string>;
    entryRecoveryState: RecoveryState;
    stale?: boolean;
    validationError?: string;
    statusMessage?: string;
    submitting?: boolean;
    batchTotal?: number;
    emptyState?: QuestionPanelEmptyState;
}): QuestionPanelWebviewModel {
    const submitDisabledReason = getSubmitDisabledReason({
        entryRecoveryState: input.entryRecoveryState,
        projection: input.projection,
        pendingQuestion: input.pendingQuestion,
        stale: input.stale,
        submitting: input.submitting,
    });

    if (input.emptyState) {
        return {
            header: input.workflowName,
            workflowName: input.workflowName,
            emptyState: input.emptyState,
            drafts: {},
            recoveryState: input.projection?.recoveryState ?? input.entryRecoveryState,
            statusMessage: input.statusMessage,
        };
    }

    if (!input.pendingQuestion) {
        return {
            header: input.workflowName,
            workflowName: input.workflowName,
            emptyState: 'no_pending',
            drafts: {},
            recoveryState: input.projection?.recoveryState ?? input.entryRecoveryState,
            statusMessage: input.statusMessage ?? QUESTION_PANEL_COPY.noPending,
        };
    }

    return {
        header: formatQuestionPanelHeader(input.workflowName, input.pendingQuestion),
        workflowName: input.workflowName,
        pendingQuestion: input.pendingQuestion,
        drafts: input.drafts,
        stale: input.stale,
        recoveryState: input.projection?.recoveryState ?? input.entryRecoveryState,
        submitDisabled: submitDisabledReason !== undefined || input.submitting === true,
        submitDisabledReason,
        validationError: input.validationError,
        statusMessage: input.statusMessage,
        batchTotal: input.batchTotal,
        submitting: input.submitting,
    };
}
