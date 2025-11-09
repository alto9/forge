---
story_id: add-multi-root-workspace-support
session_id: project-init
feature_id: [welcome-screen, studio-dashboard]
spec_id: [forge-studio-implementation]
model_id: []
context_id: []
status: completed
priority: medium
estimated_minutes: 20
---

# Add Multi-Root Workspace Support to ProjectPicker

## Objective

Update ProjectPicker to show ALL workspace folders in multi-root workspaces with readiness indicators, allowing users to initialize new projects without manual setup.

## Context

Previously, ProjectPicker filtered to only show folders with ai/ directories. This prevented starting Forge in new projects. Now we show all folders with readiness indicators.

## Implementation Steps

1. Update ProjectPicker.pickProject() method
2. Remove filtering of workspace folders (show all)
3. Add readiness check for each workspace folder
4. Add indicator to folder names: "✓ Ready" or "⚠ Not Ready"
5. Format quick pick items with readiness status
6. Ensure selection works for both ready and non-ready projects
7. Test with various multi-root workspace configurations

## Files Affected

- `packages/vscode-extension/src/utils/ProjectPicker.ts` - Update to show all folders with indicators

## Acceptance Criteria

- [x] Shows ALL workspace folders, not just ones with ai/
- [x] Each folder shows readiness indicator
- [x] Ready folders: "$(check) Forge Ready" (VSCode icon syntax)
- [x] Not ready folders: "$(warning) Not Ready" (VSCode icon syntax)
- [x] Indicator appears next to folder name (as description)
- [x] Selection returns correct projectUri
- [x] Works with 2+ workspace folders
- [x] Single workspace still works (no picker shown)

## Dependencies

- add-readiness-detection
- update-open-studio-command

