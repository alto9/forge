---
story_id: implement-drag-and-drop-functionality
session_id: react-flow-for-diagrams
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
status: completed
priority: high
estimated_minutes: 25
---

# Implement Drag-and-Drop Functionality

## Objective
Implement drag-and-drop functionality to allow users to drag shapes from the ShapeLibraryPanel and drop them onto the ReactFlowDiagramEditor canvas to create new nodes.

## Context
The drag-and-drop system connects the shape library to the diagram canvas, enabling visual diagram building. This requires coordinating between ShapeLibraryPanel and ReactFlowDiagramEditor components.

## Implementation Steps
1. In `ShapeLibraryPanel.tsx`:
   - Update `ShapeItem` component to set drag data:
     - Use `event.dataTransfer.setData('application/reactflow', JSON.stringify({ shapeType, shapeData }))`
     - Set `event.dataTransfer.effectAllowed = 'move'`
2. In `ReactFlowDiagramEditor.tsx`:
   - Import `useCallback` and `screenToFlowPosition` from react-flow
   - Add `onDrop` callback:
     - Prevent default behavior
     - Parse drag data from `event.dataTransfer.getData('application/reactflow')`
     - Get drop position using `screenToFlowPosition` with event coordinates
     - Create new node with:
       - Unique ID: `${shapeType}-${Date.now()}`
       - Type from shapeData
       - Position from screenToFlowPosition
       - Data with label from shapeData
     - Add node to nodes state using `setNodes`
   - Add `onDragOver` callback:
     - Prevent default behavior
     - Set `event.dataTransfer.dropEffect = 'move'`
   - Add `onDrop` and `onDragOver` handlers to ReactFlow container div
3. Ensure drag-and-drop only works when `readOnly` is false
4. Test dragging shapes from library to canvas creates nodes at correct positions

## Files Affected
- `packages/vscode-extension/src/webview/studio/components/ShapeLibraryPanel.tsx` - Add drag data handling
- `packages/vscode-extension/src/webview/studio/components/ReactFlowDiagramEditor.tsx` - Add drop handlers

## Acceptance Criteria
- [ ] Shapes can be dragged from library panel
- [ ] Shapes can be dropped onto diagram canvas
- [ ] New nodes are created at drop position
- [ ] Node type matches the dragged shape type
- [ ] Node label is set from shape data
- [ ] Drag-and-drop is disabled when readOnly is true
- [ ] Drop position is correctly converted from screen to flow coordinates

## Dependencies
- create-shape-library-panel-component
- create-reactflow-diagram-editor-component
- create-custom-aws-node-types
- create-custom-container-node-types

