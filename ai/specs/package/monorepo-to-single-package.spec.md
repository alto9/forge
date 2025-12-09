---
spec_id: monorepo-to-single-package
name: Monorepo to Single Package Migration
description: Technical specification for migrating from monorepo structure to single VSCode extension package
feature_id: 
  - cursor-commands-migration
diagram_id: []
---

# Monorepo to Single Package Migration

## Overview

This specification details the technical steps required to migrate the Forge repository from a monorepo structure (with separate VSCode extension and MCP server packages) to a single VSCode extension package.

## Current Structure

```
forge/
├── packages/
│   ├── vscode-extension/
│   │   ├── src/
│   │   ├── dist/
│   │   ├── package.json
│   │   └── webpack.config.js
│   └── mcp-server/
│       ├── src/
│       ├── dist/
│       ├── package.json
│       └── tsconfig.json
├── package.json (workspace root)
├── node_modules/
└── .github/
    └── workflows/
        ├── release-extension.yml
        └── release-mcp.yml
```

## Target Structure

```
forge/
├── src/                    # Moved from packages/vscode-extension/src/
├── dist/                   # Build output
├── package.json            # Single package configuration
├── webpack.config.js       # Moved from packages/vscode-extension/
├── tsconfig.json           # Root TypeScript config
├── node_modules/
└── .github/
    └── workflows/
        └── release.yml     # Single release workflow
```

## Migration Steps

### Step 1: Backup Current State

1. Create migration branch: `git checkout -b migrate-to-single-package`
2. Commit current state
3. Document all workspace dependencies

### Step 2: Move VSCode Extension to Root

**File Moves**:
```bash
# Move source files
mv packages/vscode-extension/src ./src
mv packages/vscode-extension/dist ./dist
mv packages/vscode-extension/webpack.config.js ./webpack.config.js
mv packages/vscode-extension/tsconfig.json ./tsconfig.json

# Move package metadata
mv packages/vscode-extension/README.md ./README.md
mv packages/vscode-extension/.vscodeignore ./.vscodeignore
mv packages/vscode-extension/.eslintrc.json ./.eslintrc.json
```

**Merge package.json**:
```json
{
  "name": "forge",
  "displayName": "Forge",
  "version": "2.0.0",
  "description": "Context engineering for AI-assisted development",
  "publisher": "alto9",
  "engines": {
    "vscode": "^1.80.0",
    "node": ">=22.14.0"
  },
  "categories": ["Other"],
  "activationEvents": ["onStartupFinished"],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "forge.openForgeStudio",
        "title": "Forge: Open Forge Studio"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run build",
    "build": "webpack --mode production",
    "watch": "webpack --mode development --watch",
    "package": "vsce package",
    "publish": "vsce publish"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/vscode": "^1.80.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "typescript": "^5.0.0",
    "webpack": "^5.88.0",
    "webpack-cli": "^5.1.0",
    "@vscode/vsce": "^2.19.0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

### Step 3: Remove MCP Server Package

**Delete Files**:
```bash
rm -rf packages/mcp-server
rm -rf packages/
```

**Remove MCP Dependencies**:
- `@modelcontextprotocol/sdk`
- `zod` (unless used elsewhere)
- Any MCP-specific dev dependencies

### Step 4: Update Build Configuration

**webpack.config.js** - Update paths:
```javascript
const path = require('path');

module.exports = {
  target: 'node',
  entry: './src/extension.ts',  // Updated path
  output: {
    path: path.resolve(__dirname, 'dist'),  // Updated path
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      }
    ]
  }
};
```

**tsconfig.json** - Update paths:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 5: Update Import Paths

**Before** (monorepo workspace import):
```typescript
import { SomeType } from '@forge/mcp-server';
```

**After** (no longer needed - functionality moved to templates):
- Remove all imports from `@forge/mcp-server`
- MCP functionality replaced by command templates in `src/templates/cursorCommands.ts`

### Step 6: Update CI/CD Workflows

**Before** - Separate workflows:
- `.github/workflows/release-extension.yml`
- `.github/workflows/release-mcp.yml`

**After** - Single workflow:

**.github/workflows/release.yml**:
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

**Update .releaserc.json**:
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

### Step 7: Update Documentation

**README.md** - Remove MCP sections:
- Remove "MCP Server Installation" section
- Remove MCP configuration examples
- Add "Cursor Commands" section
- Update "Getting Started" to focus on extension only
- Add migration guide for existing users

**Migration Guide** (add to README):
```markdown
## Migrating from v1.x to v2.0

Version 2.0 removes the MCP server and migrates functionality to native Cursor commands.

### Steps:

1. Remove MCP server configuration from `~/.config/Claude/claude_desktop_config.json` or Cursor MCP settings
2. Update Forge extension to v2.0.0
3. Re-initialize Forge projects to get new command files
4. Use Cursor commands instead of MCP tools:
   - Instead of calling `get_forge_about` → Use `/forge` command
   - Instead of calling `get_forge_schema` → Use `/forge-design` (schemas embedded)
   - Instead of calling `get_forge_context` → Use context files directly

### Breaking Changes:

- MCP server no longer exists
- MCP tools (`get_forge_about`, `get_forge_schema`, `get_forge_context`, `get_forge_objects`) removed
- Repository structure changed from monorepo to single package
- All functionality now available through Cursor commands
```

### Step 8: Clean Up

**Remove files**:
- `.github/workflows/release-extension.yml`
- `.github/workflows/release-mcp.yml`
- Any monorepo-specific documentation
- `packages/` directory

**Update .gitignore**:
```gitignore
node_modules/
dist/
*.vsix
.vscode-test/
```

### Step 9: Test Build

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Build
npm run build

# Package
npm run package

# Verify .vsix file created
ls -lh *.vsix
```

### Step 10: Commit and Release

```bash
git add -A
git commit -m "feat!: migrate to single package, remove MCP server

BREAKING CHANGE: Remove MCP server and migrate to native Cursor commands.
Users must remove MCP configuration and use new Cursor commands instead."

git push origin migrate-to-single-package
# Create PR and merge to main for release
```

## Validation Checklist

- [ ] All source files moved to root-level `src/`
- [ ] `packages/` directory removed
- [ ] MCP server package completely removed
- [ ] Single `package.json` with no workspace configuration
- [ ] Build succeeds with `npm run build`
- [ ] Package succeeds with `npm run package`
- [ ] Extension activates in VSCode
- [ ] Commands appear in command palette
- [ ] Studio opens correctly
- [ ] Session creation works
- [ ] File tracking works
- [ ] Cursor commands are created during initialization
- [ ] No references to `@forge/mcp-server` in code
- [ ] CI/CD workflow updated and tested
- [ ] Documentation updated (README, migration guide)
- [ ] Git history preserved

## Rollback Plan

If migration fails:
1. Keep `migrate-to-single-package` branch
2. Revert main branch to previous commit
3. Address issues in migration branch
4. Retry when ready

## Post-Migration

1. Monitor GitHub issues for migration problems
2. Update any external documentation (blog posts, videos)
3. Communicate breaking changes in release notes
4. Provide support for users migrating from v1.x
5. Consider deprecation period (optional) if needed

## Technical Notes

### Node.js Version

- Maintain Node.js 22 requirement
- Update engines in package.json: `"node": ">=22.14.0"`

### TypeScript Configuration

- Single tsconfig.json at root
- No path mapping needed (no workspace packages)
- Simpler module resolution

### Dependencies

- Consolidate all dependencies in single package.json
- Remove workspace-specific dev dependencies
- Maintain all VSCode extension dependencies

### Extension Packaging

- Single .vsix file output
- Simpler versioning (no coordinating multiple packages)
- Faster build times (no multi-package orchestration)

## Related Specifications

- `cursor-commands-management.spec.md` - Cursor command file management
- `monorepo.spec.md` - Previous monorepo architecture (for reference)

## Related Features

- `cursor-commands-migration.feature.md` - User-facing migration feature

