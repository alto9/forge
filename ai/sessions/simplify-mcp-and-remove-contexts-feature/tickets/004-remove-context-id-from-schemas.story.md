---
story_id: remove-context-id-from-schemas
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: pending
priority: high
estimated_minutes: 25
---

## Objective
Remove `context_id` field references from feature, spec, and story schemas returned by `get_forge_schema`.

## Context
Features, specs, and stories previously had `context_id` arrays for linking to context files. With contexts removed, these field references should be eliminated from the schemas.

## Implementation Steps
1. Locate schema definitions for feature, spec, and story types
2. Remove `context_id: []` from feature schema example
3. Remove `context_id: []` from spec schema example
4. Remove `context_id: []` from story schema example (if present)
5. Update schema descriptions to remove mentions of context linkages
6. Update any validation logic that checks for context_id
7. Test that schemas still return correctly without context_id

## Files Affected
- Feature schema definition - Remove context_id field
- Spec schema definition - Remove context_id field
- Story schema definition - Remove context_id field
- Schema validation logic - Remove context_id checks

## Acceptance Criteria
- [ ] Feature schema no longer includes `context_id` field
- [ ] Spec schema no longer includes `context_id` field
- [ ] Story schema no longer includes `context_id` field
- [ ] Schema descriptions no longer mention context linkages
- [ ] `get_forge_schema` returns updated schemas for all affected types
- [ ] All tests pass

## Dependencies
- Depends on: 003-remove-context-schema

