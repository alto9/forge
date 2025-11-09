---
story_id: update-contexts-browser-permissions
session_id: change-lockdown-items-and-update-menu
feature_id: [context-creation, context-editing]
spec_id: [forge-studio-implementation]
status: completed
priority: medium
estimated_minutes: 20
depends_on: [remove-context-session-requirement]
---

## Objective

Update the BrowserPage component for Contexts category to remove session requirement checks and always allow creation/editing.

## Context

The BrowserPage component currently checks for active sessions before enabling edit/create operations. For Contexts, these checks should be removed since Contexts are always editable.

## Implementation Steps

1. Open `packages/vscode-extension/src/webview/studio/components/BrowserPage.tsx`
2. Locate session requirement checks in the Contexts section
3. Remove or bypass session checks when `category === 'contexts'`
4. Ensure "New Context" button is always enabled for Contexts
5. Ensure Context edit/save operations are always enabled
6. Remove any "session required" messaging for Contexts

## Files to Modify

- `packages/vscode-extension/src/webview/studio/components/BrowserPage.tsx`

## Acceptance Criteria

- [ ] "New Context" button is always visible and enabled
- [ ] Context files can always be opened for editing
- [ ] Context save operations always work
- [ ] No "session required" messages appear for Contexts
- [ ] All Context operations work without active session

## Testing Notes

Test by:
1. Ensuring no active session
2. Navigating to Contexts
3. Verifying "New Context" button is enabled
4. Creating a new Context successfully
5. Editing an existing Context successfully
6. Saving changes successfully

