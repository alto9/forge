---
story_id: update-welcome-panel-use-shared-readiness
session_id: forge-ready-status-accuracy
feature_id: [welcome-screen]
spec_id: [welcome-initialization]
model_id: []
status: completed
priority: high
estimated_minutes: 20
---

# Update WelcomePanel to Use Shared Readiness Check

## Objective

Refactor `WelcomePanel.ts` to import and use the shared `checkProjectReadiness` function while maintaining its existing folder status checking functionality.

## Context

WelcomePanel has its own `_checkProjectReadiness()` method that duplicates readiness logic. While it also needs detailed folder/command status (for the checklist UI), the yes/no readiness decision should use the shared function.

## Implementation Steps

1. Open `packages/vscode-extension/src/panels/WelcomePanel.ts`
2. Add import: `import { checkProjectReadiness, REQUIRED_FOLDERS, REQUIRED_COMMANDS } from '../utils/projectReadiness';`
3. Replace the `_checkProjectReadiness()` method with a call to the imported function:
   - Replace method body with: `return await checkProjectReadiness(this._projectUri);`
   - OR remove method entirely and call `checkProjectReadiness()` directly where needed
4. Update `_getFolderStatus()` to use imported `REQUIRED_FOLDERS` constant if needed
5. Update `_getCommandStatus()` to use imported `REQUIRED_COMMANDS` constant if needed
6. Ensure constants like `REQUIRED_FOLDERS` in WelcomePanel match the imported ones
7. Test that Welcome screen correctly shows readiness status

## Files Affected

- `packages/vscode-extension/src/panels/WelcomePanel.ts` - Use shared readiness check

## Acceptance Criteria

- [x] WelcomePanel imports checkProjectReadiness from '../utils/projectReadiness'
- [x] WelcomePanel optionally imports REQUIRED_FOLDERS and REQUIRED_COMMANDS
- [x] _checkProjectReadiness() uses shared function or is removed
- [x] Readiness logic is consistent with other components
- [x] Folder checklist still displays correctly (shows individual folder status)
- [x] Command checklist still displays correctly
- [x] No TypeScript compilation errors
- [x] Welcome screen displays correct readiness status

## Dependencies

- create-centralized-readiness-utility (must be completed first)

