---
task_id: 012-remove-old-workflows
session_id: migrate-mcp-server-functionality-to-cursor-command
feature_id:
  - cursor-commands-migration
spec_id:
  - monorepo-to-single-package
status: completed
---

# Remove Old Workflow Files

## Objective

Delete the old separate workflow files for extension and MCP server releases, now replaced by the unified release workflow.

## Context

With the new unified `release.yml` workflow in place, the old workflows are no longer needed and would conflict if left in place.

## Steps

1. Delete old workflow files:
   ```bash
   git rm .github/workflows/release-extension.yml
   git rm .github/workflows/release-mcp.yml
   ```

2. Verify only `release.yml` remains:
   ```bash
   ls -la .github/workflows/
   ```

3. Check for any other monorepo-specific workflow files and remove if found

4. Stage deletions for commit

## Acceptance Criteria

- [ ] `release-extension.yml` deleted
- [ ] `release-mcp.yml` deleted
- [ ] Only `release.yml` remains in `.github/workflows/`
- [ ] Deletions staged with git
- [ ] No other monorepo-specific workflows remain

## Estimated Time

5 minutes

## Dependencies

- Requires: 011-update-semantic-release-config

## Notes

Simple cleanup task. The old workflows are no longer functional after the monorepo restructuring, so they must be removed to avoid confusion.

