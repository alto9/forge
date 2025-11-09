---
task_id: update-documentation
session_id: change-lockdown-items-and-update-menu
feature_id: [forge-studio]
spec_id: [forge-studio-implementation]
status: completed
priority: low
---

## Objective

Update user-facing documentation to reflect the new lockdown model where Actors and Contexts don't require sessions.

## Context

The README and other documentation may still describe the old behavior where all file operations required sessions. This needs to be updated to reflect the new foundational vs design file distinction.

## Tasks

1. Review README.md for mentions of session requirements
2. Update any statements that say "all files require sessions"
3. Add explanation of foundational vs design files
4. Update workflow descriptions to mention:
   - Define Actors and Contexts first (no session needed)
   - Start session for Features and Specs
5. Check CONTRIBUTING.md and other docs for similar updates
6. Update any example workflows or tutorials

## Files to Review/Update

- `README.md`
- `CONTRIBUTING.md`
- `EXAMPLES.md` (if exists)
- Any other user-facing documentation

## Acceptance Criteria

- [ ] Documentation clearly explains foundational files (Actors, Contexts)
- [ ] Documentation clearly explains design files (Features, Specs)
- [ ] Session requirements are accurately described
- [ ] Workflow examples reflect new capabilities
- [ ] No contradictory information about session requirements

## Notes

This is manual documentation work, not code changes.

