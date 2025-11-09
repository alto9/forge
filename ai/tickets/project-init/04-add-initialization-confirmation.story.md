---
story_id: add-initialization-confirmation
session_id: project-init
feature_id: [welcome-screen]
spec_id: [welcome-initialization]
model_id: []
context_id: [theme]
status: completed
priority: medium
estimated_minutes: 20
---

# Add Initialization Confirmation Dialog

## Objective

Create a confirmation modal dialog that appears when the user clicks "Initialize Forge Project", showing which folders will be created before proceeding.

## Context

Before creating folders, we want to show users exactly what will be created and get explicit confirmation. This provides transparency and prevents accidental initialization.

## Implementation Steps

1. Create `InitializationDialog` component in welcome UI
2. Add `showConfirmDialog` state to WelcomeApp
3. Show dialog when "Initialize Forge Project" button clicked
4. Display list of folders that will be created (missing folders only)
5. Add "Confirm" button that sends initializeProject message
6. Add "Cancel" button that closes dialog
7. Style dialog with semi-transparent backdrop
8. Use VSCode button styles for actions

## Files Affected

- `packages/vscode-extension/src/webview/welcome/index.tsx` - Add dialog component
- `packages/vscode-extension/src/webview/welcome/components/InitializationDialog.tsx` - Create dialog component

## Acceptance Criteria

- [x] Dialog appears when Initialize button clicked
- [x] Shows title "Initialize Forge Project"
- [x] Lists only folders that will be created
- [x] Confirm button sends initializeProject message
- [x] Cancel button closes dialog without action
- [x] Modal backdrop blocks interaction with background
- [x] Uses VSCode theme colors
- [x] Dialog is centered and properly sized

## Dependencies

- create-welcome-webview-ui

