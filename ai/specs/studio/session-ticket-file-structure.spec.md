---
spec_id: session-ticket-file-structure
feature_id:
  - session-ticket-organization
context_id: []
---

# Spec: Session Ticket File Structure

## Overview
Defines the new file structure where tickets are organized within session folders rather than in a separate top-level tickets directory.

## File Path Structure

### Session Files
Session files remain as individual `.session.md` files in the sessions directory:
```
ai/sessions/{session-id}.session.md
```

### Ticket Folders
Tickets are organized in a folder matching the session_id:
```
ai/sessions/{session-id}/tickets/
├── story-001.story.md
├── story-002.story.md
├── task-001.task.md
└── ...
```

### Complete Structure Example
```
ai/
├── sessions/
│   ├── my-feature.session.md
│   ├── my-feature/
│   │   └── tickets/
│   │       ├── implement-api.story.md
│   │       ├── add-tests.story.md
│   │       └── update-docs.task.md
│   ├── bug-fix.session.md
│   └── bug-fix/
│       └── tickets/
│           └── fix-validation.story.md
├── features/     # Remains at top level
├── specs/        # Remains at top level
├── diagrams/     # Remains at top level
├── models/       # Remains at top level
├── actors/       # Remains at top level
└── contexts/     # Remains at top level
```

## Path Resolution Rules

### Creating Tickets
When distilling a session with `session_id: "example-session"`:
1. Ensure directory exists: `ai/sessions/example-session/tickets/`
2. Create ticket files in that directory
3. Ticket filenames follow existing conventions: `{ticket-id}.story.md` or `{ticket-id}.task.md`

### Reading Tickets
To find all tickets for a session:
1. Read session file: `ai/sessions/{session-id}.session.md`
2. List directory: `ai/sessions/{session-id}/tickets/`
3. Filter for `*.story.md` and `*.task.md` files

### Session File Metadata
Session files should NOT change their frontmatter structure. The `changed_files` array continues to track design files (features, specs, diagrams), not tickets.

## Constraints

### Folder Naming
- Session folder name MUST match the `session_id` from the session file
- Tickets MUST be in a `tickets/` subfolder (not directly in session folder)
- Session file stays at `ai/sessions/{session-id}.session.md`

### File Organization
- ONLY tickets go in `ai/sessions/{session-id}/tickets/`
- NO other artifacts (diagrams, notes, etc.) in session folders
- Features, specs, diagrams stay at top-level `ai/features/`, `ai/specs/`, `ai/diagrams/`

### Backward Compatibility
- Old structure at `ai/tickets/{session-id}/` is deprecated
- After migration, `ai/tickets/` folder is removed entirely
- All tooling must support only the new structure

## Implementation Areas

### VSCode Extension
- `DistillSessionCommand`: Update to use `ai/sessions/{session-id}/tickets/` path
- `BuildStoryCommand`: Update to find stories in new path
- Tree views: Display tickets under session folders
- Forge Studio: Update session detail view to show nested tickets

### MCP Server
- `get_forge_about`: Update documentation to reflect new structure
- No new tools required (existing tools remain path-agnostic)

### Custom Commands
- Any commands that reference `ai/tickets/` must be updated to `ai/sessions/{session-id}/tickets/`
- Distillation prompts must specify the new path structure




























