---
story_id: remove-context-ui-components
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: pending
priority: medium
estimated_minutes: 25
---

## Objective
Remove all context-related UI components and state management from Forge Studio.

## Context
The Studio includes React components for displaying, creating, and editing contexts. These components, along with their associated state management and API calls, should be removed.

## Implementation Steps
1. Identify context-related React components in Studio webview
2. Delete context list view component
3. Delete context detail/edit component
4. Delete context creation component
5. Remove context-related state from Studio store/state management
6. Remove context-related API calls and message handlers
7. Remove context types from TypeScript definitions
8. Run Studio build to verify no broken imports
9. Test Studio functionality without context components

## Files Affected
- Context list component - Delete
- Context detail/edit component - Delete
- Context creation component - Delete
- Studio state management - Remove context state
- API/message handlers - Remove context-related handlers
- TypeScript types - Remove context types

## Acceptance Criteria
- [ ] All context UI components are deleted
- [ ] No context-related state remains in Studio
- [ ] No context-related message handlers remain
- [ ] TypeScript builds without errors
- [ ] Studio runs without errors
- [ ] No broken imports or undefined references

## Dependencies
- Depends on: 009-remove-contexts-from-studio-navigation

