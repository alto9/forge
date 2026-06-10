import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    Background,
    Controls,
    Handle,
    Position,
    ReactFlow,
    useEdgesState,
    useNodesState,
    type Edge,
    type Node,
    type NodeProps,
    type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { WorkflowGraphModel } from '../../../workflows/types';
import {
    getNodeTypeLabel,
    nodeVisualStateClass,
    type WorkflowGraphWebviewModel,
} from '../graphPresentation';
import { StepListSidebar } from './StepListSidebar';

declare const acquireVsCodeApi: () => {
    postMessage: (message: unknown) => void;
};

const vscode = acquireVsCodeApi();

type WorkflowNodeData = {
    label: string;
    nodeType: string;
    visualState: string;
    statusLabel: string;
    detail?: string;
};

const WorkflowGraphNode = memo(function WorkflowGraphNode({
    data,
    selected,
}: NodeProps<Node<WorkflowNodeData>>): React.ReactElement {
    return (
        <div
            className={`forge-graph-node ${nodeVisualStateClass(data.visualState)} forge-graph-node--type-${data.nodeType}`}
            tabIndex={0}
            aria-label={`${data.label}, ${data.statusLabel}`}
            data-selected={selected ? 'true' : 'false'}
        >
            <Handle type="target" position={Position.Top} />
            <div className="forge-graph-node__type">{getNodeTypeLabel(data.nodeType as never)}</div>
            <div className="forge-graph-node__name">{data.label}</div>
            <div className="forge-graph-node__status">{data.statusLabel}</div>
            {data.detail ? (
                <div className="forge-graph-node__detail">{data.detail}</div>
            ) : null}
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
});

const nodeTypes = { workflow: WorkflowGraphNode };

function toFlowNodes(graph: WorkflowGraphModel, selectedNodeId?: string): Node<WorkflowNodeData>[] {
    return graph.nodes.map((node) => ({
        id: node.node_id,
        type: 'workflow',
        position: node.position,
        selected: selectedNodeId === node.node_id,
        data: {
            label: node.name,
            nodeType: node.type,
            visualState: node.visual_state,
            statusLabel: node.status_label,
            detail: node.detail,
        },
    }));
}

function toFlowEdges(graph: WorkflowGraphModel): Edge[] {
    return graph.edges.map((edge) => ({
        id: edge.edge_id,
        source: edge.from_node_id,
        target: edge.to_node_id,
        label: edge.condition,
        className: `forge-graph-edge forge-graph-edge--${edge.visual_state}`,
        animated: edge.visual_state === 'active',
    }));
}

const shell: React.CSSProperties = {
    fontFamily: 'var(--vscode-font-family), system-ui, -apple-system, Segoe UI, sans-serif',
    fontSize: 'var(--vscode-font-size, 13px)',
    color: 'var(--vscode-foreground)',
    background: 'var(--vscode-editor-background)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
};

function WorkflowGraphApp(): React.ReactElement {
    const [model, setModel] = useState<WorkflowGraphWebviewModel>({
        header: 'Workflow Graph',
    });
    const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowNodeData>>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const flowRef = useRef<ReactFlowInstance<Node<WorkflowNodeData>, Edge> | null>(null);

    const graph = model.graph;

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            const message = event.data as {
                type?: string;
                payload?: WorkflowGraphWebviewModel;
            };
            if (message?.type === 'init' && message.payload) {
                setModel(message.payload);
                setSelectedNodeId(message.payload.selectedNodeId);
            }
        };

        window.addEventListener('message', handler);
        vscode.postMessage({ type: 'ready' });
        return () => window.removeEventListener('message', handler);
    }, []);

    useEffect(() => {
        if (!graph) {
            setNodes([]);
            setEdges([]);
            return;
        }

        setNodes(toFlowNodes(graph, selectedNodeId ?? model.selectedNodeId));
        setEdges(toFlowEdges(graph));
    }, [graph, model.selectedNodeId, selectedNodeId, setEdges, setNodes]);

    const focusNode = useCallback(
        (nodeId: string) => {
            setSelectedNodeId(nodeId);
            setNodes((current) =>
                current.map((node) => ({
                    ...node,
                    selected: node.id === nodeId,
                }))
            );

            const instance = flowRef.current;
            const target = instance?.getNode(nodeId);
            if (instance && target) {
                instance.setCenter(target.position.x + 100, target.position.y + 30, {
                    zoom: instance.getZoom(),
                    duration: 200,
                });
            }
        },
        [setNodes]
    );

    const onSelectStep = useCallback(
        (nodeId: string) => {
            focusNode(nodeId);
        },
        [focusNode]
    );

    const onNodeClick = useCallback(
        (_event: React.MouseEvent, node: Node<WorkflowNodeData>) => {
            focusNode(node.id);
        },
        [focusNode]
    );

    const emptyMessage = useMemo(() => {
        if (model.emptyState === 'no_workspace') {
            return 'Open a workspace folder to view workflow graphs.';
        }
        if (model.emptyState === 'no_selection') {
            return 'Select a workflow in the catalog, then open the graph.';
        }
        return undefined;
    }, [model.emptyState]);

    return (
        <div style={shell}>
            <style>{`
                .forge-graph-layout { display: flex; flex: 1; min-height: 0; }
                .forge-graph-sidebar {
                    width: 260px;
                    flex-shrink: 0;
                    border-right: 1px solid var(--vscode-panel-border);
                    padding: 12px;
                    overflow: auto;
                    box-sizing: border-box;
                }
                .forge-graph-canvas { flex: 1; min-height: 420px; }
                .forge-graph-node {
                    min-width: 160px;
                    max-width: 220px;
                    padding: 8px 10px;
                    border-radius: 6px;
                    border: 2px solid var(--vscode-panel-border);
                    background: var(--vscode-editor-background);
                    color: var(--vscode-foreground);
                    font-size: 12px;
                    box-sizing: border-box;
                }
                .forge-graph-node[data-selected="true"] {
                    outline: 2px solid var(--vscode-focusBorder);
                    outline-offset: 2px;
                }
                .forge-graph-node__type { font-size: 10px; opacity: 0.8; text-transform: uppercase; }
                .forge-graph-node__name { font-weight: 600; margin-top: 2px; }
                .forge-graph-node__status { margin-top: 4px; font-size: 11px; }
                .forge-graph-node__detail { margin-top: 2px; font-size: 10px; opacity: 0.85; }
                .forge-graph-node--active { border-color: var(--vscode-focusBorder); box-shadow: 0 0 0 1px var(--vscode-focusBorder); }
                .forge-graph-node--completed { border-color: var(--vscode-testing-iconPassed, #73c991); }
                .forge-graph-node--failed { border-color: var(--vscode-inputValidation-errorBorder, #be1100); }
                .forge-graph-node--retrying { border-color: var(--vscode-inputValidation-warningBorder, #b89500); }
                .forge-graph-node--waiting { border-color: var(--vscode-textLink-foreground, #3794ff); }
                .forge-graph-node--skipped { opacity: 0.55; }
                .forge-graph-node--cancelled { opacity: 0.65; border-style: dashed; }
                .forge-graph-edge--traversed path { stroke: var(--vscode-testing-iconPassed, #73c991); }
                .forge-graph-edge--active path { stroke: var(--vscode-focusBorder); stroke-width: 2; }
                .forge-graph-edge--untaken path { stroke: var(--vscode-descriptionForeground); opacity: 0.5; }
                .forge-graph-header { padding: 12px 16px 0; }
                .forge-graph-banner {
                    margin: 8px 16px 0;
                    padding: 8px 12px;
                    border-radius: 4px;
                    background: var(--vscode-inputValidation-warningBackground);
                    color: var(--vscode-inputValidation-warningForeground);
                    border: 1px solid var(--vscode-inputValidation-warningBorder);
                }
                .forge-graph-summary { margin: 4px 16px 0; font-size: 12px; opacity: 0.9; }
            `}</style>

            <header className="forge-graph-header">
                <h1 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>{model.header}</h1>
                {graph?.run_summary ? (
                    <p className="forge-graph-summary" role="status">
                        {graph.run_summary}
                    </p>
                ) : null}
            </header>

            {model.recoveryBanner ? (
                <div className="forge-graph-banner" role="status">
                    {model.recoveryBanner}
                </div>
            ) : null}

            {emptyMessage ? (
                <p style={{ padding: '16px' }} role="status">
                    {emptyMessage}
                </p>
            ) : graph ? (
                <div className="forge-graph-layout">
                    <aside className="forge-graph-sidebar">
                        <StepListSidebar
                            steps={graph.step_list}
                            selectedNodeId={selectedNodeId ?? model.selectedNodeId}
                            onSelectStep={onSelectStep}
                        />
                    </aside>
                    <div className="forge-graph-canvas">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            nodeTypes={nodeTypes}
                            onNodeClick={onNodeClick}
                            onInit={(instance) => {
                                flowRef.current = instance;
                            }}
                            fitView
                            nodesDraggable={false}
                            nodesConnectable={false}
                            elementsSelectable
                            proOptions={{ hideAttribution: true }}
                        >
                            <Background gap={16} />
                            <Controls showInteractive={false} />
                        </ReactFlow>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(<WorkflowGraphApp />);
}

export { WorkflowGraphApp, StepListSidebar };
