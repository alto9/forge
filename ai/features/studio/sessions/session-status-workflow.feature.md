---
feature_id: session-status-workflow
spec_id:
  - session-status-transitions
---

# Feature: Session Status Workflow

## Background

```gherkin
Background:
  Given Forge uses a session-driven workflow
  And sessions progress through distinct phases
  And each phase has specific actions and commands available
  And status transitions are controlled and intentional
```

## Scenarios

```gherkin
Scenario: Session starts in Design status
  Given I start a new design session
  When the session file is created
  Then the session status should be "design"
  And I should be able to create and modify features, specs, diagrams, and models
  And the forge-design command should be available
  And all changes should be tracked in changed_files array

Scenario: Design status capabilities
  Given I have an active session with status "design"
  When I work in Forge Studio
  Then I can create new features with Gherkin scenarios
  And I can create new specs with technical contracts
  And I can create new diagrams with nomnoml visualizations
  And I can create new models with data structures
  And I can edit existing features, specs, diagrams, and models
  And all modified files are tracked in the session's changed_files
  And scenario-level changes are tracked for features and specs

Scenario: End design session and transition to Scribe status
  Given I have an active session with status "design"
  And I have made changes to features, specs, or diagrams
  When I click "End Design Session"
  Then the session status should change to "scribe"
  And the session should no longer be marked as active
  And the end_time should be recorded
  And the final changed_files should be saved
  And I should see the session move to the Scribe section

Scenario: Scribe status capabilities
  Given I have a session with status "scribe"
  When I view the session in Forge Studio
  Then I should see all changed files with scenario-level detail
  And I should see which scenarios were added, modified, or removed
  And I should see a "Run forge-scribe" button
  And I should be able to review all changes before distillation
  And the session should display modified items with visual indicators

Scenario: Run forge-scribe command to create tickets
  Given I have a session with status "scribe"
  When I click "Run forge-scribe"
  Then the forge-scribe command should be invoked with the session_id
  And the command should instruct the agent to:
    | Call get_forge_about MCP tool |
    | Call get_forge_schema for session, story, task |
    | Read the session file |
    | Read all changed files |
    | Read all linked contexts |
    | Read all global contexts |
    | Create Stories and Tasks in ai/sessions/{session-id}/tickets/ |
  And after tickets are created, the session status should change to "development"

Scenario: Development status capabilities
  Given I have a session with status "development"
  When I view the session in Forge Studio
  Then I should see all tickets created for this session
  And each ticket should show its status (pending, in_progress, completed)
  And each ticket should be clickable to view details
  And I should see a "Mark Complete" button
  And I can continue working on implementation stories

Scenario: Mark session as complete
  Given I have a session with status "development"
  And all tickets for the session have status "completed"
  When I click "Mark Complete"
  Then the system should verify all tickets are actually completed
  And if all tickets are completed, the session status should change to "completed"
  And I should see a success message
  And the session should move to the Completed section

Scenario: Prevent marking incomplete sessions as complete
  Given I have a session with status "development"
  But some tickets have status "pending" or "in_progress"
  When I click "Mark Complete"
  Then I should see an error message
  And the message should list which tickets are not yet completed
  And the session status should remain "development"
  And I should be prompted to finish remaining tickets

Scenario: Session status progression summary
  Given I understand the Forge session workflow
  Then sessions should progress through these statuses:
    | design       | Active session, creating/editing design docs |
    | scribe       | Design complete, ready for distillation |
    | development  | Tickets created, implementation in progress |
    | completed    | All tickets finished, session archived |
  And each transition should be intentional and validated
  And users cannot skip statuses in the workflow

Scenario: Visual status indicators in Studio
  Given I am viewing sessions in Forge Studio
  When I see the sessions list
  Then each session should display its current status with a badge
  And "design" sessions should show a blue badge
  And "scribe" sessions should show an orange badge
  And "development" sessions should show a purple badge
  And "completed" sessions should show a green badge
  And the active design session should be prominently highlighted
```

