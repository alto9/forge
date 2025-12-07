---
spec_id: react-flow-diagram-implementation
name: React Flow Diagram Editor Implementation
description: Technical specification for replacing nomnoml with react-flow JSON-based diagram editor
feature_id: [react-flow-diagram-editor]
diagram_id: []
---

# React Flow Diagram Editor Implementation

## Overview

This specification defines the technical implementation for replacing the nomnoml-based diagram editor with a react-flow-based visual drag-and-drop diagram editor. The new editor will use JSON format for diagram storage, provide a shape library with categories, support AWS service icons, and enable container-based grouping.

## Critical Changes

### Removal of Code/Render Toggle

**IMPORTANT**: The Code/Render toggle is completely removed. Diagrams are always rendered visually:
- **Edit Mode (Active Session)**: Visual drag-and-drop editor with shape library
- **Read-Only Mode (No Session)**: Rendered diagram display only

### Diagram Format Change

- **Old Format**: nomnoml code blocks in markdown
- **New Format**: JSON diagram data stored in markdown file

### VSCode Styling Requirement

**CRITICAL**: The shape library panel must follow VSCode styling conventions:
- Use VSCode CSS variables for all colors, backgrounds, and borders
- Match the appearance of other Studio panels (Sidebar, Session Panel)
- Automatically adapt to light and dark themes
- Use consistent spacing, fonts, and hover states
- Reference existing VSCode-styled components in the codebase for patterns

## Technology Stack

### React Flow

We will use **react-flow** as the diagram rendering and editing framework:
- Built-in drag-and-drop support
- Node and edge management
- Container/group support via custom nodes
- Extensible with custom node types
- TypeScript support
- Excellent performance for complex diagrams

### Installation

```bash
npm install reactflow
```

## Architecture

### Component Structure

```
ItemProfile (diagrams category)
  └── ReactFlowDiagramEditor
      ├── ShapeLibraryPanel (left side)
      │   ├── CategorySection (General)
      │   │   └── ShapeItem[] (Rectangle, Circle, etc.)
      │   └── CategorySection (AWS)
      │       └── ShapeItem[] (Lambda, S3, DynamoDB, etc.)
      └── DiagramCanvas (right side)
          └── ReactFlow
              ├── Nodes (with custom node types)
              ├── Edges
              └── Containers (VPC, Subnet, General Group)
```

## Implementation Details

### VSCode Theme Integration

**CRITICAL**: All components in the shape library panel must use VSCode CSS variables for theming. This ensures:
- Automatic adaptation to light/dark themes
- Consistency with other Studio panels (Sidebar, Session Panel, etc.)
- Proper integration with VSCode's theme system

**Required VSCode CSS Variables:**
- `var(--vscode-sideBar-background)` - Panel background
- `var(--vscode-panel-border)` - Borders
- `var(--vscode-foreground)` - Primary text color
- `var(--vscode-descriptionForeground)` - Secondary text color
- `var(--vscode-list-hoverBackground)` - Hover states
- `var(--vscode-list-activeSelectionBackground)` - Active selection
- `var(--vscode-font-family)` - Font family
- `var(--vscode-editor-font-size)` - Font size

**Reference Implementation:**
See `packages/vscode-extension/src/webview/studio/components/Sidebar.tsx` for examples of VSCode-styled panels.

### Diagram File Format

Diagram files will store JSON data in a code block:

```markdown
---
diagram_id: my-diagram
name: My Diagram
description: Description of the diagram
diagram_type: infrastructure
---

# My Diagram

```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "aws-lambda",
      "position": { "x": 100, "y": 100 },
      "data": { "label": "My Lambda Function" }
    },
    {
      "id": "node-2",
      "type": "aws-s3",
      "position": { "x": 300, "y": 100 },
      "data": { "label": "My S3 Bucket" }
    },
    {
      "id": "container-1",
      "type": "vpc-container",
      "position": { "x": 50, "y": 50 },
      "data": { "label": "My VPC" },
      "width": 500,
      "height": 400
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "type": "default"
    }
  ]
}
```
```

### ReactFlowDiagramEditor Component

```typescript
import React, { useCallback, useState, useMemo } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';

interface ReactFlowDiagramEditorProps {
  diagramData: DiagramData;
  onChange: (data: DiagramData) => void;
  readOnly: boolean;
}

interface DiagramData {
  nodes: Node[];
  edges: Edge[];
}

export const ReactFlowDiagramEditor: React.FC<ReactFlowDiagramEditorProps> = ({
  diagramData,
  onChange,
  readOnly,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(diagramData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(diagramData.edges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update parent when nodes/edges change
  useEffect(() => {
    onChange({ nodes, edges });
  }, [nodes, edges, onChange]);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
```

### Shape Library Panel

**IMPORTANT**: The shape library panel must follow VSCode styling conventions using VSCode CSS variables to ensure consistent theming and appearance with other Studio panels.

```typescript
interface ShapeLibraryPanelProps {
  onDragStart: (shapeType: string, shapeData: any) => void;
}

interface ShapeItem {
  id: string;
  name: string;
  icon?: string;
  category: 'general' | 'aws';
  type: string;
}

const GENERAL_SHAPES: ShapeItem[] = [
  { id: 'rect', name: 'Rectangle', category: 'general', type: 'default' },
  { id: 'circle', name: 'Circle', category: 'general', type: 'default' },
  { id: 'ellipse', name: 'Ellipse', category: 'general', type: 'default' },
  { id: 'text', name: 'Text', category: 'general', type: 'default' },
];

const AWS_SHAPES: ShapeItem[] = [
  { id: 'lambda', name: 'Lambda', category: 'aws', type: 'aws-lambda', icon: 'lambda-icon' },
  { id: 's3', name: 'S3', category: 'aws', type: 'aws-s3', icon: 's3-icon' },
  { id: 'dynamodb', name: 'DynamoDB', category: 'aws', type: 'aws-dynamodb', icon: 'dynamodb-icon' },
  { id: 'apigateway', name: 'API Gateway', category: 'aws', type: 'aws-apigateway', icon: 'apigateway-icon' },
  { id: 'ec2', name: 'EC2', category: 'aws', type: 'aws-ec2', icon: 'ec2-icon' },
  { id: 'rds', name: 'RDS', category: 'aws', type: 'aws-rds', icon: 'rds-icon' },
  { id: 'cloudfront', name: 'CloudFront', category: 'aws', type: 'aws-cloudfront', icon: 'cloudfront-icon' },
  // ... more AWS services
];

const CONTAINER_SHAPES: ShapeItem[] = [
  { id: 'vpc', name: 'VPC', category: 'aws', type: 'vpc-container' },
  { id: 'subnet', name: 'Subnet', category: 'aws', type: 'subnet-container' },
  { id: 'group', name: 'General Group', category: 'general', type: 'general-group' },
];

export const ShapeLibraryPanel: React.FC<ShapeLibraryPanelProps> = ({ onDragStart }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['general', 'aws']));

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <div style={{ 
      width: '250px', 
      borderRight: '1px solid var(--vscode-panel-border)', 
      background: 'var(--vscode-sideBar-background)',
      padding: '12px',
      height: '100%',
      overflow: 'auto'
    }}>
      <h3 style={{ 
        marginTop: 0,
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--vscode-foreground)',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--vscode-panel-border)'
      }}>Shape Library</h3>
      
      {/* General Category */}
      <CategorySection
        title="General"
        expanded={expandedCategories.has('general')}
        onToggle={() => toggleCategory('general')}
      >
        {GENERAL_SHAPES.map((shape) => (
          <ShapeItem
            key={shape.id}
            shape={shape}
            onDragStart={onDragStart}
          />
        ))}
        {CONTAINER_SHAPES.filter(s => s.category === 'general').map((shape) => (
          <ShapeItem
            key={shape.id}
            shape={shape}
            onDragStart={onDragStart}
          />
        ))}
      </CategorySection>

      {/* AWS Category */}
      <CategorySection
        title="AWS"
        expanded={expandedCategories.has('aws')}
        onToggle={() => toggleCategory('aws')}
      >
        {AWS_SHAPES.map((shape) => (
          <ShapeItem
            key={shape.id}
            shape={shape}
            onDragStart={onDragStart}
          />
        ))}
        {CONTAINER_SHAPES.filter(s => s.category === 'aws').map((shape) => (
          <ShapeItem
            key={shape.id}
            shape={shape}
            onDragStart={onDragStart}
          />
        ))}
      </CategorySection>
    </div>
  );
};

// CategorySection component with VSCode styling
const CategorySection: React.FC<{
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, expanded, onToggle, children }) => {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 8px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--vscode-foreground)',
          background: 'transparent',
          border: 'none',
          width: '100%',
          textAlign: 'left',
          transition: 'background 0.1s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--vscode-list-hoverBackground)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span style={{ 
          marginRight: '6px',
          fontSize: '10px',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.1s'
        }}>
          ▸
        </span>
        <span>{title}</span>
      </div>
      {expanded && (
        <div style={{ 
          paddingLeft: '16px',
          paddingTop: '4px'
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ShapeItem component with VSCode styling
const ShapeItem: React.FC<{
  shape: ShapeItem;
  onDragStart: (shapeType: string, shapeData: any) => void;
}> = ({ shape, onDragStart }) => {
  const handleDragStart = (e: React.DragEvent) => {
    onDragStart(shape.id, shape);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 8px',
        marginBottom: '4px',
        cursor: 'grab',
        fontSize: '12px',
        color: 'var(--vscode-foreground)',
        background: 'transparent',
        borderRadius: '3px',
        transition: 'background 0.1s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--vscode-list-hoverBackground)';
        e.currentTarget.style.cursor = 'grab';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
      onDragStart={(e) => {
        e.currentTarget.style.cursor = 'grabbing';
        handleDragStart(e);
      }}
    >
      {shape.icon && (
        <img 
          src={shape.icon} 
          alt={shape.name}
          style={{
            width: '16px',
            height: '16px',
            marginRight: '8px'
          }}
        />
      )}
      <span>{shape.name}</span>
    </div>
  );
};
```

### Drag and Drop Integration

```typescript
const onDragStart = (event: React.DragEvent, shapeType: string, shapeData: any) => {
  event.dataTransfer.setData('application/reactflow', JSON.stringify({ shapeType, shapeData }));
  event.dataTransfer.effectAllowed = 'move';
};

const onDrop = useCallback(
  (event: React.DragEvent) => {
    event.preventDefault();
    
    const data = JSON.parse(event.dataTransfer.getData('application/reactflow'));
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode: Node = {
      id: `${data.shapeType}-${Date.now()}`,
      type: data.shapeData.type,
      position,
      data: { label: data.shapeData.name },
    };

    setNodes((nds) => nds.concat(newNode));
  },
  [setNodes]
);

const onDragOver = useCallback((event: React.DragEvent) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}, []);
```

### Custom Node Types

#### AWS Service Nodes

```typescript
import { Handle, Position } from 'reactflow';

export const AWSLambdaNode = ({ data }: { data: any }) => {
  return (
    <div style={{ 
      padding: '10px',
      background: 'white',
      border: '2px solid #FF9900',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <img src="/icons/aws-lambda.svg" alt="Lambda" width="24" height="24" />
      <span>{data.label}</span>
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
};

// Similar implementations for other AWS services
```

#### Container Nodes

```typescript
export const VPCContainerNode = ({ data, children }: { data: any; children?: React.ReactNode }) => {
  return (
    <div style={{
      padding: '20px',
      background: '#f0f0f0',
      border: '3px solid #232F3E',
      borderRadius: '8px',
      minWidth: '300px',
      minHeight: '200px',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#232F3E'
      }}>
        VPC: {data.label}
      </div>
      {children}
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
};

// Similar for SubnetContainerNode and GeneralGroupNode
```

### AWS Icon Integration

AWS service icons should be included as SVG assets:

```typescript
// Store icons in packages/vscode-extension/src/webview/studio/assets/aws-icons/
// Import and use in custom node components

import lambdaIcon from './assets/aws-icons/lambda.svg';
import s3Icon from './assets/aws-icons/s3.svg';
// ... etc
```

Alternatively, use a CDN or icon library that provides AWS icons.

### JSON Parsing and Serialization

```typescript
function parseDiagramContent(content: string): DiagramData {
  // Extract JSON from markdown code block
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
  if (!jsonMatch) {
    return { nodes: [], edges: [] };
  }

  try {
    const data = JSON.parse(jsonMatch[1]);
    return {
      nodes: data.nodes || [],
      edges: data.edges || [],
    };
  } catch (error) {
    console.error('Failed to parse diagram JSON:', error);
    return { nodes: [], edges: [] };
  }
}

function serializeDiagramData(data: DiagramData, frontmatter: string): string {
  const jsonContent = JSON.stringify(data, null, 2);
  return `${frontmatter}\n\n# Diagram\n\n\`\`\`json\n${jsonContent}\n\`\`\``;
}
```

### Integration with ItemProfile

Update `ItemProfile` component in `index.tsx`:

```typescript
// In ItemProfile component, replace nomnoml diagram section:

{category === 'diagrams' ? (
  <>
    <div className="content-section">
      <div style={{ display: 'flex', height: '600px' }}>
        {!isReadOnly && (
          <ShapeLibraryPanel onDragStart={handleDragStart} />
        )}
        <div style={{ flex: 1 }}>
          <ReactFlowDiagramEditor
            diagramData={parseDiagramContent(content)}
            onChange={(data) => {
              const newContent = serializeDiagramData(data, frontmatter);
              updateContent(newContent);
            }}
            readOnly={isReadOnly}
          />
        </div>
      </div>
    </div>
    {/* Remove Code/Render toggle completely */}
  </>
) : ...}
```

## Migration Strategy

**Note**: No migration needed - users have not started using this feature yet. We can replace the nomnoml implementation directly.

### Removal Steps

1. Remove `NomnomlRenderer` component
2. Remove nomnoml dependency from package.json
3. Remove Code/Render toggle UI
4. Remove `extractNomnomlBlocks` function
5. Update diagram file template to use JSON format
6. Update MCP server schema for diagram format

## File Format Changes

### Old Format (nomnoml)

```markdown
---
diagram_id: my-diagram
---

# My Diagram

```nomnoml
[User] -> [API Gateway]
[API Gateway] -> [Lambda]
```
```

### New Format (JSON)

```markdown
---
diagram_id: my-diagram
---

# My Diagram

```json
{
  "nodes": [
    { "id": "user", "type": "default", "position": { "x": 0, "y": 0 }, "data": { "label": "User" } },
    { "id": "api", "type": "aws-apigateway", "position": { "x": 200, "y": 0 }, "data": { "label": "API Gateway" } },
    { "id": "lambda", "type": "aws-lambda", "position": { "x": 400, "y": 0 }, "data": { "label": "Lambda" } }
  ],
  "edges": [
    { "id": "e1", "source": "user", "target": "api" },
    { "id": "e2", "source": "api", "target": "lambda" }
  ]
}
```
```

## Container Implementation

Containers are implemented as custom node types that can contain other nodes:

```typescript
// Use react-flow's node positioning to detect containment
function isNodeInContainer(node: Node, container: Node): boolean {
  return (
    node.position.x >= container.position.x &&
    node.position.y >= container.position.y &&
    node.position.x < container.position.x + (container.width || 0) &&
    node.position.y < container.position.y + (container.height || 0)
  );
}

// Update container size when nodes are added
function updateContainerSize(container: Node, nodes: Node[]): Node {
  const containedNodes = nodes.filter(n => 
    n.id !== container.id && isNodeInContainer(n, container)
  );
  
  if (containedNodes.length === 0) {
    return container;
  }

  const minX = Math.min(...containedNodes.map(n => n.position.x));
  const minY = Math.min(...containedNodes.map(n => n.position.y));
  const maxX = Math.max(...containedNodes.map(n => n.position.x + (n.width || 100)));
  const maxY = Math.max(...containedNodes.map(n => n.position.y + (n.height || 50)));

  return {
    ...container,
    position: { x: minX - 20, y: minY - 20 },
    width: maxX - minX + 40,
    height: maxY - minY + 40,
  };
}
```

## Actor Node Implementation

### Actor List Retrieval

The extension host scans `ai/actors/` recursively and returns actor metadata:

```typescript
interface ActorInfo {
  actor_id: string;
  name: string;
  type: string;       // 'human' | 'system' | 'external'
  filePath: string;
}

// Add message handler in ForgeStudioPanel.ts
case 'getActors':
  const actors = await this._listActors();
  this._panel.webview.postMessage({ type: 'actors', data: actors });
  break;

// Implementation
private async _listActors(): Promise<ActorInfo[]> {
  const actorsDir = vscode.Uri.joinPath(this._aiDir, 'actors');
  const files = await this._listFilesRecursive(actorsDir, '.actor.md');
  
  const actors: ActorInfo[] = [];
  for (const file of files) {
    const content = await vscode.workspace.fs.readFile(file);
    const text = new TextDecoder().decode(content);
    const frontmatter = this._parseFrontmatter(text);
    
    actors.push({
      actor_id: frontmatter.actor_id || '',
      name: frontmatter.name || frontmatter.actor_id || 'Unknown',
      type: frontmatter.type || 'system',
      filePath: file.fsPath
    });
  }
  return actors;
}
```

### Actors Section in Shape Library

Add Actors section between General Shapes and AWS Services:

```typescript
// In ShapeLibrary.tsx

// State for actors
const [actors, setActors] = useState<ActorInfo[]>([]);

// Request actors on mount
useEffect(() => {
  const vscode = (window as any).vscode;
  if (vscode) {
    vscode.postMessage({ type: 'getActors' });
  }
  
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'actors') {
      setActors(event.data.data || []);
    }
  };
  
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);

// Drag handler for actors
const handleActorDragStart = (e: React.DragEvent, actor: ActorInfo) => {
  const dragData = {
    isNewNode: false,
    type: 'actor',
    library: 'actor',
    actor_id: actor.actor_id,
    displayName: actor.name,
    actorType: actor.type,
    isContainer: false
  };
  e.dataTransfer.setData('application/reactflow', JSON.stringify(dragData));
  e.dataTransfer.effectAllowed = 'move';
};

// Render Actors section
<div style={{ marginBottom: '16px' }}>
  <h4 style={{ /* VSCode styling */ }}>Actors</h4>
  {actors.length === 0 ? (
    <div style={{ /* empty state styling */ }}>No actors defined</div>
  ) : (
    actors.map(actor => (
      <ActorItem key={actor.actor_id} actor={actor} onDragStart={handleActorDragStart} />
    ))
  )}
</div>
```

### Actor Item Component

Display actors with silhouette icon:

```typescript
interface ActorItemProps {
  actor: ActorInfo;
  onDragStart: (event: React.DragEvent, actor: ActorInfo) => void;
}

const ActorItem: React.FC<ActorItemProps> = ({ actor, onDragStart }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, actor)}
      style={{
        padding: '8px 12px',
        background: 'var(--vscode-list-inactiveSelectionBackground)',
        border: '1px solid var(--vscode-panel-border)',
        borderRadius: '4px',
        marginBottom: '4px',
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        fontSize: '12px',
        color: 'var(--vscode-foreground)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--vscode-list-hoverBackground)';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--vscode-list-inactiveSelectionBackground)';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      {/* Silhouette Icon */}
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '4px',
        background: '#6b7280',  // Neutral gray
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
      <span style={{ fontWeight: 500 }}>{actor.name}</span>
    </div>
  );
};
```

### ActorNode Component

Create `packages/vscode-extension/src/webview/studio/components/diagram/nodes/ActorNode.tsx`:

```typescript
import React from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';

export interface ActorNodeData {
  label: string;
  actor_id?: string;
  actorType?: string;
}

export const ActorNode: React.FC<NodeProps<ActorNodeData>> = ({ data, selected }) => {
  return (
    <>
      <NodeResizer
        minWidth={80}
        minHeight={100}
        isVisible={selected}
        lineClassName="resize-line"
        handleClassName="resize-handle"
      />
      <div style={{
        padding: '16px',
        background: 'var(--vscode-editor-background)',
        border: `2px solid ${selected ? 'var(--vscode-focusBorder)' : '#6b7280'}`,
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        minWidth: '80px',
        minHeight: '100px'
      }}>
        {/* Silhouette Icon */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        
        {/* Actor Name */}
        <div style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--vscode-foreground)',
          textAlign: 'center',
          wordBreak: 'break-word',
          maxWidth: '100%'
        }}>
          {data.label}
        </div>
      </div>
      
      {/* Connection Handles */}
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Top} id="top-target" style={{ top: 0 }} />
      <Handle type="target" position={Position.Right} id="right-target" style={{ right: 0 }} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ bottom: 0 }} />
      <Handle type="target" position={Position.Left} id="left-target" style={{ left: 0 }} />
    </>
  );
};
```

### Register Actor Node Type

Update `nodeTypes.ts`:

```typescript
import { ActorNode } from './nodes/ActorNode';

function generateNodeTypes(): NodeTypes {
  const nodeTypes: NodeTypes = {
    container: ContainerNode,
    actor: ActorNode  // Add actor node type
  };
  
  // ... existing AWS and General node types
  
  return nodeTypes;
}
```

### Handle Actor Drop in DiagramEditor

Update `DiagramEditor.tsx` onDrop handler:

```typescript
const onDrop = useCallback((event: React.DragEvent) => {
  // ... existing code ...
  
  // Determine node type based on library
  let nodeType: string;
  if (dropData.library === 'actor') {
    nodeType = 'actor';
  } else if (dropData.library === 'general') {
    nodeType = `general-${dropData.classifier}`;
  } else {
    nodeType = `aws-${dropData.classifier}`;
  }
  
  // Create node with actor-specific data
  const newNode: Node = {
    id: getId(),
    type: nodeType,
    position: adjustedPosition,
    data: {
      label: dropData.displayName || 'New Actor',
      classifier: dropData.library === 'actor' ? 'actor' : dropData.classifier,
      actor_id: dropData.actor_id,  // Link to actor file
      actorType: dropData.actorType,
      isContainer: false
    },
    zIndex: parentNodeId ? 1 : undefined,
    ...(parentNodeId && {
      parentNode: parentNodeId,
      extent: 'parent' as const
    })
  };
  
  // ... rest of drop handling
}, [reactFlowInstance, setNodes]);
```

### Actor Properties Panel Display

Update `PropertiesPanel.tsx` to show actor-specific badge:

```typescript
// In NodePropertiesPanel
const getNodeTypeBadge = (localData: any, nodeType: string): string => {
  if (nodeType === 'actor') {
    return 'Actor';
  }
  return localData.classifier || 'Node';
};

// Use in render:
<div style={{
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  padding: '4px 8px',
  background: node.type === 'actor' 
    ? '#6b7280'  // Gray for actors
    : 'var(--vscode-badge-background)',
  color: 'var(--vscode-badge-foreground)',
  borderRadius: '3px'
}}>
  {getNodeTypeBadge(localData, node.type)}
</div>
```

### Actor Node JSON Structure

When saved, actor nodes have this structure:

```json
{
  "id": "node_1733612345_abc123",
  "type": "actor",
  "position": { "x": 100, "y": 100 },
  "data": {
    "label": "Developer",
    "classifier": "actor",
    "actor_id": "developer",
    "actorType": "human"
  }
}
```

## Save Functionality

The save functionality is already handled by the existing `ItemProfile` component:
- User clicks "Save Changes" button
- `handleSave` function is called
- Content (including JSON) is saved to file
- File is tracked in active session

## Performance Considerations

- Use `React.memo` for shape library items to prevent unnecessary re-renders
- Debounce diagram updates during drag operations
- Lazy load AWS icons
- Virtualize shape library if it becomes large

## Future Enhancements

1. **Additional Categories**: Add more shape categories (Azure, GCP, Kubernetes, etc.)
2. **Custom Shapes**: Allow users to define custom shapes
3. **Templates**: Pre-built diagram templates
4. **Export**: Export diagrams as images (PNG, SVG)
5. **Import**: Import from other diagram formats
6. **Collaboration**: Real-time collaborative editing
7. **Validation**: Validate diagram structure and connections

## Dependencies

**Required npm packages:**
```json
{
  "reactflow": "^11.x.x"
}
```

**Optional (for AWS icons):**
- AWS official icon library or custom SVG assets

