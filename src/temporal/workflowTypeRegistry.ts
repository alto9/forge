export const FORGE_DATA_DEFINED_WORKFLOW_TYPE = 'forgeDataDefinedWorkflow';

const WORKFLOW_TYPE_BY_ID: Record<string, string> = {
    'refine-issue': FORGE_DATA_DEFINED_WORKFLOW_TYPE,
    'test-minimal': FORGE_DATA_DEFINED_WORKFLOW_TYPE,
};

export function resolveTemporalWorkflowType(workflowId: string): string | undefined {
    return WORKFLOW_TYPE_BY_ID[workflowId];
}

export function isKnownTemporalWorkflowType(workflowId: string): boolean {
    return resolveTemporalWorkflowType(workflowId) !== undefined;
}
