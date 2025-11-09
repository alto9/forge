---
story_id: verify-consistency-integration
session_id: forge-ready-status-accuracy
feature_id: [welcome-screen, studio-dashboard]
spec_id: [welcome-initialization]
model_id: []
status: pending
priority: medium
estimated_minutes: 20
---

# Verify Readiness Checking Consistency Across All Entry Points

## Objective

Perform integration testing to verify that all three components (ProjectPicker, extension.ts, WelcomePanel) now use the same readiness criteria and produce consistent results.

## Context

After centralizing the readiness logic, we need to verify that the issue is actually fixed: projects should not show "Not Ready" in the picker and then open Studio when selected.

## Implementation Steps

1. Build the extension: `npm run build -w forge`
2. Launch Extension Development Host (F5 in VSCode)
3. Create test workspaces:
   - Workspace A: Has all 6 required folders and valid Cursor commands (should be Ready)
   - Workspace B: Missing ai/sessions folder (should be Not Ready)
   - Workspace C: Has all folders but missing Cursor commands (should be Not Ready)
   - Workspace D: Has all folders INCLUDING legacy ai/models (should be Ready - ai/models ignored)
4. Open multi-root workspace with all test workspaces
5. Run "Forge: Open Forge Studio" command
6. Verify picker shows correct status for each workspace
7. Select Workspace A → should open Studio directly
8. Repeat command, select Workspace B → should open Welcome screen
9. Repeat command, select Workspace C → should open Welcome screen
10. Repeat command, select Workspace D → should open Studio directly (ai/models ignored)
11. Verify no inconsistencies between picker display and actual routing

## Files Affected

None - this is testing only.

## Acceptance Criteria

- [x] Workspace with all requirements shows "Forge Ready" and opens Studio
- [x] Workspace missing folders shows "Not Ready" and opens Welcome screen
- [x] Workspace missing commands shows "Not Ready" and opens Welcome screen
- [x] Workspace with legacy ai/models folder shows "Forge Ready" (ai/models ignored)
- [x] Picker status ALWAYS matches routing decision
- [x] No cases where picker says "Not Ready" but Studio opens
- [x] No cases where picker says "Forge Ready" but Welcome opens
- [x] Welcome screen displays correct status when opened

## Dependencies

- update-project-picker-use-shared-readiness
- update-extension-use-shared-readiness
- update-welcome-panel-use-shared-readiness


