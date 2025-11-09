---
story_id: update-project-status-checking
session_id: forge-ready-criteria
feature_id: [welcome-screen]
spec_id: [welcome-initialization, cursor-commands-management]
model_id: []
status: completed
priority: high
estimated_minutes: 30
---

## Objective

Update the project status checking logic to include Cursor command files and validate their content using hash checking.

## Context

Project readiness now requires both folders AND valid Cursor command files. The status checking needs to read command files, validate their hashes, and return combined status for folders and commands.

## Implementation Steps

1. Update `getProjectStatus()` in WelcomePanel.ts to check both folders and commands
2. Add array of command definitions with path and description
3. Use `Promise.all()` to check command file status in parallel
4. For each command:
   - Try to read file using workspace.fs.readFile()
   - If exists, validate hash using validateCommandFileHash()
   - Set exists and valid flags appropriately
   - Handle errors (file not found) by setting exists=false
5. Return combined array of folder statuses and command statuses
6. Update `checkProjectReadiness()` to return false if any command is missing or invalid

## Files Affected

- `packages/vscode-extension/src/panels/WelcomePanel.ts` - Update status checking methods

## Acceptance Criteria

- [ ] getProjectStatus() returns both folders and commands in status array
- [ ] Command status includes exists and valid flags
- [ ] Hash validation is called for existing command files
- [ ] Missing command files marked as exists=false, valid=false
- [ ] Invalid (outdated) command files marked as exists=true, valid=false
- [ ] Valid command files marked as exists=true, valid=true
- [ ] checkProjectReadiness() returns false if any command is missing or invalid
- [ ] Status checks complete in < 100ms for typical project

## Dependencies

- implement-hash-validation-utilities (needs validation functions)
- add-command-status-types (needs CommandStatus type)

