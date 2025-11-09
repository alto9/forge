---
story_id: update-initialization-progress-messages
session_id: forge-ready-criteria
feature_id: [welcome-screen]
spec_id: [welcome-initialization]
model_id: []
status: completed
priority: low
estimated_minutes: 20
---

## Objective

Update initialization progress message types to distinguish between folder and file creation, and update webview to display progress appropriately.

## Context

Initialization now creates both folders and files. Progress messages need to indicate what type of item is being created and whether it's a "create" or "update" action.

## Implementation Steps

1. Update progress message type in WelcomePanel.ts to include itemType field
2. Message format: `{ type: 'initializationProgress', item: string, itemType: 'folder' | 'file', status: 'created' | 'updated' | 'error' }`
3. Update webview message handler to handle itemType
4. Display appropriate text:
   - Folders: "Created folder: ai/features"
   - Files (created): "Created command: .cursor/commands/forge-design.md"
   - Files (updated): "Updated command: .cursor/commands/forge-design.md"
5. Show different icons or styling for folders vs files
6. Update completion message to include count of folders and files

## Files Affected

- `packages/vscode-extension/src/panels/WelcomePanel.ts` - Update progress messages
- `packages/vscode-extension/src/webview/welcome/` - Update progress display

## Acceptance Criteria

- [ ] Progress messages include itemType field
- [ ] Webview displays different text for folders vs files
- [ ] "Updated" status shown for files that were overwritten
- [ ] "Created" status shown for new files and folders
- [ ] Completion message shows total folders and files created/updated
- [ ] Progress messages appear in real-time during initialization
- [ ] Error messages distinguish between folder and file errors

## Dependencies

- implement-command-initialization (generates the messages)
- update-welcome-ui-command-status (displays the messages)

