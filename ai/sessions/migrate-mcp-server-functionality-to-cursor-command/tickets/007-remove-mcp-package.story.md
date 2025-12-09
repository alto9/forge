---
story_id: 007-remove-mcp-package
session_id: migrate-mcp-server-functionality-to-cursor-command
feature_id:
  - cursor-commands-migration
spec_id:
  - monorepo-to-single-package
status: completed
---

# Remove MCP Server Package and Directory

## Objective

Delete the entire MCP server package and the now-empty `packages/` directory from the repository.

## Context

With the extension moved to root and command templates replacing MCP functionality, the MCP server package is no longer needed.

## Files to Delete

```bash
# Remove MCP server package
rm -rf packages/mcp-server

# Remove now-empty packages directory
rm -rf packages/
```

## Implementation Steps

1. Verify no files remain in `packages/vscode-extension/` (should be empty from previous move)
2. Delete `packages/mcp-server/` directory entirely
3. Delete `packages/` directory
4. Stage deletions:
   ```bash
   git rm -rf packages/
   ```
5. Verify no lingering references to `packages/` in any files

## Acceptance Criteria

- [ ] `packages/mcp-server/` directory deleted
- [ ] `packages/` directory deleted
- [ ] Git recognizes deletions (staged for commit)
- [ ] No references to `packages/` in remaining codebase
- [ ] No MCP server code remains

## Estimated Time

10 minutes

## Dependencies

- Requires: 006-merge-package-json

## Notes

This is a straightforward deletion. Using `git rm -rf` ensures git tracks the removal. The MCP server code will still be in git history if needed for reference.

