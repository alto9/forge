---
story_id: update-indicators-features-only
session_id: features-are-king
feature_id: [session-visual-indicators]
spec_id: [session-ui-indicators]
status: pending
priority: medium
estimated_minutes: 15
---

# Update Visual Indicators to Show Only Modified Features

## Objective

Update the visual indicator system to display modification indicators (colored borders, badges) only on feature files that have been changed during the active session. Remove indicators from specs, diagrams, models, actors, and contexts since these are no longer tracked in sessions.

## Context

Previously, the indicator system showed colored borders on all modified files (features, specs, diagrams, models). The new design only tracks features in sessions, so indicators should only appear on modified features to avoid confusion.

This change aligns the visual feedback with the underlying tracking behavior: if a file isn't tracked in the session, it shouldn't show a session indicator.

## Implementation Steps

1. Locate the `useSessionIndicators()` hook or similar indicator logic
2. Update `isModified(filePath)` to only return `true` for feature files
3. Verify that the check looks at `changed_files` array (which now only contains features)
4. Remove any explicit indicator logic from SpecsPage, DiagramsPage, ModelsPage components
5. Keep indicator logic in FeaturesPage component
6. Update FileCard component to only show border indicator for features
7. Test that specs show no indicators even when edited during a session
8. Test that features show indicators when modified during a session

## Files Affected

- `packages/vscode-extension/src/webview/studio/hooks/useSessionIndicators.ts` - Update indicator logic
- `packages/vscode-extension/src/webview/studio/pages/SpecsPage.tsx` - Remove indicator integration
- `packages/vscode-extension/src/webview/studio/pages/DiagramsPage.tsx` - Remove indicator integration
- `packages/vscode-extension/src/webview/studio/pages/ModelsPage.tsx` - Remove indicator integration
- `packages/vscode-extension/src/webview/studio/components/FileCard.tsx` - Ensure indicators only for features

## Acceptance Criteria

- [ ] Modified features show colored border indicator
- [ ] Modified specs show NO indicator
- [ ] Modified diagrams show NO indicator
- [ ] Modified models show NO indicator
- [ ] Modified actors show NO indicator
- [ ] Modified contexts show NO indicator
- [ ] Feature indicator colors are correct (blue/orange border)
- [ ] Indicators disappear when session ends
- [ ] Indicators update in real-time when features are modified

## Dependencies

- Depends on: **update-session-format-scenario-tracking** (uses new `changed_files` format)

