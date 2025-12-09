---
story_id: 011-update-semantic-release-config
session_id: migrate-mcp-server-functionality-to-cursor-command
feature_id:
  - cursor-commands-migration
spec_id:
  - monorepo-to-single-package
status: completed
---

# Update Semantic Release Configuration

## Objective

Update `.releaserc.json` to handle single-package releases with correct VSCode extension publishing commands.

## Context

Semantic-release needs updated configuration to package and publish the extension correctly without monorepo-specific logic.

## Files to Modify

- `.releaserc.json`

## Implementation Steps

Update `.releaserc.json`:

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        "prepareCmd": "npm run package",
        "publishCmd": "npx vsce publish --packagePath forge-${nextRelease.version}.vsix"
      }
    ],
    "@semantic-release/github"
  ]
}
```

## Acceptance Criteria

- [ ] Configuration focuses on single package
- [ ] `prepareCmd` runs `npm run package`
- [ ] `publishCmd` publishes .vsix file with correct version
- [ ] No monorepo-specific plugins or configuration
- [ ] Semantic versioning correctly applied
- [ ] GitHub releases will be created automatically

## Estimated Time

10 minutes

## Dependencies

- Requires: 010-create-unified-release-workflow

## Notes

This configuration works with the new release workflow to automate version bumping, changelog generation, and VSCode Marketplace publishing.

