---
session_id: simplify-mcp-and-remove-contexts-feature
start_time: '2025-12-03T13:56:54.842Z'
status: completed
problem_statement: Simplify MCP and Remove Contexts Feature
changed_files: []
start_commit: 7eeae1bc932c7c841568a07f626aefb6baa21872
end_time: '2025-12-03T14:27:48.193Z'
---
## Problem Statement

The **Contexts feature** was originally designed to provide just-in-time guidance for AI agents when implementing features. However, **the combination of Diagrams and Specs has proven to be significantly more powerful** than the scattered contexts system.

### Why Contexts Have Become Redundant

1. **Specs provide technical contracts and implementation details** - They define WHAT must be built with API contracts, data structures, validation rules, and integration points
2. **Diagrams provide visual architecture** - They show system structure, component relationships, and data flow using react-flow JSON format
3. **Element-level spec linking in diagrams** - Individual diagram nodes can reference specs via `node.data.spec_id`, providing granular, contextual documentation exactly where it's needed
4. **Clearer separation of concerns** - Features (directive) + Specs (technical) + Diagrams (visual) creates a more logical hierarchy than Features + Specs + Diagrams + Contexts
5. **Less cognitive overhead** - Three document types are easier to understand and maintain than four

The **linkage system** between features → specs → diagrams is sufficient for gathering complete context. The additional context layer adds complexity without proportional value.

## Goals

### Simplified Architecture
- Reduce from 5 document types to 4: Features (directive), Specs (technical), Diagrams (visual), Actors (personas)
- Create clearer mental model: "where does this information go?"
- Reduce duplication by consolidating technical guidance in specs and diagrams

### Improved Workflow
- Strengthen linkage system with clear path: Features → Specs → Diagrams
- Provide element-level granularity through diagram nodes linking to specs
- Reduce decision fatigue: eliminate "Should this be a spec or a context?" questions

### Better Maintainability
- Fewer files to manage and keep in sync
- Simpler MCP server with less code and fewer tools
- Reduced cognitive load for easier user onboarding

## Approach

### Phase 1: MCP Server Changes
**Remove these tools:**
- ❌ `get_forge_context` - No longer needed; specs and diagrams provide technical guidance
- ❌ `get_forge_objects` - No longer needed; was used to discover available guidance

**Keep these tools:**
- ✅ `get_forge_about` - Provides comprehensive workflow overview
- ✅ `get_forge_schema` - Returns schemas for all Forge file types (update to remove context schema)

**Remove guidance system:**
- Delete `packages/mcp-server/src/guidance/` directory and all `.spec.md` guidance files
- Remove guidance-related code from MCP server implementation

### Phase 2: Schema Changes
**Update `get_forge_schema`:**
- Remove `context` from the schema_type enum
- Remove context schema definition
- Update feature, spec, and story schemas to remove `context_id` field references

### Phase 3: Project Readiness Changes
**Update readiness validation:**
- Remove `ai/contexts` from `REQUIRED_FOLDERS` array in `packages/vscode-extension/src/utils/projectReadiness.ts`
- Update WelcomePanel's `REQUIRED_FOLDERS` constant to remove contexts entry
- Update all readiness-related tests to remove context folder checks

### Phase 4: Studio Changes
**Remove Context UI features:**
- Delete 4 context feature files in `ai/features/studio/contexts/`
- Remove Contexts section from Studio navigation menu
- Remove context-related UI components and state management

### Phase 5: Documentation Updates
**Update all references:**
- Remove context_id from file schema examples
- Remove references to `get_forge_context` and `get_forge_objects` from documentation
- Update linkage system diagrams to show: Features → Specs → Diagrams (no contexts)
- Update `get_forge_about` output to remove context references
- Update README, EXAMPLES, and other docs

### Phase 6: Cleanup Existing Context Files

**Approach**: Simply delete all existing context files and remove context_id references from frontmatter. No migration needed since software hasn't been released.

## Key Decisions

### Breaking Changes Acknowledged
This is a **major breaking change** that will affect:
- ❌ Existing `*.context.md` files will no longer be recognized by Forge
- ❌ `context_id` references in features/specs/stories will become invalid
- ❌ `get_forge_context` and `get_forge_objects` MCP tools will be removed
- ❌ Contexts section removed from Studio
- ❌ AI agents relying on `get_forge_context` will need to adapt

### Priority: High
This simplification will significantly improve Forge's clarity and maintainability. Since the software hasn't been released yet, we can make this breaking change cleanly without worrying about user migrations.

### Cleanup Strategy
For the Forge repository itself:
1. Delete the `ai/contexts/` directory entirely
2. Remove `context_id` references from all feature/spec/story frontmatter
3. No migration needed - contexts will simply be removed

## Notes

### Alignment with Core Principles
This change aligns with Forge's core principle of **"Accurate Context Without Overload"** - by removing the contexts layer, we reduce complexity while maintaining complete, accurate context through the Features → Specs → Diagrams linkage system.

### Implementation Checklist from Issue
- Remove `get_forge_context` and `get_forge_objects` from MCP server
- Delete `packages/mcp-server/src/guidance/` directory
- Remove context schema from `get_forge_schema`
- Remove `context` from schema_type enum
- Remove `ai/contexts` from `REQUIRED_FOLDERS` in `packages/vscode-extension/src/utils/projectReadiness.ts`
- Remove `ai/contexts` from `REQUIRED_FOLDERS` in `packages/vscode-extension/src/panels/WelcomePanel.ts`
- Update all readiness-related tests to remove context folder checks
- Delete 4 context feature files from `ai/features/studio/contexts/`
- Remove Contexts section from Studio navigation
- Remove context-related UI components
- Update `get_forge_about` to remove context references
- Update README and documentation
- Update EXAMPLES to remove context examples
- Update schemas to remove `context_id` fields
- Update linkage system documentation (Features → Specs → Diagrams → Actors)
- Delete existing context files and remove context_id references
- Update tests to remove context-related test cases

### Current State
- Existing context files in Forge repository will be deleted
- Context features fully functional in Studio (will be removed)
- MCP tools `get_forge_context` and `get_forge_objects` currently working (will be removed)
- Software hasn't been released, so no user migration concerns
