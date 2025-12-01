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

// Generate truly unique IDs to avoid collisions with existing nodes
const getId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to get absolute position of a node considering all parent hierarchy
const getAbsolutePosition = (node: Node, allNodes: Node[]): { x: number; y: number } => {
  if (!node.parentNode) {
    return { x: node.position.x, y: node.position.y };
  }
  
  const parent = allNodes.find(n => n.id === node.parentNode);
  if (!parent) {
    return { x: node.position.x, y: node.position.y };
  }
  
  const parentAbs = getAbsolutePosition(parent, allNodes);
  return {
    x: node.position.x + parentAbs.x,
    y: node.position.y + parentAbs.y
  };
};

// Helper function to check if nodeId is a descendant of potentialAncestorId
const isDescendantOf = (nodeId: string, potentialAncestorId: string, allNodes: Node[]): boolean => {
  const node = allNodes.find(n => n.id === nodeId);
  if (!node || !node.parentNode) return false;
  if (node.parentNode === potentialAncestorId) return true;
  return isDescendantOf(node.parentNode, potentialAncestorId, allNodes);
};

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

    // Use functional form to access current nodes and add the new node
    setNodes((currentNodes) => {
      // Check if dropped inside a container - find the deepest one
      let parentNodeId: string | undefined = undefined;
      let adjustedPosition = position;
      let deepestContainer: { id: string; depth: number } | null = null;
      
      console.log('Checking containers, current nodes:', currentNodes.length);
      for (const node of currentNodes) {
        if (node.data?.isContainer) {
          const nodeWidth = node.width || node.style?.width || 0;
          const nodeHeight = node.height || node.style?.height || 0;
          const nodeAbsPos = getAbsolutePosition(node, currentNodes);
          
          console.log(`Checking container ${node.id}:`, {
            pos: nodeAbsPos,
            width: nodeWidth,
            height: nodeHeight,
            dropPos: position
          });
          
          if (nodeWidth && nodeHeight) {
            // Check if drop position is inside this container's absolute bounds
            const isInside = 
              position.x >= nodeAbsPos.x &&
              position.x <= nodeAbsPos.x + nodeWidth &&
              position.y >= nodeAbsPos.y &&
              position.y <= nodeAbsPos.y + nodeHeight;
            
            if (isInside) {
              // Calculate depth in hierarchy to find deepest container
              let depth = 0;
              let current = node;
              while (current.parentNode) {
                depth++;
                const parent = currentNodes.find(n => n.id === current.parentNode);
                if (!parent) break;
                current = parent;
              }
              
              if (!deepestContainer || depth > deepestContainer.depth) {
                deepestContainer = { id: node.id, depth };
              }
            }
          }
        }
      }
      
      if (deepestContainer) {
        parentNodeId = deepestContainer.id;
        const parentNode = currentNodes.find(n => n.id === parentNodeId);
        if (parentNode) {
          const parentAbsPos = getAbsolutePosition(parentNode, currentNodes);
          adjustedPosition = {
            x: position.x - parentAbsPos.x,
            y: position.y - parentAbsPos.y
          };
          console.log('✓ Dropped inside container:', parentNodeId, 'relative position:', adjustedPosition);
        }
      }

      const newNode: Node = dropData.isContainer ? {
        id: getId(),
        type: nodeType,
        position: adjustedPosition,
        data: { 
          label: dropData.displayName || 'New Node',
          classifier: dropData.classifier,
          properties: {},
          color: dropData.color,
          isContainer: true
        },
        // Explicit dimensions for containers (required for NodeResizer to work)
        style: {
          width: 400,
          height: 300,
        },
        width: 400,
        height: 300,
        ...(parentNodeId && { 
          parentNode: parentNodeId,
          extent: 'parent' as const
        })
      } : {
        id: getId(),
        type: nodeType,
        position: adjustedPosition,
        data: { 
          label: dropData.displayName || 'New Node',
          classifier: dropData.classifier,
          properties: {},
          color: dropData.color,
          isContainer: false
        },
        ...(parentNodeId && { 
          parentNode: parentNodeId,
          extent: 'parent' as const
        })
      };

      console.log('Adding new node:', newNode);
      return currentNodes.concat(newNode);
    });
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

  // Handle dragging existing nodes into containers
  const onNodeDragStop = useCallback((_event: any, draggedNode: Node) => {
    setNodes((nds) => {
      // Get the absolute position of the dragged node
      const absPos = getAbsolutePosition(draggedNode, nds);
      
      // Check if the dragged node should be parented to a container
      let newParentId: string | undefined = undefined;
      let deepestContainer: { id: string; depth: number } | null = null;
      
      for (const node of nds) {
        // Skip self and skip if this would create a circular reference
        if (node.id === draggedNode.id) continue;
        if (draggedNode.data?.isContainer && isDescendantOf(node.id, draggedNode.id, nds)) {
          console.log('Skipping - would create circular reference');
          continue;
        }
        
        if (node.data?.isContainer) {
          const nodeWidth = node.width || node.style?.width || 0;
          const nodeHeight = node.height || node.style?.height || 0;
          const nodeAbsPos = getAbsolutePosition(node, nds);
          
          if (nodeWidth && nodeHeight) {
            // Check if drop position is inside this container's absolute bounds
            const isInside = 
              absPos.x >= nodeAbsPos.x &&
              absPos.x <= nodeAbsPos.x + nodeWidth &&
              absPos.y >= nodeAbsPos.y &&
              absPos.y <= nodeAbsPos.y + nodeHeight;
            
            if (isInside) {
              // Calculate depth in hierarchy to find deepest container
              let depth = 0;
              let current = node;
              while (current.parentNode) {
                depth++;
                const parent = nds.find(n => n.id === current.parentNode);
                if (!parent) break;
                current = parent;
              }
              
              if (!deepestContainer || depth > deepestContainer.depth) {
                deepestContainer = { id: node.id, depth };
              }
            }
          }
        }
      }
      
      newParentId = deepestContainer?.id;
      
      // Only update if the parent changed
      if (newParentId !== draggedNode.parentNode) {
        console.log('Parent changed from', draggedNode.parentNode, 'to', newParentId);
        
        return nds.map(node => {
          if (node.id === draggedNode.id) {
            if (newParentId) {
              // Calculate relative position within new parent
              const newParent = nds.find(n => n.id === newParentId);
              if (newParent) {
                const newParentAbs = getAbsolutePosition(newParent, nds);
                return {
                  ...node,
                  position: {
                    x: absPos.x - newParentAbs.x,
                    y: absPos.y - newParentAbs.y
                  },
                  parentNode: newParentId,
                  extent: 'parent' as const
                };
              }
            } else {
              // Remove parent - use absolute position
              const updated = {
                ...node,
                position: { x: absPos.x, y: absPos.y }
              };
              delete updated.parentNode;
              delete updated.extent;
              return updated;
            }
          }
          return node;
        });
      }
      
      return nds;
    });
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
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        connectOnDrop={false}
        nodesDraggable={true}
        nodesConnectable={true}
        nodesFocusable={true}
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