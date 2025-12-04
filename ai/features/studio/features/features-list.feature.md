---
feature_id: features-list
name: Features List View
description: User experience for viewing and navigating the list of features in Forge Studio
spec_id: [features-ui, features-navigation]
model_id: [feature-list, studio-state]
---

# Features List View

## Feature: View Features List

```gherkin
Feature: View Features List
  As a developer
  I want to see all features in my project
  So that I can understand what functionality my system provides

  Scenario: Display features list
    Given I have features defined in my project
    When I navigate to the Features section in Forge Studio
    Then I should see a list of all feature files
    And I should see feature names and descriptions
    And I should see the folder structure if features are organized in subfolders
    And I should be able to expand/collapse folders

  Scenario: Navigate feature folders
    Given I have features organized in nested folders
    When I view the Features section
    Then I should see the folder hierarchy
    And I should be able to click on folders to navigate
    And I should see the contents of the selected folder
    And I should be able to go back to parent folders

  Scenario: Filter and search features
    Given I have many features in my project
    When I want to find a specific feature
    Then I should be able to search by feature name
    And I should be able to filter by feature status
    And I should see search results highlighted
    And I should be able to clear search/filter
```

## Feature: Feature List Actions

```gherkin
Feature: Feature List Actions
  As a developer
  I want to perform actions on features from the list view
  So that I can manage my features efficiently

  Scenario: Create new feature
    Given I am viewing the features list
    When I want to create a new feature
    Then I should be able to click "New Feature" button
    And I should be prompted for feature name and description
    And a new feature file should be created with template
    And I should be taken to edit the new feature

  Scenario: Create feature in subfolder
    Given I have a subfolder selected in the features list
    When I want to create a new feature
    Then I should be able to click "New Feature" button
    And the new feature should be created in the selected folder
    And I should be taken to edit the new feature

  Scenario: Delete feature
    Given I have a feature selected
    When I want to delete the feature
    Then I should be able to right-click and select "Delete"
    And I should be prompted to confirm deletion
    And the feature file should be removed
    And the list should be updated

  Scenario: Move feature to folder
    Given I have a feature selected
    When I want to move it to a different folder
    Then I should be able to drag and drop the feature
    And the feature should be moved to the target folder
    And the list should be updated
```
