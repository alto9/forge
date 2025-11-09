---
session_id: organize-sessions-data
start_time: '2025-11-08T23:36:00.296Z'
status: awaiting_implementation
problem_statement: Sessions do not provide enough visibility into the changes made within.
changed_files:
  - ai/features/studio/sessions/session-management.feature.md
  - ai/specs/extension/cursor-commands-management.spec.md
end_time: '2025-11-08T23:54:05.892Z'
command_file: .cursor/commands/create-stories-organize-sessions-data.md
---
## Problem Statement

Sessions do not provide enough visibility into the changes made within.

## Goals

Provide visibility into the specific files changed on the Session view in Forge Studio.

## Approach

Increase functionality of the sessions page by showing the exact files changed during the session. Also add paging functionality to the sessions view, and make sure they are sorted appropriately. The 'active session' view does not need to change. The sessions list could have a reduced list view, and an expanded focused view (if you click on it, you see the details of the session, including all session fields and changed files.

## Key Decisions

We also need to adjust the injected 'forge-build' cursor command file. I tried using it and it does not re-inforce the behavior. That command should absolutely prompt the agent to call the 'get_forge_about' mcp tool and it should be very aware to only edit files in the AI folder and it should be familiar with the concept of a Forge design session.

## Notes

None
