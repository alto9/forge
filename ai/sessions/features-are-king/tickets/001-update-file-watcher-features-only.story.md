---
story_id: update-file-watcher-features-only
session_id: features-are-king
feature_id: [scenario-level-tracking, studio-sessions]
spec_id: [session-change-tracking]
status: pending
priority: high
estimated_minutes: 15
---

# Update File Watcher to Track Only Features

## Objective

Modify the session file watcher to monitor only feature files (`ai/**/*.feature.md`) and stop tracking specs, diagrams, models, actors, and contexts. This aligns with the principle that features are directive (tracked in sessions) while specs/diagrams/actors/contexts are informative (always editable, not tracked).

## Context

The current implementation tracks multiple file types during design sessions. The new design clarifies that:
- **Features are directive**: They represent intended code changes and should be tracked
- **Specs/Diagrams/Models/Actors/Contexts are informative**: They provide guidance but don't represent direct code changes

This story updates the file watcher to reflect this distinction by only monitoring feature files during active sessions.

## Implementation Steps

1. Locate the `SessionFileTracker` class in the extension code
2. Update the file watcher pattern from `ai/**/*.{feature.md,spec.md,diagram.md,model.md}` to `ai/**/*.feature.md`
3. Remove any logic that handles spec, diagram, model, actor, or context file changes
4. Update the `startTracking()` method to create a watcher with the new pattern
5. Verify that the watcher still properly tracks feature file creation, modification, and deletion
6. Test that specs/diagrams/models/actors/contexts can be edited without triggering session tracking

## Files Affected

- `packages/vscode-extension/src/utils/SessionFileTracker.ts` - Update file watcher pattern
- `packages/vscode-extension/src/panels/ForgeStudioPanel.ts` - Update file watching initialization if needed

## Acceptance Criteria

- [ ] File watcher pattern is `ai/**/*.feature.md` (features only)
- [ ] Feature file changes are detected and tracked in active session
- [ ] Spec file changes do NOT trigger session tracking
- [ ] Diagram file changes do NOT trigger session tracking
- [ ] Model file changes do NOT trigger session tracking
- [ ] Actor file changes do NOT trigger session tracking
- [ ] Context file changes do NOT trigger session tracking
- [ ] Session file still updates correctly when features are modified

## Dependencies

None - this is a foundational change that other stories build upon.

