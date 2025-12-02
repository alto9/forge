# Release Process

Forge uses automated versioning and publishing based on [Conventional Commits](https://www.conventionalcommits.org/).

## Pre-Publish Checklist

Before your first release, verify the following are configured:

### Package Configuration

**MCP Server (`packages/mcp-server/package.json`):**
- ✅ `license` field present (MIT)
- ✅ `author` field present
- ✅ `keywords` array present for npm discoverability
- ✅ `files` array specifies what gets published (`dist`, `README.md`)
- ✅ `name` is available on npm (check https://www.npmjs.com/package/@forge/mcp-server)

**VSCode Extension (`packages/vscode-extension/package.json`):**
- ✅ `license` field present (MIT)
- ✅ `author` field present
- ✅ `keywords` array present for marketplace discoverability
- ✅ `categories` set appropriately
- ✅ `galleryBanner` configured for branding
- ✅ `publisher` exists on marketplace (verify at https://marketplace.visualstudio.com/manage/publishers/alto9)
- ⚠️ `icon` field (optional but recommended - 128x128 PNG at `media/icon.png`)

### GitHub Secrets

- ✅ `NPM_TOKEN` configured in GitHub repository secrets
- ✅ `VSCE_PAT` configured in GitHub repository secrets
- ✅ `GITHUB_TOKEN` (automatically provided by GitHub Actions)

### Local Testing

Before pushing to main, test locally:

```bash
# Test what would be published to npm
cd packages/mcp-server
npm pack
# Check the generated .tgz file contents

# Test VSCode extension packaging
cd packages/vscode-extension
npx @vscode/vsce package
# Check the generated .vsix file

# Test semantic-release dry-run (from repo root)
npm run release:dry-run
```

## Automated Release Process

When you merge commits to the `main` branch, the release workflow automatically:

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
2. **Package VSCode extension (pre-release)**: Creates initial `.vsix` file with current version
3. **Release**: Runs semantic-release which:
   - Analyzes commits since last release
   - Determines next version
   - Updates versions in all `package.json` files via `sync-versions.js`
   - Updates `CHANGELOG.md`
   - Publishes `@forge/mcp-server` to npm
   - Creates a git tag and GitHub release with `.vsix` attached
4. **Re-package VSCode extension (post-release)**: Creates `.vsix` file with the new version
5. **Publish**: Publishes VSCode extension to marketplace using the versioned `.vsix` file

## Required Secrets

The following secrets are configured in GitHub repository settings:

### NPM_TOKEN
- **Purpose**: Publishes `@forge/mcp-server` to npm
- **Status**: ✅ Configured
- **How to get** (if needed): 
  1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
  2. Create a new "Automation" token
  3. Copy the token
  4. In GitHub repo: Settings → Secrets and variables → Actions → New repository secret
  5. Name: `NPM_TOKEN`, Value: (paste token)

### VSCE_PAT
- **Purpose**: Publishes VSCode extension to marketplace
- **Status**: ✅ Configured
- **How to get** (if needed):
  1. Go to https://dev.azure.com/YOUR_ORG/_usersSettings/tokens
  2. Create a new token with "Marketplace → Manage" scope (full access)
  3. Copy the token
  4. In GitHub repo: Settings → Secrets and variables → Actions → New repository secret
  5. Name: `VSCE_PAT`, Value: (paste token)

### GITHUB_TOKEN
- **Purpose**: Creates releases and tags (automatically provided by GitHub Actions)
- **Status**: ✅ Automatic
- **Note**: No action needed, this is automatically available in all workflows

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
- Check that commits use conventional commit format (`feat:`, `fix:`, etc.)
- Verify you're pushing to `main` or `master` branch
- Check GitHub Actions logs for errors
- Ensure at least one commit requires a version bump (not just `docs:` or `chore:`)

### Version not updating
- Ensure commit messages follow conventional format
- Check that semantic-release can access the repository
- Verify `NPM_TOKEN` secret is configured
- Look for errors in the "Run semantic-release" step

### VSCode extension not publishing
- Verify `VSCE_PAT` secret is configured and has correct permissions
- Check that the extension builds successfully in the "Build packages" step
- Verify the `.vsix` file was created in "Re-package VSCode extension" step
- Review workflow logs for publishing errors
- Check that `vsce publish` command can find the `.vsix` file

### .vsix file not attached to GitHub release
- Ensure the `.vsix` file exists before semantic-release runs
- Check the path pattern in `.releaserc.json` matches the actual file
- Verify the "Package VSCode extension (pre-release)" step completed successfully

### npm package not publishing
- Verify `NPM_TOKEN` has correct permissions (must be "Automation" token)
- Check that the package name is available on npm
- Ensure `packages/mcp-server/package.json` is valid
- Review the semantic-release logs for npm-specific errors

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

## First-Time Publishing Verification

### NPM Package (@forge/mcp-server)

Before the first publish to npm:

1. **Verify package name availability**: Check that `@forge/mcp-server` is available on npmjs.com
2. **Test local build**: Run `npm run build` from repo root
3. **Inspect package contents**: Run `npm pack` in `packages/mcp-server/` and check the `.tgz` file
4. **Verify `files` field**: Ensure only `dist/` and `README.md` are included
5. **Check npm credentials**: Ensure `NPM_TOKEN` has publish access to `@forge` scope (if scoped)

### VSCode Extension

Before the first publish to marketplace:

1. **Verify publisher**: Ensure publisher "alto9" exists at https://marketplace.visualstudio.com/manage/publishers/alto9
2. **Test local packaging**: Run `npx @vscode/vsce package` in `packages/vscode-extension/`
3. **Install locally**: Test the `.vsix` file by installing it in VSCode
4. **Check VSCE_PAT permissions**: Ensure the token has "Marketplace (Manage)" scope
5. **Consider icon**: Add a 128x128 PNG icon at `media/icon.png` for better marketplace visibility (optional)

### Repository Configuration

1. **GitHub secrets configured**: Both `NPM_TOKEN` and `VSCE_PAT` in repository settings
2. **Branch protection**: Ensure `main`/`master` branch is protected
3. **Workflow permissions**: Verify GitHub Actions has permission to create releases and push tags

