---
story_id: create-reactflow-diagram-editor-component
session_id: react-flow-for-diagrams
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
diagram_id: [react-flow-editor-architecture]
status: completed
priority: high
estimated_minutes: 25
---

# Create ReactFlowDiagramEditor Component

## Objective
Create the core ReactFlowDiagramEditor component that renders and manages react-flow diagrams with nodes and edges.

## Context
This component is the main diagram editor that will replace the nomnoml renderer. It handles diagram rendering, node/edge state management, and provides the canvas for drag-and-drop interactions.

## Implementation Steps
1. Create new file `packages/vscode-extension/src/webview/studio/components/ReactFlowDiagramEditor.tsx`
2. Import React, react-flow components (ReactFlow, Node, Edge, useNodesState, useEdgesState, addEdge, Connection, Background, Controls, MiniMap)
3. Import react-flow styles: `import 'reactflow/dist/style.css'`
4. Define `DiagramData` interface with `nodes: Node[]` and `edges: Edge[]`
5. Create `ReactFlowDiagramEditor` component with props:
   - `diagramData: DiagramData`
   - `onChange: (data: DiagramData) => void`
   - `readOnly: boolean`
6. Use `useNodesState` and `useEdgesState` hooks to manage diagram state
7. Implement `onConnect` callback using `addEdge`
8. Use `useEffect` to call `onChange` when nodes/edges change
9. Render ReactFlow component with:
   - nodes and edges from state
   - `onNodesChange` and `onEdgesChange` handlers
   - `onConnect` handler
   - `nodesDraggable={!readOnly}`
   - `nodesConnectable={!readOnly}`
   - `elementsSelectable={!readOnly}`
   - Background, Controls, and MiniMap components
10. Set container style with width: '100%' and height: '600px'

## Files Affected
- `packages/vscode-extension/src/webview/studio/components/ReactFlowDiagramEditor.tsx` - New component file

## Acceptance Criteria
- [ ] Component file created with proper TypeScript types
- [ ] Component accepts diagramData, onChange, and readOnly props
- [ ] Component renders ReactFlow with nodes and edges
- [ ] Component updates parent via onChange when diagram changes
- [ ] Component respects readOnly prop for interaction
- [ ] Component includes Background, Controls, and MiniMap
- [ ] Component has proper styling and layout

## Dependencies
- install-reactflow-dependency (must be completed first)

