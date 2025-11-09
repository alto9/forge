---
feature_id: studio-dashboard
name: Studio Dashboard Overview
description: Dashboard interface showing project overview, active session status, and navigation
spec_id: [dashboard-ui, dashboard-components]
model_id: [session]
context_id: [theme]
---

# Studio Dashboard Overview

## Feature: Project Overview Dashboard

```gherkin
Feature: Project Overview Dashboard
  As a developer
  I want to see a comprehensive overview of my Forge project
  So that I can understand the current state and navigate efficiently

  Scenario: View project statistics
    Given I have a Forge project with various files
    When I open the Forge Studio dashboard
    Then I should see count cards for all Forge object types:
      | Sessions | Total number of sessions |
      | Features | Total number of feature files |
      | Specs | Total number of spec files |
      | Models | Total number of model files |
      | Actors | Total number of actor files |
      | Contexts | Total number of context files |
      | Stories | Total number of story files |
      | Tasks | Total number of task files |
    And counts should be calculated recursively from ai/ directory
    And counts should update automatically when files change

  Scenario: View active session on dashboard
    Given I have an active design session
    When I view the dashboard
    Then I should see an active session card prominently displayed
    And the card should show the session ID
    And the card should show the problem statement
    And the card should show when the session started
    And the card should show how many files have changed
    And I should see a "Stop Session" button

  Scenario: Stop session from dashboard
    Given I have an active session displayed on dashboard
    When I click "Stop Session"
    Then the session should be completed
    And the session status should change to "completed"
    And the end time should be recorded
    And the active session card should disappear
    And the session count should update

  Scenario: View dashboard without active session
    Given I do not have an active session
    When I view the dashboard
    Then I should not see an active session card
    And I should see the count cards
    And I should see quick start instructions
    And I should be prompted to start a session to begin work

  Scenario: Navigate to different sections
    Given I am on the dashboard
    When I want to work with specific Forge objects
    Then I should see a sidebar with navigation links
    And I should be able to click Dashboard to return to overview
    And I should be able to click Sessions to manage sessions
    And I should be able to click Features to browse features
    And I should be able to click Specifications to browse specs
    And I should be able to click Models to browse models
    And I should be able to click Actors to browse actors
    And I should be able to click Contexts to browse contexts
    And the current page should be highlighted in the sidebar
```

## Feature: Quick Start Guide

```gherkin
Feature: Quick Start Instructions
  As a new user
  I want to see instructions on how to use Forge
  So that I can get started quickly

  Scenario: View quick start on dashboard
    Given I am viewing the dashboard
    Then I should see a "Quick Start" section
    And I should see step-by-step instructions:
      | 1 | Start a design session from the Sessions page |
      | 2 | Design your features, specs, and models during the session |
      | 3 | Forge tracks all changes automatically |
      | 4 | Stop the session and create a stories command file |
      | 5 | Execute the command to generate actionable stories and tasks |
      | 6 | Build each story to implement your changes |
    And the instructions should be clear and concise
```

## Feature: Dashboard Layout

```gherkin
Feature: Dashboard Layout and Design
  As a developer
  I want a clean and organized dashboard
  So that I can quickly understand my project state

  Scenario: Dashboard layout structure
    Given I am viewing the dashboard
    Then I should see a header showing "Dashboard"
    And I should see the active session card (if session exists)
    And I should see count cards in a responsive grid layout
    And I should see the quick start section
    And all elements should be properly spaced
    And the layout should adapt to different screen sizes

  Scenario: Count card design
    Given I am viewing count cards
    Then each card should show the category name
    And each card should show the count as a large number
    And cards should have consistent styling
    And cards should use theme colors
    And cards should be visually distinct

  Scenario: Active session card design
    Given I have an active session
    When I view the dashboard
    Then the active session card should have an info background color
    And it should be visually prominent
    And it should show all session details clearly
    And the "Stop Session" button should be easily accessible
```

## Feature: Real-Time Dashboard Updates

```gherkin
Feature: Real-Time Dashboard Updates
  As a developer
  I want the dashboard to update automatically
  So that I always see current information

  Scenario: Update counts when files change
    Given I am viewing the dashboard
    When I create a new feature file in Studio
    Then the Features count should increment automatically
    And I should not need to refresh the page
    And the update should happen within 300ms

  Scenario: Update session status
    Given I am viewing the dashboard with an active session
    When I stop the session
    Then the active session card should disappear
    And the Sessions count should remain the same
    And the dashboard should show the updated state

  Scenario: Update on external file changes
    Given I am viewing the dashboard
    When files are created or modified outside Studio
    Then the structure watcher should detect the changes
    And the counts should update automatically
    And the dashboard should reflect the current state
```

## Feature: Opening Forge Studio

```gherkin
Feature: Open Forge Studio
  As a developer
  I want to easily open Forge Studio
  So that I can start working with Forge

  Scenario: Open Studio from command palette
    Given I am in VSCode
    When I open the command palette (Cmd/Ctrl+Shift+P)
    And I type "Forge: Open Forge Studio"
    And I press Enter
    Then I should be prompted to select a project if multiple workspaces exist
    And if the project is Forge-ready, Studio should open directly
    And if the project is not Forge-ready, the welcome screen should appear

  Scenario: Open Studio with single Forge-ready workspace
    Given I have one workspace open in VSCode
    And the workspace has the required ai/ folder structure
    When I execute "Forge: Open Forge Studio"
    Then Studio should open immediately without prompting
    And it should use the current workspace as the project
    And the dashboard should display
    And the left sidebar should collapse

  Scenario: Open Studio with single non-ready workspace
    Given I have one workspace open in VSCode
    And the workspace does not have the required ai/ folder structure
    When I execute "Forge: Open Forge Studio"
    Then the welcome screen should appear
    And I should see the project readiness status
    And I should see options to initialize the project
    And the left sidebar should collapse

  Scenario: Open Studio with multiple workspaces - show all projects
    Given I have multiple workspace folders open
    And some folders have ai/ directories and some do not
    When I execute "Forge: Open Forge Studio"
    Then I should see a quick pick menu
    And I should see ALL workspace folders listed
    And I should see which projects are Forge-ready
    And I should see which projects are not yet initialized
    And I should be able to select any project
    And the Forge-ready status shown must be accurate
    And the status check must use the same criteria as the actual readiness check

  Scenario: Select Forge-ready project from multi-root workspace
    Given I have multiple workspace folders open
    When I execute "Forge: Open Forge Studio"
    And I select a project that has the required folder structure
    Then Forge Studio should open directly
    And the dashboard should load with the selected project data

  Scenario: Select non-ready project from multi-root workspace
    Given I have multiple workspace folders open
    When I execute "Forge: Open Forge Studio"
    And I select a project that lacks the required folder structure
    Then the welcome screen should appear
    And I should see the project path
    And I should see initialization options

  Scenario: Consistent readiness checking across all entry points
    Given I have multiple workspace folders open
    When I execute "Forge: Open Forge Studio"
    Then the readiness status shown in the project picker
    And the readiness check performed after selection
    And the readiness check in the welcome screen
    Should all use the SAME readiness criteria
    And should all check for the SAME required folders
    And should all check for the SAME required Cursor commands
    And the status displayed must accurately reflect whether the project will open Studio or Welcome screen
```
