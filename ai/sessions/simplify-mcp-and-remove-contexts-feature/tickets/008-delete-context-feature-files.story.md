---
story_id: delete-context-feature-files
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: completed
priority: medium
estimated_minutes: 10
---

## Objective
Delete the 4 context feature files from `ai/features/studio/contexts/` directory.

## Context
The Studio UI had features for managing contexts (creation, editing, list view, detail view). Since contexts are being removed, these feature files are no longer needed.

## Implementation Steps
1. Locate `ai/features/studio/contexts/` directory
2. Identify the 4 feature files to delete:
   - `context-creation.feature.md`
   - `context-editing.feature.md`
   - `contexts-list.feature.md`
   - `context-detail-view.feature.md`
3. Delete all 4 files
4. Delete the `contexts/` directory if now empty
5. Verify no other files reference these feature files

## Files Affected
- `ai/features/studio/contexts/context-creation.feature.md` - Delete
- `ai/features/studio/contexts/context-editing.feature.md` - Delete
- `ai/features/studio/contexts/contexts-list.feature.md` - Delete
- `ai/features/studio/contexts/context-detail-view.feature.md` - Delete
- `ai/features/studio/contexts/` directory - Delete if empty

## Acceptance Criteria
- [x] All 4 context feature files are deleted
- [x] `contexts/` directory is deleted
- [x] No broken references to these files exist
- [x] Git shows the deletions correctly

## Dependencies
- Can be done in parallel with other Studio changes

