---
story_id: reorganize-sidebar-with-sections
session_id: change-lockdown-items-and-update-menu
feature_id: [navigation-menu, forge-studio]
spec_id: [navigation-menu-implementation]
status: completed
priority: high
estimated_minutes: 30
actual_minutes: 28
depends_on: []
---

## Objective

Reorganize the Sidebar component to display two distinct sections: "FOUNDATIONAL" and "DESIGN" with appropriate navigation items in each.

## Context

The navigation menu needs clear visual separation between foundational items (Actors, Contexts, Sessions) that are always accessible, and design items (Features, Specs) that require active sessions.

## Implementation Steps

1. Open `packages/vscode-extension/src/webview/studio/components/Sidebar.tsx`
2. Create a `NavSection` component that takes a title and list of items
3. Restructure the Sidebar to render two NavSection components:
   - "FOUNDATIONAL" section with: Actors, Contexts, Sessions
   - "DESIGN" section with: Features, Specs
4. Add CSS for section headers (uppercase, subtle styling)
5. Add visual divider between sections
6. Pass `activeSession` prop down to enable session-aware styling

## Files to Modify

- `packages/vscode-extension/src/webview/studio/components/Sidebar.tsx`
- `packages/vscode-extension/src/webview/studio/styles/sidebar.css` (or create if needed)

## Acceptance Criteria

- [x] Sidebar displays "FOUNDATIONAL" section header
- [x] FOUNDATIONAL section contains: Actors, Contexts, Sessions
- [x] Sidebar displays "DESIGN" section header
- [x] DESIGN section contains: Features, Specs
- [x] Visual divider separates the two sections
- [x] Section headers use subtle, uppercase styling
- [x] Layout is clean and easy to understand

## Implementation Notes

**Files Created:**
1. `packages/vscode-extension/src/webview/studio/components/Sidebar.tsx`

**Files Modified:**
1. `packages/vscode-extension/src/webview/studio/components/index.ts` - Added Sidebar export
2. `packages/vscode-extension/src/webview/studio/index.tsx` - Replaced inline sidebar with Sidebar component

**Component Structure:**

1. **Sidebar Component** - Main container with two sections
   - Header with "Forge Studio" title and session indicator
   - Dashboard navigation item (always visible)
   - FOUNDATIONAL section (NavSection)
   - Visual divider (1px line)
   - DESIGN section (NavSection)

2. **NavSection Component** - Reusable section with header and items
   - Section header (uppercase, subtle styling)
   - Navigation items with session-aware states
   - Lock icons for disabled items
   - Tooltips explaining requirements

**Navigation Items:**

**FOUNDATIONAL Section:**
- Actors (always enabled)
- Contexts (always enabled)
- Sessions (always enabled)

**DESIGN Section:**
- Features (requires session)
- Specifications (requires session)

**Visual Design:**

1. **Section Headers:**
   - 11px font size
   - Font weight 600
   - Uppercase with 0.5px letter spacing
   - Color: `--vscode-descriptionForeground`
   - Padding: 12px top/sides, 8px bottom

2. **Navigation Items:**
   - 13px font size
   - 8px vertical padding, 12px horizontal
   - Active state: blue highlight with left border
   - Disabled state: 50% opacity, not-allowed cursor
   - Hover state: subtle background change

3. **Visual Divider:**
   - 1px height
   - Uses `--vscode-panel-border` color
   - 12px top/bottom margin

4. **Lock Icons:**
   - 🔒 emoji (10px)
   - Displayed on disabled items
   - Right-aligned with 8px left margin

**Session-Aware Behavior:**

1. **Without Active Session:**
   - Actors, Contexts, Sessions: Fully enabled
   - Features, Specs: Disabled with lock icon
   - Tooltips indicate "Active session required"

2. **With Active Session:**
   - All items fully enabled
   - No lock icons displayed
   - Green "Session Active" indicator in header

**VSCode Theme Variables Used:**
- `--vscode-sideBar-background` - Sidebar background
- `--vscode-panel-border` - Borders and divider
- `--vscode-foreground` - Primary text
- `--vscode-descriptionForeground` - Section headers
- `--vscode-list-activeSelectionBackground` - Active item
- `--vscode-list-activeSelectionForeground` - Active item text
- `--vscode-list-hoverBackground` - Hover state
- `--vscode-focusBorder` - Active item left border
- `--vscode-charts-green` - Session indicator

**Props Interface:**
```typescript
interface SidebarProps {
  currentPage: string;
  activeSession: any;
  onNavigate: (page: string) => void;
}
```

**Integration with App:**
```tsx
<Sidebar
  currentPage={route.page}
  activeSession={activeSession}
  onNavigate={(page) => setRoute({ page: page as any })}
/>
```

**Testing:**
To test the sidebar:
1. Build: `npm run build -w forge`
2. Launch Extension Development Host (F5)
3. Open Forge Studio
4. Verify two distinct sections visible
5. Check items grouped correctly
6. Without session: Verify Features/Specs show lock icons
7. Start session: Verify lock icons disappear
8. Click navigation items: Verify routing works

## Testing Notes

Test by:
1. Opening Forge Studio
2. Verifying two distinct sections are visible
3. Checking that items are grouped correctly
4. Verifying visual hierarchy is clear

