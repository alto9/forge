---
story_id: add-session-format-migration
session_id: features-are-king
feature_id: [studio-sessions]
spec_id: [session-change-tracking]
status: pending
priority: medium
estimated_minutes: 20
---

# Add Migration Path for Old Session Format

## Objective

Implement automatic migration logic that converts existing sessions using the old `changed_files: string[]` format to the new `changed_files: FeatureChangeEntry[]` format. This ensures backwards compatibility and prevents data loss when loading older session files.

## Context

Existing session files use a simple string array for `changed_files`:
```yaml
changed_files:
  - ai/features/user/authentication.feature.md
  - ai/features/user/profile.feature.md
```

The new format is structured:
```yaml
changed_files:
  - path: ai/features/user/authentication.feature.md
    change_type: modified
    scenarios_added: []
    scenarios_modified: []
```

When loading an old session file, we need to:
1. Detect the old format
2. Convert it to the new format
3. Save the migrated session back to disk (optional)

## Implementation Steps

1. Create `migrateSessionFormat()` function in session loader
2. Detect old format: check if `changed_files[0]` is a string
3. If old format detected:
   - Create `FeatureChangeEntry` objects from string paths
   - Set `change_type: 'modified'` (assume modified since we don't know)
   - Leave scenario arrays empty (no historical data available)
4. Add migration flag to session: `_migrated: true` (for debugging)
5. Optionally auto-save migrated session back to disk
6. Log migration: `console.log('Migrated session from old format')`
7. Test with actual old session files
8. Verify that migrated sessions work with new UI components
9. Document migration behavior in code comments

## Files Affected

- `packages/vscode-extension/src/utils/SessionLoader.ts` - Add migration function
- `packages/vscode-extension/src/utils/SessionMigration.ts` - Create migration utility (optional)
- `packages/vscode-extension/src/types/Session.ts` - Add `_migrated?` flag (optional)

## Acceptance Criteria

- [ ] Old session format is detected correctly
- [ ] String array is converted to FeatureChangeEntry array
- [ ] Converted entries have `path` and `change_type` fields
- [ ] Scenario arrays are initialized as empty arrays
- [ ] Migrated sessions load without errors
- [ ] UI displays migrated sessions correctly
- [ ] Migration is logged for debugging
- [ ] No data loss occurs during migration
- [ ] New sessions use new format from the start (not affected)

## Dependencies

- Depends on: **update-session-format-scenario-tracking** (defines new format)

