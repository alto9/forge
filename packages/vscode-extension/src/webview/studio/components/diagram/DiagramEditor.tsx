import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Panel,
  ConnectionMode,
} from 'reactflow';

import { ShapeLibrary } from './ShapeLibrary';
import { nodeTypes } from './nodeTypes';

export interface DiagramData {
  nodes: Node[];
  edges: Edge[];
}

export interface DiagramEditorProps {
    diagramData: DiagramData;
    onChange: (data: DiagramData) => void;
    readOnly?: boolean;
}

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

// Simple auto-layout function using a grid layout
const relayoutReactFlow = (nodes: Node[], edges: Edge[]) => {
  const spacing = 200;
  const nodesPerRow = Math.ceil(Math.sqrt(nodes.length));
  
  const layoutedNodes = nodes.map((node, index) => {
    const row = Math.floor(index / nodesPerRow);
    const col = index % nodesPerRow;
    
    return {
      ...node,
      position: {
        x: col * spacing,
        y: row * spacing,
      },
    };
  });
  
  return { nodes: layoutedNodes, edges };
};

const DiagramEditorInner: React.FC<DiagramEditorProps> = ({diagramData, onChange, readOnly = false}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [pendingNodeType, setPendingNodeType] = useState<{
    classifier: string;
    displayName: string;
    serviceConfig: any;
  } | null>(null);

  // No need for manual event listeners - using React props below

  useEffect(() => {
    setIsInitialLoad(true);
    setNodes(diagramData.nodes || []);
    setEdges(diagramData.edges || []);
  }, [diagramData, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
     const newEdge: Edge = {
      ...connection,
      id: `edge_${Date.now()}`,
      type: 'default'
     } as Edge;
     setEdges((eds) => addEdge(newEdge, eds));
    }, [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    console.log('Drag over canvas');
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Drop on canvas!');

    if (!reactFlowWrapper.current) {
      console.log('No wrapper ref');
      return;
    }

    if (!reactFlowInstance) {
      console.log('No ReactFlow instance');
      return;
    }

    const data = event.dataTransfer.getData('application/reactflow');
    console.log('Retrieved data:', data);

    if (!data) {
      console.log('No drag data found');
      return;
    }

    let dropData;
    try {
      dropData = JSON.parse(data);
      console.log('Parsed drop data:', dropData);
    } catch (err) {
      console.error('Failed to parse drop data:', err);
      return;
    }

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    console.log('Drop position:', position);

    // Determine node type based on library
    const nodeType = dropData.library === 'general' 
      ? `general-${dropData.classifier}`
      : `aws-${dropData.classifier}`;

    console.log('Creating node with type:', nodeType);

    const newNode: Node = {
      id: getId(),
      type: nodeType,
      position,
      data: { 
        label: dropData.displayName || 'New Node',
        classifier: dropData.classifier,
        properties: {},
        color: dropData.color,
        isContainer: dropData.isContainer || false
      },
    };

    console.log('Adding new node:', newNode);
    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes]);
  
  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = relayoutReactFlow(nodes, edges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges, setNodes, setEdges]);

  // Notify parent of changes
  useEffect(() => {
    if (!isInitialLoad && !readOnly) {
      onChange({ nodes, edges });
    }
  }, [nodes, edges, onChange, isInitialLoad, readOnly]);

  useEffect(() => {
    if (isInitialLoad && nodes.length > 0) {
      setIsInitialLoad(false);
    }
  }, [nodes, isInitialLoad]);

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      if(deleted.find(n => n.id === selectedNode?.id)) {
        setSelectedNode(null);
      }
    }, [selectedNode]
  );

  const onSelectionChange = useCallback(({ nodes: selectedNodes} : { nodes: Node[] }) => {
    setSelectedNode(selectedNodes.length > 0 ? selectedNodes[0] : null);
  }, [])

  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<Node['data']>) => {
    setNodes((nds) => 
      nds.map((node) => {
        if(node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updates
            }
          };
        }
        return node;
      })
    );
  }, [setNodes]);
  
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      {/* Shape Library Panel */}
      <ShapeLibrary />

      {/* React Flow Canvas */}
      <div
        ref={reactFlowWrapper}
        style={{
          flex: 1,
          height: '100%',
          position: 'relative',
          background: 'var(--vscode-sideBar-background)',
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onNodesDelete={onNodesDelete}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributePosition="bottom-left"
        deleteKeyCode={["Backspace","Delete"]}
        elementsSelectable={true}
        selectNodesOnDrag={false}
      >
        <Background color="var(--vscode-sideBar-background)" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if(node.type.startsWith('aws-')) {
              return 'var(--vscode-icon-warningForeground)';
            }
            return 'var(--vscode-icon-infoForeground)';
          }}
        />
        {/* Toolbar */}
        <Panel position="top-right" style={{ margin: '10px'}}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={handleAutoLayout}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >Auto Layout</button>
          </div>
        </Panel>
        {/* Instructions */}
        <Panel position="bottom-center" style={{ margin: '10px' }}>
          <div style={{
            background: 'rbga(255,255,255,0.9)',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#666',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <strong>Tips:</strong> Drag services from the library to the canvas to add them to your diagram.
          </div>
        </Panel>
      </ReactFlow>
    </div>

    {/* Properties Panel */}
    
    </div>
  );
};

export const DiagramEditor: React.FC<DiagramEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <DiagramEditorInner {...props} />
    </ReactFlowProvider>
  );
};