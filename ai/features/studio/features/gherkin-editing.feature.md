---
feature_id: gherkin-editing
name: Structured Gherkin Editing
description: Visual structured editor for Gherkin scenarios in feature files
spec_id: [gherkin-parser, gherkin-ui]
model_id: [feature]
---

# Structured Gherkin Editing

## Feature: Gherkin Parser

```gherkin
Feature: Parse Gherkin from Feature Files
  As a developer
  I want Gherkin to be parsed into structured data
  So that I can edit it visually with form controls

  Scenario: Parse Gherkin code blocks
    Given a feature file contains ```gherkin code blocks
    When the file is opened in Studio
    Then the Gherkin should be extracted from code blocks
    And parsed into Background, Rules, and Scenarios
    And each scenario should be parsed into steps
    And each step should have a keyword (Given/When/Then/And/But) and text

  Scenario: Handle Background section
    Given a Gherkin block contains a Background section
    When the parser processes it
    Then the background steps should be extracted
    And stored separately from scenarios
    And displayed in a Background section in the UI

  Scenario: Handle Rules with Examples
    Given a Gherkin block contains Rule sections
    When the parser processes it
    Then each Rule should be extracted with its title
    And each Rule's Examples should be parsed as scenarios
    And Rules should be displayed as collapsible sections

  Scenario: Handle standalone Scenarios
    Given a Gherkin block contains Scenario sections
    When the parser processes it
    Then each Scenario should be extracted with its title
    And each Scenario's steps should be parsed
    And Scenarios should be displayed as collapsible sections

  Scenario: Preserve non-Gherkin content
    Given a feature file contains markdown outside Gherkin blocks
    When the parser processes it
    Then non-Gherkin content should be preserved
    And stored separately from structured Gherkin
    And displayed in appropriate sections
```

## Feature: Gherkin Editor UI

```gherkin
Feature: Visual Gherkin Editor
  As a developer
  I want to edit Gherkin scenarios visually
  So that I can maintain proper structure without manual formatting

  Scenario: Edit Background steps
    Given I have opened a feature file with a Background
    When I view the Background section
    Then I should see each step as an editable row
    And each row should have a keyword dropdown
    And each row should have a text input
    And I should see up/down buttons to reorder steps
    And I should see a delete button for each step
    And I should see an "Add Background Step" button

  Scenario: Edit Scenarios
    Given I have opened a feature file with Scenarios
    When I view the Scenarios section
    Then I should see each Scenario as a collapsible card
    And I should be able to expand/collapse scenarios
    And I should be able to edit the scenario title
    And I should be able to add/remove/reorder steps
    And I should see an "Add Scenario" button

  Scenario: Edit Rules with Examples
    Given I have opened a feature file with Rules
    When I view the Rules section
    Then I should see each Rule as a collapsible card
    And I should be able to expand/collapse rules
    And I should be able to edit the rule title
    And I should see nested Examples within each Rule
    And I should be able to add/remove Examples
    And I should be able to edit each Example's steps
    And I should see an "Add Rule" button

  Scenario: Step keyword selection
    Given I am editing a Gherkin step
    When I click the keyword dropdown
    Then I should see options: Given, When, Then, And, But
    And I should be able to select any keyword
    And the step should update immediately

  Scenario: Reorder steps
    Given I am editing a scenario with multiple steps
    When I click the up button on a step
    Then the step should move up one position
    When I click the down button on a step
    Then the step should move down one position
    And the first step should have up button disabled
    And the last step should have down button disabled

  Scenario: Delete steps
    Given I am editing a scenario with steps
    When I click the delete button on a step
    Then the step should be removed immediately
    And the remaining steps should reorder
    And the scenario should update
```

## Feature: Gherkin Serialization

```gherkin
Feature: Serialize Gherkin Back to Markdown
  As a developer
  I want my visual edits to be saved as proper Gherkin
  So that the files remain valid and readable

  Scenario: Serialize Background
    Given I have edited Background steps
    When I save the file
    Then the Background should be serialized as:
      """
      ```gherkin
      Background:
        Given step one
        When step two
      ```
      """

  Scenario: Serialize Scenarios
    Given I have edited Scenarios
    When I save the file
    Then each Scenario should be serialized as:
      """
      ```gherkin
      Scenario: Title
        Given step one
        When step two
        Then step three
      ```
      """

  Scenario: Serialize Rules
    Given I have edited Rules with Examples
    When I save the file
    Then each Rule should be serialized as:
      """
      ```gherkin
      Rule: Title
        Example: First example
          Given step one
          Then step two
        
        Example: Second example
          Given step three
          Then step four
      ```
      """

  Scenario: Preserve proper indentation
    Given I have nested Gherkin structures
    When the content is serialized
    Then Background steps should have 2-space indent
    And Scenario steps should have 2-space indent
    And Rule content should have 2-space indent
    And Example titles should have 2-space indent
    And Example steps should have 4-space indent
```

## Feature: Read-Only Mode

```gherkin
Feature: Read-Only Gherkin Display
  As a developer
  I want to view Gherkin when no session is active
  So that I can read features without editing

  Scenario: Display read-only Gherkin
    Given I do not have an active session
    When I open a feature file
    Then Gherkin sections should be displayed
    But keyword dropdowns should be replaced with labels
    And text inputs should be replaced with plain text
    And add/remove/reorder buttons should be hidden
    And I should see a message to start a session to edit

  Scenario: Styled read-only display
    Given I am viewing Gherkin in read-only mode
    Then keywords should be highlighted in blue
    And steps should be in a card layout
    And the display should be compact and readable
```

## Feature: Gherkin Validation

```gherkin
Feature: Validate Gherkin Structure
  As a developer
  I want invalid Gherkin to be prevented
  So that files remain valid

  Scenario: Require scenario titles
    Given I am creating a new scenario
    When I try to save without a title
    Then the title field should show validation error
    And save should be prevented

  Scenario: Require step text
    Given I am adding a new step
    When the step text is empty
    Then the step should show as incomplete
    And I should be prompted to add text

  Scenario: Prevent empty sections
    Given I have a scenario with no steps
    When I view it
    Then I should see a message "No steps in this scenario"
    And I should be prompted to add steps
```

## Feature: Gherkin Component Architecture

```gherkin
Feature: Component Structure
  As a developer
  I want modular Gherkin components
  So that the editor is maintainable

  Scenario: Component hierarchy
    Given the Gherkin editor is implemented
    Then it should have these components:
      | BackgroundSection | Edit background steps |
      | RulesSection | Edit rules with examples |
      | ScenariosSection | Edit standalone scenarios |
      | ExampleScenario | Edit example within a rule |
      | GherkinStepRow | Edit individual step |
    And each component should handle its own state
    And components should communicate via callbacks

  Scenario: GherkinStepRow component
    Given the GherkinStepRow component
    Then it should accept props:
      | step | The step data |
      | index | Position in list |
      | totalSteps | Total step count |
      | readOnly | Whether editing is allowed |
      | onUpdate | Callback for changes |
      | onMoveUp | Callback for reorder up |
      | onMoveDown | Callback for reorder down |
      | onDelete | Callback for deletion |
    And it should render differently in read-only mode
    And it should handle keyboard navigation
```

