---
story_id: update-properties-panel-for-actors
session_id: add-actors-to-diagram-library
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
diagram_id: [react-flow-editor-architecture]
status: pending
priority: medium
estimated_minutes: 15
---

# Update Properties Panel for Actor Nodes

## Objective

Update the PropertiesPanel to display an "Actor" type badge with distinct styling when an actor node is selected.

## Context

When selecting an actor node, the Properties Panel should show "Actor" as the type badge instead of the classifier. The badge should have a distinct gray style (#6b7280) to match the actor node's silhouette icon.

## Implementation Steps

1. Locate the `NodePropertiesPanel` component in `PropertiesPanel.tsx`
2. Add logic to detect actor nodes by checking `node.type === 'actor'`
3. Create a helper function `getNodeTypeBadge()` to return appropriate badge text
4. Update badge styling to use gray background for actors

## Files Affected

- `packages/vscode-extension/src/webview/studio/components/diagram/PropertiesPanel.tsx` - Update badge display

## Code Reference

Add helper function and update badge rendering in `NodePropertiesPanel`:

```typescript
// Helper function to get badge text
const getNodeTypeBadge = (localData: any, nodeType: string): string => {
  if (nodeType === 'actor') {
    return 'Actor';
  }
  return localData.classifier || 'Node';
};

// Update badge rendering (around line 89-101):
<div style={{
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  padding: '4px 8px',
  background: node.type === 'actor' 
    ? '#6b7280'  // Gray for actors
    : 'var(--vscode-badge-background)',
  color: node.type === 'actor'
    ? 'white'
    : 'var(--vscode-badge-foreground)',
  borderRadius: '3px'
}}>
  {getNodeTypeBadge(localData, node.type)}
</div>
```

## Acceptance Criteria

- [ ] Selecting an actor node shows "Actor" badge
- [ ] Actor badge uses gray (#6b7280) background color
- [ ] Actor badge text is white for contrast
- [ ] Non-actor nodes continue to show classifier badge
- [ ] Name field editing works for actor nodes
- [ ] Badge styling is consistent with VSCode theme

## Dependencies

- 002-create-actor-node-component (actor nodes must exist to select)
- 004-update-diagram-editor-drop-handler (must be able to create actor nodes)

