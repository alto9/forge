---
story_id: 010-create-unified-release-workflow
session_id: migrate-mcp-server-functionality-to-cursor-command
feature_id:
  - cursor-commands-migration
spec_id:
  - monorepo-to-single-package
status: completed
---

# Create Unified Release Workflow

## Objective

Create a single GitHub Actions workflow that handles building and releasing the VSCode extension only, replacing the separate extension and MCP workflows.

## Context

With the monorepo eliminated, we need a simplified CI/CD pipeline that focuses solely on the VSCode extension release process.

## Files to Create

- `.github/workflows/release.yml`

## Implementation Steps

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Build extension
        run: npm run build

      - name: Package extension
        run: npm run package

      - name: Semantic Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
        run: npx semantic-release
```

## Acceptance Criteria

- [ ] New `release.yml` workflow file created
- [ ] Workflow triggers on push to main branch
- [ ] Uses Node.js 22 as specified in package.json
- [ ] Runs `npm ci`, `npm run build`, `npm run package`
- [ ] Integrates with semantic-release for automated releases
- [ ] Uses correct environment variables (GITHUB_TOKEN, VSCE_PAT)
- [ ] No references to MCP server or multiple packages

## Estimated Time

15 minutes

## Dependencies

- Requires: 009-remove-mcp-imports (build must work)

## Notes

This workflow replaces both `release-extension.yml` and `release-mcp.yml`. It's simpler and faster since it only handles one package. The old workflow files will be deleted in a subsequent task.

