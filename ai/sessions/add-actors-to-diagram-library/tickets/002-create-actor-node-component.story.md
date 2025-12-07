---
story_id: create-actor-node-component
session_id: add-actors-to-diagram-library
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
diagram_id: [react-flow-editor-architecture]
status: completed
priority: high
estimated_minutes: 25
---

# Create ActorNode Component

## Objective

Create a new `ActorNode` React component that renders actor nodes in the diagram with a silhouette icon, label, connection handles, and resizing support.

## Context

Actor nodes need a distinct visual appearance from AWS services and general shapes. They use a neutral gray silhouette icon to represent human or system actors in architecture diagrams.

## Implementation Steps

1. Create new file `ActorNode.tsx` in the nodes directory
2. Import required react-flow components: `Handle`, `Position`, `NodeProps`, `NodeResizer`
3. Define `ActorNodeData` interface with `label`, `actor_id`, and `actorType` fields
4. Implement the component with:
   - NodeResizer for resize capability
   - Silhouette SVG icon (person shape) in neutral gray (#6b7280)
   - Label display below the icon
   - Connection handles on all four sides (source and target)
   - VSCode theme-compatible styling

## Files Affected

- `packages/vscode-extension/src/webview/studio/components/diagram/nodes/ActorNode.tsx` - Create new file

## Code Reference

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
      
      {/* Connection Handles - all four sides */}
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

## Acceptance Criteria

- [ ] `ActorNode.tsx` file created in `nodes/` directory
- [ ] Component displays silhouette icon (person shape) with neutral gray fill
- [ ] Actor name is displayed below the icon
- [ ] Node supports resizing when selected (NodeResizer)
- [ ] Connection handles exist on all four sides
- [ ] Styling uses VSCode CSS variables where appropriate
- [ ] Selected state shows focus border highlight
- [ ] Component exports `ActorNodeData` interface

## Dependencies

- None (can be done in parallel with 002-register-actor-node-type)

