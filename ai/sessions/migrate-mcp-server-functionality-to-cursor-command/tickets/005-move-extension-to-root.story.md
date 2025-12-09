---
story_id: 005-move-extension-to-root
session_id: migrate-mcp-server-functionality-to-cursor-command
feature_id:
  - cursor-commands-migration
spec_id:
  - monorepo-to-single-package
status: completed
---

# Move VSCode Extension Files to Root

## Objective

Move all VSCode extension files from `packages/vscode-extension/` to the repository root, maintaining git history.

## Context

Transforming from monorepo to single package requires moving the extension's source code, configuration files, and metadata to the root level.

## Files to Move

Execute the following moves:

```bash
# Source files
git mv packages/vscode-extension/src ./src
git mv packages/vscode-extension/dist ./dist

# Build configuration
git mv packages/vscode-extension/webpack.config.js ./webpack.config.js
git mv packages/vscode-extension/tsconfig.json ./tsconfig.json

# Package metadata
git mv packages/vscode-extension/README.md ./README.md
git mv packages/vscode-extension/.vscodeignore ./.vscodeignore
git mv packages/vscode-extension/.eslintrc.json ./.eslintrc.json

# Package file (will be merged in next story)
git mv packages/vscode-extension/package.json ./package-extension.json
```

## Implementation Steps

1. Use `git mv` commands above to preserve history
2. Verify all files moved correctly
3. Temporarily rename `package.json` to `package-extension.json` (will merge with root package.json in next story)
4. Stage all moves for commit
5. DO NOT delete `packages/` directory yet (next story will handle)

## Acceptance Criteria

- [ ] All source files moved to root-level `src/`
- [ ] All configuration files moved to root
- [ ] All metadata files moved to root
- [ ] Git history preserved for all moves
- [ ] No files left in `packages/vscode-extension/` except empty structure
- [ ] All moves staged but not yet committed

## Estimated Time

15 minutes

## Dependencies

- Requires: 004-backup-and-create-migration-branch

## Notes

Using `git mv` instead of regular `mv` ensures git tracks the file history through the move. The actual commit will happen after the package.json merge in the next story.

