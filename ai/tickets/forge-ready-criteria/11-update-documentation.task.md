---
task_id: update-documentation
session_id: forge-ready-criteria
type: documentation
status: completed
priority: low
---

## Description

Update Forge documentation to explain the Cursor command file validation system and how hash checking ensures command files stay up-to-date.

## Reason

Users and contributors need to understand why command files are validated with hashes, what happens when files are outdated, and how to update them.

## Steps

1. Update README.md to mention Cursor command management
2. Add section explaining:
   - What Cursor command files are
   - Why hash validation is used
   - How to update outdated commands (re-initialize)
   - What to do if initialization fails
3. Update developer documentation about:
   - How to modify command templates
   - Impact of template changes on existing projects
   - Testing strategy for command validation
4. Add CHANGELOG entry for this feature
5. Update any user-facing documentation about project initialization

## Resources

- README.md in project root
- docs/ folder if it exists
- CHANGELOG.md

## Completion Criteria

- [x] README.md updated with Cursor command information
- [x] User-facing documentation explains hash validation
- [x] Developer documentation covers template modification
- [x] CHANGELOG entry added
- [x] Documentation is clear and accessible

## Notes

During documentation, discovered and fixed a bug in `extension.ts`:
- `checkProjectReadiness()` was only checking folders, not command files
- This caused the Welcome Screen to be bypassed even when command files were missing
- Fixed by adding command file validation to the readiness check
- Now consistent with `WelcomePanel._checkProjectReadiness()`
- Extension rebuilt and packaged with the fix

