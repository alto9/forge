---
story_id: create-expanded-session-detail
session_id: organize-sessions-data
feature_id: [studio-sessions]
spec_id: [forge-studio-implementation]
status: pending
priority: high
estimated_minutes: 30
---

## Objective

Create an expanded detail view that shows complete session information when a session card is clicked.

## Context

When users click on a session card, they should see an expanded view with all session details including: full problem statement, goals, approach, key decisions, notes, and complete list of changed files. The view should have a close/collapse action.

## Implementation Steps

1. Add selectedSession state to SessionsPanel (null or session object)
2. Create SessionDetail component that accepts full session data
3. Display all session fields in organized sections:
   - Session ID and Status
   - Full Problem Statement (no truncation)
   - Start Time and End Time
   - Goals (full content)
   - Approach (full content)
   - Key Decisions (full content)
   - Notes (full content)
   - Command file path (if exists)
4. Add "Close Details" button
5. Add click-outside-to-close functionality
6. Toggle between list view and detail view based on selectedSession state

## Files Affected

- `packages/vscode-extension/src/webview/components/SessionDetail.tsx` - Create detail view component
- `packages/vscode-extension/src/webview/panels/SessionsPanel.tsx` - Add selectedSession state and toggle logic

## Acceptance Criteria

- [ ] Clicking a session card opens expanded detail view
- [ ] Detail view shows all session frontmatter fields
- [ ] Detail view shows Goals, Approach, Key Decisions, Notes sections
- [ ] "Close Details" button returns to list view
- [ ] Clicking outside detail view collapses it
- [ ] Detail view uses proper typography and spacing
- [ ] Detail view is scrollable if content is long
- [ ] Only one detail view can be open at a time

## Dependencies

- add-pagination-to-sessions-list
- create-compact-session-card

