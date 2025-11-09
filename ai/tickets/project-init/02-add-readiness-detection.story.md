---
story_id: add-readiness-detection
session_id: project-init
feature_id: [welcome-screen]
spec_id: [welcome-initialization]
model_id: []
context_id: []
status: pending
priority: high
estimated_minutes: 20
---

# Add Project Readiness Detection

## Objective

Implement logic in WelcomePanel to detect if a project is "Forge-ready" by checking for the existence of all required folders (ai/, ai/actors, ai/contexts, ai/features, ai/models, ai/sessions, ai/specs).

## Context

Before showing the welcome screen, we need to determine if all required Forge folders exist. This detection informs whether to show initialization options or a ready state.

## Implementation Steps

1. Add `_checkProjectReadiness()` method to WelcomePanel
2. Define required folders array constant
3. Use `workspace.fs.stat()` to check each folder
4. Return boolean indicating if all folders exist
5. Add `_getFolderStatus()` method that returns detailed status
6. Create `FolderStatus` interface with path, exists, description
7. Call readiness check when panel is created
8. Send initial status to webview via postMessage

## Files Affected

- `packages/vscode-extension/src/panels/WelcomePanel.ts` - Add readiness detection methods

## Acceptance Criteria

- [ ] _checkProjectReadiness() returns true only if all 7 folders exist
- [ ] _getFolderStatus() returns array with each folder's status
- [ ] Uses workspace.fs.stat() for folder checks
- [ ] Handles errors gracefully (missing folder = not exist)
- [ ] FolderStatus interface includes path, exists, description
- [ ] Initial status sent to webview on panel creation
- [ ] Works correctly for fully ready, partially ready, and non-ready projects

## Dependencies

- create-welcome-panel-class

