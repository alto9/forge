---
story_id: implement-command-initialization
session_id: forge-ready-criteria
feature_id: [welcome-screen]
spec_id: [welcome-initialization, cursor-commands-management]
model_id: []
status: completed
priority: high
estimated_minutes: 30
---

## Objective

Implement logic to create or update Cursor command files during project initialization.

## Context

When a user initializes a Forge project, the extension needs to create Cursor command files with proper hash comments. If files exist but are outdated (invalid hash), they should be updated.

## Implementation Steps

1. Add private method `_initializeCursorCommands()` to WelcomePanel.ts
2. Get list of managed command paths using getManagedCommandPaths()
3. For each command path:
   - Check if file exists and is valid using existing validation
   - Set needsUpdate flag if file doesn't exist or is invalid
   - If needsUpdate:
     - Ensure `.cursor/commands/` directory exists
     - Generate file content using generateCommandFile()
     - Write file using workspace.fs.writeFile()
     - Send progress message to webview
4. Update `_initializeProject()` to call `_initializeCursorCommands()` after folder creation
5. Handle errors appropriately (permission denied, disk space, etc.)

## Files Affected

- `packages/vscode-extension/src/panels/WelcomePanel.ts` - Add command initialization logic

## Acceptance Criteria

- [ ] _initializeCursorCommands() method created and called during initialization
- [ ] Method creates .cursor/commands directory if needed
- [ ] Missing command files are created with proper hash comments
- [ ] Existing invalid command files are overwritten
- [ ] Existing valid command files are preserved (not modified)
- [ ] Progress messages sent to webview for each file action
- [ ] Errors are caught and included in initialization result
- [ ] Files created in correct order (directory before files)

## Dependencies

- implement-hash-validation-utilities (needs generateCommandFile)
- update-project-status-checking (needs status checking logic)

