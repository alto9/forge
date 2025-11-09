---
task_id: integration-testing
session_id: change-lockdown-items-and-update-menu
feature_id: [forge-studio, navigation-menu]
spec_id: [forge-studio-implementation, navigation-menu-implementation]
status: pending
priority: high
depends_on: [update-file-watcher-pattern, remove-actor-session-requirement, remove-context-session-requirement, integrate-session-required-view, add-session-dependent-nav-states]
---

## Objective

Perform comprehensive integration testing of the new lockdown model and navigation structure.

## Context

After implementing all the code changes, we need to verify the complete system works together correctly and the user experience is smooth.

## Test Scenarios

### Without Active Session

1. **Open Forge Studio**
   - Verify navigation shows two sections: FOUNDATIONAL and DESIGN
   - Verify Features and Specs show lock icons
   - Verify Actors, Contexts, Sessions don't show lock icons

2. **Navigate to Actors**
   - Verify Actors page loads normally
   - Verify "New Actor" button is available
   - Create an Actor successfully
   - Edit an existing Actor successfully
   - Verify no "session required" messages

3. **Navigate to Contexts**
   - Verify Contexts page loads normally
   - Verify "New Context" button is available
   - Create a Context successfully
   - Edit an existing Context successfully
   - Verify no "session required" messages

4. **Navigate to Features**
   - Verify SessionRequiredView displays
   - Verify explanatory text is shown
   - Verify "Start New Session" button is present
   - Click button and verify navigation to Sessions

5. **Navigate to Specs**
   - Verify SessionRequiredView displays
   - Verify explanatory text is shown
   - Verify "Start New Session" button is present

### With Active Session

6. **Start a Session**
   - Create a new session from Sessions page
   - Verify session panel appears

7. **Navigate to Features**
   - Verify normal Features page loads
   - Verify no SessionRequiredView
   - Verify "New Feature" button is available
   - Create a Feature
   - Verify it's tracked in session changed_files

8. **Navigate to Specs**
   - Verify normal Specs page loads
   - Create a Spec
   - Verify it's tracked in session changed_files

9. **Create Actors and Contexts with Active Session**
   - Create an Actor
   - Verify it's NOT tracked in session changed_files
   - Create a Context
   - Verify it's NOT tracked in session changed_files

10. **Verify File Watcher**
    - Edit a Feature file
    - Verify it's added to changed_files
    - Edit an Actor file
    - Verify it's NOT added to changed_files

11. **End Session**
    - End the active session
    - Verify Features and Specs navigation items become disabled
    - Verify lock icons reappear
    - Verify Actors and Contexts remain accessible

## Acceptance Criteria

- [ ] All test scenarios pass without errors
- [ ] No console errors or warnings
- [ ] User experience is smooth and intuitive
- [ ] Visual indicators work correctly
- [ ] Session tracking works correctly
- [ ] Permissions are correctly enforced

## Notes

This is manual testing work. Document any issues found and create bug fix stories as needed.




