---
story_id: integrate-session-required-view
session_id: change-lockdown-items-and-update-menu
feature_id: [navigation-menu, forge-studio]
spec_id: [navigation-menu-implementation, forge-studio-implementation]
status: reverted
priority: high
estimated_minutes: 25
actual_minutes: 15
depends_on: [create-session-required-view-component]
---

**REVERTED**: This implementation was too restrictive. Features and Specs should remain browsable (visible) but read-only without a session, not completely blocked by SessionRequiredView. The existing read-only behavior was correct.

## Objective

Integrate SessionRequiredView component into the App's main content rendering logic to display when users navigate to Features or Specs without an active session.

## Context

The main App component needs to check if the user is navigating to Features or Specs without a session, and show SessionRequiredView instead of the normal BrowserPage.

## Implementation Steps

1. Open `packages/vscode-extension/src/webview/studio/index.tsx`
2. Import the SessionRequiredView component
3. In the `renderMainContent()` method, add checks before rendering Features/Specs:
   - If `currentView === 'features' && !activeSession`, render `<SessionRequiredView itemType="Features" onStartSession={handleStartSession} />`
   - If `currentView === 'specs' && !activeSession`, render `<SessionRequiredView itemType="Specs" onStartSession={handleStartSession} />`
4. Implement `handleStartSession` to navigate to the Sessions page
5. Only render BrowserPage for Features/Specs if session is active

## Files to Modify

- `packages/vscode-extension/src/webview/studio/index.tsx`

## Acceptance Criteria

- [x] Navigating to Features without session shows SessionRequiredView
- [x] Navigating to Specs without session shows SessionRequiredView
- [x] "Start New Session" button navigates to Sessions page
- [x] Navigating to Features with active session shows BrowserPage
- [x] Navigating to Specs with active session shows BrowserPage
- [x] Navigating to Actors/Contexts always shows BrowserPage regardless of session

## Implementation Notes

**Files Modified:**
1. `packages/vscode-extension/src/webview/studio/index.tsx`

**Changes Made:**

1. **Added SessionRequiredView Import:**
```typescript
import { SessionRequiredView } from './components/SessionRequiredView';
```

2. **Updated Features Rendering** (lines 125-134):
```typescript
{route.page === 'features' && (
  activeSession ? (
    <BrowserPage category="features" title="Features" activeSession={activeSession} />
  ) : (
    <SessionRequiredView 
      itemType="Features" 
      onStartSession={() => setRoute({ page: 'sessions' })} 
    />
  )
)}
```

3. **Updated Specs Rendering** (lines 136-145):
```typescript
{route.page === 'specs' && (
  activeSession ? (
    <BrowserPage category="specs" title="Specifications" activeSession={activeSession} />
  ) : (
    <SessionRequiredView 
      itemType="Specs" 
      onStartSession={() => setRoute({ page: 'sessions' })} 
    />
  )
)}
```

4. **Actors and Contexts Unchanged:**
   - Always render BrowserPage regardless of session state
   - No conditional logic added (they're always accessible)

**How It Works:**

**Flow Without Active Session:**
1. User navigates to Features or Specs via sidebar
2. Route changes to 'features' or 'specs'
3. Conditional check: `activeSession ? ... : ...`
4. Since no session exists, SessionRequiredView renders
5. User sees lock icon, explanation, and "Start New Session" button
6. Clicking button calls `onStartSession={() => setRoute({ page: 'sessions' })}`
7. Route changes to 'sessions' where user can create a session

**Flow With Active Session:**
1. User navigates to Features or Specs
2. Conditional check: `activeSession ? ... : ...`
3. Since session exists, BrowserPage renders normally
4. User can create/edit Features or Specs as before

**Actors and Contexts Always Work:**
- No conditional logic on these routes
- Always render BrowserPage directly
- Works both with and without active session
- Aligns with "foundational files" concept

**Integration Points:**

1. **SessionRequiredView Component:**
   - Receives `itemType` prop ("Features" or "Specs")
   - Receives `onStartSession` callback
   - Displays appropriate explanation for the item type

2. **Navigation Handler:**
   - `onStartSession={() => setRoute({ page: 'sessions' })}`
   - Uses existing routing mechanism
   - No new state or message passing needed
   - Simple, clean integration

3. **State Dependencies:**
   - Relies on existing `activeSession` state
   - No additional state management required
   - Reactive to session changes automatically

**User Experience Flow:**

1. **No Session + Click Features:**
   - Sidebar shows lock icon on Features
   - Click navigates to Features route
   - SessionRequiredView appears
   - Clear explanation of why session needed
   - Prominent "Start New Session" button

2. **Click "Start New Session":**
   - Routes to Sessions page
   - Shows new session form
   - User creates session

3. **Session Active + Navigate to Features:**
   - Sidebar shows no lock icon
   - Click navigates to Features route
   - Normal BrowserPage appears
   - User can create/edit features

4. **Navigate to Actors (no session):**
   - Sidebar shows no lock icon
   - Click navigates to Actors route
   - Normal BrowserPage appears
   - User can create/edit actors

**Testing:**
To verify the integration:
1. Build: `npm run build -w forge`
2. Launch Extension Development Host (F5)
3. Open Forge Studio without session
4. Click Features → Verify SessionRequiredView displays
5. Click "Start New Session" → Verify routes to Sessions page
6. Create a session
7. Navigate to Features → Verify BrowserPage displays
8. Navigate to Actors → Verify BrowserPage displays (no session check)

## Testing Notes

Test by:
1. Opening Studio without a session
2. Clicking Features navigation item
3. Verifying SessionRequiredView displays
4. Clicking "Start New Session" button
5. Verifying navigation to Sessions page
6. Creating a session and navigating back to Features
7. Verifying normal BrowserPage displays

