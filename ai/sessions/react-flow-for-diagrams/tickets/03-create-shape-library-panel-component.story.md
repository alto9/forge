---
story_id: create-shape-library-panel-component
session_id: react-flow-for-diagrams
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
diagram_id: [react-flow-editor-architecture]
status: completed
priority: high
estimated_minutes: 30
---

# Create ShapeLibraryPanel Component with VSCode Styling

## Objective
Create the ShapeLibraryPanel component that displays categorized shapes (General, AWS) with collapsible sections, using VSCode CSS variables for consistent theming.

## Context
The shape library panel provides drag-and-drop shapes for building diagrams. It must match VSCode's theme system using CSS variables to ensure consistent appearance with other Studio panels like Sidebar.

## Implementation Steps
1. Create new file `packages/vscode-extension/src/webview/studio/components/ShapeLibraryPanel.tsx`
2. Define `ShapeItem` interface with: id, name, icon (optional), category ('general' | 'aws'), type
3. Define shape arrays:
   - `GENERAL_SHAPES`: Rectangle, Circle, Ellipse, Text
   - `AWS_SHAPES`: Lambda, S3, DynamoDB, API Gateway, EC2, RDS, CloudFront
   - `CONTAINER_SHAPES`: VPC, Subnet, General Group (categorized appropriately)
4. Create `ShapeLibraryPanel` component with `onDragStart` prop
5. Use `useState` to manage expanded categories (default: both expanded)
6. Implement `toggleCategory` function
7. Create `CategorySection` component with:
   - VSCode-styled header using CSS variables
   - Collapsible/expandable functionality
   - Proper hover states using `var(--vscode-list-hoverBackground)`
8. Create `ShapeItem` component with:
   - Draggable functionality
   - VSCode styling using CSS variables
   - Icon display (if provided)
   - Proper hover states
9. Style panel container with:
   - `var(--vscode-sideBar-background)` for background
   - `var(--vscode-panel-border)` for borders
   - `var(--vscode-foreground)` for text
   - Width: 250px, proper padding and overflow
10. Reference `Sidebar.tsx` for VSCode styling patterns

## Files Affected
- `packages/vscode-extension/src/webview/studio/components/ShapeLibraryPanel.tsx` - New component file

## Acceptance Criteria
- [ ] Component displays General and AWS categories
- [ ] Categories are collapsible/expandable
- [ ] All shape items are displayed in their respective categories
- [ ] Shape items are draggable
- [ ] Component uses VSCode CSS variables for all styling
- [ ] Component matches appearance of other Studio panels
- [ ] Component adapts to light and dark themes automatically
- [ ] Hover states use `var(--vscode-list-hoverBackground)`
- [ ] Borders use `var(--vscode-panel-border)`
- [ ] Text uses `var(--vscode-foreground)`

## Dependencies
- None (can be developed in parallel with ReactFlowDiagramEditor)

