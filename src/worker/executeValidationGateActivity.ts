import path from 'path';
import type { CursorSdkResponseEnvelope } from './activityEnvelope';
import {
    assembleRuntimeValidationResult,
    validateRuntimeValidationResultSchema,
} from '../validation';
import type {
    DomainExitCriteriaContext,
    RefineIssueExitCriteriaContext,
    RuntimeValidationResult,
    ValidationNodeValidator,
    WorkflowArtifactDefinition,
} from '../validation';

export const VALIDATION_GATE_ACTIVITY_ID = 'forge.validation.executeGate';

export interface ExecuteValidationGateActivityInput {
    nodeId: string;
    nodeName?: string;
    workflowRunId: string;
    workspaceRoot: string;
    validators: ValidationNodeValidator[];
    sourceActivityNodeId?: string;
    workflowArtifacts?: WorkflowArtifactDefinition[];
    envelope?: CursorSdkResponseEnvelope;
    domainExitCriteria?: DomainExitCriteriaContext;
    refineIssueExitContext?: RefineIssueExitCriteriaContext;
}

export async function executeValidationGateActivity(
    input: ExecuteValidationGateActivityInput
): Promise<RuntimeValidationResult> {
    const workspaceRoot = path.resolve(input.workspaceRoot);
    const result = assembleRuntimeValidationResult({
        nodeId: input.nodeId,
        workflowRunId: input.workflowRunId,
        sourceActivityNodeId: input.sourceActivityNodeId,
        validators: input.validators,
        context: {
            workspaceRoot,
            workflowRunId: input.workflowRunId,
            nodeId: input.nodeId,
            sourceActivityNodeId: input.sourceActivityNodeId,
            envelope: input.envelope,
            workflowArtifacts: input.workflowArtifacts,
            domainExitCriteria: input.domainExitCriteria,
            refineIssueExitContext: input.refineIssueExitContext,
        },
    });

    const schemaValidation = validateRuntimeValidationResultSchema(result);
    if (!schemaValidation.valid) {
        const firstError = schemaValidation.diagnostics.find((diagnostic) => diagnostic.severity === 'error');
        throw new Error(
            firstError?.message ?? 'validation gate produced an aggregate that failed schema validation'
        );
    }

    return result;
}
