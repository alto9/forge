import React, { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './nodes/nodeTypes';

/**
 * DiagramData interface represents the structure of diagram data
 * containing nodes and edges for react-flow rendering.
 */
export interface DiagramData {
  nodes: Node[];
  edges: Edge[];
}

interface ReactFlowDiagramEditorProps {
  diagramData: DiagramData;
  onChange: (data: DiagramData) => void;
  readOnly: boolean;
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '600px',
  background: 'var(--vscode-editor-background)',
  border: '1px solid var(--vscode-panel-border)',
  borderRadius: '4px',
};

/**
 * Inner component that uses ReactFlow hooks
 * Must be wrapped in ReactFlowProvider
 */
const ReactFlowDiagramEditorInner: React.FC<ReactFlowDiagramEditorProps> = ({
  diagramData,
  onChange,
  readOnly,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(diagramData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(diagramData.edges);
  const { project } = useReactFlow();
  
  // Track if this is the initial render to avoid triggering onChange on mount
  const isInitialMount = useRef(true);
  // Track if we're currently dragging to avoid triggering onChange during drag
  const isDragging = useRef(false);

  // Handle new edge connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle drop from shape library
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // Don't allow drops in read-only mode
      if (readOnly) {
        return;
      }

      const dataStr = event.dataTransfer.getData('application/reactflow');
      if (!dataStr) {
        return;
      }

      try {
        const { shapeType, shapeData } = JSON.parse(dataStr);
        
        // Convert client coordinates to flow coordinates
        const position = project({
          x: event.clientX,
          y: event.clientY,
        });

        // Create new node with unique ID
        const newNode: Node = {
          id: `${shapeType}-${Date.now()}`,
          type: shapeData.type,
          position,
          data: { label: shapeData.name },
        };

        setNodes((nds) => nds.concat(newNode));
      } catch (error) {
        console.error('Failed to parse drop data:', error);
      }
    },
    [readOnly, project, setNodes]
  );

  // Handle drag over to allow drop
  const onDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!readOnly) {
        event.dataTransfer.dropEffect = 'move';
      }
    },
    [readOnly]
  );

  // Update parent when nodes/edges change (skip initial mount and during dragging)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!isDragging.current) {
      onChange({ nodes, edges });
    }
  }, [nodes, edges, onChange]);

  // Handle drag events
  const onNodeDragStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  const onNodeDragStop = useCallback(() => {
    isDragging.current = false;
    // Trigger onChange after drag stops
    onChange({ nodes, edges });
  }, [nodes, edges, onChange]);

  // Sync with external diagramData changes
  useEffect(() => {
    setNodes(diagramData.nodes);
    setEdges(diagramData.edges);
  }, [diagramData, setNodes, setEdges]);

  return (
    <div style={containerStyle} onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap 
          style={{
            background: 'var(--vscode-sideBar-background)',
          }}
        />
      </ReactFlow>
    </div>
  );
};

/**
 * ReactFlowDiagramEditor component
 * 
 * Core diagram editor component that renders and manages react-flow diagrams
 * with nodes and edges. Handles diagram rendering, node/edge state management,
 * and provides the canvas for drag-and-drop interactions.
 * 
 * Wrapped in ReactFlowProvider to enable useReactFlow hooks for coordinate conversion.
 */
export const ReactFlowDiagramEditor: React.FC<ReactFlowDiagramEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ReactFlowDiagramEditorInner {...props} />
    </ReactFlowProvider>
  );
};

