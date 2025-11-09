---
story_id: update-open-studio-command
session_id: project-init
feature_id: [welcome-screen, studio-dashboard]
spec_id: [forge-studio-implementation]
model_id: []
context_id: []
status: completed
priority: high
estimated_minutes: 25
---

# Update Open Studio Command to Route Based on Readiness

## Objective

Modify the `forge.openStudio` command handler to check project readiness and route to either WelcomePanel (not ready) or ForgeStudioPanel (ready).

## Context

The entry point for Forge Studio needs to intelligently determine whether to show the welcome screen or go directly to the studio based on project readiness.

## Implementation Steps

1. Update `forge.openStudio` command handler in `extension.ts`
2. Use ProjectPicker to select project (handles single/multi-root)
3. Check project readiness using same logic as WelcomePanel
4. If not ready: open WelcomePanel
5. If ready: open ForgeStudioPanel directly
6. Remove any previous filtering of non-ai workspaces in ProjectPicker
7. Show ALL workspace folders in multi-root picker
8. Add readiness indicator to folder names in picker

## Files Affected

- `packages/vscode-extension/src/extension.ts` - Update command handler
- `packages/vscode-extension/src/utils/ProjectPicker.ts` - Update to show all folders

## Acceptance Criteria

- [x] Command checks project readiness before opening panel
- [x] Not ready projects open WelcomePanel
- [x] Ready projects open ForgeStudioPanel directly
- [x] Single workspace: uses automatically, no prompt
- [x] Multi-root workspace: shows ALL folders (not just ai/)
- [x] Picker indicates which folders are "Forge Ready"
- [x] User can select any folder from multi-root workspace
- [x] Appropriate panel opens based on selection

## Dependencies

- create-welcome-panel-class
- add-readiness-detection

