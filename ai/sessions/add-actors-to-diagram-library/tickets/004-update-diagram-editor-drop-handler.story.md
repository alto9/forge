---
story_id: update-diagram-editor-drop-handler
session_id: add-actors-to-diagram-library
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
diagram_id: [react-flow-editor-architecture]
status: completed
priority: high
estimated_minutes: 15
---

# Update DiagramEditor Drop Handler for Actors

## Objective

Update the `onDrop` handler in `DiagramEditor.tsx` to recognize actor drops from the Shape Library and create actor nodes with appropriate data.

## Context

When an actor is dragged from the Shape Library, it has `library: 'actor'` in the drop data. The drop handler needs to recognize this and create a node with type `'actor'` instead of the prefixed types used for AWS and General shapes.

## Implementation Steps

1. Locate the `onDrop` callback in `DiagramEditor.tsx`
2. Update the node type determination logic to handle `library === 'actor'`
3. Ensure actor nodes are created with `actor_id` and `actorType` in their data
4. Set correct `classifier` value for actors

## Files Affected

- `packages/vscode-extension/src/webview/studio/components/diagram/DiagramEditor.tsx` - Update onDrop handler

## Code Reference

Current code at ~line 194 determines node type:

```typescript
// BEFORE:
const nodeType = dropData.library === 'general' 
  ? `general-${dropData.classifier}`
  : `aws-${dropData.classifier}`;

// AFTER:
let nodeType: string;
if (dropData.library === 'actor') {
  nodeType = 'actor';
} else if (dropData.library === 'general') {
  nodeType = `general-${dropData.classifier}`;
} else {
  nodeType = `aws-${dropData.classifier}`;
}
```

Update node data creation (~line 261-300):

```typescript
const newNode: Node = dropData.isContainer ? {
  // ... existing container logic
} : {
  id: getId(),
  type: nodeType,
  position: adjustedPosition,
  data: { 
    label: dropData.displayName || 'New Node',
    classifier: dropData.library === 'actor' ? 'actor' : dropData.classifier,
    actor_id: dropData.actor_id,      // Add for actors
    actorType: dropData.actorType,    // Add for actors
    properties: {},
    color: dropData.color,
    isContainer: false
  },
  zIndex: parentNodeId ? 1 : undefined,
  ...(parentNodeId && { 
    parentNode: parentNodeId,
    extent: 'parent' as const
  })
};
```

## Acceptance Criteria

- [ ] Actor drops create nodes with type `'actor'`
- [ ] Actor nodes include `actor_id` in their data
- [ ] Actor nodes include `actorType` in their data
- [ ] Actor nodes have `classifier: 'actor'`
- [ ] Actor nodes can be dropped into containers
- [ ] Non-actor drops continue to work correctly

## Dependencies

- 002-create-actor-node-component (ActorNode must be registered)
- 002-register-actor-node-type (type must be registered)
- 003-add-actors-section-to-shape-library (actors must be draggable)

