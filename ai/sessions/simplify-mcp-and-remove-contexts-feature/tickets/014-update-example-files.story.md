---
story_id: update-example-files
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: completed
priority: low
estimated_minutes: 15
---

## Objective
Update EXAMPLES and example files to remove context usage and context_id references.

## Context
The repository likely includes example files showing how to use Forge. These examples need to be updated to remove context references and show the new 4-document-type system.

## Implementation Steps
1. Locate EXAMPLES file or examples directory
2. Remove any example context files
3. Update example feature files to remove context_id fields
4. Update example spec files to remove context_id fields
5. Update example story files to remove context_id fields
6. Update example descriptions to show 4 document types
7. Verify examples are consistent with new workflow

## Files Affected
- `EXAMPLES.md` or `examples/` directory - Remove context examples
- Example feature files - Remove context_id
- Example spec files - Remove context_id
- Example story files - Remove context_id

## Acceptance Criteria
- [x] No example context files remain
- [x] Example frontmatter doesn't include context_id
- [x] Examples show 4 document type system
- [x] Examples are consistent with updated workflow
- [x] Examples are clear and helpful

## Dependencies
- Can be done in parallel with other documentation updates

