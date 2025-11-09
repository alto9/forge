---
story_id: add-command-validation-tests
session_id: forge-ready-criteria
feature_id: [welcome-screen]
spec_id: [cursor-commands-management]
model_id: []
status: completed
priority: medium
estimated_minutes: 30
---

## Objective

Add unit tests for command validation utilities to ensure hash computation and validation work correctly.

## Context

Hash validation is critical for ensuring command file integrity. Comprehensive tests ensure the validation logic handles all cases correctly.

## Implementation Steps

1. Create test file `packages/vscode-extension/src/utils/commandValidation.test.ts`
2. Test `computeContentHash()`:
   - Returns 64-character hex string
   - Same content produces same hash
   - Different content produces different hash
3. Test `validateCommandFileHash()`:
   - Returns true for valid file with matching hash
   - Returns false for file with no hash comment
   - Returns false for file with incorrect hash
   - Returns false for file with tampered content
   - Returns false for unknown command path
4. Test `generateCommandFile()`:
   - Generates file with hash comment at top
   - Hash comment format is correct
   - Generated file validates successfully
   - Throws error for unknown command path
5. Use test fixtures for sample command content

## Files Affected

- `packages/vscode-extension/src/utils/commandValidation.test.ts` - Create new test file

## Acceptance Criteria

- [ ] Test file created with all test cases
- [ ] All hash computation tests pass
- [ ] All validation tests pass covering valid/invalid/missing cases
- [ ] All generation tests pass
- [ ] Tests use proper assertions and descriptions
- [ ] Tests run successfully with `npm test`
- [ ] Code coverage for commandValidation.ts > 90%

## Dependencies

- implement-hash-validation-utilities (code being tested)

