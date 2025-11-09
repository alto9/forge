---
feature_id: actor-editing
name: Actor Editing
description: User experience for editing existing actors in Forge Studio
spec_id: [actor-editor-ui, actor-validation]
model_id: [actor-editing, studio-state]
context_id: [theme, vsce]
---

# Actor Editing

## Feature: Edit Actor Information

```gherkin
Feature: Edit Actor Information
  As a developer
  I want to edit existing actors
  So that I can keep actor information up to date

  Scenario: Edit actor at any time
    Given I am viewing an actor
    When I want to edit the actor
    Then I should be able to click "Edit" button
    And I should be able to modify the actor ID
    And I should be able to change the actor type
    And I should be able to edit the actor name
    And I should be able to edit the actor description
    And I should be able to save changes
    And I should see a success message

  Scenario: Edit actor without active session
    Given I do not have an active session
    And I am viewing an actor
    When I edit and save the actor
    Then the changes should be saved successfully
    And the actor file should be updated on disk
    And I should not be prompted to start a session
    
  Scenario: Edit actor with active session
    Given I have an active design session
    And I am viewing an actor
    When I edit and save the actor
    Then the changes should be saved successfully
    And the actor file should NOT be tracked in the session's changed_files
    And actors are considered foundational and not session-tracked

  Scenario: Cancel editing
    Given I am editing an actor
    When I want to cancel my changes
    Then I should be able to click "Cancel" button
    And I should be prompted to confirm cancellation
    And my changes should be discarded
    And I should return to the actor detail view
```

## Feature: Actor Content Editing

```gherkin
Feature: Actor Content Editing
  As a developer
  I want to edit the detailed content of actors
  So that I can provide comprehensive actor information

  Scenario: Edit actor sections
    Given I am editing an actor
    When I want to modify actor content
    Then I should be able to edit the Overview section
    And I should be able to edit the Responsibilities section
    And I should be able to edit the Characteristics section
    And I should be able to edit the Interactions section
    And I should be able to edit the Context section
    And I should be able to add new sections if needed

  Scenario: Use markdown formatting
    Given I am editing actor content
    When I want to format the text
    Then I should be able to use markdown formatting
    And I should see a preview of the formatted text
    And I should be able to toggle between edit and preview modes
    And the formatting should be preserved when saving

  Scenario: Validate actor content
    Given I am editing an actor
    When I try to save with incomplete information
    Then I should see warnings for missing sections
    And I should be able to save anyway if desired
    And I should see suggestions for improving the actor definition
```

## Feature: Actor Management Actions

```gherkin
Feature: Actor Management Actions
  As a developer
  I want to perform management actions on actors
  So that I can organize and maintain my actor definitions

  Scenario: Duplicate actor
    Given I am viewing an actor
    When I want to create a similar actor
    Then I should be able to click "Duplicate" button
    And a new actor should be created with the same content
    And the new actor should have a modified ID to avoid conflicts
    And I should be taken to edit the new actor

  Scenario: Move actor to different folder
    Given I am viewing an actor
    When I want to move it to a different folder
    Then I should be able to click "Move" button
    And I should be able to select the target folder
    And the actor should be moved to the new location
    And the actors list should be updated

  Scenario: Rename actor file
    Given I am viewing an actor
    When I want to rename the actor file
    Then I should be able to click "Rename" button
    And I should be able to enter a new name
    And the file should be renamed
    And the actor ID should be updated to match
    And I should see a confirmation of the rename
```
