---
story_id: add-unit-tests-pagination-sorting
session_id: organize-sessions-data
feature_id: [studio-sessions]
spec_id: [forge-studio-implementation]
status: pending
priority: medium
estimated_minutes: 25
---

## Objective

Add unit tests for the pagination and sorting functionality in the Sessions list.

## Context

Per project memory, all code written must include unit tests. This story adds comprehensive tests for the pagination and sorting logic added to the SessionsPanel.

## Implementation Steps

1. Create test file for SessionsPanel (if doesn't exist)
2. Add tests for pagination:
   - Verify sessions are sliced to 10 items per page
   - Verify page navigation updates displayed sessions
   - Verify Previous/Next button states
   - Verify page number highlighting
3. Add tests for sorting:
   - Verify "Newest First" sorts by start_time descending
   - Verify "Oldest First" sorts by start_time ascending
   - Verify "Status" groups correctly
   - Verify "Session ID" sorts alphabetically
4. Add integration test for pagination + sorting working together
5. Run tests and verify all pass

## Files Affected

- `packages/vscode-extension/src/webview/panels/__tests__/SessionsPanel.test.tsx` - Add pagination and sorting tests

## Acceptance Criteria

- [ ] Tests verify pagination shows 10 items per page
- [ ] Tests verify page navigation works correctly
- [ ] Tests verify all 4 sorting options work correctly
- [ ] Tests verify pagination state persists during session
- [ ] Tests verify sort state persists during session
- [ ] Tests verify pagination + sorting work together
- [ ] All tests pass with npm test

## Dependencies

- add-pagination-to-sessions-list
- add-sorting-to-sessions-list

