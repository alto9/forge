# Release Process

Forge uses automated versioning and publishing based on [Conventional Commits](https://www.conventionalcommits.org/). When you merge commits to the `main` branch, the release workflow automatically:

1. Analyzes commit messages to determine the next version
2. Updates all `package.json` files with the new version
3. Generates/updates `CHANGELOG.md`
4. Creates a git tag
5. Publishes `@forge/mcp-server` to npm
6. Publishes the VSCode extension to the marketplace

## How It Works

### Commit Message Analysis

The system uses semantic-release to analyze commit messages and determine version bumps:

- **feat**: New feature → Minor version bump (0.1.0 → 0.2.0)
- **fix**: Bug fix → Patch version bump (0.1.0 → 0.1.1)
- **feat!** or **BREAKING CHANGE**: Breaking change → Major version bump (0.1.0 → 1.0.0)
- **docs**, **style**, **refactor**, **test**, **chore**, **ci**, **build**: No version bump

### Release Workflow

The `.github/workflows/release.yml` workflow runs on every push to `main`:

1. **Build**: Compiles all packages
2. **Release**: Runs semantic-release which:
   - Analyzes commits since last release
   - Determines next version
   - Updates versions in all `package.json` files
   - Updates `CHANGELOG.md`
   - Publishes `@forge/mcp-server` to npm
   - Creates a git tag and GitHub release
3. **Package**: Creates `.vsix` file for VSCode extension
4. **Publish**: Publishes VSCode extension to marketplace

## Required Secrets

Configure these secrets in your GitHub repository settings:

### NPM_TOKEN
- **Purpose**: Publishes `@forge/mcp-server` to npm
- **How to get**: 
  1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
  2. Create a new "Automation" token
  3. Copy the token and add it as `NPM_TOKEN` secret in GitHub

### VSCE_PAT
- **Purpose**: Publishes VSCode extension to marketplace
- **How to get**:
  1. Go to https://marketplace.visualstudio.com/manage
  2. Create a Personal Access Token
  3. Copy the token and add it as `VSCE_PAT` secret in GitHub

### GITHUB_TOKEN
- **Purpose**: Creates releases and tags (automatically provided by GitHub Actions)
- **Note**: No action needed, this is automatically available

## Testing Releases

You can test what would be released without actually publishing:

```bash
npm run release:dry-run
```

This shows:
- What version would be released
- Which commits would be included
- What would be published

## Manual Release (If Needed)

If you need to manually trigger a release or skip the automated process:

```bash
# Set version manually (not recommended)
npm version patch|minor|major

# Or use semantic-release manually
npm run release
```

## Version Synchronization

All packages in the monorepo share the same version number. The `scripts/sync-versions.js` script ensures:

- Root `package.json`
- `packages/mcp-server/package.json`
- `packages/vscode-extension/package.json`

All have the same version after a release.

## Skipping Releases

To skip a release, include `[skip release]` or `[no release]` in your commit message:

```bash
git commit -m "docs: update README [skip release]"
```

## Troubleshooting

### Release didn't trigger
- Check that commits use conventional commit format
- Verify you're pushing to `main` or `master` branch
- Check GitHub Actions logs for errors

### Version not updating
- Ensure commit messages follow conventional format
- Check that semantic-release can access the repository
- Verify `NPM_TOKEN` secret is configured

### VSCode extension not publishing
- Verify `VSCE_PAT` secret is configured
- Check that the extension builds successfully
- Review workflow logs for publishing errors

## Examples

### Patch Release (Bug Fix)
```bash
git commit -m "fix(studio): resolve session save issue"
git push origin main
# → Releases 0.1.0 → 0.1.1
```

### Minor Release (New Feature)
```bash
git commit -m "feat(studio): add diagram export feature"
git push origin main
# → Releases 0.1.0 → 0.2.0
```

### Major Release (Breaking Change)
```bash
git commit -m "feat!: redesign session workflow

BREAKING CHANGE: Session file format has changed"
git push origin main
# → Releases 0.1.0 → 1.0.0
```

## Configuration Files

- `.releaserc.json`: Semantic-release configuration
- `.github/workflows/release.yml`: GitHub Actions workflow
- `scripts/sync-versions.js`: Version synchronization script
- `CHANGELOG.md`: Auto-generated changelog

