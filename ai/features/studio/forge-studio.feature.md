---
feature_id: forge-studio
name: Forge Studio Interface
description: Visual interface for managing Forge files and sessions with integrated session panel
spec_id: [studio-ui, studio-components, studio-webview]
model_id: [session, feature, spec, model, actor, context]
context_id: [theme, vsce]
---

# Forge Studio Interface

## Feature: Forge Studio Dashboard

```gherkin
Feature: Forge Studio Dashboard
  As a developer
  I want to see an overview of my Forge project
  So that I can understand the current state and navigate efficiently

  Scenario: View project overview
    Given I have a Forge project with various files
    When I open Forge Studio
    Then I should see a dashboard with counts of all Forge objects
    And I should see sessions, features, specs, models, actors, contexts, stories, and tasks counts
    And I should see the active session status prominently displayed
    And I should see quick start instructions
    And I should be able to navigate to different sections via sidebar

  Scenario: View active session on dashboard
    Given I have an active design session
    When I view the dashboard
    Then I should see the active session card with session ID
    And I should see the problem statement
    And I should see when the session started
    And I should see how many files have changed
    And I should be able to stop the session from the dashboard

  Scenario: Navigate between sections
    Given I am in Forge Studio
    When I want to work with different Forge objects
    Then I should be able to navigate to Dashboard
    And I should be able to navigate to Sessions
    And I should be able to navigate to Features
    And I should be able to navigate to Specs
    And I should be able to navigate to Models
    And I should be able to navigate to Actors
    And I should be able to navigate to Contexts
```

## Feature: Session Panel

```gherkin
Feature: Integrated Session Panel
  As a developer
  I want a persistent session panel while working
  So that I can track my progress and document decisions during the session

  Scenario: View active session panel
    Given I have an active design session
    When I am in Forge Studio
    Then I should see a session panel on the right side
    And I should see the session ID and start time
    And I should see the problem statement field
    And I should see fields for Goals, Approach, Key Decisions, and Notes
    And I should see the list of changed files
    And I should be able to minimize/expand the panel

  Scenario: Edit session details in real-time
    Given I have an active session with the panel visible
    When I type in any of the session fields
    Then the changes should be auto-saved after 500ms
    And the session file should be updated on disk
    And I should not need to manually save
    And my work should be preserved if I close Studio

  Scenario: Track session progress
    Given I have an active session
    When I create or edit Forge files
    Then the changed files list should update automatically
    And the file count should be displayed in the panel
    And relative file paths should be shown

  Scenario: Minimize session panel
    Given I have the session panel open
    When I click the minimize button
    Then the panel should collapse to a narrow vertical bar
    And I should see a rotate indicator with "Active Session" text
    And I should be able to expand it again by clicking
```

## Feature: File Management in Studio

```gherkin
Feature: File Management in Studio
  As a developer
  I want to create and manage Forge files through Studio
  So that I can organize my context engineering work

  Scenario: Session-aware file creation
    Given I have an active design session
    When I want to create a new Forge file
    Then I should be able to create files in any category
    And I should be prompted for a title
    And the file should be created with kebab-case naming
    And the file should have proper frontmatter template
    And the file should have category-appropriate content template
    And the file change should be tracked in the session

  Scenario: Prevent editing without session
    Given I do not have an active session
    When I try to create or edit Forge files
    Then I should see a read-only indicator
    And I should see a message to start a session first
    And file creation buttons should not be available
    And file editing should be disabled

  Scenario: Navigate folder structure
    Given I have a nested folder structure
    When I navigate through folders in Studio
    Then I should see the folder hierarchy in a tree view
    And I should be able to expand/collapse folders
    And I should be able to create subfolders during a session
    And I should be able to see both folders and files in folder contents
    And I should see file metadata like modification date

  Scenario: Create nested folders
    Given I have an active session
    When I right-click on a folder in the tree
    Then I should be prompted for a subfolder name
    And the folder should be created with kebab-case naming
    And the folder tree should automatically refresh
    And I should be able to create files in the new folder
```

## Feature: File Editing Interface

```gherkin
Feature: File Editing Interface
  As a developer
  I want to edit Forge files with structured interfaces
  So that I can maintain consistency and quality

  Scenario: Edit file frontmatter
    Given I have opened a Forge file in Studio
    When I view the file
    Then I should see a Metadata section with all frontmatter fields
    And fields should be editable during an active session
    And fields should be read-only without an active session
    And array fields should be comma-separated for easy editing

  Scenario: Edit feature files with Gherkin
    Given I have opened a feature file
    When I view the file
    Then I should see structured sections for Background, Rules, and Scenarios
    And each section should allow adding/removing steps
    And steps should have keyword dropdowns (Given/When/Then/And/But)
    And I should be able to reorder steps with up/down buttons
    And I should be able to add/remove scenarios and rules
    And changes should serialize back to proper Gherkin format

  Scenario: Edit non-feature files
    Given I have opened a spec, model, actor, or context file
    When I view the file
    Then I should see the frontmatter metadata section
    And I should see a content textarea for markdown content
    And I should be able to edit content during a session
    And content should be read-only without a session

  Scenario: Save file changes
    Given I have made changes to a file
    When I click Save Changes
    Then the file should be written to disk
    And the session's changed files should be updated
    And I should see a success message
    And the file should be tracked in the session
```

## Feature: Studio UI Components

```gherkin
Feature: Studio UI Components
  As a developer
  I want a responsive and intuitive interface
  So that I can work efficiently with Forge

  Scenario: Three-panel layout
    Given I am using Forge Studio
    When I open the interface
    Then I should see a left sidebar for navigation
    And I should see a main content area
    And I should see a session panel on the right (when session is active)
    And all panels should be resizable and responsive

  Scenario: Split view for browsing
    Given I am viewing a category (Features, Specs, etc.)
    When I am browsing files
    Then I should see a split view with folder tree on left
    And I should see folder contents or file details on right
    And I should be able to navigate by clicking folders/files
    And I should see a back button when viewing file details

  Scenario: Theme integration
    Given I am using Forge Studio
    When VSCode theme changes
    Then Studio should adapt to the new theme automatically
    And colors should use VSCode CSS variables
    And all text should remain readable
    And interactive elements should have proper hover states

  Scenario: Real-time updates
    Given I am using Forge Studio
    When files are created or modified on disk
    Then the folder trees should refresh automatically
    And the counts on the dashboard should update
    And the session panel should show updated changed files
    And I should not need to manually refresh
```
