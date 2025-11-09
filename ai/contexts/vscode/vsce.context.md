---
context_id: vsce
category: vscode
name: VSCode Extension Packaging Guidance
description: Guidance for packaging and distributing VSCode extensions
---

# VSCode Extension Packaging Context

## When to Use This Context

Use this context when:
- Packaging VSCode extensions for distribution
- Configuring extension metadata
- Building extension bundles
- Publishing to VSCode marketplace

## VSCode Extension Packaging

```gherkin
Scenario: Package VSCode extension
  Given you have a completed VSCode extension
  When packaging for distribution
  Then use @vscode/vsce for packaging
  And configure proper extension metadata
  And bundle all dependencies
  And create .vsix package file

Scenario: Configure extension metadata
  Given you are setting up extension packaging
  When configuring package.json
  Then include proper displayName and description
  And specify correct engine requirements
  And define all contributed commands
  And configure proper file associations
```

## Technical Implementation

### Packaging Process
- **Tool**: `@vscode/vsce` for packaging
- **Output**: `.vsix` package file
- **Dependencies**: Bundle all required dependencies
- **Metadata**: Configure package.json properly

### Extension Configuration
- **Display Name**: "Forge - Context Engineering for Agentic Development"
- **Description**: VSCode extension for context engineering
- **Version**: 0.1.0
- **Publisher**: alto9
- **Engines**: VSCode ^1.80.0, Node.js >=22.14.0

### Build Process
1. **Compile**: TypeScript compilation
2. **Bundle**: Webpack for main extension
3. **Webview**: esbuild for React components
4. **Package**: vsce for final .vsix file

## Best Practices

### Package Configuration
- Include all necessary dependencies
- Configure proper file associations
- Set correct engine requirements
- Include proper metadata

### Build Optimization
- Use webpack for main extension
- Use esbuild for webview components
- Minimize bundle size
- Handle source maps properly

### Distribution
- Test .vsix package before distribution
- Verify all commands work correctly
- Ensure proper file associations
- Test installation process
