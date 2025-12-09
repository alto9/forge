---
task_id: 013-update-readme-with-migration-guide
session_id: migrate-mcp-server-functionality-to-cursor-command
feature_id:
  - cursor-commands-migration
spec_id:
  - monorepo-to-single-package
status: completed
---

# Update README with Migration Guide

## Objective

Update the repository README to remove MCP server documentation and add a comprehensive migration guide for users upgrading from v1.x to v2.0.

## Context

Users need clear instructions on migrating from the MCP-based v1.x to the command-based v2.0, including what changed and how to adapt their workflows.

## Steps

1. **Remove MCP Server Sections**:
   - Delete "MCP Server Installation" section
   - Delete MCP configuration examples
   - Delete references to `get_forge_about` and other MCP tools

2. **Add "Cursor Commands" Section**:
   - Explain that Forge now uses native Cursor commands
   - List available commands: `/forge`, `/forge-design`, `/forge-build`, `/forge-sync`, `/forge-scribe`
   - Explain that commands are automatically created during initialization
   - Show example usage patterns

3. **Add "Migrating from v1.x to v2.0" Section**:
   ```markdown
   ## Migrating from v1.x to v2.0
   
   Version 2.0 removes the MCP server and migrates functionality to native Cursor commands.
   
   ### Steps:
   
   1. Remove MCP server configuration from `~/.config/Claude/claude_desktop_config.json` or Cursor MCP settings
   2. Update Forge extension to v2.0.0
   3. Re-initialize Forge projects to get new command files
   4. Use Cursor commands instead of MCP tools:
      - Instead of calling `get_forge_about` → Use `/forge` command
      - Instead of calling `get_forge_schema` → Use `/forge-design` (schemas embedded)
      - Instead of calling `get_forge_context` → Context files in ai/contexts/
   
   ### Breaking Changes:
   
   - MCP server no longer exists
   - MCP tools (`get_forge_about`, `get_forge_schema`, `get_forge_context`, `get_forge_objects`) removed
   - Repository structure changed from monorepo to single package
   - All functionality now available through Cursor commands
   
   ### Benefits:
   
   - No external configuration required
   - Faster loading (no MCP initialization)
   - Simpler architecture
   - Better integration with Cursor
   ```

4. **Update "Getting Started" Section**:
   - Focus on extension installation only
   - Remove any MCP setup steps
   - Emphasize that commands work immediately

## Acceptance Criteria

- [ ] All MCP server documentation removed
- [ ] "Cursor Commands" section added with command list
- [ ] Complete migration guide included
- [ ] Breaking changes clearly documented
- [ ] Benefits section highlights improvements
- [ ] "Getting Started" simplified and accurate

## Estimated Time

30 minutes

## Dependencies

Can be done in parallel with technical stories (010-012)

## Notes

This is user-facing documentation and critical for smooth migration. Be clear, concise, and empathetic to users who need to make changes to their setup.

