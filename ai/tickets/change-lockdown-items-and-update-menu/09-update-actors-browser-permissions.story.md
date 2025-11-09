---
story_id: update-actors-browser-permissions
session_id: change-lockdown-items-and-update-menu
feature_id: [actor-creation, actor-editing]
spec_id: [forge-studio-implementation]
status: completed
priority: medium
estimated_minutes: 20
depends_on: [remove-actor-session-requirement]
---

## Objective

Update the BrowserPage component for Actors category to remove session requirement checks and always allow creation/editing.

## Context

The BrowserPage component currently checks for active sessions before enabling edit/create operations. For Actors, these checks should be removed since Actors are always editable.

## Implementation Steps

1. Open `packages/vscode-extension/src/webview/studio/components/BrowserPage.tsx`
2. Locate session requirement checks in the Actors section
3. Remove or bypass session checks when `category === 'actors'`
4. Ensure "New Actor" button is always enabled for Actors
5. Ensure Actor edit/save operations are always enabled
6. Remove any "session required" messaging for Actors

## Files to Modify

- `packages/vscode-extension/src/webview/studio/components/BrowserPage.tsx`

## Acceptance Criteria

- [ ] "New Actor" button is always visible and enabled
- [ ] Actor files can always be opened for editing
- [ ] Actor save operations always work
- [ ] No "session required" messages appear for Actors
- [ ] All Actor operations work without active session

## Testing Notes

Test by:
1. Ensuring no active session
2. Navigating to Actors
3. Verifying "New Actor" button is enabled
4. Creating a new Actor successfully
5. Editing an existing Actor successfully
6. Saving changes successfully

