---
session_id: add-actors-to-diagram-library
start_time: '2025-12-07T21:24:43.158Z'
status: development
problem_statement: Add Actors to Diagram Library
changed_files:
  - path: ai/features/studio/editors/react-flow-diagram-editor.feature.md
    change_type: modified
    scenarios_added:
      - Actors section in shape library
      - Actor item display
      - Drag actor from library to diagram
      - Empty actors section
      - Actors from nested folders
      - Actor node visual appearance
      - Actor node connection handles
      - Actor node resizing
      - Actor node label editing
      - Actor node data structure
      - Actor node properties display
      - Actor node type badge
start_commit: f4f7f14be54f573762e2be1ae7637f901af77b0b
end_time: '2025-12-07T21:29:32.118Z'
---
## Problem Statement

Enhance the diagram editor in Forge Studio to support Actors as draggable items from the Shape Library. Actors can be added to diagrams as visual nodes to represent system actors. This implements GitHub Issue #3.

## Goals

1. Add an "Actors" section to the Shape Library panel that displays all actors from `ai/actors/`
2. Create an ActorNode component that displays actors with a silhouette-style icon
3. Support drag-and-drop of actors from the library to the diagram canvas
4. Integrate actor nodes with the Properties Panel for editing
5. Ensure actor nodes support connections and resizing like other node types

## Approach

### Implementation Strategy

1. **Extension Host Changes** - Add `getActors` message handler in `ForgeStudioPanel.ts` to scan `ai/actors/` recursively and return actor metadata
2. **Shape Library Enhancement** - Add Actors section between General Shapes and AWS Services with actor items displayed using silhouette icons
3. **New ActorNode Component** - Create dedicated node component with person silhouette icon, editable label, and connection handles on all sides
4. **Node Types Registry** - Register 'actor' node type in `nodeTypes.ts`
5. **DiagramEditor Update** - Handle actor-specific drop events to create actor nodes
6. **Properties Panel** - Detect actor nodes and display appropriate badge and properties

### File Changes Required

**Create:**
- `packages/vscode-extension/src/webview/studio/components/diagram/nodes/ActorNode.tsx`

**Modify:**
- `packages/vscode-extension/src/webview/studio/components/diagram/ShapeLibrary.tsx`
- `packages/vscode-extension/src/webview/studio/components/diagram/nodeTypes.ts`
- `packages/vscode-extension/src/webview/studio/components/diagram/DiagramEditor.tsx`
- `packages/vscode-extension/src/webview/studio/components/diagram/PropertiesPanel.tsx`
- `packages/vscode-extension/src/panels/ForgeStudioPanel.ts`

## Key Decisions

1. **Silhouette Style** - Actor nodes use a neutral gray silhouette icon to distinguish them from AWS (colored icons) and General shapes (geometric shapes)
2. **Section Placement** - Actors section appears between General Shapes and AWS Services in the library hierarchy
3. **Node Type** - Single 'actor' node type (not library-prefixed like 'general-' or 'aws-') since actors are a first-class concept
4. **Data Structure** - Actor nodes store `actor_id` to link back to the actor file, enabling future cross-referencing
5. **Nested Folder Support** - Actors from nested folders are loaded and displayed (respecting the ai/actors/ folder structure)

## Notes

- This enhancement aligns with Forge's goal of visually representing system architecture including the actors who interact with it
- Actor nodes can be connected to other nodes (AWS services, general shapes) to show interactions
- The actor_id linkage enables potential future features like clicking an actor node to view the actor definition
- Empty state handling ensures graceful behavior when no actors are defined
- Reference: [GitHub Issue #3](https://github.com/alto9/forge/issues/3)
