---
session_id: react-flow-for-diagrams
start_time: '2025-11-27T14:57:06.134Z'
status: completed
problem_statement: >-
  Replace nomnoml with JSON-based diagram format using react-flow. Remove
  Code/Render toggle, add shape library panel with categories (General, AWS),
  enable drag-and-drop, support AWS service icons, and add container grouping
  (VPC, Subnet, General Group).
changed_files:
  - path: ai/features/studio/editors/react-flow-diagram-editor.feature.md
    change_type: added
    scenarios_added:
      - Diagram editor layout
      - Shape library categories
      - Drag shape from library to diagram
      - General category shapes
      - AWS category shapes
      - Container shapes for grouping
      - Add components to containers
      - Render diagram from JSON
      - Build diagram interactively
      - Save diagram
      - Diagram profile actions
      - No Code/Render toggle
      - VPC container
      - Subnet container
      - General Group container
      - Container nesting
      - AWS icon display
      - AWS icon library
      - Read-only diagram display
      - Diagram JSON structure
      - Load diagram from JSON
      - Shape library VSCode styling
  - path: ai/features/studio/specs/spec-creation.feature.md
    change_type: modified
    scenarios_added:
      - Diagram references in specs
    scenarios_modified:
      - Apply spec template
    scenarios_removed:
      - Nomnoml diagram template
  - path: ai/features/studio/specs/spec-editing.feature.md
    change_type: modified
    scenarios_added:
      - Edit diagram references
    scenarios_removed:
      - Edit Nomnoml diagrams
  - path: ai/features/studio/specs/spec-detail-view.feature.md
    change_type: modified
    scenarios_modified:
      - Edit spec with active session
      - Display spec information
  - path: ai/features/studio/sessions/session-status-workflow.feature.md
    change_type: modified
    scenarios_modified:
      - Design status capabilities
start_commit: 045320a467ebd36b5c527a4e88730581db5e75d7
end_time: '2025-11-27T15:09:41.072Z'
---
## Problem Statement

Replace nomnoml diagram format with a JSON-based diagram format that renders with react-flow. The new editor should:
- Remove the Code/Render toggle (always visual)
- Provide a shape library panel on the left with categories (General, AWS)
- Enable drag-and-drop from library to diagram canvas
- Support AWS service icons
- Support container grouping (VPC, Subnet, General Group)
- Allow render, build, and save from diagram profile

## Goals

1. Replace nomnoml with react-flow for diagram rendering and editing
2. Implement visual drag-and-drop diagram editor
3. Create shape library with categorized shapes (General, AWS)
4. Support AWS service icons in diagrams
5. Implement container functionality for grouping components
6. Remove Code/Render toggle - always show visual editor when session is active
7. Store diagrams as JSON in markdown files
8. Enable save functionality from diagram profile

## Approach

1. **Feature Definition**: Created comprehensive feature file with Gherkin scenarios covering all user interactions
2. **Technical Specification**: Created detailed spec file with implementation details, component structure, and code examples
3. **Architecture Diagram**: Created diagram showing component structure and data flow
4. **No Migration Needed**: Users haven't started using this feature, so we can replace nomnoml directly

## Key Decisions

1. **Format Change**: Diagrams will use JSON format stored in markdown code blocks instead of nomnoml syntax
2. **Toggle Removal**: Code/Render toggle is completely removed - diagrams are always visual in edit mode, always rendered in read-only mode
3. **Shape Library**: Two initial categories (General, AWS) with expandable sections
4. **VSCode Styling**: Shape library panel must follow VSCode styling conventions using VSCode CSS variables for consistent theming with other Studio panels
5. **Container Support**: Three container types - VPC, Subnet, and General Group - with nesting capability
6. **AWS Icons**: Use official AWS service icons for AWS category shapes
7. **React Flow**: Use react-flow library for diagram rendering and interaction

## Notes

- No migration strategy needed - users haven't started using diagrams yet
- Container implementation uses custom node types with position-based containment detection
- AWS icons can be sourced from official AWS icon library or custom SVG assets
- JSON format follows react-flow's node/edge structure
- Save functionality integrates with existing ItemProfile save mechanism
- Shape library panel styling must match VSCode theme variables (see Sidebar.tsx for reference implementation)
