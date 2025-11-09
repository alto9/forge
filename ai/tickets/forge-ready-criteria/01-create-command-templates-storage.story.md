---
story_id: create-command-templates-storage
session_id: forge-ready-criteria
feature_id: [welcome-screen]
spec_id: [cursor-commands-management]
model_id: []
status: completed
priority: high
estimated_minutes: 25
---

## Objective

Create the template storage system for Cursor command files with constants for forge-design.md and forge-build.md templates.

## Context

Forge needs to distribute and validate Cursor command files as part of project initialization. These templates are stored in the extension code and used to create command files in user projects.

## Implementation Steps

1. Create `packages/vscode-extension/src/templates/cursorCommands.ts`
2. Define `FORGE_DESIGN_TEMPLATE` constant with the design command content
3. Define `FORGE_BUILD_TEMPLATE` constant with the build command content
4. Create `COMMAND_TEMPLATES` map to store path-to-template mappings
5. Export `getManagedCommandPaths()` function to return array of managed command paths
6. Export `getCommandTemplate(commandPath: string)` function to retrieve template by path

## Files Affected

- `packages/vscode-extension/src/templates/cursorCommands.ts` - Create new file with template constants

## Acceptance Criteria

- [ ] cursorCommands.ts file created with both template constants
- [ ] FORGE_DESIGN_TEMPLATE contains complete markdown content for design command
- [ ] FORGE_BUILD_TEMPLATE contains complete markdown content for build command
- [ ] COMMAND_TEMPLATES maps `.cursor/commands/forge-design.md` and `.cursor/commands/forge-build.md` to templates
- [ ] getManagedCommandPaths() returns array of both command paths
- [ ] getCommandTemplate() returns correct template for valid path
- [ ] getCommandTemplate() returns undefined for invalid path

## Dependencies

None

