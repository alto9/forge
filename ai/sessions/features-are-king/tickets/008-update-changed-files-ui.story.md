---
story_id: update-changed-files-ui
session_id: features-are-king
feature_id: [studio-sessions, scenario-level-tracking]
spec_id: [session-change-tracking]
status: completed
priority: medium
estimated_minutes: 20
---

# Update Changed Files Display with Scenario Details

## Objective

Update the "Changed Files" section in the session panel to display scenario-level details in an expandable/collapsible format. Show which scenarios were added, modified, or removed for each feature file, with appropriate color coding.

## Context

The session panel currently shows a simple list of changed file paths. With scenario-level tracking implemented, we can now show much more detailed information:
- Which scenarios were added (green)
- Which scenarios were modified (yellow)
- Which scenarios were removed (red)

This provides better context for reviewing a session before distillation and helps understand the scope of changes.

## Implementation Steps

1. Update `SessionPanel` component to read from new `FeatureChangeEntry[]` format
2. Create expandable file entries in the Changed Files list:
   - Show file path and count of changes (collapsed state)
   - Show detailed scenario changes (expanded state)
3. For each file entry, display:
   - File path at the top
   - "Added: scenario-1, scenario-2" with green indicator
   - "Modified: scenario-3" with yellow indicator
   - "Removed: scenario-4" with red indicator
4. Add expand/collapse toggle (chevron icon or similar)
5. Persist expanded/collapsed state in component state
6. Show total count badge: "3 scenarios changed"
7. Handle empty scenario arrays (don't show section if empty)
8. Update styling to match VSCode theme
9. Test with sessions that have multiple features with various scenario changes

## Files Affected

- `packages/vscode-extension/src/webview/studio/components/SessionPanel.tsx` - Update Changed Files display
- `packages/vscode-extension/src/webview/studio/components/ChangedFileEntry.tsx` - Create expandable entry component
- `packages/vscode-extension/src/webview/studio/styles/session-panel.css` - Add styles for expandable entries

## Acceptance Criteria

- [ ] Changed Files section displays all modified features
- [ ] Each file entry shows total scenario change count
- [ ] File entries are expandable/collapsible
- [ ] Expanded view shows added scenarios with green indicator
- [ ] Expanded view shows modified scenarios with yellow indicator
- [ ] Expanded view shows removed scenarios with red indicator
- [ ] Empty scenario arrays are handled gracefully (not shown)
- [ ] Expand/collapse state is preserved during session
- [ ] Colors adapt to VSCode theme (light/dark)
- [ ] File paths are clickable to open the file

## Dependencies

- Depends on: **update-session-format-scenario-tracking** (uses new data format)

