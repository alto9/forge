---
session_id: migrate-mcp-server-functionality-to-cursor-command
start_time: '2025-12-09T16:15:12.818Z'
status: completed
problem_statement: >-
  Migrate MCP Server functionality to Cursor Commands and simplify repo
  structure
changed_files:
  - path: ai/features/mcp/cursor-commands-migration.feature.md
    change_type: added
    scenarios_added:
      - Use /forge command for workflow guidance
      - Use /forge-design with embedded schemas
      - Combine /forge with other commands
      - No MCP configuration required
      - Migrate existing users from MCP to commands
      - Validate command files during initialization
start_commit: d60f0ad582295993be3f45af59cb5de03f6fb3d7
end_time: '2025-12-09T16:27:15.361Z'
---
## Problem Statement

Migrate MCP Server functionality to Cursor Commands and simplify repo structure

## Goals

1. **Remove MCP Server Dependency**: Eliminate the `@forge/mcp-server` package entirely from the project
2. **Migrate to Native Cursor Commands**: Convert MCP tool functionality into native `.cursor/commands/*.md` files
3. **Simplify Repository Structure**: Transform from monorepo architecture to single VSCode extension package
4. **Maintain Feature Parity**: Ensure all existing MCP functionality is preserved through command files
5. **Streamline User Experience**: Remove need for users to configure MCP servers, use native Cursor integration instead

## Approach

### Phase 1: Create New Cursor Commands

**Create `/forge` Command** (`.cursor/commands/forge.md`):
- Replaces `get_forge_about` MCP tool functionality
- Contains comprehensive Forge workflow documentation
- Provides session-driven approach guidance
- Explains when to create Stories vs Tasks
- Documents minimal story size principles
- Should be used WITH all other Forge commands to provide context

**Enhance `/forge-design` Command**:
- Embed all document schemas directly in command file
- Include schemas for: Actor, Feature, Spec, Diagram
- Only 4 schemas, so context pollution should be minimal
- Remove MCP tool calls from command logic

### Phase 2: Repository Restructuring

**Flatten Monorepo Structure**:
- Move VSCode extension from `packages/vscode-extension/` to root
- Remove `packages/` directory entirely
- Update root `package.json` to reflect single-package structure
- Remove workspace configuration
- Simplify dependency management

**Remove MCP Server Package**:
- Delete `packages/mcp-server/` directory
- Remove all MCP-related dependencies
- Remove MCP build/publish scripts
- Clean up any MCP-specific configuration

### Phase 3: CI/CD Updates

**Update GitHub Actions Workflows**:
- Remove MCP server build steps
- Remove MCP server publish steps
- Focus exclusively on VSCode extension release workflow
- Update semantic-release configuration if needed
- Simplify build matrix

### Phase 4: Documentation Updates

**Update Repository Documentation**:
- Remove MCP server installation instructions from README
- Remove examples showing MCP configuration
- Update workflow documentation to reference commands instead of MCP tools
- Add migration guide for existing users
- Document breaking changes clearly

## Key Decisions

### Decision 1: Complete MCP Removal (Not Optional)
- **Rationale**: MCP adds complexity, startup overhead, and requires additional user configuration
- **Impact**: Breaking change requiring major version bump (v2.0.0)
- **Alternative Considered**: Keep MCP as optional - rejected due to maintenance burden

### Decision 2: Embed Schemas in Commands (Not Separate Files)
- **Rationale**: Only 4 schemas, minimal context pollution, keeps everything self-contained
- **Impact**: Simplifies command structure, no need for external schema files
- **Alternative Considered**: Separate schema files - rejected due to added complexity

### Decision 3: `/forge` Command as Companion
- **Rationale**: Provides foundational context that all other commands can reference
- **Impact**: Users should call `/forge` WITH other commands for complete context
- **Usage Pattern**: `/forge /forge-design` or `/forge /forge-build`

### Decision 4: Major Version Release (v2.0.0)
- **Rationale**: This is a breaking change for existing MCP users
- **Impact**: Clear communication required, migration guide essential
- **Migration Path**: Users remove MCP config, reinstall extension, use new commands

## Notes

### Breaking Changes Communication

Users will need to:
1. Remove MCP server from their Claude/Cursor MCP configuration
2. Re-install or update the VSCode extension
3. Use the new Cursor commands instead of MCP tools
4. Update any automation or scripts referencing MCP tools

### Benefits of This Migration

- **Simpler Architecture**: One package instead of monorepo
- **Faster Loading**: No MCP server initialization required
- **Better Integration**: Native Cursor command system
- **Easier Maintenance**: Single codebase without workspace dependencies
- **Reduced Complexity**: No need to manage MCP server installation/configuration
- **Improved User Experience**: Commands work out of the box without additional configuration

### Implementation Considerations

- Ensure `/forge` command content matches all information currently in `get_forge_about`
- Validate that schemas in `/forge-design` are complete and accurate
- Test all command workflows without MCP dependencies
- Verify CI/CD pipelines work correctly after restructuring
- Consider using feature flags during transition if needed

### Related Files to Track

As we make changes during this session, we'll track modified files here:
- New: `.cursor/commands/forge.md` (when created)
- Modified: `.cursor/commands/forge-design.md` (when schemas added)
- Features related to MCP server removal
- Specs related to repository restructuring

### Session Summary

This design session comprehensively documents the migration from MCP server to native Cursor commands based on GitHub issue #5.

**Documentation Created**:

1. **Feature**: `cursor-commands-migration.feature.md`
   - Defines user-facing scenarios for the migration
   - Documents benefits and breaking changes
   - Covers all migration use cases

2. **Specs**:
   - `monorepo-to-single-package.spec.md` - Complete migration steps for repository restructuring
   - `forge-command.spec.md` - Technical specification for new /forge command
   - `forge-design-enhanced.spec.md` - Specification for enhanced /forge-design with embedded schemas

3. **Diagram**: `monorepo-migration.diagram.md`
   - Visual before/after comparison of repository structure
   - Highlights removed, new, and breaking change elements
   - Provides migration path visualization

**Key Outcomes**:
- Complete technical roadmap for v2.0.0 release
- Detailed migration steps with validation checklists
- Breaking change documentation for users
- Benefits clearly articulated (simpler, faster, better UX)
- All functionality preserved through native Cursor commands

**Next Steps**:
When ready to implement, distill this session into Stories for:
- Creating /forge command template
- Enhancing /forge-design with schemas
- Repository restructuring tasks
- CI/CD workflow updates
- Documentation updates
- Testing and validation
