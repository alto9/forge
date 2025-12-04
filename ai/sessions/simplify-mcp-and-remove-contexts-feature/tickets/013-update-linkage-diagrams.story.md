---
story_id: update-linkage-diagrams
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: completed
priority: medium
estimated_minutes: 20
---

## Objective
Update linkage system diagrams in `ai/diagrams/` to remove context nodes and context_id connections.

## Context
Forge includes diagram files showing the linkage system between different document types. These diagrams need to be updated to show the new linkage path: Features → Specs → Diagrams → Actors (without Contexts).

## Implementation Steps
1. Find all diagram files that show linkage system relationships
2. Update diagrams to remove Context nodes
3. Remove context_id arrows/edges from diagrams
4. Update diagram descriptions to reflect 4 document types
5. Verify diagrams are syntactically correct (valid react-flow JSON)
6. Test diagrams render correctly in Studio (if applicable)

## Files Affected
- Linkage system diagrams in `ai/diagrams/` - Remove context nodes and edges
- Diagram descriptions - Update to show current linkage system

## Acceptance Criteria
- [x] All linkage diagrams no longer show Context nodes
- [x] No context_id linkages shown in diagrams
- [x] Diagrams show clear path: Features → Specs → Diagrams → Actors
- [x] Diagram JSON is valid and renders correctly
- [x] Diagram descriptions are accurate

## Dependencies
- Can be done in parallel with other documentation updates

