---
feature_id: spec-editing
name: Spec Editing
description: User experience for editing existing specs in Forge Studio
spec_id: [spec-editor-ui, spec-validation]
model_id: [spec-editing, studio-state]
context_id: [theme, vsce]
---

# Spec Editing

## Feature: Edit Spec Information

```gherkin
Feature: Edit Spec Information
  As a developer
  I want to edit existing specs
  So that I can keep spec information up to date

  Scenario: Edit spec with active session
    Given I have an active design session
    And I am viewing a spec
    When I want to edit the spec
    Then I should be able to click "Edit" button
    And I should be able to modify the spec ID
    And I should be able to edit the spec name
    And I should be able to edit the spec description
    And I should be able to modify linked feature IDs
    And I should be able to modify linked model IDs
    And I should be able to modify linked context IDs
    And I should be able to save changes
    And I should see a success message

  Scenario: Edit spec without active session
    Given I do not have an active session
    When I try to edit a spec
    Then I should see that editing is disabled
    And I should see a message that an active session is required
    And I should be able to start a session from this prompt

  Scenario: Cancel editing
    Given I am editing a spec
    When I want to cancel my changes
    Then I should be able to click "Cancel" button
    And I should be prompted to confirm cancellation
    And my changes should be discarded
    And I should return to the spec detail view
```

## Feature: Spec Content Editing

```gherkin
Feature: Spec Content Editing
  As a developer
  I want to edit the detailed content of specs
  So that I can provide comprehensive spec information

  Scenario: Edit spec sections
    Given I am editing a spec
    When I want to modify spec content
    Then I should be able to edit the Overview section
    And I should be able to edit the Architecture section
    And I should be able to edit the Implementation Details section
    And I should be able to edit the Notes section
    And I should be able to add new sections if needed

  Scenario: Edit Nomnoml diagrams
    Given I am editing a spec
    When I want to modify Nomnoml diagrams
    Then I should be able to edit existing diagrams
    And I should be able to add new diagrams
    And I should be able to delete diagrams
    And I should see syntax highlighting for Nomnoml
    And I should be able to validate Nomnoml syntax
    And I should see a preview of the rendered diagram

  Scenario: Use markdown formatting
    Given I am editing spec content
    When I want to format the text
    Then I should be able to use markdown formatting
    And I should see a preview of the formatted text
    And I should be able to toggle between edit and preview modes
    And the formatting should be preserved when saving

  Scenario: Validate spec content
    Given I am editing a spec
    When I try to save with incomplete information
    Then I should see warnings for missing sections
    And I should be able to save anyway if desired
    And I should see suggestions for improving the spec definition
```

## Feature: Spec Management Actions

```gherkin
Feature: Spec Management Actions
  As a developer
  I want to perform management actions on specs
  So that I can organize and maintain my spec definitions

  Scenario: Duplicate spec
    Given I am viewing a spec
    When I want to create a similar spec
    Then I should be able to click "Duplicate" button
    And a new spec should be created with the same content
    And the new spec should have a modified ID to avoid conflicts
    And I should be taken to edit the new spec

  Scenario: Move spec to different folder
    Given I am viewing a spec
    When I want to move it to a different folder
    Then I should be able to click "Move" button
    And I should be able to select the target folder
    And the spec should be moved to the new location
    And the specs list should be updated

  Scenario: Rename spec file
    Given I am viewing a spec
    When I want to rename the spec file
    Then I should be able to click "Rename" button
    And I should be able to enter a new name
    And the file should be renamed
    And the spec ID should be updated to match
    And I should see a confirmation of the rename
```
