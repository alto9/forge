---
session_id: main-menu-v2
start_time: '2025-11-17T01:54:14.448Z'
status: completed
problem_statement: >-
  Reorganize the Forge Studio main menu to better reflect the workflow -
  :INFORM: section for foundational/reference materials and :DESIGN: section for
  active design work
changed_files:
  - path: ai/features/studio/navigation-menu.feature.md
    change_type: added
    scenarios_added:
      - View dashboard as primary entry point
      - Access INFORM section for foundational materials
      - Access DESIGN section for active design work
      - Understand section purposes through visual design
      - Navigate to always-accessible items without session
      - Navigate to Sessions without active session
      - Attempt to access Features without session
      - Access Features with active session
      - Visual indicators for session requirements
      - Follow INFORM then DESIGN workflow
      - Use foundational materials during design
      - Understand session boundaries
      - Update navigation when session starts
      - Update navigation when session ends
      - Maintain navigation consistency
    scenarios_modified: []
    scenarios_removed: []
  - path: ai/diagrams/studio/navigation-menu-structure.diagram.md
    change_type: modified
    scenarios_added: []
    scenarios_modified: []
    scenarios_removed: []
  - path: ai/specs/studio/navigation-menu-implementation.spec.md
    change_type: modified
    scenarios_added: []
    scenarios_modified: []
    scenarios_removed: []
start_commit: 6ea9125a38f44f902d30f471fd83913353022876
end_time: '2025-11-17T02:12:39.419Z'
---
## Problem Statement

The current Forge Studio navigation menu doesn't clearly communicate the workflow distinction between foundational materials (Actors, Contexts, Diagrams, Specs) that inform design decisions and active design work (Sessions, Features) that requires structured session management. The menu should be reorganized to make this distinction obvious and guide users through the proper workflow.

## Goals

1. **Clarify Workflow Distinction**: Make it obvious which navigation items are for reference (always accessible) vs design work (session-dependent)
2. **Improve User Experience**: Organize navigation to match the mental model of "inform then design"
3. **Maintain Consistency**: Ensure the new organization aligns with existing Forge principles and session-driven workflow
4. **Preserve Functionality**: All existing navigation should continue to work, just reorganized
5. **Update Documentation**: Ensure all related specs, diagrams, and features reflect the new organization

## Approach

1. **Define New Menu Structure**:
   - Dashboard (always accessible)
   - :INFORM: Actors, Contexts, Diagrams, Specifications (always accessible)
   - :DESIGN: Sessions, Features (Sessions always accessible, Features session-dependent)

2. **Update Documentation**:
   - Create navigation-menu feature file
   - Update navigation-menu-structure diagram
   - Update navigation-menu-implementation spec with new organization
   - Ensure session dependencies are correctly implemented

3. **Implementation Strategy**:
   - Keep existing technical implementation but reorganize the menu items
   - Update session state logic to reflect new dependencies (Features require session, Sessions don't)
   - Ensure backward compatibility with existing user workflows

## Key Decisions

1. **Menu Organization**: Moved Sessions from INFORM to DESIGN section since sessions are the foundation of design work, while keeping Features in DESIGN as session-dependent
2. **Always Accessible Items**: Actors, Contexts, Diagrams, and Specifications (Specs) are always accessible as they provide foundational information
3. **Session Dependencies**: Only Features require an active session; Sessions themselves are always accessible to allow starting new work
4. **Section Naming**: Used :INFORM: and :DESIGN: with colons to clearly distinguish sections as workflow phases

## Notes

- This reorganization better reflects the Forge workflow: first gather information (Actors, Contexts, Diagrams, Specs), then engage in structured design work (Sessions, Features)
- The new structure makes it clearer that Sessions are the entry point for design work, while Features are the output of that work
- Diagrams and Specifications moving to INFORM makes sense as they provide visual and technical reference information
- This change is primarily organizational and doesn't break existing functionality
