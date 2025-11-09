---
story_id: verify-features-remain-session-locked
session_id: change-lockdown-items-and-update-menu
feature_id: [feature-creation, feature-editing]
spec_id: [forge-studio-implementation]
status: pending
priority: medium
estimated_minutes: 15
depends_on: [integrate-session-required-view]
---

## Objective

Verify that Features creation and editing still require an active session and display SessionRequiredView when no session is active.

## Context

Features should remain session-locked after our changes. This story is to verify that Features functionality wasn't accidentally changed.

## Implementation Steps

1. Review BrowserPage.tsx to ensure Features category still checks for active session
2. Verify SessionRequiredView is shown for Features when no session
3. Verify "New Feature" button is hidden/disabled without session
4. Verify Feature editing is disabled without session
5. Verify Features work normally with active session
6. No code changes needed - this is verification only

## Files to Review

- `packages/vscode-extension/src/webview/studio/components/BrowserPage.tsx`
- `packages/vscode-extension/src/webview/studio/index.tsx`

## Acceptance Criteria

- [ ] Navigating to Features without session shows SessionRequiredView
- [ ] "New Feature" button is hidden/disabled without session
- [ ] Cannot edit Feature files without session
- [ ] Starting a session enables all Feature operations
- [ ] Features are tracked in session changed_files when created/edited

## Testing Notes

Test by:
1. Opening Studio without session
2. Navigating to Features
3. Verifying SessionRequiredView displays
4. Verifying no create/edit operations are available
5. Starting a session
6. Verifying Features page loads normally
7. Creating a Feature and verifying it's tracked in session




