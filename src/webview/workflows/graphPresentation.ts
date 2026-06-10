import type { RecoveryState } from '../../temporal/workflowRunIndex';
import type {
    WorkflowGraphModel,
    WorkflowGraphStepListEntry,
    WorkflowNodeType,
} from '../../workflows/types';

export type WorkflowGraphEmptyState = 'no_workspace' | 'no_selection';

export type WorkflowGraphWebviewModel = {
    graph?: WorkflowGraphModel;
    header: string;
    recoveryBanner?: string;
    emptyState?: WorkflowGraphEmptyState;
    selectedNodeId?: string;
};

export const GRAPH_VALIDATION_BLOCKED_MESSAGE =
    'Fix validation errors before opening the workflow graph.';

export const GRAPH_NO_SELECTION_MESSAGE =
    'Select a workflow in the catalog, then open the graph.';

export const RECOVERY_BANNER_COPY: Record<
    Exclude<RecoveryState, 'synced' | 'orphaned'>,
    string
> = {
    recovery_pending: 'Recovering run state…',
    refresh_failed: 'Could not refresh run state. Try **Forge: Refresh Workflow Graph**.',
    unreachable: 'Waiting for Temporal…',
};

export function formatGraphHeader(model: WorkflowGraphModel): string {
    if (model.mode === 'definition') {
        return `Definition — ${model.workflow_name}`;
    }

    const temporal = model.temporal_ids;
    if (temporal) {
        return `Run — ${model.workflow_name} (${temporal.workflowId}/${temporal.runId})`;
    }

    return `Run — ${model.workflow_name}`;
}

export function getRecoveryBannerCopy(recoveryState: RecoveryState | undefined): string | undefined {
    if (!recoveryState || recoveryState === 'synced' || recoveryState === 'orphaned') {
        return undefined;
    }

    return RECOVERY_BANNER_COPY[recoveryState];
}

export function buildGraphWebviewModel(
    graph: WorkflowGraphModel,
    selectedNodeId?: string
): WorkflowGraphWebviewModel {
    return {
        graph,
        header: formatGraphHeader(graph),
        recoveryBanner: getRecoveryBannerCopy(graph.recoveryState),
        selectedNodeId,
    };
}

export function getStepAccessibleName(step: WorkflowGraphStepListEntry): string {
    return `${step.name}, ${step.status_label}`;
}

export function getNodeTypeLabel(type: WorkflowNodeType): string {
    switch (type) {
        case 'human_question':
            return 'Question';
        case 'terminal':
            return 'Terminal';
        default:
            return type.charAt(0).toUpperCase() + type.slice(1);
    }
}

export function nodeVisualStateClass(visualState: string): string {
    return `forge-graph-node--${visualState}`;
}
