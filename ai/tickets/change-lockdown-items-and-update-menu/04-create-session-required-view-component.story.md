---
story_id: create-session-required-view-component
session_id: change-lockdown-items-and-update-menu
feature_id: [navigation-menu]
spec_id: [navigation-menu-implementation]
status: completed
priority: high
estimated_minutes: 30
actual_minutes: 25
---

## Objective

Create a SessionRequiredView component that displays when users navigate to Features or Specs without an active session.

## Context

When no session is active, navigating to Features or Specs should show an explanatory view with a prominent "Start New Session" button, rather than just showing disabled UI.

## Implementation Steps

1. Create new file `packages/vscode-extension/src/webview/studio/components/SessionRequiredView.tsx`
2. Implement the component with:
   - Large lock icon (centered)
   - "Active Session Required" heading
   - Explanatory text about why sessions are needed
   - "Start New Session" button
   - Props: `itemType: 'Features' | 'Specs'` and `onStartSession: () => void`
3. Add CSS styling using VSCode theme variables
4. Export the component from the components directory

## Files to Create

- `packages/vscode-extension/src/webview/studio/components/SessionRequiredView.tsx`

## Acceptance Criteria

- [x] Component renders with lock icon, heading, and button
- [x] Text explains why Features/Specs require sessions
- [x] Button calls onStartSession callback when clicked
- [x] Styling uses VSCode theme variables
- [x] Component is responsive and centered
- [x] Works for both Features and Specs item types

## Implementation Notes

**Files Created:**
1. `packages/vscode-extension/src/webview/studio/components/SessionRequiredView.tsx`
2. `packages/vscode-extension/src/webview/studio/components/index.ts`

**Component Features:**

1. **Lock Icon** (SVG):
   - 64x64 pixel lock icon using SVG
   - Uses `currentColor` to inherit VSCode theme color
   - 30% opacity for subtle appearance
   - Centered with 24px bottom margin

2. **Heading**:
   - "Active Session Required"
   - 24px font size, weight 600
   - Uses `--vscode-foreground` color

3. **Description Text**:
   - Dynamic text based on `itemType` prop
   - "Features are created and edited within design sessions..."
   - Uses `--vscode-descriptionForeground` color
   - 14px font size with 1.6 line height

4. **Explanation Box**:
   - Styled card with border and background
   - Uses `--vscode-editorWidget-background`
   - Border uses `--vscode-panel-border`
   - Contains "Why sessions?" explanation
   - 6px border radius for modern look

5. **Call-to-Action Button**:
   - "Start New Session" button
   - Uses `--vscode-button-background` and `--vscode-button-foreground`
   - Hover and active states (0.9 and 0.8 opacity)
   - Calls `onStartSession` callback prop

**Props Interface:**
```typescript
interface SessionRequiredViewProps {
  itemType: 'Features' | 'Specs';
  onStartSession: () => void;
}
```

**VSCode Theme Variables Used:**
- `--vscode-foreground` - Main text color
- `--vscode-descriptionForeground` - Secondary text color
- `--vscode-editorWidget-background` - Explanation box background
- `--vscode-panel-border` - Border color
- `--vscode-button-background` - Button background
- `--vscode-button-foreground` - Button text
- `--vscode-font-family` - Font family

**Design Decisions:**
1. **Centered Layout**: Flexbox centering for optimal visual hierarchy
2. **Max Width**: 600px container, 500px explanation box for readability
3. **Spacing**: Generous padding (48px) and margins for breathing room
4. **Responsive**: Works on different screen sizes
5. **Accessibility**: Semantic HTML with proper heading structure

**Component Index:**
Created `components/index.ts` to export all components in a centralized location:
- `MarkdownEditor`
- `NomnomlRenderer`
- `SessionRequiredView`

**Testing:**
To test the component:
1. Build the webview: `npm run build -w forge`
2. Import: `import { SessionRequiredView } from './components'`
3. Render with props:
```tsx
<SessionRequiredView
  itemType="Features"
  onStartSession={() => console.log('Start session')}
/>
```
4. Verify visual appearance in both light and dark themes
5. Click button and verify callback is triggered

## Testing Notes

Test by rendering the component in isolation and verifying:
- Visual appearance matches design
- Button click triggers callback
- Text is clear and helpful

