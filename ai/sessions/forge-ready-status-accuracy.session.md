---
session_id: forge-ready-status-accuracy
start_time: '2025-11-09T17:54:41.621Z'
status: awaiting_implementation
problem_statement: forge-ready-status-accuracy
changed_files:
  - ai/features/studio/dashboard/overview.feature.md
  - ai/specs/studio/welcome-initialization.spec.md
  - ai/features/studio/welcome/welcome-screen.feature.md
end_time: '2025-11-09T18:04:59.334Z'
command_file: .cursor/commands/create-stories-forge-ready-status-accuracy.md
---
## Problem Statement

forge-ready-status-accuracy

## Goals

Have an accurate accounting of 'forge-ready' status in a multi-root workspace.

## Approach

Either update the project status intelligently or remove that field from the project selection in a multi-root workspace.

## Key Decisions

### Decision: Centralize Readiness Checking Logic

**Problem Identified**: Three separate implementations of `checkProjectReadiness` exist with inconsistent criteria:
1. `ProjectPicker.checkProjectReadiness()` - checks 7 folders (including LEGACY ai/models), but NOT Cursor commands
2. `extension.ts checkProjectReadiness()` - checks 6 folders correctly (without ai/models), and DOES check Cursor commands  
3. `WelcomePanel._checkProjectReadiness()` - checks folders and Cursor commands

**Impact**: ProjectPicker still checks for the legacy `ai/models` folder, causing it to mark projects as "Not Ready" even when they are actually ready (have all current required folders). When user selects the "Not Ready" project, extension.ts correctly identifies it as ready and opens Studio.

**Decision**: Create a single canonical implementation at `packages/vscode-extension/src/utils/projectReadiness.ts` that:
- Exports `REQUIRED_FOLDERS` constant (6 folders, excluding legacy ai/models)
- Exports `REQUIRED_COMMANDS` constant
- Exports `checkProjectReadiness()` function
- All components (ProjectPicker, extension.ts, WelcomePanel) MUST import and use this shared function

**Rationale**: Single source of truth ensures consistency across all readiness checks and accurate status display.

### Decision: Remove ai/models from Readiness Checks

**Status**: `ai/models` is a LEGACY folder and should NOT be checked. ProjectPicker's check for this folder is outdated and causes false "Not Ready" status.

### Decision: Update Documentation to Reflect Consistency Requirements

**Changes Made**:
1. Added scenario in `welcome-screen.feature.md` for consistent readiness checking
2. Added scenario to prevent status display inconsistency
3. Updated `welcome-initialization.spec.md` to document centralized approach
4. Updated `dashboard/overview.feature.md` to require accurate status display

## Notes

When I click on a project that says it is not forge-ready, it is corrected but the status doesn't get updated. The next time I open the project, it shows as not ready yet it opens anyway.

**Root Cause**: The ProjectPicker uses outdated readiness criteria that includes the legacy `ai/models` folder. Projects without `ai/models` (correctly structured modern projects) are marked "Not Ready" by ProjectPicker. However, when selected, extension.ts uses the correct criteria (without ai/models check) and properly identifies the project as ready, routing to Studio instead of Welcome screen.

Additionally, ProjectPicker doesn't check Cursor commands while extension.ts does, creating a second source of inconsistency.

**Solution**: Centralize all readiness checking logic in a shared utility module that all components import, using the correct criteria (6 folders excluding ai/models, plus Cursor commands validation).
