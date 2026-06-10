import type * as vscode from 'vscode';
import { writeHumanAnswerArtifactTargets } from './humanAnswerArtifactWrites';
import { clearHumanAnswerDraft } from './humanAnswerDraft';
import {
    HumanAnswerSubmitError,
    resolveHumanAnswerUpdateName,
    submitHumanAnswer,
    type HumanAnswerSubmitClient,
} from './humanAnswerSubmit';
import type { PendingHumanQuestion, WorkflowRunProjection } from './workflowRunProjection';
import { evaluateHumanInputSubmit } from './workflowRunActions';
import type { WorkflowRunIndexEntry } from './workflowRunIndex';

export function validateHumanAnswerFields(
    pendingQuestion: PendingHumanQuestion,
    answers: Record<string, string>
): { valid: boolean; reason?: string } {
    for (const prompt of pendingQuestion.prompts) {
        if (!prompt.required) {
            continue;
        }

        const answer = answers[prompt.field_id]?.trim() ?? '';
        if (answer.length === 0) {
            return {
                valid: false,
                reason: `Answer required for "${prompt.label}".`,
            };
        }
    }

    return { valid: true };
}

export function validateHumanAnswerSubmitGuards(
    entry: WorkflowRunIndexEntry,
    projection: WorkflowRunProjection,
    pendingQuestion: PendingHumanQuestion
): { allowed: boolean; reason?: string } {
    const submitState = evaluateHumanInputSubmit(entry, projection);
    if (!submitState.allowed) {
        return submitState;
    }

    if (projection.waitingNodeId !== pendingQuestion.node_id) {
        return {
            allowed: false,
            reason: 'This question is no longer active for this run.',
        };
    }

    return { allowed: true };
}

export async function orchestrateHumanAnswerSubmit(input: {
    entry: WorkflowRunIndexEntry;
    projection: WorkflowRunProjection;
    pendingQuestion: PendingHumanQuestion;
    answers: Record<string, string>;
    client: HumanAnswerSubmitClient;
    workspaceState?: vscode.Memento;
    submittedAt?: string;
}): Promise<void> {
    const guard = validateHumanAnswerSubmitGuards(
        input.entry,
        input.projection,
        input.pendingQuestion
    );
    if (!guard.allowed) {
        throw new HumanAnswerSubmitError(guard.reason ?? 'Submit is blocked for this run.');
    }

    const fieldValidation = validateHumanAnswerFields(input.pendingQuestion, input.answers);
    if (!fieldValidation.valid) {
        throw new HumanAnswerSubmitError(
            fieldValidation.reason ?? 'One or more required answers are missing.'
        );
    }

    writeHumanAnswerArtifactTargets(
        input.entry.repositoryRoot,
        input.pendingQuestion,
        input.answers
    );

    try {
        await submitHumanAnswer(input.client, {
            namespace: input.entry.namespace,
            workflowId: input.entry.workflowId,
            runId: input.entry.runId,
            updateName: resolveHumanAnswerUpdateName(input.pendingQuestion),
            payload: {
                question_id: input.pendingQuestion.question_id,
                node_id: input.pendingQuestion.node_id,
                answers: input.answers,
            },
            submittedAt: input.submittedAt,
        });
    } catch (error) {
        throw error instanceof HumanAnswerSubmitError
            ? error
            : new HumanAnswerSubmitError('Forge could not submit your answers.');
    }

    clearHumanAnswerDraft(
        input.workspaceState,
        input.entry,
        input.pendingQuestion.question_id
    );
}
