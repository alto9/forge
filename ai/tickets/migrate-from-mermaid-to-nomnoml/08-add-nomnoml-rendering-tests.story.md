---
story_id: add-nomnoml-rendering-tests
session_id: migrate-from-mermaid-to-nomnoml
feature_id: [spec-detail-view]
spec_id: [forge-studio-implementation]
status: pending
priority: medium
estimated_minutes: 20
---

## Objective

Add unit tests for the NomnomlRenderer component to verify correct rendering behavior and error handling.

## Context

The NomnomlRenderer component needs test coverage to ensure it correctly renders nomnoml diagrams, handles errors gracefully, and updates when source changes.

## Implementation Steps

1. Create test file: `packages/vscode-extension/src/__tests__/NomnomlRenderer.test.tsx`
2. Import NomnomlRenderer component
3. Import testing utilities (@testing-library/react)
4. Write test: "renders valid nomnoml source to SVG"
5. Write test: "updates when source prop changes"
6. Write test: "handles invalid nomnoml syntax gracefully"
7. Write test: "applies className prop correctly"
8. Write test: "renders empty state for empty source"
9. Run tests with `npm test`
10. Verify all tests pass

## Files Affected

- `packages/vscode-extension/src/__tests__/NomnomlRenderer.test.tsx` - New test file

## Acceptance Criteria

- [ ] Test file created in __tests__ directory
- [ ] At least 5 test cases covering main functionality
- [ ] Tests verify SVG is rendered for valid input
- [ ] Tests verify error handling for invalid input
- [ ] Tests verify component updates on prop changes
- [ ] All tests pass with npm test
- [ ] Test coverage includes edge cases

## Dependencies

- Story: create-nomnoml-renderer-component (must be completed first)

