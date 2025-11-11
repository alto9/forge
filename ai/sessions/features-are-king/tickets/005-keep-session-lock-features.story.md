---
story_id: keep-session-lock-features
session_id: features-are-king
feature_id: [studio-sessions]
spec_id: [forge-studio-implementation]
status: pending
priority: high
estimated_minutes: 10
---

# Keep Session Requirement for Features

## Objective

Ensure that features continue to require an active design session for creation and editing. Update UI messages and read-only indicators to clearly communicate that features are directive (tracked in sessions) and require a session to be modified.

## Context

While specs/diagrams/models/actors/contexts are being unlocked to allow editing without sessions, features must remain session-locked because they represent directive code changes that need to be tracked.

This story verifies and reinforces the session requirement for features, and updates any messaging to clarify this distinction.

## Implementation Steps

1. Verify that `isEditable()` returns `false` for features when no session is active
2. Update UI messages for features to explain:
   - "Features require an active design session"
   - "Start a session to create or modify features"
3. Ensure read-only mode is active for features when no session exists
4. Add visual indicators showing features are locked (e.g., lock icon)
5. Disable "New Feature" button when no session is active
6. Show tooltip explaining the session requirement when hovering over disabled controls
7. Test that features cannot be edited when no session is active
8. Test that features CAN be edited when a session is active

## Files Affected

- `packages/vscode-extension/src/webview/studio/pages/FeaturesPage.tsx` - Update UI and messages
- `packages/vscode-extension/src/webview/studio/hooks/useSessionPermissions.ts` - Verify feature lock logic
- `packages/vscode-extension/src/webview/studio/components/FeatureEditor.tsx` - Update read-only mode

## Acceptance Criteria

- [ ] Features cannot be created without active session
- [ ] Features cannot be edited without active session
- [ ] "New Feature" button is disabled when no session exists
- [ ] Clear message explains session requirement for features
- [ ] Lock icon or similar indicator shows features are locked
- [ ] Tooltip explains why features are locked
- [ ] Features become editable when session is started
- [ ] Specs/diagrams/models/actors/contexts are NOT affected (remain unlocked)

## Dependencies

- Should be implemented after: **remove-session-lock-specs-diagrams** (to ensure correct contrast)

