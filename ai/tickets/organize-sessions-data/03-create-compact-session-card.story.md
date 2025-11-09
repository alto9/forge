---
story_id: create-compact-session-card
session_id: organize-sessions-data
feature_id: [studio-sessions]
spec_id: [forge-studio-implementation]
status: pending
priority: high
estimated_minutes: 25
---

## Objective

Create a compact session card component for the Sessions list view that displays key session information in a reduced format.

## Context

The feature specifies a reduced list view where each session appears as a compact card showing: Session ID, Problem Statement (truncated to 80 chars), Status Badge, Start Time, File Change Count, and Command Status. Cards should be clickable and have hover effects.

## Implementation Steps

1. Create SessionCard component that accepts session data
2. Display Session ID prominently
3. Truncate Problem Statement to 80 characters with ellipsis
4. Add Status Badge with color coding (active/completed/awaiting_implementation)
5. Format and display Start Time (use relative time if possible)
6. Display File Change Count (length of changed_files array)
7. Display Command Status if command file exists
8. Make card clickable (onClick handler passed as prop)
9. Add hover effects (border highlight, slight elevation)

## Files Affected

- `packages/vscode-extension/src/webview/components/SessionCard.tsx` - Create new compact card component
- `packages/vscode-extension/src/webview/panels/SessionsPanel.tsx` - Use SessionCard in list

## Acceptance Criteria

- [ ] SessionCard displays Session ID
- [ ] Problem Statement truncated to 80 characters with "..." if longer
- [ ] Status Badge shows correct color for status
- [ ] Start Time formatted as readable date/time
- [ ] File Change Count displays number from changed_files.length
- [ ] Command Status displays if command file exists
- [ ] Card has hover effect (visual feedback)
- [ ] Card is clickable
- [ ] Card uses VSCode theme colors

## Dependencies

None

