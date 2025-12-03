---
story_id: remove-contexts-from-studio-navigation
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: pending
priority: medium
estimated_minutes: 15
---

## Objective
Remove the Contexts section from Forge Studio navigation menu.

## Context
The Studio UI includes a navigation menu with sections for Features, Specs, Diagrams, Actors, and Contexts. The Contexts section needs to be removed from the menu.

## Implementation Steps
1. Locate Studio navigation component (likely in `packages/vscode-extension/src/webview/studio/`)
2. Find the navigation menu definition or routing configuration
3. Remove Contexts menu item/route
4. Remove any Contexts icon or navigation element
5. Test that Studio navigation renders correctly without Contexts
6. Verify no broken links or routing errors

## Files Affected
- Studio navigation component - Remove Contexts menu item
- Routing configuration - Remove Contexts routes
- Navigation state management - Remove Contexts state

## Acceptance Criteria
- [ ] Contexts section no longer appears in Studio navigation menu
- [ ] Navigation menu displays correctly with remaining sections
- [ ] No console errors or broken routes
- [ ] Clicking other menu items still works correctly
- [ ] Studio builds and runs without errors

## Dependencies
- Can be done in parallel with other Studio UI changes

