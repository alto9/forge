---
story_id: update-extension-use-shared-readiness
session_id: forge-ready-status-accuracy
feature_id: [studio-dashboard]
spec_id: [welcome-initialization]
model_id: []
status: completed
priority: high
estimated_minutes: 15
---

# Update extension.ts to Use Shared Readiness Check

## Objective

Refactor `extension.ts` to remove its own implementation of `checkProjectReadiness` and import the shared function from the centralized utility module.

## Context

The extension.ts file has its own implementation of checkProjectReadiness that is mostly correct but duplicates logic. Centralizing ensures all components use identical criteria.

## Implementation Steps

1. Open `packages/vscode-extension/src/extension.ts`
2. Add import at top: `import { checkProjectReadiness } from './utils/projectReadiness';`
3. Remove the standalone `checkProjectReadiness` function (lines ~66-111)
4. Verify the command handler (line ~44) already calls `checkProjectReadiness(project)` correctly
5. Remove any now-unused imports related to the old implementation
6. Test that command routing works correctly (ready projects → Studio, not ready → Welcome)

## Files Affected

- `packages/vscode-extension/src/extension.ts` - Remove local implementation, import shared function

## Acceptance Criteria

- [x] extension.ts imports checkProjectReadiness from './utils/projectReadiness'
- [x] Standalone checkProjectReadiness function is removed
- [x] Command handler continues to work correctly
- [x] Ready projects open ForgeStudioPanel directly
- [x] Not ready projects open WelcomePanel
- [x] No TypeScript compilation errors
- [x] Extension activates successfully

## Dependencies

- create-centralized-readiness-utility (must be completed first)

