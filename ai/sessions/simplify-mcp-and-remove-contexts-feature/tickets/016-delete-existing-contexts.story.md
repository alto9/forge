---
story_id: delete-existing-contexts
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: completed
priority: medium
estimated_minutes: 15
---

## Objective
Delete the `ai/contexts/` directory and all existing context files from the Forge repository.

## Context
The Forge repository contains existing context files that are no longer needed. Since contexts are being removed as a feature and there's no value in migrating them, they should simply be deleted.

## Implementation Steps
1. Delete the entire `ai/contexts/` directory
2. Find all files with `context_id` fields in frontmatter (features, specs, stories)
3. Remove `context_id: []` fields from all frontmatter
4. Search for any broken references to deleted context files
5. Verify the repository builds and works without contexts folder

## Files Affected
- `ai/contexts/` - Delete entire directory
- Feature files with context_id - Remove context_id field
- Spec files with context_id - Remove context_id field
- Story files with context_id - Remove context_id field

## Acceptance Criteria
- [x] `ai/contexts/` directory is completely deleted
- [x] No files contain `context_id` fields in frontmatter
- [x] No broken references to context files remain
- [x] Repository builds successfully
- [x] All tests pass
- [x] Forge functionality works without contexts

## Dependencies
- Can be done after MCP and readiness changes are complete

