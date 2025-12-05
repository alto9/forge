---
story_id: remove-context-schema
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: completed
priority: high
estimated_minutes: 15
---

## Objective
Remove `context` from the `schema_type` enum and remove the context schema definition from `get_forge_schema` tool.

## Context
The `get_forge_schema` tool provides schemas for all Forge file types. Since contexts are being removed, the context schema should no longer be available.

## Implementation Steps
1. Locate the `get_forge_schema` implementation in MCP server
2. Find the `schema_type` enum definition
3. Remove `context` from the enum values
4. Remove the context schema case/handler
5. Update any type definitions that reference the context schema
6. Run tests to verify schema tool still works for other types

## Files Affected
- `packages/mcp-server/src/tools/schema.ts` (or equivalent) - Remove context enum value and schema
- Type definitions - Update schema_type enum

## Acceptance Criteria
- [x] `schema_type` enum no longer includes `context`
- [x] Calling `get_forge_schema` with `schema_type: "context"` returns error or undefined
- [x] Other schema types (session, feature, spec, diagram, actor, story, task) still work
- [x] All tests pass
- [x] TypeScript builds without errors

## Dependencies
- Depends on: 001-remove-mcp-context-tools

