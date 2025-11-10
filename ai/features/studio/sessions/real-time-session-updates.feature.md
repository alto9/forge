---
feature_id: real-time-session-updates
spec_id:
  - session-file-watching
  - session-state-management
---

# Feature: Real-Time Session Updates

## Background

```gherkin
Background:
  Given Forge Studio displays session information
  And AI agents can modify session files during work
  And users need to see changes immediately without manual refresh
  And real-time updates improve workflow efficiency
```

## Scenarios

```gherkin
Scenario: Watch active session file for changes
  Given I have an active design session
  And the session file is displayed in Forge Studio
  When an AI agent modifies the session file on disk
  Then the Studio should detect the file change immediately
  And the session data should be reloaded from disk
  And the UI should update to reflect the new content
  And this should happen within 1 second of the file change

Scenario: Update session panel when agent modifies session
  Given I have an active session displayed in the session panel
  And an AI agent is tracking changes during forge-design
  When the agent updates the changed_files array in the session
  Then I should see the Changed Files section update
  And new files should appear in the list
  And file counts should update
  And I should not need to click refresh or reload Studio

Scenario: Update session status in real-time
  Given I have an active session
  When the session status changes from "design" to "scribe"
  Then the session panel should immediately reflect the new status
  And the status badge should update its color and text
  And available actions should change based on the new status
  And the UI should transition smoothly without jarring reloads

Scenario: Handle multiple rapid changes
  Given I have an active session
  And an AI agent is making rapid changes to the session file
  When multiple changed_files entries are added in quick succession
  Then the Studio should debounce the updates
  And updates should batch within a 500ms window
  And the final state should accurately reflect all changes
  And the UI should remain responsive and not flicker

Scenario: Show loading indicator during updates
  Given I have an active session
  When the session file is being updated externally
  Then I should see a subtle loading indicator
  And the indicator should appear on the session panel
  And it should not block my interaction with the UI
  And it should disappear once the update is complete

Scenario: Preserve scroll position during updates
  Given I am viewing the Changed Files section in the session panel
  And I have scrolled down to review changes
  When the session file is updated with new changes
  Then the list should update with new entries
  But my scroll position should be preserved
  And I should not be suddenly jumped to the top of the list
  And this maintains context during reviews

Scenario: File system watching for session file
  Given I have opened Forge Studio with an active session
  When the extension starts
  Then it should create a FileSystemWatcher for the active session file
  And the watcher should listen for change events
  And the watcher should trigger a reload when changes are detected
  And the watcher should be disposed when the session is closed

Scenario: Update Changed Files view in real-time
  Given I have an active session
  And I am viewing the session in Studio
  When I save a modified feature file
  Then the session file should be updated by the file tracking system
  And the Changed Files view should immediately show the new entry
  And scenario-level details should be displayed
  And the file count badge should increment
  And this should all happen automatically

Scenario: Notify user of external session changes
  Given I have an active session
  When the session file is modified by an external process (like an AI agent)
  Then I should see a toast notification (optional)
  And the notification should say "Session updated"
  And the notification should be non-intrusive and brief
  And the UI should update regardless of whether I see the notification

Scenario: Handle session file deletion
  Given I have an active session displayed in Studio
  When the session file is deleted from disk
  Then Studio should detect the deletion
  And Studio should show an error message
  And Studio should clear the active session state
  And Studio should prompt me to start a new session

Scenario: Reload session on Studio reopen
  Given I have an active session with tracked changes
  And I close Forge Studio
  When I reopen Forge Studio
  Then the active session should be automatically loaded
  And all changed files should be displayed
  And the session state should match what was on disk
  And file watching should resume immediately

Scenario: Sync session state between webview and extension
  Given Forge Studio runs in a webview
  And the extension host manages file operations
  When the extension detects a session file change
  Then it should post a message to the webview
  And the webview should update its state
  And the update should be seamless to the user
  And this maintains consistency between processes

Scenario: Handle concurrent edits safely
  Given I am editing the session's problem statement in Studio
  And an AI agent updates the changed_files array simultaneously
  When both changes are saved
  Then both changes should be preserved
  And the session file should merge both updates
  And no data should be lost
  And I should see a warning if conflicts are detected

Scenario: Real-time update of session tickets
  Given I have a session with status "development"
  And I am viewing the session detail page showing tickets
  When an AI agent creates new ticket files in the session's tickets folder
  Then the ticket list should update in real-time
  And new tickets should appear without requiring a refresh
  And this keeps me informed of distillation progress
```

