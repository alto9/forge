---
feature_id: context-editing
name: Context Editing
description: User experience for editing existing contexts in Forge Studio
spec_id: [context-editor-ui, context-validation]
model_id: [context-editing, studio-state]
context_id: [theme, vsce]
---

# Context Editing

## Feature: Edit Context Information

```gherkin
Feature: Edit Context Information
  As a developer
  I want to edit existing contexts
  So that I can keep context information up to date

  Scenario: Edit context with active session
    Given I have an active design session
    And I am viewing a context
    When I want to edit the context
    Then I should be able to click "Edit" button
    And I should be able to modify the context ID
    And I should be able to change the context category
    And I should be able to edit the context name
    And I should be able to edit the context description
    And I should be able to toggle the global context checkbox
    And I should be able to save changes
    And I should see a success message

  Scenario: Edit context without active session
    Given I do not have an active session
    When I try to edit a context
    Then I should see that editing is disabled
    And I should see a message that an active session is required
    And I should be able to start a session from this prompt

  Scenario: Cancel editing
    Given I am editing a context
    When I want to cancel my changes
    Then I should be able to click "Cancel" button
    And I should be prompted to confirm cancellation
    And my changes should be discarded
    And I should return to the context detail view

  Scenario: Mark context as global
    Given I am editing a context
    And I want this context to be included in all distillation prompts
    When I check the "Global Context" checkbox
    And I save the context
    Then the context should have global: true in its frontmatter
    And the context should appear in all future distillation prompts
    And I should see a help text explaining what global means

  Scenario: Unmark context as global
    Given I am editing a context
    And the context is currently marked as global
    When I uncheck the "Global Context" checkbox
    And I save the context
    Then the context should not have global: true in its frontmatter
    And the context should no longer appear automatically in distillation prompts
```

## Feature: Context Content Editing

```gherkin
Feature: Context Content Editing
  As a developer
  I want to edit the detailed content of contexts
  So that I can provide comprehensive context information

  Scenario: Edit context sections
    Given I am editing a context
    When I want to modify context content
    Then I should be able to edit the Overview section
    And I should be able to edit the Usage section
    And I should be able to edit the Guidance section
    And I should be able to edit the Notes section
    And I should be able to add new sections if needed

  Scenario: Edit Gherkin usage scenarios
    Given I am editing a context
    When I want to modify usage scenarios
    Then I should be able to edit existing scenarios
    And I should be able to add new scenarios
    And I should be able to delete scenarios
    And I should see syntax highlighting for Gherkin
    And I should be able to validate Gherkin syntax

  Scenario: Use markdown formatting
    Given I am editing context content
    When I want to format the text
    Then I should be able to use markdown formatting
    And I should see a preview of the formatted text
    And I should be able to toggle between edit and preview modes
    And the formatting should be preserved when saving

  Scenario: Validate context content
    Given I am editing a context
    When I try to save with incomplete information
    Then I should see warnings for missing sections
    And I should be able to save anyway if desired
    And I should see suggestions for improving the context definition
```

## Feature: Context Management Actions

```gherkin
Feature: Context Management Actions
  As a developer
  I want to perform management actions on contexts
  So that I can organize and maintain my context definitions

  Scenario: Duplicate context
    Given I am viewing a context
    When I want to create a similar context
    Then I should be able to click "Duplicate" button
    And a new context should be created with the same content
    And the new context should have a modified ID to avoid conflicts
    And I should be taken to edit the new context

  Scenario: Move context to different folder
    Given I am viewing a context
    When I want to move it to a different folder
    Then I should be able to click "Move" button
    And I should be able to select the target folder
    And the context should be moved to the new location
    And the contexts list should be updated

  Scenario: Rename context file
    Given I am viewing a context
    When I want to rename the context file
    Then I should be able to click "Rename" button
    And I should be able to enter a new name
    And the file should be renamed
    And the context ID should be updated to match
    And I should see a confirmation of the rename
```
