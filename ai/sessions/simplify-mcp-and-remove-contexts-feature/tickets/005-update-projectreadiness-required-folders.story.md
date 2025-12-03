---
story_id: update-projectreadiness-required-folders
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: pending
priority: high
estimated_minutes: 10
---

## Objective
Remove `ai/contexts` from the `REQUIRED_FOLDERS` array in `packages/vscode-extension/src/utils/projectReadiness.ts`.

## Context
The project readiness check verifies that all required Forge folders exist. Since contexts are being removed, `ai/contexts` should no longer be required for a project to be "Forge-ready".

## Implementation Steps
1. Open `packages/vscode-extension/src/utils/projectReadiness.ts`
2. Locate the `REQUIRED_FOLDERS` array export
3. Remove the `'ai/contexts'` entry from the array
4. Update the comment documenting folder count (currently says 7 folders)
5. Run tests to verify readiness check works correctly

## Files Affected
- `packages/vscode-extension/src/utils/projectReadiness.ts` - Remove `ai/contexts` from REQUIRED_FOLDERS

## Acceptance Criteria
- [ ] `REQUIRED_FOLDERS` array no longer includes `'ai/contexts'`
- [ ] Comment accurately reflects new folder count
- [ ] `checkProjectReadiness` function still works correctly
- [ ] Projects without `ai/contexts` folder are now considered ready
- [ ] All tests pass

## Dependencies
- Can be done in parallel with other readiness changes

