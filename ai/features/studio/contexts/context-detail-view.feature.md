---
feature_id: context-detail-view
name: Context Detail View
description: User experience for viewing and interacting with individual context details
spec_id: [context-detail-ui, context-editor]
model_id: [context-detail, studio-state]
context_id: [theme, vsce]
---

# Context Detail View

## Feature: View Context Details

```gherkin
Feature: View Context Details
  As a developer
  I want to see detailed information about a context
  So that I can understand when and how to use technical guidance

  Scenario: Display context information
    Given I have selected a context from the list
    When I view the context details
    Then I should see the context name and category
    And I should see the context description
    And I should see the usage scenarios
    And I should see the technical guidance
    And I should see any additional notes or documentation

  Scenario: Navigate to context from list
    Given I am viewing the contexts list
    When I click on a context
    Then I should be taken to the context detail view
    And I should see all context information
    And I should be able to edit the context if I have an active session

  Scenario: View context in read-only mode
    Given I do not have an active session
    When I view a context
    Then I should see all context information
    And I should see that editing is disabled
    And I should see a message that an active session is required for editing
```

## Feature: Context Detail Actions

```gherkin
Feature: Context Detail Actions
  As a developer
  I want to perform actions on individual contexts
  So that I can manage context information effectively

  Scenario: Edit context with active session
    Given I have an active session
    And I am viewing a context
    When I want to edit the context
    Then I should be able to click "Edit" button
    And I should be able to modify context fields
    And I should be able to edit usage scenarios
    And I should be able to edit technical guidance
    And I should be able to save changes
    And I should see a success message

  Scenario: Edit context without active session
    Given I do not have an active session
    When I try to edit a context
    Then I should see that editing is disabled
    And I should see a message to start a session first

  Scenario: Delete context from detail view
    Given I am viewing a context
    When I want to delete the context
    Then I should be able to click "Delete" button
    And I should be prompted to confirm deletion
    And the context should be deleted
    And I should be returned to the contexts list

  Scenario: Navigate back to list
    Given I am viewing a context
    When I want to go back to the contexts list
    Then I should be able to click "Back" or use breadcrumb navigation
    And I should be returned to the contexts list
    And the list should maintain its previous state
```
