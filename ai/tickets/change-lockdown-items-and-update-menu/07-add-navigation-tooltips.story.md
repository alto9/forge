---
story_id: add-navigation-tooltips
session_id: change-lockdown-items-and-update-menu
feature_id: [navigation-menu]
spec_id: [navigation-menu-implementation]
status: completed
priority: medium
estimated_minutes: 20
actual_minutes: 0
depends_on: [add-session-dependent-nav-states]
---

## Objective

Add helpful tooltips to navigation items that explain their purpose and session requirements.

## Context

Navigation items should have tooltips that explain what they are and whether they require a session, helping users understand the system at a glance.

## Implementation Steps

1. Create a `getTooltip()` helper function that takes label, isDisabled, and requiresSession
2. Define tooltip text for each navigation item:
   - Actors: "Define system actors and personas - Always editable"
   - Contexts: "Provide technical guidance and context - Always editable"
   - Sessions: "Manage design sessions - Create and manage at any time"
   - Features: "Define user-facing functionality" + session requirement if disabled
   - Specs: "Define technical specifications" + session requirement if disabled
3. Add tooltip to NavItem component using `title` attribute
4. Append " - Active session required" to Features/Specs tooltips when disabled

## Files to Modify

- `packages/vscode-extension/src/webview/studio/components/Sidebar.tsx`

## Acceptance Criteria

- [x] All navigation items have tooltips
- [x] Actor tooltip says "Always editable"
- [x] Context tooltip says "Always editable"
- [x] Sessions tooltip explains purpose
- [x] Features tooltip includes "Active session required" when disabled
- [x] Specs tooltip includes "Active session required" when disabled
- [x] Tooltips display on hover
- [x] Tooltip text is clear and helpful

## Implementation Notes

**Status**: ✅ Already implemented in story 05 (reorganize-sidebar-with-sections)

**Explanation:**
This story was completed as part of story 05 when building the Sidebar component. Tooltips were a natural part of creating a complete navigation experience, so they were implemented together rather than as a separate follow-up task.

**Implementation Reference:**
See the Sidebar component (`Sidebar.tsx`) created in story 05:

### 1. `getTooltip()` Helper Function (lines ~175-195)

```typescript
function getTooltip(
  label: string,
  isDisabled: boolean,
  requiresSession?: boolean
): string {
  const tooltips: { [key: string]: string } = {
    'Actors': 'Define system actors and personas - Always editable',
    'Contexts': 'Provide technical guidance and context - Always editable',
    'Sessions': 'Manage design sessions - Create and manage at any time',
    'Features': 'Define user-facing functionality',
    'Specifications': 'Define technical specifications',
  };

  let tooltip = tooltips[label] || label;

  if (requiresSession && isDisabled) {
    tooltip += ' - Active session required';
  }

  return tooltip;
}
```

### 2. Tooltip Integration in NavSection Component

The tooltip is applied via the `title` attribute on each navigation item:

```typescript
<div
  key={item.id}
  style={...}
  onClick={...}
  title={getTooltip(item.label, isDisabled, item.requiresSession)}
>
  <span style={styles.navLabel}>{item.label}</span>
  {isDisabled && <span style={styles.lockIcon}>🔒</span>}
</div>
```

### Tooltip Behavior:

**Without Active Session:**
- **Actors**: "Define system actors and personas - Always editable"
- **Contexts**: "Provide technical guidance and context - Always editable"
- **Sessions**: "Manage design sessions - Create and manage at any time"
- **Features**: "Define user-facing functionality - Active session required"
- **Specifications**: "Define technical specifications - Active session required"

**With Active Session:**
- **Actors**: "Define system actors and personas - Always editable"
- **Contexts**: "Provide technical guidance and context - Always editable"
- **Sessions**: "Manage design sessions - Create and manage at any time"
- **Features**: "Define user-facing functionality" (no session message)
- **Specifications**: "Define technical specifications" (no session message)

### How It Works:

1. Each `NavItemConfig` has optional `requiresSession` flag
2. The `getTooltip()` function checks if item is disabled AND requires session
3. If both conditions are true, " - Active session required" is appended
4. Tooltip text updates dynamically based on session state
5. Native HTML `title` attribute provides browser tooltip on hover

**Impact:**
- ✅ All navigation items have helpful tooltips
- ✅ Tooltips explain purpose of each section
- ✅ Session requirements are clearly communicated
- ✅ Dynamic behavior based on session state
- ✅ Native browser tooltips (no custom library needed)

**Testing:**
Same testing as story 05:
1. Build: `npm run build -w forge`
2. Launch Extension Development Host (F5)
3. Open Forge Studio
4. Hover over navigation items without session → Verify session required messages
5. Start a session
6. Hover over Features/Specs → Verify session required messages removed
7. Hover over Actors/Contexts → Verify "Always editable" messages persist

## Testing Notes

Test by:
1. Hovering over each navigation item without a session
2. Verifying tooltips display correct text
3. Starting a session
4. Hovering over Features/Specs to verify "Active session required" is removed

