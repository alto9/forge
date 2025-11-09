---
feature_id: context-creation
name: Context Creation
description: User experience for creating new contexts in Forge Studio
spec_id: [context-creation-ui, context-templates]
model_id: [context-creation, studio-state]
context_id: [theme, vsce]
---

# Context Creation

## Feature: Create New Context

```gherkin
Feature: Create New Context
  As a developer
  I want to create new contexts for my system
  So that I can provide technical guidance for specific areas

  Scenario: Create context with active session
    Given I have an active design session
    And I am in the Contexts section
    When I want to create a new context
    Then I should be able to click "New Context" button
    And I should be prompted for context name
    And I should be able to select context category
    And I should be able to enter context description
    And I should be able to save the context
    And the context should be created with proper template
    And I should be taken to edit the new context

  Scenario: Create context without active session
    Given I do not have an active session
    When I try to create a new context
    Then I should see that creation is disabled
    And I should see a message to start a session first
    And I should be able to start a session from this prompt

  Scenario: Create context in specific folder
    Given I have an active session
    And I have selected a subfolder in the contexts list
    When I want to create a new context
    Then I should be able to click "New Context" button
    And the new context should be created in the selected folder
    And I should be prompted for context details
    And the context should be saved in the correct location
```

## Feature: Context Creation Form

```gherkin
Feature: Context Creation Form
  As a developer
  I want a guided form for creating contexts
  So that I can provide complete context information

  Scenario: Fill context creation form
    Given I am creating a new context
    When I fill out the context creation form
    Then I should be able to enter context ID (auto-generated from name)
    And I should be able to select context category
    And I should be able to enter context name
    And I should be able to enter context description
    And I should see validation for required fields
    And I should be able to save or cancel

  Scenario: Validate context creation form
    Given I am filling out the context creation form
    When I try to save with missing required fields
    Then I should see validation errors
    And I should not be able to save until errors are fixed
    And I should see which fields are required

  Scenario: Auto-generate context ID
    Given I am creating a new context
    When I enter the context name
    Then the context ID should be auto-generated in kebab-case
    And I should be able to modify the context ID if needed
    And the context ID should be validated for uniqueness
```

## Feature: Context Template

```gherkin
Feature: Context Template
  As a developer
  I want a proper template for new contexts
  So that I can structure context information consistently

  Scenario: Apply context template
    Given I am creating a new context
    When the context is created
    Then it should have proper frontmatter with context_id and category
    And it should have template content with sections for:
      - Overview
      - Usage (with Gherkin scenarios)
      - Guidance
      - Notes
    And the template should include helpful placeholder text
    And I should be able to edit all sections

  Scenario: Gherkin scenario template for usage
    Given I am creating a new context
    When the context template is applied
    Then it should include a Gherkin scenario template for usage with:
      - Scenario description
      - Given/When/Then steps for when to use the context
    And the Gherkin should be in proper code blocks
    And I should be able to add multiple usage scenarios
```
