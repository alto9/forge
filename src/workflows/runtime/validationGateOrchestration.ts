import type { ExecuteValidationGateActivityInput } from '../../worker/executeValidationGateActivity';
import type {
    RefineIssueExitCriteriaContext,
    RuntimeValidationResult,
    ValidationNodeValidator,
    WorkflowArtifactDefinition,
} from '../../validation';
import type { CursorSdkResponseEnvelope } from '../../worker/activityEnvelope';

export interface WorkflowValidationNode {
    node_id: string;
    type: 'validation';
    name: string;
    validators: ValidationNodeValidator[];
    transitions?: Array<{ to_node_id: string; condition?: string }>;
}

export interface ValidationTransitionResult {
    advance: boolean;
    nextNodeId?: string;
    failedNodeId?: string;
    validationFailed: boolean;
}

export const REFINE_ISSUE_VALIDATION_NODE_IDS = {
    triageArtifacts: 'validate_triage_artifacts',
    exitCriteria: 'validate_exit_criteria',
} as const;

export function resolveValidationTransition(
    node: WorkflowValidationNode,
    result: RuntimeValidationResult
): ValidationTransitionResult {
    if (!result.valid) {
        return {
            advance: false,
            failedNodeId: node.node_id,
            validationFailed: true,
        };
    }

    const nextNodeId = node.transitions?.[0]?.to_node_id;
    return {
        advance: Boolean(nextNodeId),
        nextNodeId,
        validationFailed: false,
    };
}

export function shouldAdvanceAfterValidation(result: RuntimeValidationResult): boolean {
    return result.valid;
}

export function buildRefineIssueValidationGateInput(input: {
    node: WorkflowValidationNode;
    workflowRunId: string;
    workspaceRoot: string;
    workflowArtifacts: WorkflowArtifactDefinition[];
    sourceActivityNodeId?: string;
    envelope?: CursorSdkResponseEnvelope;
    refineIssueExitContext?: RefineIssueExitCriteriaContext;
}): ExecuteValidationGateActivityInput {
    return {
        nodeId: input.node.node_id,
        nodeName: input.node.name,
        workflowRunId: input.workflowRunId,
        workspaceRoot: input.workspaceRoot,
        validators: input.node.validators,
        sourceActivityNodeId: input.sourceActivityNodeId,
        workflowArtifacts: input.workflowArtifacts,
        envelope: input.envelope,
        refineIssueExitContext: input.refineIssueExitContext,
    };
}

export function findValidationNode(
    nodes: Array<{ node_id: string; type: string }>,
    nodeId: string
): WorkflowValidationNode | undefined {
    const node = nodes.find((candidate) => candidate.node_id === nodeId);
    if (!node || node.type !== 'validation') {
        return undefined;
    }

    return node as WorkflowValidationNode;
}
