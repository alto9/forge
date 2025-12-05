---
story_id: update-readiness-tests
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: completed
priority: high
estimated_minutes: 20
---

## Objective
Update all readiness-related tests to remove context folder checks and update folder count expectations.

## Context
Multiple test files verify project readiness checking logic. These tests currently expect `ai/contexts` to be required. They need to be updated to reflect the new folder requirements.

## Implementation Steps
1. Locate readiness-related test files:
   - `packages/vscode-extension/src/utils/__tests__/projectReadiness.test.ts`
   - `packages/vscode-extension/src/panels/__tests__/ProjectReadiness.test.ts`
   - `packages/vscode-extension/src/panels/__tests__/WelcomePanel.test.ts`
   - `packages/vscode-extension/src/utils/__tests__/ProjectPicker.test.ts`
2. Update expected folder counts (from 7 to 6 folders)
3. Remove test assertions that verify `ai/contexts` folder presence
4. Update test mock data to exclude contexts folder
5. Run all tests to verify they pass

## Files Affected
- `projectReadiness.test.ts` - Update folder count and remove contexts checks
- `ProjectReadiness.test.ts` - Update test scenarios
- `WelcomePanel.test.ts` - Update expected folder list
- `ProjectPicker.test.ts` - Update readiness scenarios

## Acceptance Criteria
- [x] All readiness tests pass with updated folder requirements
- [x] Tests no longer expect `ai/contexts` folder
- [x] Folder count expectations updated (6 instead of 7)
- [x] No test failures related to contexts folder

## Dependencies
- Depends on: 005-update-projectreadiness-required-folders
- Depends on: 006-update-welcomepanel-required-folders

