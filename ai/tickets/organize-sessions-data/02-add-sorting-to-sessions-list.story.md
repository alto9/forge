---
story_id: add-sorting-to-sessions-list
session_id: organize-sessions-data
feature_id: [studio-sessions]
spec_id: [forge-studio-implementation]
status: pending
priority: high
estimated_minutes: 20
---

## Objective

Add sorting functionality to the Sessions list with a dropdown that offers 4 sort options and defaults to "Newest First".

## Context

Users need to sort sessions by different criteria. This story adds a sort dropdown with 4 options: Start Time (Newest First), Start Time (Oldest First), Status, and Session ID. The default sort is Newest First.

## Implementation Steps

1. Add sort state to SessionsPanel component (sortBy: string, default "newest")
2. Create sort dropdown component with 4 options:
   - "Sort By Start Time (Newest First)"
   - "Sort By Start Time (Oldest First)"
   - "Sort By Status"
   - "Sort By Session ID"
3. Implement sort functions for each option
4. Apply sort before pagination slicing
5. Update sessions list immediately when sort option changes
6. Preserve sort preference in component state

## Files Affected

- `packages/vscode-extension/src/webview/panels/SessionsPanel.tsx` - Add sort state and logic
- `packages/vscode-extension/src/webview/components/SortDropdown.tsx` - Create sort dropdown (if extracted)

## Acceptance Criteria

- [ ] Sort dropdown displays with 4 sort options
- [ ] Default sort is "Newest First"
- [ ] Selecting "Newest First" sorts by start_time descending
- [ ] Selecting "Oldest First" sorts by start_time ascending
- [ ] Selecting "Status" groups by status (active, completed, awaiting_implementation)
- [ ] Selecting "Session ID" sorts alphabetically by session_id
- [ ] List updates immediately when sort option changes
- [ ] Sort preference persists during Sessions view session

## Dependencies

None

