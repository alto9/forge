---
story_id: create-custom-container-node-types
session_id: react-flow-for-diagrams
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
status: completed
priority: medium
estimated_minutes: 25
---

# Create Custom Container Node Types

## Objective
Create custom react-flow node types for containers (VPC, Subnet, General Group) that can visually contain other nodes and support nesting.

## Context
Containers provide visual grouping for diagram organization. They need to display as larger containers that can hold other nodes, with proper visual boundaries and labels.

## Implementation Steps
1. Create new file `packages/vscode-extension/src/webview/studio/components/nodes/ContainerNodes.tsx`
2. Import React, Handle, Position from react-flow
3. Create `VPCContainerNode` component:
   - Accepts `data` prop with label
   - Displays as large container with border
   - Shows "VPC: {label}" at top
   - Uses AWS dark blue color (#232F3E) for border
   - Has minWidth: 300px, minHeight: 200px
   - Includes connection handles
   - Uses light background (#f0f0f0)
4. Create `SubnetContainerNode` component:
   - Similar structure to VPC but visually distinct
   - Uses different border color/style to distinguish from VPC
   - Shows "Subnet: {label}" label
5. Create `GeneralGroupNode` component:
   - Generic container for non-AWS grouping
   - Customizable label
   - Neutral styling
6. Each container should:
   - Support dynamic sizing (will be updated based on contained nodes)
   - Display label prominently
   - Have proper padding for contained content
   - Include connection handles
7. Export all container node components
8. Add container node types to node types mapping

## Files Affected
- `packages/vscode-extension/src/webview/studio/components/nodes/ContainerNodes.tsx` - New file with container node components

## Acceptance Criteria
- [ ] VPC container node is created with proper styling
- [ ] Subnet container node is created and visually distinct from VPC
- [ ] General Group container node is created
- [ ] All containers display labels correctly
- [ ] Containers have proper sizing and padding
- [ ] Containers include connection handles
- [ ] Container components are properly exported
- [ ] Container node types are added to node types mapping

## Dependencies
- create-reactflow-diagram-editor-component (for understanding node structure)

## Notes
- Container sizing logic (based on contained nodes) will be implemented in a separate story
- Position-based containment detection will be handled in the main editor component

