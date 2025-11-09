---
story_id: display-changed-files-in-detail
session_id: organize-sessions-data
feature_id: [studio-sessions]
spec_id: [forge-studio-implementation]
status: pending
priority: high
estimated_minutes: 30
---

## Objective

Display the complete list of changed files in the session detail view, grouped by file type with counts, and make file paths clickable to open files.

## Context

The expanded detail view needs to show all changed files from the session. Files should be grouped by type (features, specs, models, actors, contexts), show counts per group, be clickable to open, and indicate if a file no longer exists.

## Implementation Steps

1. Add changed files section to SessionDetail component
2. Implement file grouping logic:
   - Parse file paths to determine type (features, specs, models, actors, contexts)
   - Group files by type into separate arrays
   - Count files per type
3. Display grouped files with headers and counts
4. Make each file path clickable (send message to extension to open file)
5. Check file existence using extension message
6. Add visual indicator (grayed out, strikethrough) for non-existent files
7. Display full relative path from project root for each file

## Files Affected

- `packages/vscode-extension/src/webview/components/SessionDetail.tsx` - Add changed files display
- `packages/vscode-extension/src/webview/panels/SessionsPanel.tsx` - Add message handler for opening files
- `packages/vscode-extension/src/extension.ts` - Add command to open file by path (if not exists)

## Acceptance Criteria

- [ ] Changed files section displays in detail view
- [ ] Files are grouped by type (features, specs, models, actors, contexts)
- [ ] Each group shows a count of files
- [ ] Each file shows full relative path from project root
- [ ] Clicking a file path opens that file in editor
- [ ] Non-existent files are visually indicated (grayed/strikethrough)
- [ ] Empty groups are not displayed
- [ ] Files maintain order from changed_files array within groups

## Dependencies

- create-expanded-session-detail

