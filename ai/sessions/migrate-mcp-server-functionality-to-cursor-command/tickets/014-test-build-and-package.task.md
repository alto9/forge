---
task_id: 014-test-build-and-package
session_id: migrate-mcp-server-functionality-to-cursor-command
feature_id:
  - cursor-commands-migration
spec_id:
  - monorepo-to-single-package
status: completed
---

# Test Build and Package Process

## Objective

Validate that the migrated codebase builds and packages correctly, producing a functional .vsix file.

## Context

Before committing the migration, we need to ensure the single-package structure builds successfully and can be packaged for distribution.

## Steps

1. **Clean Install**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Test Build**:
   ```bash
   npm run build
   ```
   - Verify build completes without errors
   - Check that `dist/extension.js` is created
   - Verify no MCP-related errors

3. **Test Package**:
   ```bash
   npm run package
   ```
   - Verify .vsix file is created
   - Check filename format: `forge-2.0.0.vsix` (or similar)
   - Verify file size is reasonable

4. **Manual VSCode Test**:
   - Install the .vsix in VSCode: `code --install-extension forge-2.0.0.vsix`
   - Open Forge Studio command
   - Verify extension activates
   - Check that command files are created during initialization
   - Test creating a design session
   - Verify no console errors related to MCP

5. **Verify No References**:
   ```bash
   # Check for lingering MCP references
   grep -r "mcp-server" src/
   grep -r "@forge/mcp-server" dist/
   ```

## Acceptance Criteria

- [ ] Clean install completes successfully
- [ ] `npm run build` completes without errors
- [ ] `dist/extension.js` created and functional
- [ ] `npm run package` creates .vsix file
- [ ] Extension installs in VSCode
- [ ] Extension activates without errors
- [ ] Commands appear in command palette
- [ ] Forge Studio opens correctly
- [ ] Command files created during initialization
- [ ] No MCP-related errors in console
- [ ] No references to `mcp-server` in built code

## Estimated Time

20 minutes

## Dependencies

- Requires: 009-remove-mcp-imports
- Requires: 008-update-build-configuration

## Notes

This is a critical validation step. If any issues are found, fix them before proceeding to commit the migration. Test thoroughly to ensure a smooth user experience.

