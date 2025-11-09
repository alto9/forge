---
spec_id: webpack
name: Webpack Build Configuration
description: Technical implementation for webpack build process in VSCode extension
feature_id: [vscode-extension]
diagram_id: [webpack-build-flow]
context_id: [node, vsce]
---

# Webpack Build Configuration

## Architecture

See [webpack-build-flow](../diagrams/build/webpack-build-flow.diagram.md) diagram for build process.

## Implementation Details

### Webpack Configuration
- **Entry Point**: `src/extension.ts`
- **Output**: `dist/extension.js`
- **Loader**: `ts-loader` for TypeScript compilation
- **Mode**: Production with source maps for debugging

### Build Process
1. **TypeScript Compilation**: Convert TypeScript to JavaScript
2. **Bundle Creation**: Create single JavaScript bundle
3. **Source Maps**: Generate source maps for debugging
4. **Asset Optimization**: Minimize and optimize bundle

### Webview Build
- **Tool**: `esbuild` for React components
- **Entry**: `src/webview/studio/index.tsx`
- **Output**: `media/studio/main.js`
- **Format**: IIFE for webview compatibility

## Technical Requirements

### Dependencies
- **Webpack**: ^5.102.0 for bundling
- **ts-loader**: ^9.5.4 for TypeScript compilation
- **esbuild**: ^0.24.0 for webview bundling
- **TypeScript**: ^5.0.0 for type checking

### Build Scripts
```json
{
  "compile": "webpack && npm run build:webview",
  "build": "webpack && npm run build:webview",
  "build:webview": "esbuild src/webview/studio/index.tsx --bundle --outfile=media/studio/main.js --format=iife --platform=browser --minify"
}
```

### Configuration Files
- **webpack.config.js**: Main webpack configuration
- **tsconfig.json**: TypeScript configuration
- **package.json**: Build scripts and dependencies

## Best Practices

### Build Optimization
- Use production mode for final builds
- Enable source maps for debugging
- Minimize bundle size
- Handle external dependencies properly

### Development Workflow
- Use watch mode for development
- Separate webview and extension builds
- Handle hot reloading appropriately
- Maintain build performance
