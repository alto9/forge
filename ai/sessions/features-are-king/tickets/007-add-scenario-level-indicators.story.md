---
story_id: add-scenario-level-indicators
session_id: features-are-king
feature_id: [session-visual-indicators]
spec_id: [session-ui-indicators]
status: completed
priority: medium
estimated_minutes: 25
---

# Add Scenario-Level Indicators to Feature Detail View

## Objective

Implement visual indicators within the feature detail view that highlight which scenarios were added (green), modified (yellow), or removed (red) during the active session. This provides granular visibility into changes at the scenario level.

## Context

With scenario-level tracking now implemented, we can show users exactly which scenarios within a feature file were affected during a session. This helps with:
- Reviewing changes before distillation
- Understanding the scope of work in a session
- Creating focused stories based on specific scenarios

The indicators should be color-coded:
- **Green** (#10B981): Scenario added
- **Yellow** (#F59E0B): Scenario modified
- **Red** (#EF4444): Scenario removed

## Implementation Steps

1. Create `ScenarioList` component that displays scenarios with indicators
2. Add `getScenarioChanges(filePath)` function to `useSessionIndicators` hook
   - Returns `{ added: string[], modified: string[], removed: string[] }`
   - Parses from `FeatureChangeEntry` in `changed_files`
3. Update feature detail view to use `ScenarioList` component
4. For each scenario, determine its change type:
   - Check if in `scenarios_added` array → green indicator
   - Check if in `scenarios_modified` array → yellow indicator
   - Check if in `scenarios_removed` array → red indicator
   - No match → no indicator
5. Display indicator as colored dot or icon next to scenario name
6. Add tooltip on hover: "Added in current session", "Modified in current session", etc.
7. Ensure indicators only show when there is an active session
8. Test with features that have multiple scenarios with different change types

## Files Affected

- `packages/vscode-extension/src/webview/studio/components/ScenarioList.tsx` - Create new component
- `packages/vscode-extension/src/webview/studio/hooks/useSessionIndicators.ts` - Add `getScenarioChanges()`
- `packages/vscode-extension/src/webview/studio/pages/FeatureDetailView.tsx` - Integrate ScenarioList
- `packages/vscode-extension/src/webview/studio/styles/indicators.css` - Add scenario indicator styles

## Acceptance Criteria

- [ ] Scenario indicators appear in feature detail view
- [ ] Added scenarios show green indicator
- [ ] Modified scenarios show yellow indicator
- [ ] Removed scenarios show red indicator (if applicable)
- [ ] Unchanged scenarios show no indicator
- [ ] Indicators have proper tooltips
- [ ] Colors match design spec (green: #10B981, yellow: #F59E0B, red: #EF4444)
- [ ] Indicators adapt to light/dark theme
- [ ] Indicators only show when active session exists
- [ ] Multiple indicators in same file work correctly

## Dependencies

- Depends on: **update-session-format-scenario-tracking** (uses scenario tracking data)
- Depends on: **update-indicators-features-only** (builds on indicator system)

