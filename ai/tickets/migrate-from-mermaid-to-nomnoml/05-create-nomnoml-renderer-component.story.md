---
story_id: create-nomnoml-renderer-component
session_id: migrate-from-mermaid-to-nomnoml
feature_id: [spec-detail-view]
spec_id: [forge-studio-implementation]
status: pending
priority: high
estimated_minutes: 25
---

## Objective

Create a React component that renders nomnoml diagram source code into SVG diagrams for display in the Forge Studio.

## Context

The Studio needs to display rendered nomnoml diagrams when viewing specs. This component will take nomnoml source code as input and render it to an SVG that can be displayed in the UI.

## Implementation Steps

1. Create new file: `packages/vscode-extension/src/webview/studio/components/NomnomlRenderer.tsx`
2. Import nomnoml library
3. Create React component with props:
   - `source: string` - the nomnoml source code
   - `className?: string` - optional CSS class
4. Use useEffect to render diagram when source changes
5. Create a canvas element or div to hold the SVG
6. Call nomnoml.renderSvg() to generate SVG from source
7. Insert SVG into the DOM element
8. Handle errors gracefully (invalid syntax, etc.)
9. Add basic styling for diagram container

## Files Affected

- `packages/vscode-extension/src/webview/studio/components/NomnomlRenderer.tsx` - New component

## Acceptance Criteria

- [ ] Component accepts nomnoml source code as prop
- [ ] Component renders valid nomnoml to SVG
- [ ] Component updates when source changes
- [ ] Component handles invalid syntax gracefully
- [ ] Component is styled appropriately for Studio theme
- [ ] SVG is responsive and scales properly

## Dependencies

- Story: install-nomnoml-package (must be completed first)

