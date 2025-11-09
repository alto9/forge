---
story_id: add-unit-tests-findglobalcontexts
session_id: create-global-contexts
feature_id: [studio-sessions]
spec_id: [cursor-commands-management]
model_id: []
context_id: [local-development, build-procedures]
status: completed
priority: medium
estimated_minutes: 30
---

# Add Unit Tests for findGlobalContexts Method

## Objective

Create comprehensive unit tests for the `findGlobalContexts()` method in `PromptGenerator` to ensure it correctly discovers and returns global contexts from the filesystem.

## Context

The findGlobalContexts method needs thorough testing to verify it correctly scans directories, parses frontmatter, filters for global contexts, and handles edge cases like missing directories or malformed files.

## Implementation Steps

1. Create or update test file: `packages/vscode-extension/src/utils/PromptGenerator.test.ts`
2. Set up test fixtures with mock filesystem:
   - Create mock context files with global: true
   - Create mock context files with global: false or no global property
   - Create mock context files in nested directories
3. Test cases to implement:
   - **Test: finds global contexts in root directory**
     - Given contexts with global: true in ai/contexts/
     - Should return those contexts with correct data
   - **Test: finds global contexts in nested directories**
     - Given contexts with global: true in ai/contexts/foundation/
     - Should recursively find and return them
   - **Test: filters out non-global contexts**
     - Given mix of global: true and global: false
     - Should only return contexts with global: true
   - **Test: returns empty array when no global contexts**
     - Given no contexts have global: true
     - Should return empty array
   - **Test: handles missing contexts directory**
     - Given ai/contexts/ doesn't exist
     - Should return empty array without throwing
   - **Test: includes full content of global contexts**
     - Given global context files
     - Should return complete file content including frontmatter and body
   - **Test: returns correct file paths**
     - Given global contexts found
     - Should return absolute file paths
4. Use vitest for testing framework
5. Mock VSCode workspace.fs API as needed
6. Ensure tests run successfully with `npm test -w forge`

## Files Affected

- `packages/vscode-extension/src/utils/PromptGenerator.test.ts` - Create or update test file

## Acceptance Criteria

- [ ] Test file created or updated
- [ ] All test cases implemented and passing
- [ ] Tests cover happy path (global contexts found)
- [ ] Tests cover edge cases (no contexts, missing directory)
- [ ] Tests verify filtering logic (global vs non-global)
- [ ] Tests verify recursive scanning works
- [ ] Tests verify full content is returned
- [ ] Tests verify correct file paths returned
- [ ] Mock filesystem used for predictable testing
- [ ] Tests run with `npm test -w forge`
- [ ] All tests pass

## Dependencies

- Story: implement-findglobalcontexts-method (must be completed first)

