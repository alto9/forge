---
story_id: add-source-render-toggle
session_id: migrate-from-mermaid-to-nomnoml
feature_id: [spec-editing, spec-detail-view]
spec_id: [forge-studio-implementation]
status: pending
priority: medium
estimated_minutes: 25
---

## Objective

Add a toggle button to spec editing view that allows switching between diagram source code and rendered view during an active design session.

## Context

During a design session, developers need to edit nomnoml diagrams (source code) but also want to see the rendered output. A toggle button allows switching between these two views.

## Implementation Steps

1. Open spec editing component in Studio webview
2. Add state to track view mode: 'source' | 'rendered'
3. Create a toggle button component with two options:
   - "Source" - show nomnoml code in textarea/editor
   - "Render" - show rendered diagram
4. Position toggle above the diagram section
5. When in 'source' mode, show editable textarea with nomnoml code
6. When in 'rendered' mode, show NomnomlRenderer with current code
7. Ensure toggle is only visible during active sessions
8. Style toggle consistently with Studio theme
9. Preserve toggle state when switching between specs

## Files Affected

- `packages/vscode-extension/src/webview/studio/components/*` - Update spec editing view

## Acceptance Criteria

- [ ] Toggle button appears when editing specs during active session
- [ ] "Source" mode shows editable nomnoml code
- [ ] "Render" mode shows rendered diagram
- [ ] Toggle state persists while editing same spec
- [ ] Changes to source immediately reflect in rendered view
- [ ] Toggle is hidden in read-only mode (no active session)
- [ ] Toggle styling matches Studio theme

## Dependencies

- Story: create-nomnoml-renderer-component (must be completed first)
- Story: add-diagram-view-to-spec-detail (must be completed first)

