import type { ActivityNodePolicyRefs } from '../workflows/activityPolicyRegistry';
import type { ExecuteCursorSdkAgentActivityInput } from './activityEnvelope';
import { executeCursorSdkAgentActivity } from './executeCursorSdkAgentActivity';
import { mapEnvelopeToActivityFailure } from './mapEnvelopeToActivityFailure';

export interface RegisteredCursorSdkAgentActivityInput extends ExecuteCursorSdkAgentActivityInput {
    policyRefs?: ActivityNodePolicyRefs;
}

async function executeRegisteredCursorSdkAgentActivity(
    input: RegisteredCursorSdkAgentActivityInput
): Promise<ReturnType<typeof executeCursorSdkAgentActivity>> {
    const response = await executeCursorSdkAgentActivity(input);
    const failure = mapEnvelopeToActivityFailure(response, input.policyRefs);
    if (failure) {
        throw failure;
    }
    return response;
}

export function createWorkerActivities() {
    return {
        executeCursorSdkAgentActivity: executeRegisteredCursorSdkAgentActivity,
    };
}

export { executeCursorSdkAgentActivity } from './executeCursorSdkAgentActivity';
export { buildTemporalActivityOptions } from './temporalActivityPolicyOptions';
export { mapEnvelopeToActivityFailure } from './mapEnvelopeToActivityFailure';
export type {
    CursorSdkRequestEnvelope,
    CursorSdkResponseEnvelope,
    ExecuteCursorSdkAgentActivityInput,
} from './activityEnvelope';
