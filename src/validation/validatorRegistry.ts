import {
    ACTIVITY_ENVELOPE_SCHEMA_VALIDATOR_ID,
    ACTIVITY_ENVELOPE_SIZE_VALIDATOR_ID,
    ACTIVITY_ENVELOPE_UNSUPPORTED_VERSION_VALIDATOR_ID,
} from '../worker/validateActivityEnvelope';
import type {
    RuntimeValidatorOutcome,
    RuntimeValidatorType,
    RuntimeValidationDiagnostic,
    RuntimeValidationResult,
    ValidationNodeValidator,
    ValidatorExecutor,
    ValidatorExecutorContext,
} from './types';
import {
    ARTIFACT_EXISTS_VALIDATOR_ID,
    ARTIFACT_INTEGRITY_VALIDATOR_ID,
    ARTIFACT_SCHEMA_VALIDATOR_ID,
    DOMAIN_EXIT_CRITERIA_VALIDATOR_ID,
    REFINE_ISSUE_EXIT_CRITERIA_VALIDATOR_ID,
    executeArtifactExistsValidator,
    executeArtifactIntegrityValidator,
    executeArtifactSchemaValidator,
    executeDomainExitCriteriaValidator,
    executeEnvelopeSchemaValidator,
    executeEnvelopeSizeValidator,
    executeEnvelopeUnsupportedVersionValidator,
    executeRefineIssueExitCriteriaValidator,
} from './validators';

export const RUNTIME_CATALOG_VALIDATOR_IDS = [
    ACTIVITY_ENVELOPE_SCHEMA_VALIDATOR_ID,
    ACTIVITY_ENVELOPE_UNSUPPORTED_VERSION_VALIDATOR_ID,
    ACTIVITY_ENVELOPE_SIZE_VALIDATOR_ID,
    ARTIFACT_EXISTS_VALIDATOR_ID,
    ARTIFACT_INTEGRITY_VALIDATOR_ID,
    ARTIFACT_SCHEMA_VALIDATOR_ID,
    DOMAIN_EXIT_CRITERIA_VALIDATOR_ID,
    REFINE_ISSUE_EXIT_CRITERIA_VALIDATOR_ID,
] as const;

export type RuntimeCatalogValidatorId = (typeof RUNTIME_CATALOG_VALIDATOR_IDS)[number];

const VALIDATOR_EXECUTORS: Record<string, ValidatorExecutor> = {
    [ACTIVITY_ENVELOPE_SCHEMA_VALIDATOR_ID]: executeEnvelopeSchemaValidator,
    [ACTIVITY_ENVELOPE_UNSUPPORTED_VERSION_VALIDATOR_ID]: executeEnvelopeUnsupportedVersionValidator,
    [ACTIVITY_ENVELOPE_SIZE_VALIDATOR_ID]: executeEnvelopeSizeValidator,
    [ARTIFACT_EXISTS_VALIDATOR_ID]: executeArtifactExistsValidator,
    [ARTIFACT_INTEGRITY_VALIDATOR_ID]: executeArtifactIntegrityValidator,
    [ARTIFACT_SCHEMA_VALIDATOR_ID]: executeArtifactSchemaValidator,
    [DOMAIN_EXIT_CRITERIA_VALIDATOR_ID]: executeDomainExitCriteriaValidator,
    [REFINE_ISSUE_EXIT_CRITERIA_VALIDATOR_ID]: executeRefineIssueExitCriteriaValidator,
};

export function isRuntimeCatalogValidatorId(validatorId: string): validatorId is RuntimeCatalogValidatorId {
    return (RUNTIME_CATALOG_VALIDATOR_IDS as readonly string[]).includes(validatorId);
}

export function getValidatorExecutor(validatorId: string): ValidatorExecutor | undefined {
    return VALIDATOR_EXECUTORS[validatorId];
}

export function assembleRuntimeValidationResult(input: {
    nodeId: string;
    workflowRunId: string;
    sourceActivityNodeId?: string;
    validators: ValidationNodeValidator[];
    context: ValidatorExecutorContext;
    validatedAt?: string;
}): RuntimeValidationResult {
    const validatorOutcomes: RuntimeValidatorOutcome[] = [];
    const diagnostics: RuntimeValidationDiagnostic[] = [];

    for (const declaration of input.validators) {
        const executor = getValidatorExecutor(declaration.validator_id);
        if (!executor) {
            const outcome: RuntimeValidatorOutcome = {
                validator_id: declaration.validator_id,
                type: declaration.type,
                target: declaration.target,
                passed: false,
                blocking: true,
                diagnostics: [
                    {
                        code: 'forge.validator.unregistered',
                        severity: 'error',
                        message: `no executor registered for validator "${declaration.validator_id}"`,
                        validator_id: declaration.validator_id,
                    },
                ],
            };
            validatorOutcomes.push(outcome);
            diagnostics.push(...(outcome.diagnostics ?? []));
            continue;
        }

        const result = executor(declaration, input.context);
        const outcome: RuntimeValidatorOutcome = {
            validator_id: declaration.validator_id,
            type: declaration.type,
            target: declaration.target,
            passed: result.passed,
            blocking: true,
            ...(result.diagnostics.length > 0 ? { diagnostics: result.diagnostics } : {}),
        };
        validatorOutcomes.push(outcome);
        diagnostics.push(...result.diagnostics);
    }

    const valid = validatorOutcomes.every((outcome) => outcome.passed || !outcome.blocking);

    return {
        valid,
        node_id: input.nodeId,
        workflow_run_id: input.workflowRunId,
        ...(input.sourceActivityNodeId ? { source_activity_node_id: input.sourceActivityNodeId } : {}),
        validated_at: input.validatedAt ?? new Date().toISOString(),
        diagnostics,
        validator_outcomes: validatorOutcomes,
    };
}

export function executeRegisteredValidator(
    declaration: ValidationNodeValidator,
    context: ValidatorExecutorContext
): RuntimeValidatorOutcome {
    const executor = getValidatorExecutor(declaration.validator_id);
    if (!executor) {
        return {
            validator_id: declaration.validator_id,
            type: declaration.type,
            target: declaration.target,
            passed: false,
            blocking: true,
            diagnostics: [
                {
                    code: 'forge.validator.unregistered',
                    severity: 'error',
                    message: `no executor registered for validator "${declaration.validator_id}"`,
                    validator_id: declaration.validator_id,
                },
            ],
        };
    }

    const result = executor(declaration, context);
    return {
        validator_id: declaration.validator_id,
        type: declaration.type as RuntimeValidatorType,
        target: declaration.target,
        passed: result.passed,
        blocking: true,
        ...(result.diagnostics.length > 0 ? { diagnostics: result.diagnostics } : {}),
    };
}
