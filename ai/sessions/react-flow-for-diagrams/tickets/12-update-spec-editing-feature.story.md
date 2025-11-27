---
story_id: update-spec-editing-feature
session_id: react-flow-for-diagrams
feature_id: [spec-editing]
spec_id: []
status: completed
priority: low
estimated_minutes: 10
---

# Update Spec Editing Feature for Diagram References

## Objective
Verify the spec editing feature correctly describes editing diagram references that use react-flow JSON format instead of nomnoml.

## Context
The spec-editing feature was modified during the design session to change how diagram editing is described. The feature now mentions editing diagram references and react-flow instead of editing nomnoml diagrams directly.

## Implementation Steps
1. Review `ai/features/studio/specs/spec-editing.feature.md` to understand the changes
2. The feature already includes:
   - "Edit diagram references" scenario
   - Mentions that diagrams are edited in separate diagram files using react-flow
   - Removed "Edit Nomnoml diagrams" scenario
3. Verify the feature file accurately reflects the new diagram editing approach
4. No code changes needed - this is a feature definition update that was already made during the design session

## Files Affected
- `ai/features/studio/specs/spec-editing.feature.md` - Already updated during design session (verify accuracy)

## Acceptance Criteria
- [ ] Feature file correctly describes editing diagram references
- [ ] Feature file mentions diagrams are edited in separate files
- [ ] Feature file mentions react-flow for diagram editing
- [ ] Feature file no longer references editing nomnoml directly
- [ ] "Edit diagram references" scenario is present
- [ ] "Edit Nomnoml diagrams" scenario is removed

## Dependencies
- None (feature definition was already updated, just verification)

## Notes
This story is primarily a verification that the feature definition changes made during the design session are correct. The actual implementation of spec editing UI will follow these feature definitions.

