---
story_id: integrate-reactflow-into-itemprofile
session_id: react-flow-for-diagrams
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
status: completed
priority: high
estimated_minutes: 25
---

# Integrate ReactFlowDiagramEditor into ItemProfile

## Objective
Replace the nomnoml diagram rendering section in ItemProfile with the new ReactFlowDiagramEditor component, including ShapeLibraryPanel for active sessions.

## Context
The ItemProfile component currently handles diagram rendering with nomnoml. We need to replace that section with the new react-flow implementation, showing the shape library when editing and just the rendered diagram when read-only.

## Implementation Steps
1. In `packages/vscode-extension/src/webview/studio/index.tsx`:
   - Remove import of `NomnomlRenderer` component (line 3)
   - Import `ReactFlowDiagramEditor` component
   - Import `ShapeLibraryPanel` component
   - Import `parseDiagramContent` and `serializeDiagramData` from diagramUtils
   - Remove `extractNomnomlBlocks` function (if still present)
2. Locate the `category === 'diagrams'` section in ItemProfile component
3. Replace the entire nomnoml diagram section (lines ~1963-2029) with:
   - Content section div
   - Flex container with height: 600px
   - Conditional rendering:
     - If `!isReadOnly`: Render `ShapeLibraryPanel` on left
     - Render `ReactFlowDiagramEditor` on right (flex: 1)
   - Pass props to ReactFlowDiagramEditor:
     - `diagramData={parseDiagramContent(content)}`
     - `onChange={(data) => { const newContent = serializeDiagramData(data, frontmatter); updateContent(newContent); }}`
     - `readOnly={isReadOnly}`
4. Remove the Code/Render toggle UI completely
5. Remove `diagramViewMode` state (no longer needed)
6. Ensure ShapeLibraryPanel's `onDragStart` is properly connected (may need handler function)

## Files Affected
- `packages/vscode-extension/src/webview/studio/index.tsx` - Replace diagram section

## Acceptance Criteria
- [ ] NomnomlRenderer import is removed from index.tsx
- [ ] extractNomnomlBlocks function is removed (if present)
- [ ] Nomnoml diagram section is completely removed
- [ ] ReactFlowDiagramEditor is rendered for diagrams
- [ ] ShapeLibraryPanel appears when session is active (not read-only)
- [ ] ShapeLibraryPanel is hidden when read-only
- [ ] Diagram data is parsed from content correctly
- [ ] Diagram changes are serialized and saved correctly
- [ ] Code/Render toggle is completely removed
- [ ] `diagramViewMode` state is removed
- [ ] Frontmatter is preserved when saving

## Dependencies
- create-reactflow-diagram-editor-component
- create-shape-library-panel-component
- implement-json-parsing-serialization
- implement-drag-and-drop-functionality

