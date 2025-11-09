---
story_id: add-initialization-integration-tests
session_id: forge-ready-criteria
feature_id: [welcome-screen]
spec_id: [welcome-initialization, cursor-commands-management]
model_id: []
status: completed
priority: low
estimated_minutes: 30
---

## Objective

Add integration tests for project initialization to verify command files are created and updated correctly.

## Context

Initialization should create missing command files and update outdated ones while preserving valid files. Tests ensure this logic works correctly in various scenarios.

## Implementation Steps

1. Create or update initialization integration tests
2. Test command file creation:
   - Creates command files when they don't exist
   - Creates .cursor/commands directory if needed
   - Files include proper hash comments
   - Generated files validate successfully
3. Test command file updates:
   - Updates files with invalid hashes
   - Preserves files with valid hashes
   - Overwrites files without hash comments
4. Test mixed scenarios:
   - Some folders missing, some commands missing
   - Some commands valid, some invalid
   - All folders exist but all commands missing
5. Test progress messages during initialization
6. Use mock file system for controlled testing

## Files Affected

- `packages/vscode-extension/src/panels/WelcomePanel.test.ts` - Add initialization tests

## Acceptance Criteria

- [ ] Tests cover command creation scenarios
- [ ] Tests cover command update scenarios (outdated files)
- [ ] Tests verify valid files are not modified
- [ ] Tests verify hash comments are embedded correctly
- [ ] Tests verify progress messages sent for each file
- [ ] Tests verify error handling for file write failures
- [ ] All tests pass with `npm test`
- [ ] Tests are independent and can run in any order

## Dependencies

- implement-command-initialization (code being tested)
- add-command-validation-tests (validation logic tested)

