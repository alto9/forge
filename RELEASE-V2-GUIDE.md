# Release v2.0.0 Guide

## Summary of Changes

Based on your current changes, you've made significant breaking changes:
- ✅ Removed Forge Studio (tree provider and UI)
- ✅ Removed design session workflow commands (`BuildStoryCommand`, `DistillSessionCommand`)
- ✅ Removed `forge-design` command
- ✅ Added GitHub issue workflow (`forge-refine`, `forge-scribe`)
- ✅ Removed Work Issue command and webview
- ✅ Major refactoring and simplification

**This warrants a major version bump to 2.0.0** 🎯

## Pre-Commit Checklist

### 1. Ensure All Changes Are Staged
```bash
# Review what will be committed
git status

# Add all changes
git add .

# Or selectively add files
git add FORGE-WORKFLOW.md
git add src/
git add package.json
# ... etc
```

### 2. Verify Tests Pass
```bash
# Run linting
npm run lint

# Run tests
npm test

# Build the extension
npm run build
```

### 3. Test Release Dry-Run (Optional but Recommended)
```bash
# See what version would be released
npm run release:dry-run
```

## Commit Message Format

To trigger a **major version bump (2.0.0)**, you MUST use a breaking change commit message:

### Option 1: Using `feat!:` prefix (Recommended)
```bash
git commit -m "feat!: migrate to GitHub issue workflow

BREAKING CHANGE: Removed Forge Studio UI and design session workflow. 
Replaced with GitHub issue-based workflow using forge-refine and forge-scribe commands.

- Remove Forge Studio tree provider and webview
- Remove design session commands (BuildStoryCommand, DistillSessionCommand)
- Remove forge-design command
- Add forge-refine command for issue refinement
- Add forge-scribe command for technical breakdown
- Remove Work Issue command and webview
- Simplify extension architecture"
```

### Option 2: Using `BREAKING CHANGE:` footer
```bash
git commit -m "feat: migrate to GitHub issue workflow

BREAKING CHANGE: Removed Forge Studio UI and design session workflow. 
Replaced with GitHub issue-based workflow using forge-refine and forge-scribe commands.

- Remove Forge Studio tree provider and webview
- Remove design session commands (BuildStoryCommand, DistillSessionCommand)
- Remove forge-design command
- Add forge-refine command for issue refinement
- Add forge-scribe command for technical breakdown
- Remove Work Issue command and webview
- Simplify extension architecture"
```

## Release Process

### Step 1: Merge to Main Branch

```bash
# Make sure you're on your feature branch
git checkout v2poc

# Ensure all changes are committed
git status

# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Merge your feature branch
git merge v2poc

# Push to main (this triggers the release workflow)
git push origin main
```

### Step 2: GitHub Actions Will Automatically:

1. ✅ **Run CI tests** (lint, build, test)
2. ✅ **Build extension** (`npm run build`)
3. ✅ **Package extension** (create `.vsix` file)
4. ✅ **Run semantic-release** which will:
   - Analyze commit message
   - Detect breaking change (`feat!:` or `BREAKING CHANGE:`)
   - Bump version from `1.1.3` → `2.0.0`
   - Update `package.json` with new version
   - Update `CHANGELOG.md` with release notes
   - Create git tag `v2.0.0`
   - Create GitHub release with `.vsix` attached
5. ✅ **Re-package extension** with new version
6. ✅ **Publish to VSCode Marketplace** (if `VSCE_PAT` secret is configured)

## Verification

After pushing to `main`, check:

1. **GitHub Actions**: https://github.com/alto9/forge/actions
   - Look for the "Release" workflow run
   - Verify all steps pass

2. **GitHub Release**: https://github.com/alto9/forge/releases
   - Should see new release `v2.0.0`
   - Should have `.vsix` file attached

3. **CHANGELOG.md**: Should be automatically updated with v2.0.0 entry

4. **package.json**: Version should be updated to `2.0.0`

5. **VSCode Marketplace**: https://marketplace.visualstudio.com/items?itemName=alto9.forge-studio
   - New version should appear (may take a few minutes)

## Important Notes

### Breaking Change Detection

The release will only trigger v2.0.0 if:
- ✅ Commit message contains `feat!:` OR
- ✅ Commit message contains `BREAKING CHANGE:` in the footer

**Without this, it will only do a minor/patch bump!**

### Required Secrets

Make sure these GitHub secrets are configured:
- ✅ `GITHUB_TOKEN` (automatic, no action needed)
- ✅ `VSCE_PAT` (for VSCode Marketplace publishing)
- ⚠️ `NPM_TOKEN` (not needed since `npmPublish: false` in `.releaserc.json`)

### If Release Fails

If the release workflow fails:

1. Check GitHub Actions logs for errors
2. Fix any issues
3. Create a new commit with fixes
4. Push again (will trigger new release attempt)

### Skipping Release (If Needed)

If you need to make changes without releasing:
```bash
git commit -m "docs: update README [skip release]"
```

## Example Complete Workflow

```bash
# 1. Ensure you're on your feature branch with all changes
git checkout v2poc
git status  # Verify all changes are committed

# 2. Run tests locally
npm run lint
npm test
npm run build

# 3. Test what would be released (optional)
npm run release:dry-run

# 4. Switch to main and merge
git checkout main
git pull origin main
git merge v2poc

# 5. Push to trigger release
git push origin main

# 6. Monitor GitHub Actions
# Visit: https://github.com/alto9/forge/actions

# 7. Verify release
# Check: https://github.com/alto9/forge/releases
```

## Troubleshooting

### Version didn't bump to 2.0.0
- ❌ Check commit message includes `feat!:` or `BREAKING CHANGE:`
- ❌ Verify you pushed to `main` branch
- ❌ Check semantic-release logs in GitHub Actions

### Release workflow didn't run
- ❌ Verify you pushed to `main` branch (not `master` or other branch)
- ❌ Check GitHub Actions is enabled for the repository
- ❌ Verify workflow file exists: `.github/workflows/release.yml`

### Extension didn't publish to marketplace
- ❌ Verify `VSCE_PAT` secret is configured
- ❌ Check workflow logs for publishing errors
- ❌ Verify `.vsix` file was created successfully

## Next Steps After Release

1. ✅ Verify v2.0.0 appears in VSCode Marketplace
2. ✅ Update any documentation that references old features
3. ✅ Consider creating migration guide for users upgrading from v1.x
4. ✅ Announce the release (if applicable)

---

**Ready to release? Follow the steps above and push to `main` with a breaking change commit message!** 🚀
