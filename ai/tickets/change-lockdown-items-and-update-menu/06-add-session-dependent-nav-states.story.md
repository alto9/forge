---
story_id: add-session-dependent-nav-states
session_id: change-lockdown-items-and-update-menu
feature_id: [navigation-menu]
spec_id: [navigation-menu-implementation]
status: pending
priority: high
estimated_minutes: 25
depends_on: [reorganize-sidebar-with-sections]
---

## Objective

Add session-dependent disabled states and lock icons to Features and Specs navigation items when no session is active.

## Context

When no session is active, Features and Specs navigation items should appear visually disabled with lock icons to indicate they require a session.

## Implementation Steps

1. Update `NavItem` component in Sidebar.tsx to accept `isDisabled` and `requiresSession` props
2. Add conditional rendering for lock icon when `isDisabled` is true
3. Add `disabled` CSS class that reduces opacity and changes cursor
4. Pass `requiresSession: true` for Features and Specs items
5. Pass `isDisabled: !activeSession && requiresSession` to determine disabled state
6. Prevent navigation when item is disabled

## Files to Modify

- `packages/vscode-extension/src/webview/studio/components/Sidebar.tsx`
- `packages/vscode-extension/src/webview/studio/styles/sidebar.css`

## Acceptance Criteria

- [ ] Features nav item shows lock icon when no session is active
- [ ] Specs nav item shows lock icon when no session is active
- [ ] Actors, Contexts, Sessions nav items never show lock icons
- [ ] Disabled items have reduced opacity (0.5)
- [ ] Disabled items have `not-allowed` cursor
- [ ] Clicking disabled items does nothing
- [ ] Lock icons disappear when session becomes active

## Testing Notes

Test by:
1. Opening Studio without active session
2. Verifying Features and Specs show lock icons and are dimmed
3. Verifying Actors, Contexts, Sessions are fully enabled
4. Starting a session
5. Verifying lock icons disappear from Features and Specs




