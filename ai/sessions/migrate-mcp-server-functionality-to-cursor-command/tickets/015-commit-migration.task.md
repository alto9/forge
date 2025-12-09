---
task_id: 015-commit-migration
session_id: migrate-mcp-server-functionality-to-cursor-command
feature_id:
  - cursor-commands-migration
spec_id:
  - monorepo-to-single-package
status: completed
---

# Commit and Push Migration

## Objective

Commit all migration changes with proper semantic versioning commit message and push to GitHub for review and release.

## Context

After validating the migration works correctly, commit all changes with a breaking change commit message to trigger semantic-release for v2.0.0.

## Steps

1. **Stage All Changes**:
   ```bash
   git add -A
   ```

2. **Review Changes**:
   ```bash
   git status
   git diff --cached --stat
   ```
   - Verify all expected files are staged
   - Check that no unintended files are included

3. **Commit with Breaking Change Message**:
   ```bash
   git commit -m "feat!: migrate to single package, remove MCP server

BREAKING CHANGE: Remove MCP server and migrate to native Cursor commands.

Migration Details:
- MCP server package removed entirely
- Functionality migrated to native Cursor commands (/forge, /forge-design)
- Repository structure changed from monorepo to single VSCode extension package
- Command templates created during project initialization
- All document schemas embedded in /forge-design command

User Impact:
- Users must remove MCP server from their configuration
- All functionality preserved through native Cursor commands
- Commands work immediately without external setup
- No MCP tools (get_forge_about, get_forge_schema) available

Benefits:
- Simpler architecture (one package instead of monorepo)
- Faster loading (no MCP server initialization)
- Better integration (native Cursor command system)
- Easier maintenance (single codebase)
- Improved user experience (no configuration required)"
   ```

4. **Push to GitHub**:
   ```bash
   git push origin migrate-to-single-package
   ```

5. **Create Pull Request**:
   - Open PR from `migrate-to-single-package` to `main`
   - Title: "feat!: Migrate to single package, remove MCP server (v2.0.0)"
   - Description: Include migration details, breaking changes, and testing results
   - Request review if applicable

6. **Merge to Main**:
   - After approval, merge PR to main
   - Semantic-release will automatically create v2.0.0 release
   - Verify GitHub release is created
   - Verify extension is published to VSCode Marketplace

## Acceptance Criteria

- [ ] All changes staged
- [ ] Commit message follows conventional commits with breaking change
- [ ] Commit includes comprehensive migration details
- [ ] Changes pushed to GitHub
- [ ] Pull request created with clear description
- [ ] PR merged to main (after review if applicable)
- [ ] Semantic-release triggers and creates v2.0.0
- [ ] GitHub release created with release notes
- [ ] Extension published to VSCode Marketplace

## Estimated Time

15 minutes (plus review time)

## Dependencies

- Requires: 014-test-build-and-package
- Requires: 013-update-readme-with-migration-guide
- Requires: 012-remove-old-workflows

## Notes

The `feat!:` prefix and `BREAKING CHANGE:` footer in the commit message will trigger semantic-release to create a major version (v2.0.0) release. Ensure the commit message is comprehensive since it will appear in release notes.

