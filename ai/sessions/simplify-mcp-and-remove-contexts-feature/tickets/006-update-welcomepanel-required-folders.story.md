---
story_id: update-welcomepanel-required-folders
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: pending
priority: high
estimated_minutes: 10
---

## Objective
Remove the `ai/contexts` entry from the `REQUIRED_FOLDERS` constant in `packages/vscode-extension/src/panels/WelcomePanel.ts`.

## Context
The Welcome Panel displays a checklist of required folders to users during project initialization. Since contexts are being removed, the UI should no longer show contexts as a required folder.

## Implementation Steps
1. Open `packages/vscode-extension/src/panels/WelcomePanel.ts`
2. Locate the `REQUIRED_FOLDERS` constant definition
3. Remove the entry with `path: 'ai/contexts'`
4. Verify the constant is only used for UI display
5. Test that Welcome Panel displays correct folder list

## Files Affected
- `packages/vscode-extension/src/panels/WelcomePanel.ts` - Remove contexts entry from REQUIRED_FOLDERS

## Acceptance Criteria
- [ ] `REQUIRED_FOLDERS` constant no longer includes `ai/contexts` entry
- [ ] Welcome Panel displays correct folder list (without contexts)
- [ ] Folder initialization no longer creates `ai/contexts` directory
- [ ] All tests pass

## Dependencies
- Can be done in parallel with 005-update-projectreadiness-required-folders

