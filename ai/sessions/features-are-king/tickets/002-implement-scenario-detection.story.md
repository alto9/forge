---
story_id: implement-scenario-detection
session_id: features-are-king
feature_id: [scenario-level-tracking]
spec_id: [session-change-tracking]
status: completed
priority: high
estimated_minutes: 25
---

# Implement Scenario-Level Change Detection

## Objective

Create functions to detect scenario-level changes in feature files by parsing Gherkin scenarios and comparing old vs new content. This enables tracking which specific scenarios were added, modified, or removed during a design session.

## Context

Previously, sessions tracked files at the file level (just the path). The new approach requires scenario-level granularity so that distillation can create focused stories based on specific scenario changes rather than entire files.

This story implements the core detection logic that identifies:
- **Added scenarios**: New scenarios that didn't exist before
- **Modified scenarios**: Existing scenarios with changed steps
- **Removed scenarios**: Scenarios that were deleted

## Implementation Steps

1. Create or update `GherkinParser.ts` utility to extract scenarios from feature content
2. Implement `extractScenarios(content: string): string[]` function
   - Use regex pattern `/^\s*Scenario:\s*(.+)$/gm` to find scenario names
   - Return array of scenario names
3. Implement `buildScenarioMap(content: string): Record<string, string>` function
   - Parse feature content into map of scenario name → scenario content
   - Include all steps (Given/When/Then/And/But)
4. Implement `detectScenarioChanges(oldContent: string, newContent: string): ScenarioChanges` function
   - Build maps for old and new content
   - Compare maps to identify added/modified/removed scenarios
   - Return structured object with three arrays
5. Add TypeScript interface for `ScenarioChanges`:
   ```typescript
   interface ScenarioChanges {
     added: string[];
     modified: string[];
     removed: string[];
   }
   ```
6. Write unit tests for each function with sample Gherkin content

## Files Affected

- `packages/vscode-extension/src/utils/GherkinParser.ts` - Add scenario detection functions
- `packages/vscode-extension/src/types/ScenarioChanges.ts` - Add TypeScript interface
- `packages/vscode-extension/tests/GherkinParser.test.ts` - Add unit tests

## Acceptance Criteria

- [ ] `extractScenarios()` correctly parses scenario names from Gherkin content
- [ ] `buildScenarioMap()` creates map of scenario name to full scenario content
- [ ] `detectScenarioChanges()` correctly identifies added scenarios
- [ ] `detectScenarioChanges()` correctly identifies modified scenarios (when steps change)
- [ ] `detectScenarioChanges()` correctly identifies removed scenarios
- [ ] Multiple scenarios in one file are handled correctly
- [ ] Empty files or files without scenarios are handled gracefully
- [ ] Unit tests pass for all functions

## Dependencies

None - this is pure logic that can be implemented independently.

