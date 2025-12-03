---
story_id: update-context-related-tests
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: pending
priority: high
estimated_minutes: 30
---

## Objective
Remove or update all context-related test cases in the test suite.

## Context
The codebase includes tests for context functionality (creation, editing, validation, etc.). These tests need to be either removed or updated to reflect the removal of contexts.

## Implementation Steps
1. Search for test files mentioning "context" in their names or content
2. Identify tests specifically for context functionality (delete these)
3. Identify tests that include context checks as part of broader tests (update these)
4. Remove context-related test fixtures and mock data
5. Update integration tests that verify complete workflows
6. Run full test suite to ensure all tests pass
7. Verify test coverage is still adequate

## Files Affected
- Context-specific test files - Delete
- Integration tests - Update to remove context checks
- Test fixtures - Remove context-related data
- Mock data - Remove context examples

## Acceptance Criteria
- [ ] All context-specific tests are removed
- [ ] Integration tests no longer verify context functionality
- [ ] Test fixtures don't include context data
- [ ] All remaining tests pass
- [ ] No test failures related to missing contexts
- [ ] Test coverage remains adequate

## Dependencies
- Depends on: 001-remove-mcp-context-tools (tools should be removed first)
- Depends on: 010-remove-context-ui-components (UI components should be removed first)

