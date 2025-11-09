---
feature_id: actors-list
name: Actors List View
description: User experience for viewing and navigating the list of actors in Forge Studio
spec_id: [actors-ui, actors-navigation]
model_id: [actor-list, studio-state]
context_id: [theme, vsce]
---

# Actors List View

## Feature: View Actors List

```gherkin
Feature: View Actors List
  As a developer
  I want to see all actors in my project
  So that I can understand who interacts with my system

  Scenario: Display actors list
    Given I have actors defined in my project
    When I navigate to the Actors section in Forge Studio
    Then I should see a list of all actor files
    And I should see actor names and types
    And I should see the folder structure if actors are organized in subfolders
    And I should be able to expand/collapse folders

  Scenario: Navigate actor folders
    Given I have actors organized in nested folders
    When I view the Actors section
    Then I should see the folder hierarchy
    And I should be able to click on folders to navigate
    And I should see the contents of the selected folder
    And I should be able to go back to parent folders

  Scenario: Filter and search actors
    Given I have many actors in my project
    When I want to find a specific actor
    Then I should be able to search by actor name
    And I should be able to filter by actor type (user, system, external)
    And I should see search results highlighted
    And I should be able to clear search/filter
```

## Feature: Actor List Actions

```gherkin
Feature: Actor List Actions
  As a developer
  I want to perform actions on actors from the list view
  So that I can manage my actors efficiently

  Scenario: Create new actor
    Given I am viewing the actors list
    When I want to create a new actor
    Then I should be able to click "New Actor" button
    And I should be prompted for actor name and type
    And a new actor file should be created with template
    And I should be taken to edit the new actor

  Scenario: Create actor in subfolder
    Given I have a subfolder selected in the actors list
    When I want to create a new actor
    Then I should be able to click "New Actor" button
    And the new actor should be created in the selected folder
    And I should be taken to edit the new actor

  Scenario: Delete actor
    Given I have an actor selected
    When I want to delete the actor
    Then I should be able to right-click and select "Delete"
    And I should be prompted to confirm deletion
    And the actor file should be removed
    And the list should be updated

  Scenario: Move actor to folder
    Given I have an actor selected
    When I want to move it to a different folder
    Then I should be able to drag and drop the actor
    And the actor should be moved to the target folder
    And the list should be updated
```
