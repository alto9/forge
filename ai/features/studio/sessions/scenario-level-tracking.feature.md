---
feature_id: scenario-level-tracking
spec_id:
  - session-change-tracking
status: planned
---

# Feature: Scenario-Level Change Tracking

**STATUS: FUTURE ENHANCEMENT** - This feature is planned but not yet implemented. The current implementation tracks files as simple paths. See `session-change-tracking.spec.md` for current implementation details.

## Background

```gherkin
Background:
  Given Forge tracks file changes during design sessions
  And features contain multiple Gherkin scenarios
  And specs contain multiple technical sections
  And users need granular visibility into what changed
  And scenario-level tracking provides better context for story creation
  But this granular tracking is not yet implemented
```

## Planned Scenarios (Future Implementation)

```gherkin
Scenario: Track scenario additions in features (PLANNED)
  Given I have an active design session
  And I open a feature file
  When I add a new Gherkin scenario to the feature
  Then the session's changed_files should record:
    | path | The feature file path |
    | change_type | modified |
    | scenarios_added | The new scenario name |
  And the scenario name should be extracted from the Gherkin "Scenario:" line
  And this should be tracked automatically on file save

Scenario: Track scenario modifications in features
  Given I have an active design session
  And a feature file with existing scenarios
  When I modify the steps of an existing scenario
  Then the session's changed_files should record:
    | path | The feature file path |
    | change_type | modified |
    | scenarios_modified | The modified scenario name |
  And the system should detect changes to Given/When/Then steps
  And multiple modifications to the same scenario should only list it once

Scenario: Track scenario removals in features
  Given I have an active design session
  And a feature file with multiple scenarios
  When I delete an entire scenario from the feature
  Then the session's changed_files should record:
    | path | The feature file path |
    | change_type | modified |
    | scenarios_removed | The removed scenario name |
  And the system should detect when a scenario no longer exists

Scenario: Track new feature file creation
  Given I have an active design session
  When I create a new feature file with scenarios
  Then the session's changed_files should record:
    | path | The new feature file path |
    | change_type | added |
    | scenarios_added | List of all scenario names in the file |
  And every scenario in the new file should be listed
  And the file should be tracked from the moment it's created

Scenario: Track spec section changes
  Given I have an active design session
  And I am editing a spec file
  When I add or modify a section in the spec
  Then the session's changed_files should record:
    | path | The spec file path |
    | change_type | modified |
    | sections_modified | List of modified section headers |
  And section headers should be extracted from markdown ## headers
  And this provides context about which parts of the spec changed

Scenario: Track diagram changes
  Given I have an active design session
  And I am editing a diagram file
  When I modify the nomnoml diagram
  Then the session's changed_files should record:
    | path | The diagram file path |
    | change_type | modified |
    | description | Brief description of the diagram |
  And diagrams are tracked at file level (not scenario level)

Scenario: Display scenario-level changes in Changed Files view
  Given I have an active session with tracked changes
  When I view the session panel in Forge Studio
  Then I should see a "Changed Files" section
  And for each feature file, I should see:
    | File path |
    | Change type badge (Added/Modified) |
    | List of scenarios added (with green indicator) |
    | List of scenarios modified (with yellow indicator) |
    | List of scenarios removed (with red indicator) |
  And for each spec file, I should see:
    | File path |
    | Change type badge |
    | List of sections modified |
  And this should update in real-time as I make changes

Scenario: Expandable changed file entries
  Given I am viewing the Changed Files section
  And a feature file has multiple scenario changes
  When I see the feature file entry
  Then it should show the file path and count of changes
  And I should be able to expand it to see detailed scenario changes
  And expanded view should show:
    | Added: scenario-name-1, scenario-name-2 |
    | Modified: scenario-name-3 |
    | Removed: scenario-name-4 |
  And I should be able to collapse it to save space

Scenario: Scenario tracking in session file format
  Given I have a session with tracked changes
  When I view the session file
  Then the changed_files array should have entries like:
```yaml
changed_files:
  - path: ai/features/user-authentication.feature.md
    change_type: modified
    scenarios_added:
      - "User logs in with two-factor authentication"
    scenarios_modified:
      - "User logs in with email and password"
  - path: ai/specs/authentication-api.spec.md
    change_type: modified
    sections_modified:
      - "Login Endpoint"
      - "Token Validation"
```
  And this format provides complete context for distillation

Scenario: Use scenario tracking during distillation
  Given I have a session with scenario-level tracking
  When I run forge-scribe to create stories
  Then the AI should see exactly which scenarios were changed
  And the AI should create stories that reference specific scenarios
  And stories should have clear scope based on scenario changes
  And this prevents creating overly broad or vague stories

Scenario: Real-time tracking during active session
  Given I have an active design session
  When I save changes to a feature file
  Then the session file should be updated immediately
  And the changed_files array should reflect the new changes
  And the Studio UI should refresh to show updated changes
  And I should not need to manually refresh or reload
```

