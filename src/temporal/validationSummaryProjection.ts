import type {
    RuntimeValidationDiagnostic,
    RuntimeValidationResult,
    RuntimeValidatorType,
} from '../validation';
import type { WorkflowRunProjection } from './workflowRunProjection';

export interface ValidationSummaryValidatorOutcome {
    validator_id: string;
    type: RuntimeValidatorType;
    target?: string;
    passed: boolean;
    blocking: boolean;
}

export interface ValidationSummary {
    node_id: string;
    node_name: string;
    valid: boolean;
    validated_at: string;
    source_activity_node_id?: string;
    validator_outcomes: ValidationSummaryValidatorOutcome[];
    diagnostics: RuntimeValidationDiagnostic[];
}

export function mapRuntimeValidationResultToSummary(
    result: RuntimeValidationResult,
    nodeName: string
): ValidationSummary {
    return {
        node_id: result.node_id,
        node_name: nodeName,
        valid: result.valid,
        validated_at: result.validated_at,
        ...(result.source_activity_node_id
            ? { source_activity_node_id: result.source_activity_node_id }
            : {}),
        validator_outcomes: result.validator_outcomes.map((outcome) => ({
            validator_id: outcome.validator_id,
            type: outcome.type,
            ...(outcome.target ? { target: outcome.target } : {}),
            passed: outcome.passed,
            blocking: outcome.blocking,
        })),
        diagnostics: result.diagnostics.map(redactValidationDiagnostic),
    };
}

function redactValidationDiagnostic(
    diagnostic: RuntimeValidationDiagnostic
): RuntimeValidationDiagnostic {
    return {
        code: diagnostic.code,
        severity: diagnostic.severity,
        message: diagnostic.message,
        validator_id: diagnostic.validator_id,
        ...(diagnostic.path ? { path: diagnostic.path } : {}),
    };
}

export function appendValidationSummary(
    projection: WorkflowRunProjection,
    summary: ValidationSummary
): WorkflowRunProjection {
    return {
        ...projection,
        validationSummaries: [...projection.validationSummaries, summary],
        ...(summary.valid
            ? {}
            : {
                  failedNodeId: summary.node_id,
                  validatingNodeId: undefined,
              }),
    };
}
