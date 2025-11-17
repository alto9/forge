---
story_id: implement-navigation-menu-reorganization
session_id: main-menu-v2
feature_id: [navigation-menu]
spec_id: [navigation-menu-implementation]
diagram_id: [navigation-menu-structure, navigation-session-state]
status: completed
priority: high
estimated_minutes: 90
---

## Objective

Implement the reorganized Forge Studio navigation menu with :INFORM: and :DESIGN: sections to clearly separate foundational reference materials from active design work.

## Context

The current Forge Studio navigation doesn't clearly communicate the workflow distinction between always-accessible reference materials (Actors, Contexts, Diagrams, Specifications) and session-dependent design work (Sessions, Features). The new organization creates two distinct sections with appropriate visual separation and session-aware behavior.

## Implementation Steps

1. **Create NavSection Component**
   - Implement NavSection component with section header styling
   - Support both :INFORM: and :DESIGN: section types
   - Handle different item configurations per section

2. **Update NavItem Component**
   - Add session-dependent disabled state logic
   - Implement lock icons for disabled items
   - Add tooltips explaining session requirements
   - Update styling for disabled state (reduced opacity)

3. **Create SessionRequiredView Component**
   - Implement the session-locked view for Features
   - Add proper styling matching VSCode theme
   - Include explanatory text and Start Session button

4. **Update Sidebar Component**
   - Restructure navigation items into :INFORM: and :DESIGN: sections
   - Remove always-accessible items from session dependency logic
   - Add section headers with proper styling

5. **Update App Component Integration**
   - Modify navigation handling to respect session requirements
   - Add session-locked view routing for Features
   - Update session state management

6. **Update Styling**
   - Add CSS for section headers and separators
   - Implement disabled state visual indicators
   - Ensure VSCode theme compatibility

## Files Affected

- `packages/vscode-extension/src/webview/studio/components/Sidebar.tsx` - Main navigation component
- `packages/vscode-extension/src/webview/studio/components/NavItem.tsx` - Navigation item component
- `packages/vscode-extension/src/webview/studio/components/NavSection.tsx` - New section component
- `packages/vscode-extension/src/webview/studio/components/SessionRequiredView.tsx` - New session-locked view
- `packages/vscode-extension/src/webview/studio/App.tsx` - Main app component updates
- `packages/vscode-extension/src/webview/studio/styles/sidebar.css` - Updated styling

## Acceptance Criteria

- [ ] Navigation menu shows :INFORM: section with Actors, Contexts, Diagrams, Specifications (all always accessible)
- [ ] Navigation menu shows :DESIGN: section with Sessions, Features (Sessions always accessible, Features session-dependent)
- [ ] Without active session, Features show lock icon and reduced opacity
- [ ] Clicking Features without session shows SessionRequiredView with explanatory message
- [ ] With active session, Features are fully enabled and accessible
- [ ] Tooltips explain the purpose and requirements of each navigation item
- [ ] Visual section headers clearly distinguish :INFORM: and :DESIGN: areas
- [ ] All navigation items maintain existing functionality and routing
- [ ] Session state changes immediately update navigation appearance

## Dependencies

None - this is the core implementation work for the navigation reorganization.
