---
feature_id: react-flow-diagram-editor
name: React Flow Diagram Editor
description: Visual drag-and-drop diagram editor using react-flow to replace nomnoml with JSON-based diagram format
spec_id: [react-flow-diagram-implementation]
context_id: []
---

# React Flow Diagram Editor

## Feature: Visual Diagram Editor with Shape Library

```gherkin
Feature: Visual Diagram Editor with Shape Library
  As a developer
  I want to create diagrams using a visual drag-and-drop interface
  So that I can design system architecture without writing diagram code

  Scenario: Diagram editor layout
    Given I am viewing a diagram file in Studio
    When I have an active session
    Then I should see a shape library panel on the left
    And I should see a rendered diagram canvas on the right
    And I should NOT see a Code/Render toggle
    And the diagram should be rendered using react-flow

  Scenario: Shape library categories
    Given I am viewing a diagram file
    When I look at the shape library panel
    Then I should see categories for shapes
    And I should see a "General" category
    And I should see an "AWS" category
    And categories should be collapsible/expandable

  Scenario: Shape library VSCode styling
    Given I am viewing the shape library panel
    When I examine the panel appearance
    Then it should follow VSCode theme styling
    And it should use VSCode CSS variables for colors
    And it should match the appearance of other Studio panels
    And it should adapt to light and dark themes automatically
    And borders should use var(--vscode-panel-border)
    And background should use var(--vscode-sideBar-background)
    And text should use var(--vscode-foreground)
    And hover states should use var(--vscode-list-hoverBackground)

  Scenario: Drag shape from library to diagram
    Given I have a diagram open with an active session
    When I drag a shape from the library panel
    And drop it onto the diagram canvas
    Then a new element should be added to the diagram
    And the element should appear at the drop location
    And the diagram JSON should be updated

  Scenario: General category shapes
    Given I am viewing the General category in the shape library
    When I expand the category
    Then I should see general-purpose shapes
    And I should see shapes like Rectangle, Circle, Ellipse
    And I should see connector/arrow shapes
    And I should see text/label shapes

  Scenario: AWS category shapes
    Given I am viewing the AWS category in the shape library
    When I expand the category
    Then I should see AWS service icons
    And I should see services like Lambda, S3, DynamoDB, API Gateway
    And I should see EC2, RDS, CloudFront, and other AWS services
    And each service should display with its official AWS icon

  Scenario: Container shapes for grouping
    Given I am viewing the shape library
    When I look for container shapes
    Then I should see a "VPC" container shape
    And I should see a "Subnet" container shape
    And I should see a "General Group" container shape
    And containers should be draggable to the diagram

  Scenario: Add components to containers
    Given I have a container (VPC, Subnet, or General Group) on the diagram
    When I drag a component shape into the container
    Then the component should be added inside the container
    And the component should be visually contained within the container boundaries
    And the diagram JSON should reflect the parent-child relationship

  Scenario: Render diagram from JSON
    Given I have a diagram file with JSON diagram data
    When I open the diagram file
    Then the JSON should be parsed
    And the diagram should be rendered using react-flow
    And all nodes and edges should be displayed correctly
    And container relationships should be preserved

  Scenario: Build diagram interactively
    Given I have an active session
    And I am viewing a diagram file
    When I drag shapes onto the canvas
    And I connect nodes with edges
    And I group components in containers
    Then all changes should be reflected in real-time
    And the diagram JSON should be updated automatically

  Scenario: Save diagram
    Given I have made changes to a diagram
    When I click the "Save Changes" button in the diagram profile
    Then the diagram JSON should be saved to the file
    And the frontmatter should be preserved
    And the file should be tracked in the active session
    And the changes should be persisted to disk

  Scenario: Diagram profile actions
    Given I am viewing a diagram file profile
    When I have an active session
    Then I should see a "Save Changes" button
    And I should see a "Cancel" button
    And I should be able to render the diagram
    And I should be able to build the diagram interactively
    And I should be able to save the diagram

  Scenario: No Code/Render toggle
    Given I am viewing a diagram file
    When I look at the diagram interface
    Then I should NOT see a "Code" toggle button
    And I should NOT see a "Render" toggle button
    And the diagram should always be in visual editing mode when session is active
    And the diagram should always be rendered when session is not active
```

## Feature: Container Functionality

```gherkin
Feature: Container Grouping for Diagram Organization
  As a developer
  I want to group diagram elements in containers
  So that I can organize complex architectures visually

  Scenario: VPC container
    Given I have a VPC container on the diagram
    When I drag AWS services into the VPC
    Then the services should be visually contained within the VPC boundaries
    And the VPC should show a label
    And the container should resize to fit its contents

  Scenario: Subnet container
    Given I have a Subnet container on the diagram
    When I drag components into the Subnet
    Then the components should be nested within the Subnet
    And the Subnet should be visually distinct from VPC
    And I should be able to nest Subnets within VPCs

  Scenario: General Group container
    Given I have a General Group container on the diagram
    When I drag any components into the General Group
    Then the components should be grouped together
    And the group should have a customizable label
    And the group should provide visual organization

  Scenario: Container nesting
    Given I have a VPC container on the diagram
    When I drag a Subnet container into the VPC
    Then the Subnet should be nested within the VPC
    And components in the Subnet should be nested within both containers
    And the hierarchy should be preserved in the JSON structure
```

## Feature: AWS Service Icons

```gherkin
Feature: AWS Service Icons in Diagram Editor
  As a developer
  I want to use official AWS service icons in diagrams
  So that my architecture diagrams are recognizable and professional

  Scenario: AWS icon display
    Given I drag an AWS service from the library
    When the service is added to the diagram
    Then it should display with the official AWS service icon
    And the icon should be properly sized
    And the service name should be visible

  Scenario: AWS icon library
    Given I am viewing the AWS category
    When I see the available services
    Then each service should show its icon in the library
    And the icons should match AWS official branding
    And the icons should be clear and recognizable
```

## Feature: Read-Only Diagram View

```gherkin
Feature: Read-Only Rendered Diagram Display
  As a developer
  I want to view diagrams as rendered visuals when no session is active
  So that I can review architecture without editing

  Scenario: Read-only diagram display
    Given I do not have an active session
    When I view a diagram file
    Then the diagram should be rendered using react-flow
    And the diagram should NOT be editable
    And I should NOT see the shape library panel
    And I should see a message to start a session to edit
    And all nodes, edges, and containers should be displayed correctly
```

## Feature: JSON Diagram Format

```gherkin
Feature: JSON-Based Diagram Storage
  As a developer
  I want diagrams stored as JSON
  So that they can be programmatically processed and version-controlled

  Scenario: Diagram JSON structure
    Given I create a diagram with nodes and edges
    When the diagram is saved
    Then it should be stored as JSON in the diagram file
    And the JSON should follow react-flow node/edge format
    And the JSON should include container/group relationships
    And the frontmatter should be preserved separately

  Scenario: Load diagram from JSON
    Given a diagram file contains JSON diagram data
    When I open the diagram file
    Then the JSON should be parsed correctly
    And all nodes should be restored with their positions
    And all edges should be restored with their connections
    And all containers should be restored with their nested elements
```

