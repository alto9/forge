---
story_id: verify-specs-remain-session-locked
session_id: change-lockdown-items-and-update-menu
feature_id: [spec-creation, spec-editing]
spec_id: [forge-studio-implementation]
status: pending
priority: medium
estimated_minutes: 15
depends_on: [integrate-session-required-view]
---

## Objective

Verify that Specs creation and editing still require an active session and display SessionRequiredView when no session is active.

## Context

Specs should remain session-locked after our changes. This story is to verify that Specs functionality wasn't accidentally changed.

## Implementation Steps

1. Review BrowserPage.tsx to ensure Specs category still checks for active session
2. Verify SessionRequiredView is shown for Specs when no session
3. Verify "New Spec" button is hidden/disabled without session
4. Verify Spec editing is disabled without session
5. Verify Specs work normally with active session
6. No code changes needed - this is verification only

## Files to Review

- `packages/vscode-extension/src/webview/studio/components/BrowserPage.tsx`
- `packages/vscode-extension/src/webview/studio/index.tsx`

## Acceptance Criteria

- [ ] Navigating to Specs without session shows SessionRequiredView
- [ ] "New Spec" button is hidden/disabled without session
- [ ] Cannot edit Spec files without session
- [ ] Starting a session enables all Spec operations
- [ ] Specs are tracked in session changed_files when created/edited

## Testing Notes

Test by:
1. Opening Studio without session
2. Navigating to Specs
3. Verifying SessionRequiredView displays
4. Verifying no create/edit operations are available
5. Starting a session
6. Verifying Specs page loads normally
7. Creating a Spec and verifying it's tracked in session




