---
feature_id: contexts-list
name: Contexts List View
description: User experience for viewing and navigating the list of contexts in Forge Studio
spec_id: [contexts-ui, contexts-navigation]
model_id: [context-list, studio-state]
context_id: [theme, vsce]
---

# Contexts List View

## Feature: View Contexts List

```gherkin
Feature: View Contexts List
  As a developer
  I want to see all contexts in my project
  So that I can understand what guidance is available for technical decisions

  Scenario: Display contexts list
    Given I have contexts defined in my project
    When I navigate to the Contexts section in Forge Studio
    Then I should see a list of all context files
    And I should see context names and categories
    And I should see the folder structure if contexts are organized in subfolders
    And I should be able to expand/collapse folders

  Scenario: Navigate context folders
    Given I have contexts organized in nested folders
    When I view the Contexts section
    Then I should see the folder hierarchy
    And I should be able to click on folders to navigate
    And I should see the contents of the selected folder
    And I should be able to go back to parent folders

  Scenario: Filter and search contexts
    Given I have many contexts in my project
    When I want to find a specific context
    Then I should be able to search by context name
    And I should be able to filter by context category
    And I should see search results highlighted
    And I should be able to clear search/filter
```

## Feature: Context List Actions

```gherkin
Feature: Context List Actions
  As a developer
  I want to perform actions on contexts from the list view
  So that I can manage my contexts efficiently

  Scenario: Create new context
    Given I am viewing the contexts list
    When I want to create a new context
    Then I should be able to click "New Context" button
    And I should be prompted for context name and category
    And a new context file should be created with template
    And I should be taken to edit the new context

  Scenario: Create context in subfolder
    Given I have a subfolder selected in the contexts list
    When I want to create a new context
    Then I should be able to click "New Context" button
    And the new context should be created in the selected folder
    And I should be taken to edit the new context

  Scenario: Delete context
    Given I have a context selected
    When I want to delete the context
    Then I should be able to right-click and select "Delete"
    And I should be prompted to confirm deletion
    And the context file should be removed
    And the list should be updated

  Scenario: Move context to folder
    Given I have a context selected
    When I want to move it to a different folder
    Then I should be able to drag and drop the context
    And the context should be moved to the target folder
    And the list should be updated
```
