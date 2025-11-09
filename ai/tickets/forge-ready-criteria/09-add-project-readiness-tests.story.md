---
story_id: add-project-readiness-tests
session_id: forge-ready-criteria
feature_id: [welcome-screen]
spec_id: [welcome-initialization, cursor-commands-management]
model_id: []
status: completed
priority: medium
estimated_minutes: 30
---

## Objective

Add integration tests for project readiness checking to verify that command file validation is properly integrated.

## Context

Project readiness now depends on both folders and command files. Tests should verify that all combinations of folder/command states are handled correctly.

## Implementation Steps

1. Create or update test file for WelcomePanel readiness checking
2. Test `checkProjectReadiness()`:
   - Returns true when all folders and commands exist and are valid
   - Returns false when folders missing
   - Returns false when commands missing
   - Returns false when commands exist but invalid (hash mismatch)
   - Returns false when only some commands valid
3. Test `getProjectStatus()`:
   - Returns array with both folders and commands
   - Command status includes correct exists and valid flags
   - Status matches actual file state
4. Use mock file system for controlled testing
5. Create test fixtures for valid and invalid command files

## Files Affected

- `packages/vscode-extension/src/panels/WelcomePanel.test.ts` - Add/update readiness tests

## Acceptance Criteria

- [ ] Tests cover all readiness states (ready/not ready scenarios)
- [ ] Tests verify command file validation is called
- [ ] Tests verify both missing and invalid commands cause not-ready state
- [ ] Tests verify partially valid state (some commands valid, some not)
- [ ] Tests use mocked file system for isolation
- [ ] All tests pass with `npm test`
- [ ] Tests clearly describe each scenario

## Dependencies

- update-project-status-checking (code being tested)
- implement-hash-validation-utilities (validation logic used)

