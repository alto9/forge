---
story_id: add-tests-for-readiness-utility
session_id: forge-ready-status-accuracy
feature_id: [welcome-screen, studio-dashboard]
spec_id: [welcome-initialization]
model_id: []
status: completed
priority: medium
estimated_minutes: 25
---

# Add Unit Tests for Project Readiness Utility

## Objective

Create comprehensive unit tests for the centralized `projectReadiness.ts` utility to ensure readiness checking logic is correct and consistent.

## Context

The centralized readiness utility is critical infrastructure that determines routing decisions throughout the extension. It needs thorough testing to ensure reliability.

## Implementation Steps

1. Create test file: `packages/vscode-extension/src/utils/__tests__/projectReadiness.test.ts`
2. Import the utility: `import { checkProjectReadiness, REQUIRED_FOLDERS, REQUIRED_COMMANDS } from '../projectReadiness';`
3. Mock vscode.workspace.fs.stat and fs.readFile
4. Write test cases for:
   - All folders exist and all commands valid → returns true
   - Missing one required folder → returns false
   - Missing ai/ root folder → returns false
   - All folders exist but missing command file → returns false
   - All folders and commands exist but invalid hash → returns false
   - Verify REQUIRED_FOLDERS has exactly 6 entries
   - Verify REQUIRED_FOLDERS does NOT include 'ai/models'
   - Verify REQUIRED_COMMANDS has 2 entries
5. Use vitest or jest for testing framework
6. Run tests and ensure all pass

## Files Affected

- `packages/vscode-extension/src/utils/__tests__/projectReadiness.test.ts` - NEW FILE

## Acceptance Criteria

- [x] Test file created in correct location
- [x] Tests cover: all folders exist scenario
- [x] Tests cover: missing folder scenarios
- [x] Tests cover: missing command file scenarios
- [x] Tests cover: invalid command hash scenarios
- [x] Tests verify REQUIRED_FOLDERS has 6 entries (not 7)
- [x] Tests verify 'ai/models' is NOT in REQUIRED_FOLDERS
- [x] All tests pass
- [x] Test coverage is meaningful

## Dependencies

- create-centralized-readiness-utility (must be completed first)

