---
feature_id: feature-creation
name: Feature Creation
description: User experience for creating new features in Forge Studio
spec_id: [feature-creation-ui, feature-templates]
model_id: [feature-creation, studio-state]
---

# Feature Creation

## Feature: Create New Feature

```gherkin
Feature: Create New Feature
  As a developer
  I want to create new features for my system
  So that I can document what functionality my application provides

  Scenario: Create feature with active session
    Given I have an active design session
    And I am in the Features section
    When I want to create a new feature
    Then I should be able to click "New Feature" button
    And I should be prompted for feature name
    And I should be able to enter feature description
    And I should be able to link to spec IDs
    And I should be able to link to model IDs
    And I should be able to link to context IDs
    And I should be able to save the feature
    And the feature should be created with proper template
    And I should be taken to edit the new feature

  Scenario: Create feature without active session
    Given I do not have an active session
    When I try to create a new feature
    Then I should see that creation is disabled
    And I should see a message to start a session first
    And I should be able to start a session from this prompt

  Scenario: Create feature in specific folder
    Given I have an active session
    And I have selected a subfolder in the features list
    When I want to create a new feature
    Then I should be able to click "New Feature" button
    And the new feature should be created in the selected folder
    And I should be prompted for feature details
    And the feature should be saved in the correct location
```

## Feature: Feature Creation Form

```gherkin
Feature: Feature Creation Form
  As a developer
  I want a guided form for creating features
  So that I can provide complete feature information

  Scenario: Fill feature creation form
    Given I am creating a new feature
    When I fill out the feature creation form
    Then I should be able to enter feature ID (auto-generated from name)
    And I should be able to enter feature name
    And I should be able to enter feature description
    And I should be able to link to existing specs
    And I should be able to link to existing models
    And I should be able to link to existing contexts
    And I should see validation for required fields
    And I should be able to save or cancel

  Scenario: Validate feature creation form
    Given I am filling out the feature creation form
    When I try to save with missing required fields
    Then I should see validation errors
    And I should not be able to save until errors are fixed
    And I should see which fields are required

  Scenario: Auto-generate feature ID
    Given I am creating a new feature
    When I enter the feature name
    Then the feature ID should be auto-generated in kebab-case
    And I should be able to modify the feature ID if needed
    And the feature ID should be validated for uniqueness
```

## Feature: Feature Template

```gherkin
Feature: Feature Template
  As a developer
  I want a proper template for new features
  So that I can structure feature information consistently

  Scenario: Apply feature template
    Given I am creating a new feature
    When the feature is created
    Then it should have proper frontmatter with feature_id, spec_id, model_id, context_id
    And it should have template content with sections for:
      - Overview
      - Behavior (with Gherkin scenarios)
      - Notes
    And the template should include helpful placeholder text
    And I should be able to edit all sections

  Scenario: Gherkin scenario template
    Given I am creating a new feature
    When the feature template is applied
    Then it should include a Gherkin scenario template with:
      - Feature description
      - Scenario outline
      - Given/When/Then steps
    And the Gherkin should be in proper code blocks
    And I should be able to add multiple scenarios
```
