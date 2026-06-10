/**
 * Worker-side integration point for Temporal workflow update `forge.human_answer.submit`.
 *
 * Workflow orchestration packages should register an update handler that:
 * 1. Validates payload shape per `.ai/data/serialization.md` **Human answer submission**.
 * 2. Confirms `question_id` and `node_id` match the active human_question wait.
 * 3. Unblocks the waiting workflow node and records answers in workflow state.
 *
 * The VS Code extension sends updates through `submitHumanAnswer` in
 * `src/temporal/humanAnswerSubmit.ts`; this stub documents the worker contract until
 * workflow orchestration milestones wire the handler in the worker bundle.
 */
export const HUMAN_ANSWER_UPDATE_HANDLER = 'forge.human_answer.submit';

export interface HumanAnswerUpdateHandlerInput {
    envelope_version: string;
    question_id: string;
    node_id: string;
    workflow_run_id: string;
    answers: Record<string, string>;
    submitted_at: string;
}

export interface HumanAnswerUpdateHandlerResult {
    accepted: boolean;
    reason?: string;
}

export function validateHumanAnswerUpdatePayload(
    payload: HumanAnswerUpdateHandlerInput
): HumanAnswerUpdateHandlerResult {
    if (payload.envelope_version !== '1.0.0') {
        return {
            accepted: false,
            reason: 'Unsupported human answer envelope version.',
        };
    }

    if (!payload.question_id.trim() || !payload.node_id.trim()) {
        return {
            accepted: false,
            reason: 'question_id and node_id are required.',
        };
    }

    if (!payload.workflow_run_id.trim()) {
        return {
            accepted: false,
            reason: 'workflow_run_id is required.',
        };
    }

    if (!payload.submitted_at.trim()) {
        return {
            accepted: false,
            reason: 'submitted_at is required.',
        };
    }

    for (const [fieldId, answer] of Object.entries(payload.answers)) {
        if (!fieldId.trim()) {
            return {
                accepted: false,
                reason: 'Answer field ids must be non-empty.',
            };
        }

        if (typeof answer !== 'string') {
            return {
                accepted: false,
                reason: `Answer for "${fieldId}" must be a string.`,
            };
        }
    }

    return { accepted: true };
}

export function handleHumanAnswerUpdate(
    payload: HumanAnswerUpdateHandlerInput
): HumanAnswerUpdateHandlerResult {
    const validation = validateHumanAnswerUpdatePayload(payload);
    if (!validation.accepted) {
        return validation;
    }

    return {
        accepted: true,
    };
}
