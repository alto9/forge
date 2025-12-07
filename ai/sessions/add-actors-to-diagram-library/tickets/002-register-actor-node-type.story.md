---
story_id: register-actor-node-type
session_id: add-actors-to-diagram-library
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
diagram_id: [react-flow-editor-architecture]
status: completed
priority: high
estimated_minutes: 10
---

# Register Actor Node Type in nodeTypes Registry

## Objective

Register the `actor` node type in `nodeTypes.ts` so react-flow can render actor nodes on the diagram canvas.

## Context

React-flow requires custom node types to be registered in a `nodeTypes` object. The actor node type is different from AWS and General shapes - it uses a simple `'actor'` type name (not prefixed like `'aws-'` or `'general-'`).

## Implementation Steps

1. Import `ActorNode` component from `./nodes/ActorNode`
2. Add `actor: ActorNode` to the `nodeTypes` object in `generateNodeTypes()`
3. Update `getNodeTypeFromClassifier()` function if needed to handle actor library

## Files Affected

- `packages/vscode-extension/src/webview/studio/components/diagram/nodeTypes.ts` - Register actor node type

## Code Reference

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

// Update getNodeTypeFromClassifier if needed:
export function getNodeTypeFromClassifier(classifier?: string, library: 'aws' | 'general' | 'actor' = 'aws'): string {
    if (!classifier) {
        return 'default';
    }
    
    if (library === 'actor') {
        return 'actor';
    }

    return library === 'general' ? `general-${classifier}` : `aws-${classifier}`;
}
```

## Acceptance Criteria

- [ ] `ActorNode` is imported from `./nodes/ActorNode`
- [ ] `actor` key is added to `nodeTypes` object
- [ ] Actor nodes can be rendered by react-flow
- [ ] TypeScript compiles without errors

## Dependencies

- 002-create-actor-node-component (ActorNode must exist to import)

