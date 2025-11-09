---
story_id: add-command-status-types
session_id: forge-ready-criteria
feature_id: [welcome-screen]
spec_id: [welcome-initialization, cursor-commands-management]
model_id: []
status: completed
priority: high
estimated_minutes: 15
---

## Objective

Add TypeScript types for representing Cursor command file status alongside folder status.

## Context

The welcome screen needs to display both folder status and command file status. We need types that can represent whether commands exist, are valid, and discriminate between folders and commands.

## Implementation Steps

1. Locate the file where `FolderStatus` is defined (likely in WelcomePanel.ts or a types file)
2. Add `CommandStatus` interface with fields: path, exists, valid, description, type: 'command'
3. Update `FolderStatus` to include type: 'folder'
4. Create union type `ProjectItemStatus = FolderStatus | CommandStatus`
5. Update any existing functions that return `FolderStatus[]` to use discriminated union if needed

## Files Affected

- `packages/vscode-extension/src/panels/WelcomePanel.ts` (or types file) - Add command status types

## Acceptance Criteria

- [ ] CommandStatus interface defined with all required fields
- [ ] FolderStatus includes type discriminator
- [ ] ProjectItemStatus union type created
- [ ] Types support discriminated union pattern (can narrow by type field)
- [ ] Existing code still compiles with new types

## Dependencies

None

