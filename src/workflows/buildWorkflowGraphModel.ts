import dagre from '@dagrejs/dagre';
import type { WorkflowRunProjection } from '../temporal/workflowRunProjection';
import type {
    WorkflowDefinition,
    WorkflowDefinitionNode,
    WorkflowGraphEdge,
    WorkflowGraphEdgeVisualState,
    WorkflowGraphModel,
    WorkflowGraphNode,
    WorkflowGraphNodeVisualState,
    WorkflowGraphStepListEntry,
} from './types';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

const STATUS_LABELS: Record<WorkflowGraphNodeVisualState, string> = {
    pending: 'Pending',
    active: 'Active',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    waiting: 'Waiting',
    validating: 'Validating',
    retrying: 'Retrying',
    skipped: 'Skipped',
};

function buildEdgeId(fromNodeId: string, toNodeId: string): string {
    return `${fromNodeId}->${toNodeId}`;
}

function layoutNodePositions(definition: WorkflowDefinition): Map<string, { x: number; y: number }> {
    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 80 });

    for (const node of definition.nodes) {
        graph.setNode(node.node_id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }

    for (const node of definition.nodes) {
        for (const transition of node.transitions ?? []) {
            graph.setEdge(node.node_id, transition.to_node_id);
        }
    }

    dagre.layout(graph);

    const positions = new Map<string, { x: number; y: number }>();
    for (const node of definition.nodes) {
        const layoutNode = graph.node(node.node_id);
        positions.set(node.node_id, {
            x: layoutNode.x - NODE_WIDTH / 2,
            y: layoutNode.y - NODE_HEIGHT / 2,
        });
    }

    return positions;
}

function buildStepList(nodes: WorkflowGraphNode[]): WorkflowGraphStepListEntry[] {
    return [...nodes]
        .sort((left, right) => {
            if (left.position.y !== right.position.y) {
                return left.position.y - right.position.y;
            }
            return left.node_id.localeCompare(right.node_id);
        })
        .map(({ node_id, name, visual_state, status_label }) => ({
            node_id,
            name,
            visual_state,
            status_label,
        }));
}

function buildDefinitionEdges(definition: WorkflowDefinition): WorkflowGraphEdge[] {
    const edges: WorkflowGraphEdge[] = [];

    for (const node of definition.nodes) {
        for (const transition of node.transitions ?? []) {
            edges.push({
                edge_id: buildEdgeId(node.node_id, transition.to_node_id),
                from_node_id: node.node_id,
                to_node_id: transition.to_node_id,
                visual_state: 'idle',
                condition: transition.condition,
            });
        }
    }

    return edges;
}

function statusLabelForNode(
    visualState: WorkflowGraphNodeVisualState,
    definitionNode: WorkflowDefinitionNode,
    retryAttempt?: number,
    retryMax?: number
): string {
    if (visualState === 'retrying' && retryAttempt !== undefined && retryMax !== undefined) {
        return `Retrying (${retryAttempt}/${retryMax})`;
    }

    if (visualState === 'waiting') {
        if (definitionNode.type === 'human_question') {
            return 'Waiting for input';
        }
        return STATUS_LABELS.waiting;
    }

    return STATUS_LABELS[visualState];
}

function detailForNode(
    definitionNode: WorkflowDefinitionNode,
    visualState: WorkflowGraphNodeVisualState
): string | undefined {
    if (visualState === 'waiting' && definitionNode.type === 'human_question' && definitionNode.question_id) {
        return definitionNode.question_id;
    }

    return undefined;
}

function buildDefinitionNodes(
    definition: WorkflowDefinition,
    positions: Map<string, { x: number; y: number }>
): WorkflowGraphNode[] {
    return definition.nodes.map((node) => ({
        node_id: node.node_id,
        type: node.type,
        name: node.name,
        visual_state: 'pending',
        status_label: STATUS_LABELS.pending,
        position: positions.get(node.node_id) ?? { x: 0, y: 0 },
    }));
}

export function buildDefinitionGraph(definition: WorkflowDefinition): WorkflowGraphModel {
    const positions = layoutNodePositions(definition);
    const nodes = buildDefinitionNodes(definition, positions);

    return {
        workflow_id: definition.workflow_id,
        workflow_name: definition.name,
        mode: 'definition',
        nodes,
        edges: buildDefinitionEdges(definition),
        step_list: buildStepList(nodes),
    };
}

function resolveNodeVisualState(
    nodeId: string,
    definitionNode: WorkflowDefinitionNode,
    projection: WorkflowRunProjection
): {
    visualState: WorkflowGraphNodeVisualState;
    retryAttempt?: number;
    retryMax?: number;
} {
    if (projection.skippedNodeIds.includes(nodeId)) {
        return { visualState: 'skipped' };
    }

    if (projection.failedNodeId === nodeId) {
        return { visualState: 'failed' };
    }

    if (projection.cancelled && projection.activeNodeId === nodeId) {
        return { visualState: 'cancelled' };
    }

    if (projection.retrying?.node_id === nodeId) {
        return {
            visualState: 'retrying',
            retryAttempt: projection.retrying.attempt,
            retryMax: projection.retrying.max,
        };
    }

    if (projection.validatingNodeId === nodeId) {
        return { visualState: 'validating' };
    }

    if (projection.waitingNodeId === nodeId) {
        return { visualState: 'waiting' };
    }

    if (projection.activeNodeId === nodeId) {
        return { visualState: 'active' };
    }

    if (projection.completedNodeIds.includes(nodeId)) {
        return { visualState: 'completed' };
    }

    return { visualState: 'pending' };
}

function computeEdgeVisualStates(
    definition: WorkflowDefinition,
    projection: WorkflowRunProjection
): Map<string, WorkflowGraphEdgeVisualState> {
    const states = new Map<string, WorkflowGraphEdgeVisualState>();

    for (const node of definition.nodes) {
        for (const transition of node.transitions ?? []) {
            states.set(buildEdgeId(node.node_id, transition.to_node_id), 'idle');
        }
    }

    const completed = projection.completedNodeIds;
    for (let index = 0; index < completed.length - 1; index += 1) {
        const edgeId = buildEdgeId(completed[index], completed[index + 1]);
        if (states.has(edgeId)) {
            states.set(edgeId, 'traversed');
        }
    }

    const lastCompleted = completed[completed.length - 1];
    if (projection.activeNodeId && lastCompleted) {
        const activeEdgeId = buildEdgeId(lastCompleted, projection.activeNodeId);
        if (states.has(activeEdgeId)) {
            states.set(activeEdgeId, 'active');
        }
    }

    for (const node of definition.nodes) {
        if (node.type !== 'decision' || !completed.includes(node.node_id)) {
            continue;
        }

        for (const transition of node.transitions ?? []) {
            const edgeId = buildEdgeId(node.node_id, transition.to_node_id);
            if (states.get(edgeId) === 'idle') {
                states.set(edgeId, 'untaken');
            }
        }
    }

    return states;
}

function buildRunSummary(
    definition: WorkflowDefinition,
    projection: WorkflowRunProjection,
    nodes: WorkflowGraphNode[]
): string {
    if (projection.cancelled) {
        return 'Run cancelled';
    }

    if (projection.failedNodeId) {
        const failedNode = nodes.find((node) => node.node_id === projection.failedNodeId);
        return `Failed at ${failedNode?.name ?? projection.failedNodeId}`;
    }

    if (projection.terminal && projection.temporalStatus === 'COMPLETED') {
        return 'Run complete';
    }

    if (projection.activeNodeId) {
        const activeNode = nodes.find((node) => node.node_id === projection.activeNodeId);
        const name = activeNode?.name ?? projection.activeNodeId;

        switch (activeNode?.visual_state) {
            case 'retrying':
                return `Retrying ${name}`;
            case 'validating':
                return `Validating ${name}`;
            case 'waiting':
                return `Waiting at ${name}`;
            case 'cancelled':
                return 'Run cancelled';
            default:
                return `Active step: ${name}`;
        }
    }

    return 'Run in progress';
}

export function overlayRunProjection(
    model: WorkflowGraphModel,
    definition: WorkflowDefinition,
    projection: WorkflowRunProjection
): WorkflowGraphModel {
    const edgeStates = computeEdgeVisualStates(definition, projection);
    const nodes = definition.nodes.map((definitionNode) => {
        const position =
            model.nodes.find((node) => node.node_id === definitionNode.node_id)?.position ??
            { x: 0, y: 0 };
        const { visualState, retryAttempt, retryMax } = resolveNodeVisualState(
            definitionNode.node_id,
            definitionNode,
            projection
        );

        return {
            node_id: definitionNode.node_id,
            type: definitionNode.type,
            name: definitionNode.name,
            visual_state: visualState,
            status_label: statusLabelForNode(visualState, definitionNode, retryAttempt, retryMax),
            position,
            retry_attempt: retryAttempt,
            retry_max: retryMax,
            detail: detailForNode(definitionNode, visualState),
        };
    });

    const edges = buildDefinitionEdges(definition).map((edge) => ({
        ...edge,
        visual_state: edgeStates.get(edge.edge_id) ?? 'idle',
    }));

    return {
        workflow_id: model.workflow_id,
        workflow_name: model.workflow_name,
        mode: 'run',
        nodes,
        edges,
        step_list: buildStepList(nodes),
        run_summary: buildRunSummary(definition, projection, nodes),
        recoveryState: projection.recoveryState,
        temporal_ids: {
            workflowId: projection.workflowId,
            runId: projection.runId,
            namespace: projection.namespace,
        },
    };
}

export function buildWorkflowGraphModel(
    definition: WorkflowDefinition,
    projection?: WorkflowRunProjection
): WorkflowGraphModel {
    const definitionGraph = buildDefinitionGraph(definition);

    if (!projection) {
        return definitionGraph;
    }

    return overlayRunProjection(definitionGraph, definition, projection);
}
