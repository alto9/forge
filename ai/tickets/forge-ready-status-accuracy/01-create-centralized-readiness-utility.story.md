---
story_id: create-centralized-readiness-utility
session_id: forge-ready-status-accuracy
feature_id: [welcome-screen, studio-dashboard]
spec_id: [welcome-initialization]
model_id: []
status: completed
priority: high
estimated_minutes: 25
---

# Create Centralized Project Readiness Utility Module

## Objective

Create a single, canonical utility module at `packages/vscode-extension/src/utils/projectReadiness.ts` that exports constants and functions for checking project readiness. This establishes the single source of truth for readiness criteria.

## Context

Currently, three separate implementations of `checkProjectReadiness` exist with inconsistent criteria:
- `ProjectPicker.checkProjectReadiness()` - checks 7 folders (including LEGACY ai/models), but NOT Cursor commands
- `extension.ts checkProjectReadiness()` - checks 6 folders, but inconsistent with others
- `WelcomePanel._checkProjectReadiness()` - another separate implementation

This story creates the centralized utility that all components will use.

## Implementation Steps

1. Create new file: `packages/vscode-extension/src/utils/projectReadiness.ts`
2. Export `REQUIRED_FOLDERS` constant with 6 folders (excluding ai/models):
   - 'ai'
   - 'ai/actors'
   - 'ai/contexts'
   - 'ai/features'
   - 'ai/sessions'
   - 'ai/specs'
3. Export `REQUIRED_COMMANDS` constant with Cursor command paths
4. Implement `checkProjectReadiness(projectUri: vscode.Uri): Promise<boolean>` function that:
   - Loops through REQUIRED_FOLDERS and checks existence with `vscode.workspace.fs.stat()`
   - Returns false if any folder is missing
   - Loops through REQUIRED_COMMANDS and checks existence + validates hash
   - Returns false if any command is missing or invalid
   - Returns true only if all folders and commands are valid
5. Import necessary types from vscode
6. Import `validateCommandFileHash` from existing validation utilities

## Files Affected

- `packages/vscode-extension/src/utils/projectReadiness.ts` - NEW FILE

## Acceptance Criteria

- [x] New file `projectReadiness.ts` exists in utils directory
- [x] Exports `REQUIRED_FOLDERS` constant as string array with 6 folders
- [x] REQUIRED_FOLDERS does NOT include 'ai/models'
- [x] Exports `REQUIRED_COMMANDS` constant as string array
- [x] Exports `checkProjectReadiness` async function
- [x] Function checks all folders with vscode.workspace.fs.stat()
- [x] Function checks all Cursor commands and validates hashes
- [x] Function returns boolean Promise
- [x] Code compiles without TypeScript errors

## Dependencies

None - this is the foundation for other stories.

