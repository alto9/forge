---
story_id: add-diagram-view-to-spec-detail
session_id: migrate-from-mermaid-to-nomnoml
feature_id: [spec-detail-view]
spec_id: [forge-studio-implementation]
status: pending
priority: high
estimated_minutes: 20
---

## Objective

Update the spec detail view in Studio to extract and render nomnoml diagrams from spec content when viewing in read-only mode.

## Context

When viewing a spec without an active session, users should see rendered nomnoml diagrams instead of the source code. This provides a visual representation of the architecture.

## Implementation Steps

1. Open the spec profile/detail view component (likely in `src/webview/studio/components/`)
2. Add a function to extract nomnoml code blocks from markdown content
3. Use regex to find ` ```nomnoml...``` ` blocks
4. Import the NomnomlRenderer component
5. Render each nomnoml diagram using NomnomlRenderer
6. Display rendered diagrams in the spec view where code blocks appear
7. Show other markdown content as normal
8. Ensure diagrams are styled consistently with Studio theme

## Files Affected

- `packages/vscode-extension/src/webview/studio/components/*` - Update spec detail view component

## Acceptance Criteria

- [ ] Spec detail view extracts nomnoml code blocks from content
- [ ] Each nomnoml block is rendered as an SVG diagram
- [ ] Diagrams display correctly in read-only mode
- [ ] Multiple diagrams in one spec all render
- [ ] Non-diagram content displays normally
- [ ] Diagrams are visually integrated with Studio theme

## Dependencies

- Story: create-nomnoml-renderer-component (must be completed first)

