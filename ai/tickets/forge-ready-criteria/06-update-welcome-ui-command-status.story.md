---
story_id: update-welcome-ui-command-status
session_id: forge-ready-criteria
feature_id: [welcome-screen]
spec_id: [welcome-initialization]
model_id: []
status: completed
priority: medium
estimated_minutes: 25
---

## Objective

Update the Welcome Screen webview UI to display Cursor command file status in the checklist alongside folders.

## Context

The welcome screen checklist currently shows only folders. It needs to also display Cursor command files with appropriate status indicators (missing, outdated, valid).

## Implementation Steps

1. Update welcome webview component (likely in `src/webview/welcome/`)
2. Update checklist to handle both folder and command items using type discriminator
3. For command items (type === 'command'):
   - Show ✗ red if exists=false (missing)
   - Show ⚠ orange if exists=true but valid=false (outdated)
   - Show ✓ green if exists=true and valid=true
4. Update status text:
   - "Missing" for non-existent files
   - "Outdated" for invalid files
   - "Valid" for correct files
5. Add visual grouping or section headers to separate folders from commands
6. Update initialization confirmation dialog to show command files will be created/updated

## Files Affected

- `packages/vscode-extension/src/webview/welcome/` - Update React components for checklist display

## Acceptance Criteria

- [ ] Checklist renders both folders and command items
- [ ] Missing command files show red X and "Missing" status
- [ ] Outdated command files show orange warning and "Outdated" status  
- [ ] Valid command files show green checkmark and "Valid" status
- [ ] Visual distinction between folders and commands (grouping or spacing)
- [ ] Confirmation dialog lists command files to be created/updated
- [ ] UI updates match VSCode theme colors
- [ ] Status updates when initialization completes

## Dependencies

- add-command-status-types (needs CommandStatus type)
- update-project-status-checking (provides command status data)

