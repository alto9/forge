---
diagram_id: session-real-time-architecture
title: Session Real-Time Update Architecture
spec_id:
  - session-file-watching
  - session-state-management
---

# Diagram: Session Real-Time Update Architecture

## Description
Visual representation of how file changes are detected, tracked, and synchronized between the file system, extension host, and webview.

## Diagram

```nomnoml
#title: Real-Time Session Update Architecture
#direction: down
#spacing: 80
#padding: 20

[<actor>User/AI Agent]
[<actor>User in Studio]

[<frame>File System|
  [Session File\nai/sessions/\*.session.md]
  [Feature Files\nai/features/\*.feature.md]
  [Spec Files\nai/specs/\*.spec.md]
]

[<frame>Extension Host|
  [FileSystemWatcher]
  [SessionFileTracker]
  [ChangeDebouncer]
  [SessionStateManager]
]

[<frame>Webview (Studio UI)|
  [Zustand Store]
  [React Components]
  [Visual Indicators]
]

[User/AI Agent] modifies -> [Session File]
[User/AI Agent] modifies -> [Feature Files]
[User/AI Agent] modifies -> [Spec Files]

[Session File] file change event -> [FileSystemWatcher]
[Feature Files] file change event -> [SessionFileTracker]
[Spec Files] file change event -> [SessionFileTracker]

[FileSystemWatcher] detect change -> [ChangeDebouncer]
[SessionFileTracker] detect change -> [ChangeDebouncer]

[ChangeDebouncer] batch (500ms) -> [SessionStateManager]

[SessionStateManager] update state -> [SessionStateManager]
[SessionStateManager] post message -> [Zustand Store]

[Zustand Store] state change -> [React Components]
[React Components] render -> [Visual Indicators]
[Visual Indicators] display -> [User in Studio]

[<note>Flow Steps:
1. User/Agent modifies files
2. FSWatcher detects changes
3. Changes are debounced (500ms)
4. Session state updates
5. Message sent to webview
6. Store updates
7. UI re-renders
8. User sees changes < 1sec]

[<note>Key Features:
• Automatic change detection
• Scenario-level tracking
• Debounced updates
• Real-time synchronization
• Visual feedback]
```

