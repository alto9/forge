---
story_id: remove-session-lock-specs-diagrams
session_id: features-are-king
feature_id: [studio-sessions]
spec_id: [forge-studio-implementation]
status: completed
priority: high
estimated_minutes: 10
---

# Remove Session Requirement for Specs and Diagrams

## Objective

Update the UI permission logic to allow specs, diagrams, actors, and contexts to be created and edited at any time, regardless of whether an active session exists. These file types are informative (not directive) and should always be editable.

## Context

Previously, Forge Studio required an active session to edit specs, and diagrams. The new design clarifies that:
- **Features are directive**: Require active session (they represent code changes)
- **Specs/Diagrams/Actors/Contexts are informative**: Always editable (they provide guidance)

This story removes the session requirement for informative file types while keeping the requirement for features.

## Implementation Steps

1. Locate the `isEditable()` or similar permission check function in the webview code
2. Update the logic to return `true` for specs, diagrams, actors, and contexts regardless of session status
3. Remove any "requires session" warning messages for these file types
4. Update the file creation UI to allow creating these files without a session
5. Remove read-only mode indicators for specs/diagrams/actors/contexts
6. Test that these files can be created and edited when no session is active
7. Verify that features still show the session requirement

## Files Affected

- `packages/vscode-extension/src/webview/studio/pages/SpecsPage.tsx` - Remove session requirement
- `packages/vscode-extension/src/webview/studio/pages/DiagramsPage.tsx` - Remove session requirement
- `packages/vscode-extension/src/webview/studio/pages/ActorsPage.tsx` - Remove session requirement
- `packages/vscode-extension/src/webview/studio/pages/ContextsPage.tsx` - Remove session requirement
- `packages/vscode-extension/src/webview/studio/hooks/useSessionPermissions.ts` - Update permission logic

## Acceptance Criteria

- [ ] Specs can be created without active session
- [ ] Specs can be edited without active session
- [ ] Diagrams can be created without active session
- [ ] Diagrams can be edited without active session
- [ ] Actors can be created without active session
- [ ] Actors can be edited without active session
- [ ] Contexts can be created without active session
- [ ] Contexts can be edited without active session
- [ ] No "requires session" warnings appear for these file types
- [ ] Features still require active session (not affected by this change)

## Dependencies

None - this is a UI-only change.

