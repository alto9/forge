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
    ActivityArtifactRef,
    ActivityEnvelopeValidationResult,
    ActivityEnvelopeValidatorDiagnostic,
    ActivityFollowUpQuestion,
    ActivityValidationInputs,
    CursorSdkRequestEnvelope,
    CursorSdkResponseEnvelope,
    ExecuteCursorSdkAgentActivityInput,
} from './activityEnvelope';
export {
    validateActivityEnvelope,
    validateEnvelopeSchema,
    validateEnvelopeUnsupportedVersion,
    validateEnvelopeSize,
    ACTIVITY_ENVELOPE_SCHEMA_VALIDATOR_ID,
    ACTIVITY_ENVELOPE_UNSUPPORTED_VERSION_VALIDATOR_ID,
    ACTIVITY_ENVELOPE_SIZE_VALIDATOR_ID,
    INLINE_STRUCTURED_PAYLOAD_MAX_BYTES,
    TOTAL_ENVELOPE_MAX_BYTES,
    ENVELOPE_UNSUPPORTED_VERSION_CODE,
    ENVELOPE_SIZE_EXCEEDED_CODE,
} from './validateActivityEnvelope';
