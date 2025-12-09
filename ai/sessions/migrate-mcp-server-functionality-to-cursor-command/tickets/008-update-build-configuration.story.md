---
story_id: 008-update-build-configuration
session_id: migrate-mcp-server-functionality-to-cursor-command
feature_id:
  - cursor-commands-migration
spec_id:
  - monorepo-to-single-package
status: completed
---

# Update Build Configuration for Single Package

## Objective

Update `webpack.config.js` and `tsconfig.json` to use correct paths for the single-package structure.

## Context

With files moved to root, build configurations need updated paths pointing to `./src` and `./dist` instead of nested package directories.

## Files to Modify

- `webpack.config.js`
- `tsconfig.json`

## Implementation Steps

### 1. Update webpack.config.js

```javascript
const path = require('path');

module.exports = {
  target: 'node',
  entry: './src/extension.ts',  // Updated from packages/vscode-extension/src
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

### 2. Update tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",       // Updated path
    "rootDir": "./src",       // Updated path
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],    // Updated path
  "exclude": ["node_modules", "dist"]
}
```

## Acceptance Criteria

- [ ] `webpack.config.js` entry points to `./src/extension.ts`
- [ ] `webpack.config.js` output path is `./dist`
- [ ] `tsconfig.json` rootDir is `./src`
- [ ] `tsconfig.json` outDir is `./dist`
- [ ] `tsconfig.json` include pattern is `src/**/*`
- [ ] No references to `packages/` in either file
- [ ] Configurations are valid and buildable

## Estimated Time

15 minutes

## Dependencies

- Requires: 007-remove-mcp-package

## Notes

After this change, the build should work with `npm run build`. Test the build configuration before proceeding to ensure paths are correct.

