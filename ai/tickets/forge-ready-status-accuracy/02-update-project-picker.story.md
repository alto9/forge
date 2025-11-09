---
story_id: update-project-picker-use-shared-readiness
session_id: forge-ready-status-accuracy
feature_id: [studio-dashboard]
spec_id: [welcome-initialization]
model_id: []
status: completed
priority: high
estimated_minutes: 15
---

# Update ProjectPicker to Use Shared Readiness Check

## Objective

Refactor `ProjectPicker.ts` to remove its own implementation of `checkProjectReadiness` and import the shared function from the centralized utility module.

## Context

ProjectPicker currently has its own implementation that checks 7 folders (including legacy ai/models) and doesn't check Cursor commands. This causes inaccurate "Not Ready" status display in multi-root workspace picker.

## Implementation Steps

1. Open `packages/vscode-extension/src/utils/ProjectPicker.ts`
2. Add import: `import { checkProjectReadiness } from './projectReadiness';`
3. Remove the private `checkProjectReadiness` method (lines ~51-75)
4. Update the call in `pickProject()` method (line ~29) to use imported function:
   - Change `await this.checkProjectReadiness(folder.uri)` to `await checkProjectReadiness(folder.uri)`
   - Note: It's now a module function, not a class method
5. Verify no other references to the old method exist
6. Test that multi-root picker still shows readiness status correctly

## Files Affected

- `packages/vscode-extension/src/utils/ProjectPicker.ts` - Remove local implementation, import shared function

## Acceptance Criteria

- [x] ProjectPicker imports checkProjectReadiness from './projectReadiness'
- [x] Private checkProjectReadiness method is removed
- [x] pickProject() method calls the imported checkProjectReadiness function
- [x] Function call changed from `this.checkProjectReadiness` to `checkProjectReadiness`
- [x] No TypeScript compilation errors
- [x] Multi-root workspace picker displays readiness status
- [x] Status now accurately reflects whether project will open Studio or Welcome

## Dependencies

- create-centralized-readiness-utility (must be completed first)

