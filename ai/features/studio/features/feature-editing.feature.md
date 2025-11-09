---
feature_id: feature-editing
name: Feature Editing
description: User experience for editing existing features in Forge Studio
spec_id: [feature-editor-ui, feature-validation]
model_id: [feature-editing, studio-state]
context_id: [theme, vsce]
---

# Feature Editing

## Feature: Edit Feature Information

```gherkin
Feature: Edit Feature Information
  As a developer
  I want to edit existing features
  So that I can keep feature information up to date

  Scenario: Edit feature with active session
    Given I have an active design session
    And I am viewing a feature
    When I want to edit the feature
    Then I should be able to click "Edit" button
    And I should be able to modify the feature ID
    And I should be able to edit the feature name
    And I should be able to edit the feature description
    And I should be able to modify linked spec IDs
    And I should be able to modify linked model IDs
    And I should be able to modify linked context IDs
    And I should be able to save changes
    And I should see a success message

  Scenario: Edit feature without active session
    Given I do not have an active session
    When I try to edit a feature
    Then I should see that editing is disabled
    And I should see a message that an active session is required
    And I should be able to start a session from this prompt

  Scenario: Cancel editing
    Given I am editing a feature
    When I want to cancel my changes
    Then I should be able to click "Cancel" button
    And I should be prompted to confirm cancellation
    And my changes should be discarded
    And I should return to the feature detail view
```

## Feature: Feature Content Editing

```gherkin
Feature: Feature Content Editing
  As a developer
  I want to edit the detailed content of features
  So that I can provide comprehensive feature information

  Scenario: Edit feature sections
    Given I am editing a feature
    When I want to modify feature content
    Then I should be able to edit the Overview section
    And I should be able to edit the Behavior section
    And I should be able to edit the Notes section
    And I should be able to add new sections if needed

  Scenario: Edit Gherkin scenarios
    Given I am editing a feature
    When I want to modify Gherkin scenarios
    Then I should be able to edit existing scenarios
    And I should be able to add new scenarios
    And I should be able to delete scenarios
    And I should see syntax highlighting for Gherkin
    And I should be able to validate Gherkin syntax

  Scenario: Use markdown formatting
    Given I am editing feature content
    When I want to format the text
    Then I should be able to use markdown formatting
    And I should see a preview of the formatted text
    And I should be able to toggle between edit and preview modes
    And the formatting should be preserved when saving

  Scenario: Validate feature content
    Given I am editing a feature
    When I try to save with incomplete information
    Then I should see warnings for missing sections
    And I should be able to save anyway if desired
    And I should see suggestions for improving the feature definition
```

## Feature: Feature Management Actions

```gherkin
Feature: Feature Management Actions
  As a developer
  I want to perform management actions on features
  So that I can organize and maintain my feature definitions

  Scenario: Duplicate feature
    Given I am viewing a feature
    When I want to create a similar feature
    Then I should be able to click "Duplicate" button
    And a new feature should be created with the same content
    And the new feature should have a modified ID to avoid conflicts
    And I should be taken to edit the new feature

  Scenario: Move feature to different folder
    Given I am viewing a feature
    When I want to move it to a different folder
    Then I should be able to click "Move" button
    And I should be able to select the target folder
    And the feature should be moved to the new location
    And the features list should be updated

  Scenario: Rename feature file
    Given I am viewing a feature
    When I want to rename the feature file
    Then I should be able to click "Rename" button
    And I should be able to enter a new name
    And the file should be renamed
    And the feature ID should be updated to match
    And I should see a confirmation of the rename
```
