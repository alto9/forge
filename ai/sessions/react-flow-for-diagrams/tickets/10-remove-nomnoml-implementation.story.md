---
story_id: remove-nomnoml-implementation
session_id: react-flow-for-diagrams
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
status: completed
priority: medium
estimated_minutes: 25
---

# Remove Nomnoml Implementation

## Objective
Remove all nomnoml-related code, components, dependencies, and tests since we're replacing it with react-flow.

## Context
The nomnoml implementation is no longer needed. We should clean up all related code, including the NomnomlRenderer component, extractNomnomlBlocks function, tests, and the npm dependency.

## Implementation Steps
1. Remove component files:
   - Delete `packages/vscode-extension/src/webview/studio/components/NomnomlRenderer.tsx`
   - Delete `packages/vscode-extension/src/webview/studio/components/__tests__/NomnomlRenderer.test.tsx`
2. Remove utility function and tests:
   - Delete `packages/vscode-extension/src/webview/studio/__tests__/extractNomnomlBlocks.test.ts`
   - Note: `extractNomnomlBlocks` function should already be removed in story #9
3. Remove exports:
   - In `packages/vscode-extension/src/webview/studio/components/index.ts`:
     - Remove `export { NomnomlRenderer } from './NomnomlRenderer';`
4. Update templates and prompts:
   - In `packages/vscode-extension/src/templates/cursorCommands.ts`:
     - Line 34: Change "Single nomnoml diagram per file" to "JSON diagram data in markdown code blocks"
     - Line 77: Change "Diagrams use single nomnoml diagrams" to "Diagrams use react-flow JSON format"
     - Line 109: Change "Specs (technical implementation details with Nomnoml diagrams)" to "Specs (technical implementation details with diagram references)"
     - Line 222: Change "formats (Gherkin, nomnoml)" to "formats (Gherkin, react-flow JSON)"
     - Line 335: Change "Read all nomnoml diagrams" to "Read all diagram files"
     - Line 336: Change "Examine every nomnoml diagram" to "Examine every diagram file"
     - Line 367: Change "All nomnoml diagrams analyzed" to "All diagram files analyzed"
   - In `packages/vscode-extension/src/panels/ForgeStudioPanel.ts`:
     - Around line 1775: Replace nomnoml template example with JSON format example:
       ```json
       {
         "nodes": [
           { "id": "component-a", "type": "default", "position": { "x": 0, "y": 0 }, "data": { "label": "Component A" } },
           { "id": "component-b", "type": "default", "position": { "x": 200, "y": 0 }, "data": { "label": "Component B" } }
         ],
         "edges": [
           { "id": "e1", "source": "component-a", "target": "component-b" }
         ]
       }
       ```
5. Update tests:
   - In `packages/vscode-extension/src/webview/studio/__tests__/specToggle.test.tsx`:
     - Remove or update test "should extract and render nomnoml blocks in rendered mode" (lines 113-129)
     - Update test "should preserve content when toggling between views" (line 197) to use JSON format instead of nomnoml
     - Note: These tests may need to be removed entirely if they're specific to nomnoml functionality
6. Remove dependency:
   - In `packages/vscode-extension/package.json`:
     - Remove `"nomnoml": "^1.7.0"` from dependencies
7. Clean up:
   - Run `npm install` to update lock file
   - Verify no other files import or reference nomnoml
   - Check that `media/studio/main.js` will be regenerated on next build (it's a built file)

## Files Affected
- `packages/vscode-extension/src/webview/studio/components/NomnomlRenderer.tsx` - Delete
- `packages/vscode-extension/src/webview/studio/components/__tests__/NomnomlRenderer.test.tsx` - Delete
- `packages/vscode-extension/src/webview/studio/__tests__/extractNomnomlBlocks.test.ts` - Delete
- `packages/vscode-extension/src/webview/studio/components/index.ts` - Remove NomnomlRenderer export
- `packages/vscode-extension/src/templates/cursorCommands.ts` - Update all nomnoml references to react-flow JSON
- `packages/vscode-extension/src/panels/ForgeStudioPanel.ts` - Update diagram template example
- `packages/vscode-extension/src/webview/studio/__tests__/specToggle.test.tsx` - Remove/update nomnoml test cases
- `packages/vscode-extension/package.json` - Remove nomnoml dependency

## Acceptance Criteria
- [ ] NomnomlRenderer component is deleted
- [ ] NomnomlRenderer test is deleted
- [ ] extractNomnomlBlocks test is deleted
- [ ] NomnomlRenderer export is removed from components/index.ts
- [ ] All nomnoml references in cursorCommands.ts are updated to react-flow JSON
- [ ] Diagram template in ForgeStudioPanel.ts uses JSON format
- [ ] specToggle.test.tsx nomnoml tests are removed or updated
- [ ] nomnoml dependency is removed from package.json
- [ ] npm install completes successfully
- [ ] No references to nomnoml remain in codebase (verify with grep)
- [ ] No TypeScript errors from missing imports
- [ ] All tests pass after removal

## Dependencies
- integrate-reactflow-into-itemprofile (must be completed first to ensure nomnoml is no longer used)

