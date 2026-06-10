import type { TemporalRecoveryClient } from './temporalRecoveryScan';

export const DEFAULT_HUMAN_ANSWER_UPDATE = 'forge.human_answer.submit';

export interface HumanAnswerSubmitPayload {
    question_id: string;
    node_id: string;
    answers: Record<string, string>;
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

export async function submitHumanAnswer(
    client: HumanAnswerSubmitClient,
    input: {
        namespace: string;
        workflowId: string;
        runId: string;
        updateName?: string;
        payload: HumanAnswerSubmitPayload;
    }
): Promise<void> {
    await client.executeUpdate(
        input.namespace,
        input.workflowId,
        input.runId,
        input.updateName ?? DEFAULT_HUMAN_ANSWER_UPDATE,
        input.payload
    );
}
