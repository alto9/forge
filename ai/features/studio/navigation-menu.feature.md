---
feature_id: navigation-menu
name: Navigation Menu Structure
description: Clear visual separation between foundational and session-locked sections in Forge Studio
spec_id: [forge-studio-implementation]
context_id: [theme, vsce]
---

# Navigation Menu Structure

## Feature: Navigation Menu Organization

```gherkin
Feature: Navigation Menu Organization
  As a developer
  I want a clear menu structure in Forge Studio
  So that I understand which items require sessions and which don't

  Scenario: View navigation menu sections
    Given I have opened Forge Studio
    When I view the left navigation sidebar
    Then I should see two clearly separated sections
    And the first section should be labeled "Foundational"
    And the second section should be labeled "Design"

  Scenario: Foundational section contents
    Given I am viewing the navigation menu
    When I look at the Foundational section
    Then I should see "Actors" navigation item
    And I should see "Contexts" navigation item
    And I should see "Sessions" navigation item
    And these items should be accessible at all times
    And these items should not show session-required badges

  Scenario: Design section contents
    Given I am viewing the navigation menu
    When I look at the Design section
    Then I should see "Features" navigation item
    And I should see "Specs" navigation item
    And these items should show visual indicators if no session is active
    And these items should be clearly marked as requiring sessions

  Scenario: Visual separation between sections
    Given I am viewing the navigation menu
    When I look at the layout
    Then I should see a visual divider between Foundational and Design sections
    And the divider could be a horizontal line or spacing
    And section headers should use subtle typography to indicate grouping
    And the separation should be clear but not overly prominent
```

## Feature: Session State Indicators in Menu

```gherkin
Feature: Session State Indicators in Menu
  As a developer
  I want to see session state in the navigation menu
  So that I know which items are currently accessible

  Scenario: Navigation without active session
    Given I do not have an active session
    When I view the navigation menu
    Then Actors, Contexts, and Sessions should appear fully enabled
    And Features and Specs should appear with subtle disabled styling
    And Features and Specs should show a lock icon or session-required indicator
    And hovering over Features or Specs should show tooltip "Active session required"

  Scenario: Navigation with active session
    Given I have an active design session
    When I view the navigation menu
    Then all navigation items should appear fully enabled
    And no lock icons should be visible
    And all sections should be clickable
    And the active page should be highlighted in the menu

  Scenario: Click locked navigation item
    Given I do not have an active session
    When I click on "Features" or "Specs" in the navigation
    Then I should be taken to a view showing "Active session required"
    And I should see a message explaining why the content is locked
    And I should see a "Start New Session" button prominently displayed
    And I should be able to start a session directly from this prompt
```

## Feature: Navigation Menu Tooltips

```gherkin
Feature: Navigation Menu Tooltips
  As a developer
  I want helpful tooltips in the navigation
  So that I understand the purpose of each section

  Scenario: Hover over Actors
    Given I am viewing the navigation menu
    When I hover over the "Actors" item
    Then I should see a tooltip explaining "Define system actors and personas"
    And the tooltip should indicate "Always editable"

  Scenario: Hover over Contexts
    Given I am viewing the navigation menu
    When I hover over the "Contexts" item
    Then I should see a tooltip explaining "Provide technical guidance and context"
    And the tooltip should indicate "Always editable"

  Scenario: Hover over Sessions
    Given I am viewing the navigation menu
    When I hover over the "Sessions" item
    Then I should see a tooltip explaining "Manage design sessions"
    And the tooltip should indicate "Create and manage at any time"

  Scenario: Hover over Features
    Given I am viewing the navigation menu
    When I hover over the "Features" item
    Then I should see a tooltip explaining "Define user-facing functionality"
    And if no session is active, the tooltip should indicate "Requires active session"
    And if a session is active, the tooltip should not show session requirement

  Scenario: Hover over Specs
    Given I am viewing the navigation menu
    When I hover over the "Specs" item
    Then I should see a tooltip explaining "Define technical specifications"
    And if no session is active, the tooltip should indicate "Requires active session"
    And if a session is active, the tooltip should not show session requirement
```

## Feature: Navigation Menu Visual Design

```gherkin
Feature: Navigation Menu Visual Design
  As a developer
  I want an intuitive visual design in the navigation
  So that I can quickly understand the menu structure

  Scenario: Section header styling
    Given I am viewing the navigation menu
    When I look at section headers
    Then "Foundational" header should use subtle, uppercase text
    And "Design" header should use the same styling for consistency
    And headers should use a muted color from the VSCode theme
    And headers should have appropriate spacing above and below

  Scenario: Navigation item styling
    Given I am viewing the navigation menu
    When I look at navigation items
    Then each item should have an icon representing its type
    And icons should use VSCode theme colors
    And active items should have a highlight background
    And hover states should show a subtle background change
    And disabled items should have reduced opacity

  Scenario: Responsive menu layout
    Given I am viewing the navigation menu
    When the Studio panel is resized
    Then the menu should remain fully visible
    And section headers should not wrap or truncate
    And navigation item labels should remain readable
    And icons should scale appropriately
```

