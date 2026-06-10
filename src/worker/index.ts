import type { ActivityNodePolicyRefs } from '../workflows/activityPolicyRegistry';
import type { ExecuteCursorSdkAgentActivityInput } from './activityEnvelope';
import { executeCursorSdkAgentActivity } from './executeCursorSdkAgentActivity';
import {
    executeValidationGateActivity,
    type ExecuteValidationGateActivityInput,
} from './executeValidationGateActivity';
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

async function executeRegisteredValidationGateActivity(
    input: ExecuteValidationGateActivityInput
): Promise<ReturnType<typeof executeValidationGateActivity>> {
    return executeValidationGateActivity(input);
}

export function createWorkerActivities() {
    return {
        executeCursorSdkAgentActivity: executeRegisteredCursorSdkAgentActivity,
        executeValidationGate: executeRegisteredValidationGateActivity,
    };
}

export { executeCursorSdkAgentActivity } from './executeCursorSdkAgentActivity';
export {
    executeValidationGateActivity,
    VALIDATION_GATE_ACTIVITY_ID,
} from './executeValidationGateActivity';
export type { ExecuteValidationGateActivityInput } from './executeValidationGateActivity';
export {
    buildTemporalActivityOptions,
    buildValidationGateActivityOptions,
    VALIDATION_GATE_POLICY_REFS,
} from './temporalActivityPolicyOptions';
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
export {
    assembleRuntimeValidationResult,
    executeRegisteredValidator,
    getValidatorExecutor,
    isRuntimeCatalogValidatorId,
    RUNTIME_CATALOG_VALIDATOR_IDS,
    validateRuntimeValidationResultSchema,
} from '../validation';
export {
    handleHumanAnswerUpdate,
    HUMAN_ANSWER_UPDATE_HANDLER,
    validateHumanAnswerUpdatePayload,
} from './humanAnswerUpdateHandler';
export type {
    HumanAnswerUpdateHandlerInput,
    HumanAnswerUpdateHandlerResult,
} from './humanAnswerUpdateHandler';
export type {
    RuntimeValidationDiagnostic,
    RuntimeValidationResult,
    RuntimeValidatorOutcome,
    ValidatorExecutorContext,
    WorkflowArtifactDefinition,
} from '../validation';
