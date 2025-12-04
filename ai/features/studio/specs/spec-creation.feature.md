---
feature_id: spec-creation
name: Spec Creation
description: User experience for creating new specs in Forge Studio
spec_id: [spec-creation-ui, spec-templates]
model_id: [spec-creation, studio-state]
---

# Spec Creation

## Feature: Create New Spec

```gherkin
Feature: Create New Spec
  As a developer
  I want to create new specs for my system
  So that I can document technical implementation requirements

  Scenario: Create spec with active session
    Given I have an active design session
    And I am in the Specs section
    When I want to create a new spec
    Then I should be able to click "New Spec" button
    And I should be prompted for spec name
    And I should be able to enter spec description
    And I should be able to link to feature IDs
    And I should be able to link to model IDs
    And I should be able to link to context IDs
    And I should be able to save the spec
    And the spec should be created with proper template
    And I should be taken to edit the new spec

  Scenario: Create spec without active session
    Given I do not have an active session
    When I try to create a new spec
    Then I should see that creation is disabled
    And I should see a message to start a session first
    And I should be able to start a session from this prompt

  Scenario: Create spec in specific folder
    Given I have an active session
    And I have selected a subfolder in the specs list
    When I want to create a new spec
    Then I should be able to click "New Spec" button
    And the new spec should be created in the selected folder
    And I should be prompted for spec details
    And the spec should be saved in the correct location
```

## Feature: Spec Creation Form

```gherkin
Feature: Spec Creation Form
  As a developer
  I want a guided form for creating specs
  So that I can provide complete spec information

  Scenario: Fill spec creation form
    Given I am creating a new spec
    When I fill out the spec creation form
    Then I should be able to enter spec ID (auto-generated from name)
    And I should be able to enter spec name
    And I should be able to enter spec description
    And I should be able to link to existing features
    And I should be able to link to existing models
    And I should be able to link to existing contexts
    And I should see validation for required fields
    And I should be able to save or cancel

  Scenario: Validate spec creation form
    Given I am filling out the spec creation form
    When I try to save with missing required fields
    Then I should see validation errors
    And I should not be able to save until errors are fixed
    And I should see which fields are required

  Scenario: Auto-generate spec ID
    Given I am creating a new spec
    When I enter the spec name
    Then the spec ID should be auto-generated in kebab-case
    And I should be able to modify the spec ID if needed
    And the spec ID should be validated for uniqueness
```

## Feature: Spec Template

```gherkin
Feature: Spec Template
  As a developer
  I want a proper template for new specs
  So that I can structure spec information consistently

  Scenario: Apply spec template
    Given I am creating a new spec
    When the spec is created
    Then it should have proper frontmatter with spec_id, feature_id, model_id, context_id
    And it should have template content with sections for:
      - Overview
      - Architecture (with diagram references)
      - Implementation Details
      - Notes
    And the template should include helpful placeholder text
    And I should be able to edit all sections

  Scenario: Diagram references in specs
    Given I am creating a new spec
    When the spec template is applied
    Then it should reference diagram files for architecture visualization
    And diagrams should be created separately as diagram files
    And diagrams use react-flow JSON format
    And I should be able to link to existing diagram files
```
