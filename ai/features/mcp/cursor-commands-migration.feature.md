---
feature_id: cursor-commands-migration
name: Native Cursor Commands Migration
description: Migration from MCP server to native Cursor commands for Forge workflow guidance
spec_id:
  - cursor-commands-management
---

# Native Cursor Commands Migration

## Overview

This feature describes the migration from MCP server-based tools to native Cursor commands, providing a simpler, more integrated experience for users.

## Scenarios

```gherkin
Scenario: Use /forge command for workflow guidance
  Given a developer working in a Forge project
  When they need to understand the Forge workflow
  Then they should run the /forge command
  And they should receive comprehensive workflow overview
  And they should understand session-driven approach
  And they should know when to create Stories vs Tasks
  And they should receive minimal story size guidance
  And this command should work without any MCP server configuration
```

```gherkin
Scenario: Use /forge-design with embedded schemas
  Given a developer in an active design session
  When they need to create or update AI documentation
  Then they should run the /forge-design command
  And the command should include all document schemas inline
  And schemas should cover: Actor, Feature, Spec, Diagram
  And they should not need to call any external MCP tools
  And all guidance should be self-contained in the command file
```

```gherkin
Scenario: Combine /forge with other commands
  Given a developer needs complete context for a workflow
  When they run a Forge command
  Then they should combine /forge with the specific command
  And example usage should be: "/forge /forge-design"
  And example usage should be: "/forge /forge-build"
  And this provides foundational context plus specific guidance
```

```gherkin
Scenario: No MCP configuration required
  Given a new Forge user
  When they install the VSCode extension
  Then all Cursor commands should be automatically available
  And they should not need to configure MCP servers
  And they should not need Claude Desktop or external tools
  And the extension should create command files during initialization
  And commands should work immediately out of the box
```

```gherkin
Scenario: Migrate existing users from MCP to commands
  Given an existing Forge user with MCP server configured
  When they upgrade to v2.0.0 of the extension
  Then they should receive migration instructions
  And they should remove MCP server from their configuration
  And they should use new Cursor commands instead
  And all functionality should remain available through commands
  And the upgrade should be a one-time breaking change
```

```gherkin
Scenario: Validate command files during initialization
  Given a Forge project being initialized
  When the extension creates Cursor command files
  Then each command file should include a content hash
  And the hash should validate file integrity
  And outdated command files should be detected
  And users should be prompted to update outdated commands
```

## Benefits

- **Simpler Architecture**: Single VSCode extension package instead of monorepo
- **Faster Loading**: No MCP server initialization or startup overhead
- **Better Integration**: Native Cursor command system, no external dependencies
- **Easier Maintenance**: Single codebase without workspace management
- **Improved User Experience**: Commands work immediately without configuration
- **Reduced Support Burden**: No MCP troubleshooting or configuration issues

## Breaking Changes

This is a **breaking change** requiring major version (v2.0.0):

1. Users must remove MCP server from their configuration
2. MCP tools (`get_forge_about`, `get_forge_schema`, etc.) are no longer available
3. All functionality migrated to Cursor commands
4. Extension structure changes from monorepo to single package

