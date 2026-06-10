import type { CursorSdkResponseEnvelope } from '../worker/activityEnvelope';

export type RuntimeDiagnosticSeverity = 'error' | 'warning' | 'info';

export interface RuntimeValidationDiagnostic {
    code: string;
    severity: RuntimeDiagnosticSeverity;
    message: string;
    validator_id: string;
    path?: string;
}

export type RuntimeValidatorType = 'schema' | 'artifact' | 'domain';

export interface RuntimeValidatorOutcome {
    validator_id: string;
    type: RuntimeValidatorType;
    target?: string;
    passed: boolean;
    blocking: boolean;
    diagnostics?: RuntimeValidationDiagnostic[];
}

export interface RuntimeValidationResult {
    valid: boolean;
    node_id: string;
    workflow_run_id: string;
    source_activity_node_id?: string;
    validated_at: string;
    diagnostics: RuntimeValidationDiagnostic[];
    validator_outcomes: RuntimeValidatorOutcome[];
}

export interface WorkflowArtifactDefinition {
    artifact_id: string;
    path: string;
    description?: string;
}

export interface ValidationNodeValidator {
    validator_id: string;
    type: RuntimeValidatorType;
    target?: string;
}

export interface DomainExitCriteriaContext {
    criteriaMet: Record<string, boolean>;
}

export interface RefineIssueExitCriteriaContext {
    issueBodyValid: boolean;
    blockersResolved: boolean;
    openDecisionsResolved: boolean;
    aiChangesCommitted: boolean;
}

export interface ValidatorExecutorContext {
    workspaceRoot: string;
    workflowRunId: string;
    nodeId: string;
    sourceActivityNodeId?: string;
    envelope?: CursorSdkResponseEnvelope;
    workflowArtifacts?: WorkflowArtifactDefinition[];
    domainExitCriteria?: DomainExitCriteriaContext;
    refineIssueExitContext?: RefineIssueExitCriteriaContext;
}

export interface ValidatorExecutorResult {
    passed: boolean;
    diagnostics: RuntimeValidationDiagnostic[];
}

export type ValidatorExecutor = (
    declaration: ValidationNodeValidator,
    context: ValidatorExecutorContext
) => ValidatorExecutorResult;
