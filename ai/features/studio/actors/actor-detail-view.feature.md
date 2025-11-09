---
feature_id: actor-detail-view
name: Actor Detail View
description: User experience for viewing and interacting with individual actor details
spec_id: [actor-detail-ui, actor-editor]
model_id: [actor-detail, studio-state]
context_id: [theme, vsce]
---

# Actor Detail View

## Feature: View Actor Details

```gherkin
Feature: View Actor Details
  As a developer
  I want to see detailed information about an actor
  So that I can understand their role and responsibilities

  Scenario: Display actor information
    Given I have selected an actor from the list
    When I view the actor details
    Then I should see the actor name and type
    And I should see the actor description
    And I should see the actor's responsibilities
    And I should see the actor's characteristics
    And I should see the actor's interactions
    And I should see the actor's context

  Scenario: Navigate to actor from list
    Given I am viewing the actors list
    When I click on an actor
    Then I should be taken to the actor detail view
    And I should see all actor information
    And I should be able to edit the actor if I have an active session

  Scenario: View actor in read-only mode
    Given I do not have an active session
    When I view an actor
    Then I should see all actor information
    And I should see that editing is disabled
    And I should see a message that an active session is required for editing
```

## Feature: Actor Detail Actions

```gherkin
Feature: Actor Detail Actions
  As a developer
  I want to perform actions on individual actors
  So that I can manage actor information effectively

  Scenario: Edit actor with active session
    Given I have an active session
    And I am viewing an actor
    When I want to edit the actor
    Then I should be able to click "Edit" button
    And I should be able to modify actor fields
    And I should be able to save changes
    And I should see a success message

  Scenario: Edit actor without active session
    Given I do not have an active session
    When I try to edit an actor
    Then I should see that editing is disabled
    And I should see a message to start a session first

  Scenario: Delete actor from detail view
    Given I am viewing an actor
    When I want to delete the actor
    Then I should be able to click "Delete" button
    And I should be prompted to confirm deletion
    And the actor should be deleted
    And I should be returned to the actors list

  Scenario: Navigate back to list
    Given I am viewing an actor
    When I want to go back to the actors list
    Then I should be able to click "Back" or use breadcrumb navigation
    And I should be returned to the actors list
    And the list should maintain its previous state
```
