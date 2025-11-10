---
spec_id: session-ticket-migration
feature_id:
  - ticket-migration
context_id: []
---

# Spec: Session Ticket Migration

## Overview
Defines the process for migrating existing tickets from `ai/tickets/{session-id}/` to `ai/sessions/{session-id}/tickets/`.

## Migration Algorithm

### Step 1: Discover Sessions and Tickets
```
For each folder in ai/tickets/:
  session_id = folder name
  ticket_files = all *.story.md and *.task.md files in folder
  
  Record migration entry:
    - session_id
    - ticket_files[]
    - source_path: ai/tickets/{session_id}/
    - target_path: ai/sessions/{session_id}/tickets/
```

### Step 2: Validate Sessions
```
For each migration entry:
  Check if ai/sessions/{session_id}.session.md exists:
    - If exists: session is valid
    - If not exists: mark as orphaned, log warning
  
  Continue with migration regardless (create target folder)
```

### Step 3: Create Target Directories
```
For each migration entry:
  Create directory: ai/sessions/{session_id}/tickets/
  Ensure parent directory ai/sessions/{session_id}/ exists
```

### Step 4: Move Ticket Files
```
For each migration entry:
  For each ticket_file in ticket_files:
    source = ai/tickets/{session_id}/{ticket_file}
    target = ai/sessions/{session_id}/tickets/{ticket_file}
    
    Move file from source to target
    Preserve file content exactly (no modifications)
```

### Step 5: Remove Old Structure
```
For each migration entry:
  Remove empty folder: ai/tickets/{session_id}/

After all migrations:
  If ai/tickets/ is empty:
    Remove folder: ai/tickets/
```

### Step 6: Generate Migration Report
```
Report includes:
  - Total sessions migrated
  - Total tickets moved (stories + tasks)
  - Orphaned sessions (tickets without session files)
  - Any errors or warnings
```

## Migration Script Interface

### Command
```bash
npm run migrate:tickets
```

### Expected Output
```
Forge Ticket Migration
======================

Discovering tickets...
Found 5 sessions with tickets:
  - session-001: 12 tickets (10 stories, 2 tasks)
  - session-002: 5 tickets (4 stories, 1 task)
  - session-003: 8 tickets (7 stories, 1 task)
  - orphaned-session: 3 tickets (3 stories, 0 tasks) [WARNING: No session file]
  - session-005: 1 ticket (1 story, 0 tasks)

Migrating tickets...
✓ Migrated session-001 (12 tickets)
✓ Migrated session-002 (5 tickets)
✓ Migrated session-003 (8 tickets)
⚠ Migrated orphaned-session (3 tickets) - No session file found
✓ Migrated session-005 (1 ticket)

Cleaning up...
✓ Removed ai/tickets/ folder

Migration Summary
================
Total sessions: 5
Total tickets: 29 (25 stories, 4 tasks)
Orphaned sessions: 1
Status: Complete
```

## File Preservation Rules

### Content Preservation
- Do NOT modify ticket frontmatter
- Do NOT modify ticket content
- Do NOT modify line endings or whitespace
- Preserve file permissions

### What Stays the Same
- Ticket `story_id` or `task_id`
- Ticket `session_id` (already references the session)
- All frontmatter fields (feature_id, spec_id, status, etc.)
- All markdown content

## Error Handling

### Orphaned Tickets
- Tickets exist in `ai/tickets/{session-id}/` but no `ai/sessions/{session-id}.session.md`
- Action: Still migrate tickets, log warning
- Rationale: Preserve data, let user decide what to do

### Duplicate Tickets
- Ticket already exists at target path
- Action: Prompt user for resolution (skip, overwrite, rename)
- Default: Skip migration for that specific file

### Permission Errors
- Cannot create target directory or move file
- Action: Log error, continue with other files
- Report errors at end of migration

## Testing Requirements

### Unit Tests
- Test path construction
- Test file discovery
- Test orphaned session detection

### Integration Tests
- Test full migration with sample data
- Test migration with orphaned sessions
- Test cleanup of old folders
- Verify file content preservation

### Manual Testing
- Run migration on actual Forge repository
- Verify all tickets moved correctly
- Verify old ai/tickets/ folder removed
- Verify VSCode extension works with new structure
- Verify MCP server works with new structure




























