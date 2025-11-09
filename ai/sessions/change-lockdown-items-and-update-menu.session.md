---
session_id: change-lockdown-items-and-update-menu
start_time: '2025-11-09T16:18:35.402Z'
status: awaiting_implementation
problem_statement: change lockdown items and update menu
changed_files:
  - ai/features/studio/flexible-editing-permissions.feature.md
  - ai/features/studio/organized-menu-structure.feature.md
  - ai/specs/studio/editing-permissions-implementation.spec.md
  - ai/specs/studio/menu-structure-implementation.spec.md
  - ai/features/studio/actors/actor-editing.feature.md
  - ai/features/studio/contexts/context-editing.feature.md
  - ai/features/studio/forge-studio.feature.md
  - ai/features/studio/sessions/session-management.feature.md
  - ai/specs/studio/forge-studio-implementation.spec.md
  - ai/features/studio/navigation-menu.feature.md
  - ai/specs/studio/navigation-menu-implementation.spec.md
  - ai/features/studio/actors/actor-creation.feature.md
  - ai/features/studio/contexts/context-creation.feature.md
end_time: '2025-11-09T16:37:47.642Z'
command_file: .cursor/commands/create-stories-change-lockdown-items-and-update-menu.md
---
## Problem Statement

change lockdown items and update menu

## Goals

permit develoeprs to update certain non feature-changing items outside of the context of a design session. This promotes developers defining these items initially and then generating features and specs within design sessions.

## Approach

allow editing of actors and contexts outside of a design session. they can be edited at all times. Features and specs are still locked behind a design session. Also update the menu on the left to show clear separation between 1 section that has Actors, Contexts, and Sessions, then a separate section with Features and Specifications.

## Key Decisions

1. **Foundational vs Design Files**: Actors and Contexts are classified as "foundational" files that developers define before starting design work. They provide vocabulary and guidance but are not design decisions themselves.

2. **Session Tracking Scope**: Only Features and Specs are tracked in session changed_files arrays. Actors and Contexts are explicitly excluded from session tracking to reinforce their foundational nature.

3. **File Watcher Pattern**: Updated file watcher pattern from `ai/**/*.{feature.md,spec.md,model.md,context.md,actor.md}` to only `ai/**/*.{feature.md,spec.md}` to match the new tracking policy.

4. **Menu Organization**: Two-section navigation menu:
   - "FOUNDATIONAL" section: Actors, Contexts, Sessions (always accessible)
   - "DESIGN" section: Features, Specs (requires active session)

5. **Visual Indicators**: Session-locked items (Features/Specs) show lock icons and disabled styling when no session is active, with helpful tooltips explaining the requirement.

6. **Browsable Design Files**: Features and Specs remain visible and browsable without a session (for reference), but are read-only. The existing lock/read-only behavior is sufficient - no need to completely block the view.

## Notes

### Changes Summary

**Updated Features:**
1. `actor-creation.feature.md` - Removed session requirement for creating actors
2. `actor-editing.feature.md` - Removed session requirement for editing actors
3. `context-creation.feature.md` - Removed session requirement for creating contexts
4. `context-editing.feature.md` - Removed session requirement for editing contexts
5. `forge-studio.feature.md` - Updated file management scenarios to distinguish between foundational and session-locked files
6. `session-management.feature.md` - Updated file tracking scenarios to only track Features and Specs
7. `navigation-menu.feature.md` - NEW: Complete feature definition for the two-section navigation menu

**Updated Specs:**
1. `forge-studio-implementation.spec.md` - Updated session-aware operations and file change tracking sections
2. `navigation-menu-implementation.spec.md` - NEW: Complete technical specification for navigation menu reorganization

### Implementation Impact

**Extension Host Changes Required:**
- Update file watcher pattern to only monitor `ai/**/*.{feature.md,spec.md}`
- Modify session-aware checks to allow Actor/Context operations without active session
- Update session file tracking logic to exclude Actor/Context changes

**Webview UI Changes Required:**
- Reorganize Sidebar component with two sections (Foundational and Design)
- Add session-dependent disabled state for Features and Specs navigation items
- Add lock icons and tooltips to navigation items
- Update BrowserPage components to check session requirements only for Features and Specs
- ~~Implement SessionRequiredView component for locked views~~ **REVERTED** - Features/Specs should remain browsable

**User Experience Benefits:**
- Clear visual communication of what requires sessions vs what doesn't
- Developers can set up foundational elements (Actors, Contexts) before starting design work
- Reduces friction for preparatory work while maintaining design discipline for actual feature work
- Better aligns with natural workflow: define vocabulary → start session → design features

### Migration Considerations

This is a breaking change in behavior but should be mostly positive:
- Existing Actor/Context files remain valid
- No data migration needed
- Users gain more flexibility, no features are removed
- Session files may have fewer tracked files going forward (only Features/Specs)

### Implementation Correction (2025-11-09)

**Issue**: Initial implementation (Story 08) used SessionRequiredView to completely block Features and Specs views when no session was active. This was too restrictive.

**Correction**: Reverted Story 08. Features and Specs should remain **browsable** (visible for reference) but **read-only** when no session is active. The existing read-only behavior with lock indicators was already correct and sufficient.

**Final Behavior**:
- **Actors & Contexts**: Always fully editable (create, edit, save) - no session required
- **Features & Specs**: Always browsable (view, navigate folders, read files) - session required only for create/edit operations
- **Navigation**: Lock icons and tooltips on Features/Specs nav items indicate session requirement
- **Files**: Read-only alert shown when opening Features/Specs without session

**Files Changed in Correction**:
- `packages/vscode-extension/src/webview/studio/index.tsx` - Removed SessionRequiredView conditional rendering, kept simple BrowserPage for all categories
- Updated all documentation (README.md, extension README.md) to clarify "browsable but read-only" behavior


