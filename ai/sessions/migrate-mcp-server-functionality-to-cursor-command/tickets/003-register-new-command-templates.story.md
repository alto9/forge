---
story_id: 003-register-new-command-templates
session_id: migrate-mcp-server-functionality-to-cursor-command
feature_id:
  - cursor-commands-migration
spec_id:
  - forge-command
  - cursor-commands-management
status: completed
---

# Register New Command Templates in Template Map

## Objective

Add the new `/forge` command to the `COMMAND_TEMPLATES` map and update `getManagedCommandPaths()` to include it in project initialization.

## Context

The extension's template management system uses a map to track all managed command files. The new `/forge` command needs to be registered so it's created during project initialization and validated for updates.

## Files to Modify

- `packages/vscode-extension/src/templates/cursorCommands.ts`

## Implementation Steps

1. Add new entry to `COMMAND_TEMPLATES` Record:
   ```typescript
   export const COMMAND_TEMPLATES: Record<string, string> = {
     '.cursor/commands/forge.md': FORGE_COMMAND_TEMPLATE,
     '.cursor/commands/forge-design.md': FORGE_DESIGN_TEMPLATE,
     '.cursor/commands/forge-build.md': FORGE_BUILD_TEMPLATE,
     '.cursor/commands/forge-sync.md': FORGE_SYNC_TEMPLATE,
     '.cursor/commands/forge-scribe.md': FORGE_SCRIBE_TEMPLATE
   };
   ```
2. Verify `getManagedCommandPaths()` automatically returns all keys from the map
3. Verify `getCommandTemplate()` works for the new command path

## Acceptance Criteria

- [ ] New `/forge` command registered in `COMMAND_TEMPLATES` map
- [ ] All existing commands remain in the map
- [ ] `getManagedCommandPaths()` returns new command path
- [ ] `getCommandTemplate('.cursor/commands/forge.md')` returns template
- [ ] No changes needed to helper functions

## Estimated Time

10 minutes

## Dependencies

- Requires: 001-create-forge-command-template
- Requires: 002-enhance-forge-design-template

## Notes

This is a simple registration step but critical for the extension to manage the new command file during initialization.

