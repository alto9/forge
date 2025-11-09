---
story_id: create-welcome-webview-ui
session_id: project-init
feature_id: [welcome-screen]
spec_id: [welcome-initialization]
model_id: []
context_id: [theme]
status: pending
priority: high
estimated_minutes: 30
---

# Create Welcome Webview UI Structure

## Objective

Create the React-based welcome screen UI with main component structure, including project header, status display, folder checklist, and action buttons.

## Context

The welcome screen webview provides a clean interface for users to understand project readiness and initialize missing folders. This story creates the core UI components.

## Implementation Steps

1. Create `packages/vscode-extension/src/webview/welcome/index.tsx`
2. Set up basic React app with VSCode API integration
3. Create `WelcomeApp` main component
4. Add state management for: projectPath, isReady, folders, isInitializing, error
5. Implement message listener for extension messages
6. Create `ProjectHeader` component showing project path
7. Create `StatusIndicator` component (Ready/Not Ready badge)
8. Create `FolderChecklist` component showing folder status
9. Create `ActionButtons` component (Initialize/Open Studio buttons)
10. Add basic styling using VSCode CSS variables

## Files Affected

- `packages/vscode-extension/src/webview/welcome/index.tsx` - Create new file
- `packages/vscode-extension/src/webview/welcome/types.ts` - Create types file

## Acceptance Criteria

- [ ] WelcomeApp component renders with state management
- [ ] ProjectHeader displays project path
- [ ] StatusIndicator shows Ready (green) or Not Ready (orange)
- [ ] FolderChecklist displays all folders with exist/missing status
- [ ] ActionButtons shows appropriate button based on ready state
- [ ] Uses VSCode theme CSS variables
- [ ] Message passing to/from extension works
- [ ] UI is centered and well-spaced

## Dependencies

- create-welcome-panel-class

