---
story_id: update-get-forge-about
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: completed
priority: high
estimated_minutes: 30
---

## Objective
Update `get_forge_about` MCP tool output to remove all context references and update the linkage system documentation.

## Context
The `get_forge_about` tool provides comprehensive workflow overview. It currently documents contexts as an informative document type and includes them in the linkage system. All context references need to be removed.

## Implementation Steps
1. Locate the `get_forge_about` implementation in MCP server
2. Remove contexts from file structure documentation
3. Update "Directive vs Informative Documents" section to remove Contexts subsection
4. Update linkage system diagram to remove context linkages
5. Remove context references from "Context Building Checklist"
6. Update "Phase 2: Changed Files Analysis" to remove context_id extraction steps
7. Remove "get_forge_context" references from distillation guidance
8. Update workflow descriptions to remove context mentions
9. Test that `get_forge_about` returns updated documentation

## Files Affected
- `packages/mcp-server/src/tools/about.ts` (or equivalent) - Update documentation text
- About tool response data - Remove context sections

## Acceptance Criteria
- [x] `get_forge_about` output no longer mentions contexts
- [x] Linkage system shows: Features → Specs → Diagrams → Actors (no contexts)
- [x] Context Building Checklist no longer includes context steps
- [x] File structure documentation shows 4 document types (not 5)
- [x] All workflow descriptions are accurate without contexts
- [x] Tool returns successfully with updated content

## Dependencies
- Depends on: 001-remove-mcp-context-tools
- Depends on: 004-remove-context-id-from-schemas

