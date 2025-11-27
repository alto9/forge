---
story_id: implement-json-parsing-serialization
session_id: react-flow-for-diagrams
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
status: completed
priority: high
estimated_minutes: 20
---

# Implement JSON Parsing and Serialization

## Objective
Create utility functions to parse JSON diagram data from markdown files and serialize diagram data back to JSON format for saving.

## Context
Diagrams are stored as JSON in markdown code blocks. We need functions to extract JSON from markdown content and convert diagram state back to JSON for persistence.

## Implementation Steps
1. Create new file `packages/vscode-extension/src/webview/studio/utils/diagramUtils.ts`
2. Define `DiagramData` interface (or import from ReactFlowDiagramEditor):
   - `nodes: Node[]`
   - `edges: Edge[]`
3. Create `parseDiagramContent` function:
   - Accepts `content: string` (full markdown content)
   - Uses regex to extract JSON from markdown code block: `/```json\n([\s\S]*?)\n```/`
   - If no JSON found, return `{ nodes: [], edges: [] }`
   - Parse JSON string
   - Return `DiagramData` with nodes and edges arrays
   - Handle parse errors gracefully (return empty diagram)
4. Create `serializeDiagramData` function:
   - Accepts `data: DiagramData` and `frontmatter: string`
   - Stringify diagram data with `JSON.stringify(data, null, 2)` for formatting
   - Construct markdown content:
     - Frontmatter
     - Empty line
     - `# Diagram` heading
     - Empty line
     - JSON code block with formatted JSON
   - Return complete markdown string
5. Export both functions

## Files Affected
- `packages/vscode-extension/src/webview/studio/utils/diagramUtils.ts` - New utility file

## Acceptance Criteria
- [ ] `parseDiagramContent` extracts JSON from markdown code blocks
- [ ] `parseDiagramContent` returns empty diagram if no JSON found
- [ ] `parseDiagramContent` handles parse errors gracefully
- [ ] `serializeDiagramData` formats JSON with proper indentation
- [ ] `serializeDiagramData` preserves frontmatter
- [ ] `serializeDiagramData` creates valid markdown with JSON code block
- [ ] Both functions handle edge cases (empty content, malformed JSON, etc.)

## Dependencies
- None (utility functions, can be developed independently)

