import { status as grpcStatus } from '@grpc/grpc-js';
import { isGrpcServiceError } from '@temporalio/client';
import type { PendingHumanQuestion } from './workflowRunProjection';
import type { TemporalRecoveryClient } from './temporalRecoveryScan';

export const DEFAULT_HUMAN_ANSWER_UPDATE = 'forge.human_answer.submit';
export const HUMAN_ANSWER_ENVELOPE_VERSION = '1.0.0';

export interface HumanAnswerSubmitPayload {
    envelope_version: string;
    question_id: string;
    node_id: string;
    workflow_run_id: string;
    answers: Record<string, string>;
    submitted_at: string;
}

export interface HumanAnswerSubmitClient {
    executeUpdate(
        namespace: string,
        workflowId: string,
        runId: string,
        updateName: string,
        payload: HumanAnswerSubmitPayload
    ): Promise<void>;
}

export class HumanAnswerSubmitError extends Error {
    readonly panelReason: string;

    constructor(panelReason: string, message?: string) {
        super(message ?? panelReason);
        this.name = 'HumanAnswerSubmitError';
        this.panelReason = panelReason;
    }
}

export function buildHumanAnswerSubmitPayload(input: {
    questionId: string;
    nodeId: string;
    runId: string;
    answers: Record<string, string>;
    submittedAt?: string;
}): HumanAnswerSubmitPayload {
    return {
        envelope_version: HUMAN_ANSWER_ENVELOPE_VERSION,
        question_id: input.questionId,
        node_id: input.nodeId,
        workflow_run_id: input.runId,
        answers: input.answers,
        submitted_at: input.submittedAt ?? new Date().toISOString(),
    };
}

export function mapTemporalHumanAnswerError(error: unknown): HumanAnswerSubmitError {
    if (error instanceof HumanAnswerSubmitError) {
        return error;
    }

    if (isGrpcServiceError(error)) {
        switch (error.code) {
            case grpcStatus.INVALID_ARGUMENT:
                return new HumanAnswerSubmitError(
                    'The submitted answers were rejected by the workflow.',
                    error.message
                );
            case grpcStatus.FAILED_PRECONDITION:
                return new HumanAnswerSubmitError(
                    'This question is no longer active for this run.',
                    error.message
                );
            case grpcStatus.NOT_FOUND:
                return new HumanAnswerSubmitError(
                    'The workflow run could not be found. Refresh the run list and try again.',
                    error.message
                );
            default:
                return new HumanAnswerSubmitError(
                    'Forge could not submit your answers. Try again after refreshing the run.',
                    error.message
                );
        }
    }

    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('validation') || message.includes('invalid')) {
            return new HumanAnswerSubmitError(
                'The submitted answers were rejected by the workflow.',
                error.message
            );
        }
    }

    return new HumanAnswerSubmitError(
        'Forge could not submit your answers. Try again after refreshing the run.',
        error instanceof Error ? error.message : String(error)
    );
}

export function createHumanAnswerSubmitClient(
    recoveryClient: TemporalRecoveryClient
): HumanAnswerSubmitClient {
    return {
        async executeUpdate(namespace, workflowId, runId, updateName, payload) {
            await recoveryClient.executeWorkflowUpdate(
                namespace,
                workflowId,
                runId,
                updateName,
                payload
            );
        },
    };
}

export function resolveHumanAnswerUpdateName(
    pendingQuestion: Pick<PendingHumanQuestion, 'resume_update'>
): string {
    return pendingQuestion.resume_update ?? DEFAULT_HUMAN_ANSWER_UPDATE;
}

export async function submitHumanAnswer(
    client: HumanAnswerSubmitClient,
    input: {
        namespace: string;
        workflowId: string;
        runId: string;
        updateName?: string;
        payload: Pick<HumanAnswerSubmitPayload, 'question_id' | 'node_id' | 'answers'>;
        submittedAt?: string;
    }
): Promise<void> {
    const payload = buildHumanAnswerSubmitPayload({
        questionId: input.payload.question_id,
        nodeId: input.payload.node_id,
        runId: input.runId,
        answers: input.payload.answers,
        submittedAt: input.submittedAt,
    });

    try {
        await client.executeUpdate(
            input.namespace,
            input.workflowId,
            input.runId,
            input.updateName ?? DEFAULT_HUMAN_ANSWER_UPDATE,
            payload
        );
    } catch (error) {
        throw mapTemporalHumanAnswerError(error);
    }
}
