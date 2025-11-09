---
feature_id: welcome-screen
name: Welcome Screen and Project Initialization
description: Welcome screen that checks project readiness and initializes required folder structure
spec_id: [welcome-initialization, forge-studio-implementation]
model_id: []
context_id: [theme, vsce]
---

# Welcome Screen and Project Initialization

## Feature: Welcome Screen Display

```gherkin
Feature: Welcome Screen Display
  As a developer
  I want to see a welcome screen when opening Forge
  So that I understand the project readiness status

  Scenario: View welcome screen for Forge-ready project
    Given I have selected a project with complete ai/ folder structure
    When the welcome screen opens
    Then I should see "Forge Ready" status
    And I should see a green checkmark indicator
    And I should see the project path displayed
    And I should see a list of all required folders with checkmarks
    And I should see an "Open Forge Studio" button
    And I should not see an initialization button
    And the left sidebar should be collapsed

  Scenario: View welcome screen for non-ready project
    Given I have selected a project without the complete ai/ folder structure
    When the welcome screen opens
    Then I should see "Not Ready" status
    And I should see an orange warning indicator
    And I should see the project path displayed
    And I should see a checklist of required folders
    And I should see which folders exist (checked)
    And I should see which folders are missing (unchecked)
    And I should see an "Initialize Forge Project" button
    And I should not see an "Open Forge Studio" button
    And the left sidebar should be collapsed

  Scenario: View welcome screen for completely new project
    Given I have selected a project with no ai/ directory at all
    When the welcome screen opens
    Then I should see "Not Ready" status
    And all folders in the checklist should be unchecked
    And I should see a message explaining Forge needs to be initialized
    And I should see the "Initialize Forge Project" button prominently

  Scenario: Display folder structure requirements
    Given I am viewing the welcome screen for a non-ready project
    Then I should see the following folders in the checklist:
      | Folder | Purpose |
      | ai/ | Root directory for all Forge files |
      | ai/actors | Actor definitions and personas |
      | ai/contexts | Context guidance files |
      | ai/features | Feature definitions with Gherkin |
      | ai/sessions | Design session tracking |
      | ai/specs | Technical specifications |
    And I should see the following Cursor commands in the checklist:
      | File | Purpose |
      | .cursor/commands/forge-design.md | Cursor command for design session workflow |
      | .cursor/commands/forge-build.md | Cursor command for building implementation from tickets |
    And each folder should show whether it currently exists
    And each Cursor command should show whether it exists and is valid
```

## Feature: Project Readiness Detection

```gherkin
Feature: Project Readiness Detection
  As a developer
  I want Forge to automatically detect if my project is ready
  So that I know what setup is needed

  Scenario: Detect fully ready project
    Given a project has all required folders:
      | ai/ |
      | ai/actors |
      | ai/contexts |
      | ai/features |
      | ai/sessions |
      | ai/specs |
    And a project has all required Cursor commands:
      | .cursor/commands/forge-design.md |
      | .cursor/commands/forge-build.md |
    And the Cursor commands have valid content matching extension templates
    When Forge checks project readiness
    Then the project should be marked as "Forge Ready"
    And the welcome screen should show ready status
    And the user should be able to open Studio directly

  Scenario: Detect partially initialized project
    Given a project has some but not all required folders
    And ai/ exists
    And ai/features exists
    But ai/actors does not exist
    And ai/contexts does not exist
    When Forge checks project readiness
    Then the project should be marked as "Not Ready"
    And the welcome screen should show which folders exist
    And the welcome screen should show which folders are missing
    And the user should be offered to complete initialization

  Scenario: Detect completely uninitialized project
    Given a project has no ai/ directory
    When Forge checks project readiness
    Then the project should be marked as "Not Ready"
    And all required folders should be shown as missing
    And a clear message should explain initialization is needed

  Scenario: Recheck readiness after initialization
    Given a project was not ready
    And I initialized the project
    When Forge rechecks project readiness
    Then the project should now be marked as "Forge Ready"
    And the welcome screen should update to show ready status
    And the "Open Forge Studio" button should appear

  Scenario: Detect project with missing Cursor commands
    Given a project has all required ai/ folders
    But .cursor/commands/forge-design.md does not exist
    Or .cursor/commands/forge-build.md does not exist
    When Forge checks project readiness
    Then the project should be marked as "Not Ready"
    And the welcome screen should show which Cursor commands are missing
    And the user should be offered to complete initialization

  Scenario: Detect project with outdated Cursor commands
    Given a project has all required ai/ folders
    And .cursor/commands/forge-design.md exists
    And .cursor/commands/forge-build.md exists
    But the forge-design.md content hash does not match the extension template
    When Forge checks project readiness
    Then the project should be marked as "Not Ready"
    And the welcome screen should show which Cursor commands need updating
    And the user should be offered to update the commands

  Scenario: Validate Cursor command content on startup
    Given Forge extension is starting up
    And a project has Cursor command files
    When the extension validates the command files
    Then it should compute the hash of each file's content
    And compare against the expected template hash
    And report which files are valid or invalid
    And update project readiness status accordingly

  Scenario: Consistent readiness checking across all components
    Given I have a project with all required folders
    And the project has valid Cursor command files
    When ProjectPicker checks readiness for the multi-root picker
    And extension.ts checks readiness after project selection
    And WelcomePanel checks readiness when rendering
    Then all three checks MUST return the same result
    And all three checks MUST use the same readiness criteria
    And all three checks MUST check for the same folders (excluding legacy ai/models)
    And all three checks MUST check for the same Cursor commands
    And the status shown in the picker MUST match the actual routing decision

  Scenario: Prevent status display inconsistency in multi-root workspace
    Given I have multiple workspace folders
    And one folder shows "Not Ready" in the project picker
    When I select that folder
    Then if the welcome screen appears, the folder was correctly marked "Not Ready"
    And if Studio opens directly, the folder status was INCORRECT
    And this scenario should NEVER happen
    And the picker status MUST accurately predict the routing decision
```

## Feature: Project Initialization

```gherkin
Feature: Project Initialization
  As a developer
  I want to initialize my project with one click
  So that I can start using Forge without manual setup

  Scenario: View initialization preview
    Given I am on the welcome screen for a non-ready project
    And ai/ does not exist
    When I click "Initialize Forge Project"
    Then I should see a confirmation dialog
    And the dialog should show "The following will be created:"
    And I should see a list of all folders that will be created:
      | ai/ |
      | ai/actors |
      | ai/contexts |
      | ai/features |
      | ai/sessions |
      | ai/specs |
    And I should see a list of all Cursor commands that will be created:
      | .cursor/commands/forge-design.md |
      | .cursor/commands/forge-build.md |
    And I should see a "Confirm" button
    And I should see a "Cancel" button

  Scenario: Confirm and execute initialization
    Given I am viewing the initialization confirmation dialog
    When I click "Confirm"
    Then Forge should create all missing folders
    And each folder should be created in the correct location
    And Forge should create all missing Cursor commands
    And each Cursor command should be created with the correct template content
    And each Cursor command should include a hash comment for validation
    And I should see a progress indicator
    And I should see which folders and files are being created
    And when complete, I should see "Initialization Complete"
    And Forge Studio should open automatically
    And the dashboard should load with the initialized project

  Scenario: Cancel initialization
    Given I am viewing the initialization confirmation dialog
    When I click "Cancel"
    Then no folders should be created
    And I should return to the welcome screen
    And the project status should remain "Not Ready"

  Scenario: Initialize partially ready project
    Given a project has ai/ and ai/features
    But is missing ai/actors, ai/contexts, ai/sessions, ai/specs
    And is missing Cursor commands
    When I initialize the project
    Then only the missing folders should be created
    And only the missing Cursor commands should be created
    And existing folders should be preserved
    And I should see which folders and files were created
    And Forge Studio should open automatically

  Scenario: Update outdated Cursor commands
    Given a project has all required folders
    And has Cursor command files
    But the command file content is outdated (hash mismatch)
    When I initialize the project
    Then the outdated Cursor commands should be updated with new templates
    And the new hash comment should be written
    And existing folders should be preserved
    And I should see which files were updated
    And Forge Studio should open automatically

  Scenario: Automatic transition to Studio after initialization
    Given I have confirmed project initialization
    When the initialization completes successfully
    Then the welcome screen should close automatically
    And Forge Studio should open in the same webview panel
    And the dashboard should display
    And I should see zero counts for all object types
    And I should be able to start a session and begin work
```

## Feature: Initialization Error Handling

```gherkin
Feature: Initialization Error Handling
  As a developer
  I want clear feedback if initialization fails
  So that I can resolve issues and try again

  Scenario: Handle permission error during initialization
    Given I am initializing a project
    When folder creation fails due to insufficient permissions
    Then I should see an error message: "Unable to create folders: Permission denied"
    And I should see which folders failed to create
    And I should remain on the welcome screen
    And I should be able to retry initialization

  Scenario: Handle disk space error during initialization
    Given I am initializing a project
    When folder creation fails due to insufficient disk space
    Then I should see an error message: "Unable to create folders: Insufficient disk space"
    And the welcome screen should remain open
    And any partially created folders should be preserved

  Scenario: Handle path error during initialization
    Given I am initializing a project
    When the project path is invalid or no longer exists
    Then I should see an error message: "Invalid project path"
    And I should be offered to select a different project
    And no folders should be created

  Scenario: Retry after initialization failure
    Given initialization failed due to an error
    When I click "Retry Initialization"
    Then Forge should attempt to create missing folders again
    And I should see updated progress
    And if successful, Studio should open automatically
```

## Feature: Welcome Screen UI Components

```gherkin
Feature: Welcome Screen UI Components
  As a developer
  I want a clean and intuitive welcome screen
  So that I can quickly understand and act on project status

  Scenario: Theme integration
    Given I am viewing the welcome screen
    When my VSCode theme is dark
    Then the welcome screen should use dark theme colors
    And all text should be readable
    And buttons should use theme-appropriate colors
    And when I change to a light theme
    Then the welcome screen should update automatically

  Scenario: Responsive layout
    Given I am viewing the welcome screen
    Then the layout should be centered and well-spaced
    And the project path should be clearly visible at the top
    And the status indicator should be prominent
    And the folder checklist should be easy to scan
    And action buttons should be clearly visible at the bottom

  Scenario: Visual feedback for actions
    Given I am on the welcome screen
    When I hover over the "Initialize Forge Project" button
    Then the button should show a hover state
    And when I click the button
    Then I should see immediate feedback
    And during initialization, the button should be disabled
    And I should see a progress indicator

  Scenario: Folder checklist display
    Given I am viewing the folder checklist
    Then each folder should show:
      | Element | Purpose |
      | Folder path | The relative path of the folder |
      | Checkbox/icon | Visual indicator of existence |
      | Status | "Exists" or "Missing" text |
    And folders should be grouped logically
    And the list should be easy to scan
```

## Feature: Opening Forge Studio from Welcome Screen

```gherkin
Feature: Opening Forge Studio from Welcome Screen
  As a developer
  I want to proceed to Forge Studio once my project is ready
  So that I can start my design work

  Scenario: Open Studio from welcome screen when ready
    Given I am on the welcome screen
    And the project is marked as "Forge Ready"
    When I click "Open Forge Studio"
    Then the welcome screen should close
    And Forge Studio should open in the same webview panel
    And the dashboard should load
    And I should see accurate counts for existing Forge objects
    And the left sidebar should remain collapsed

  Scenario: Cannot open Studio when not ready
    Given I am on the welcome screen
    And the project is marked as "Not Ready"
    Then the "Open Forge Studio" button should not be visible
    And only the "Initialize Forge Project" button should be shown
    And I should see a clear message that initialization is required

  Scenario: Seamless transition to Studio
    Given I have just initialized a project
    When initialization completes
    Then there should be no intermediate step
    And Forge Studio should open immediately
    And I should not need to click another button
    And I should land on the dashboard
    And I should be ready to start a design session
```










