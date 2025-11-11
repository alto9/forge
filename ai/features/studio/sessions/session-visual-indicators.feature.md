---
feature_id: session-visual-indicators
spec_id:
  - session-ui-indicators
---

# Feature: Session Visual Indicators

## Background

```gherkin
Background:
  Given Forge tracks changes during active design sessions
  And users need visual feedback about what has been modified
  And visual indicators help review changes before distillation
  And indicators should be contextual and non-intrusive
```

## Scenarios

```gherkin
Scenario: Highlight modified features in Features list
  Given I have an active design session
  And I have modified some features during the session
  When I view the Features list in Forge Studio
  Then modified features should have a colored border
  And the border should be a distinct accent color (e.g., orange or blue)
  And the border should be 2-3px wide on the left side of the card
  And unmodified features should have no special indicator
  And this helps me quickly identify what changed

Scenario: No indicators for specs or diagrams
  Given I have an active design session
  And I have modified specs or diagrams during the session
  When I view the Specs or Diagrams lists in Forge Studio
  Then there should be NO visual indicators on specs or diagrams
  And specs and diagrams are always editable regardless of session status
  And only features show session indicators

Scenario: Highlight scenarios within feature detail view
  Given I have an active design session
  And I am viewing a modified feature's detail page
  When I see the list of scenarios in the feature
  Then scenarios that were added should have a green indicator
  And scenarios that were modified should have a yellow indicator
  And scenarios that were removed should have a red indicator (if shown)
  And unchanged scenarios should have no indicator
  And this provides granular visibility into what changed

Scenario: Indicator badge on session panel
  Given I have an active design session
  When I view the session panel
  Then I should see a "Modified Features" badge count
  And the badge should show the total number of changed feature files
  And the badge should use the session indicator color
  And clicking the badge should expand the Changed Files section
  And only features are counted (not specs/diagrams/models)

Scenario: Show new feature files with distinct indicator
  Given I have an active design session
  And I have created new features
  When I view the Features list
  Then newly created feature files should have a "New" badge
  And the badge should be visually distinct from modified indicators
  And the badge should be green to indicate addition
  And this distinguishes new work from modifications

Scenario: Remove indicators when session ends
  Given I have an active design session with visual indicators
  When I end the design session and transition to "scribe" status
  Then all visual indicators should remain visible in the session context
  But the indicators should not appear in the main Features list
  And this keeps the main UI clean while preserving session context

Scenario: Session review mode shows all indicators
  Given I have a session with status "scribe"
  When I view the session detail page
  Then I should see all modified feature files with indicators
  And I should see scenario-level changes highlighted
  And this serves as a review interface before running forge-scribe
  And I can verify all changes are correct before distillation
  And only features are shown (specs/diagrams are not tracked)

Scenario: Indicator color scheme
  Given I am viewing Forge Studio with an active session
  Then the indicator color scheme should be:
    | Session Border       | Blue (#3B82F6) or Orange (#F59E0B) |
    | Scenario Added       | Green (#10B981) |
    | Scenario Modified    | Yellow (#F59E0B) |
    | Scenario Removed     | Red (#EF4444) |
    | New File Badge       | Green (#10B981) |
  And colors should be consistent throughout the Studio
  And colors should work with both light and dark themes

Scenario: Indicators update in real-time
  Given I have an active design session
  And I am viewing the Features list
  When I modify a feature file and save it
  Then the indicator should appear immediately
  And I should not need to refresh the page
  And the session panel should update to reflect the change
  And the Changed Files count should increment

Scenario: Indicators in nested folder views
  Given I have an active design session
  And I have modified features in nested folders
  When I view the Features list with folder structure
  Then modified features should show indicators
  And parent folders containing modified files should show a count badge
  And the count badge should indicate how many modified files are inside
  And this helps navigate complex folder structures

Scenario: Hover tooltip for modified items
  Given I have an active design session
  And I am viewing a modified feature in the list
  When I hover over the modified indicator
  Then I should see a tooltip
  And the tooltip should say "Modified in current session"
  And the tooltip should show the session_id
  And this provides context for the indicator
```

