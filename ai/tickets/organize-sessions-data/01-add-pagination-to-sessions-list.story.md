---
story_id: add-pagination-to-sessions-list
session_id: organize-sessions-data
feature_id: [studio-sessions]
spec_id: [forge-studio-implementation]
status: pending
priority: high
estimated_minutes: 25
---

## Objective

Add pagination functionality to the Sessions list view in Forge Studio to display sessions in pages of 10 with navigation controls.

## Context

The Sessions panel currently shows all sessions in a single list. As the number of sessions grows, this becomes unwieldy. This story implements pagination to show 10 sessions per page with Previous, Next, and page number controls.

## Implementation Steps

1. Add pagination state to SessionsPanel component (currentPage, itemsPerPage = 10)
2. Calculate total pages based on sessions array length
3. Slice sessions array to show only current page items
4. Create pagination controls component (Previous, Next, page numbers)
5. Add click handlers to update currentPage state
6. Highlight current page in pagination controls
7. Preserve pagination state in React state (resets on navigation away is acceptable)

## Files Affected

- `packages/vscode-extension/src/webview/panels/SessionsPanel.tsx` - Add pagination state and logic
- `packages/vscode-extension/src/webview/components/Pagination.tsx` - Create reusable pagination component (if needed)

## Acceptance Criteria

- [ ] Sessions list shows maximum 10 sessions per page
- [ ] Pagination controls display Previous, Next, and page numbers
- [ ] Current page is visually highlighted
- [ ] Clicking Next/Previous navigates between pages correctly
- [ ] Clicking page numbers jumps to that page
- [ ] Previous is disabled on first page
- [ ] Next is disabled on last page
- [ ] Pagination state persists while on Sessions view

## Dependencies

None

