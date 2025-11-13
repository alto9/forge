---
story_id: update-session-format-scenario-tracking
session_id: features-are-king
feature_id: [scenario-level-tracking]
spec_id: [session-change-tracking]
status: completed
priority: high
estimated_minutes: 20
---

# Update Session Format for Scenario Tracking

## Objective

Update the session file `changed_files` property from a simple `string[]` array to a structured `FeatureChangeEntry[]` array that includes scenario-level detail. This enables precise tracking of which scenarios were added, modified, or removed within each feature file.

## Context

The current session format tracks files as simple paths:
```yaml
changed_files:
  - ai/features/user/authentication.feature.md
  - ai/features/user/profile.feature.md
```

The new format provides scenario-level granularity:
```yaml
changed_files:
  - path: ai/features/user/authentication.feature.md
    change_type: modified
    scenarios_added:
      - "User logs in with two-factor authentication"
    scenarios_modified:
      - "User logs in with email and password"
  - path: ai/features/user/profile.feature.md
    change_type: added
    scenarios_added:
      - "User can update profile"
      - "User can upload avatar"
```

This change enables better context for distillation and clearer visual indicators in the UI.

## Implementation Steps

1. Update TypeScript interface for `Session` in `Session.ts`:
   ```typescript
   interface Session {
     session_id: string;
     start_time: string;
     end_time?: string;
     status: 'design' | 'scribe' | 'development' | 'completed';
     problem_statement: string;
     changed_files: FeatureChangeEntry[];  // Changed from string[]
   }
   ```

2. Create new TypeScript interface for `FeatureChangeEntry`:
   ```typescript
   interface FeatureChangeEntry {
     path: string;
     change_type: 'added' | 'modified';
     scenarios_added?: string[];
     scenarios_modified?: string[];
     scenarios_removed?: string[];
   }
   ```

3. Update `SessionFileTracker.recordChange()` to create structured entries
   - Use `detectScenarioChanges()` to get scenario details
   - Build `FeatureChangeEntry` object with all fields
   - Add to session's `changed_files` array

4. Update `SessionFileTracker.mergeChangeEntries()` to handle new format
   - Merge scenario arrays (union of added/modified/removed)
   - Avoid duplicates within each array

5. Update session file read/write to handle both old and new formats (backwards compatibility)

## Files Affected

- `packages/vscode-extension/src/types/Session.ts` - Update Session interface
- `packages/vscode-extension/src/types/FeatureChangeEntry.ts` - Create new interface
- `packages/vscode-extension/src/utils/SessionFileTracker.ts` - Update change recording logic
- `packages/vscode-extension/src/utils/SessionFileWriter.ts` - Update file writing

## Acceptance Criteria

- [ ] `Session.changed_files` type is `FeatureChangeEntry[]`
- [ ] `FeatureChangeEntry` interface includes all required fields
- [ ] New session files use structured format
- [ ] Session file writing includes scenario details
- [ ] `recordChange()` populates scenario arrays correctly
- [ ] `mergeChangeEntries()` combines scenario changes without duplicates
- [ ] TypeScript compilation succeeds with no errors
- [ ] Existing code that reads sessions still works (backwards compatible)

## Dependencies

- Depends on: **implement-scenario-detection** (needs `detectScenarioChanges()` function)

