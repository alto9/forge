# Contributing to Forge

Thank you for your interest in contributing to Forge! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/alto9/cursor-context-engineering.git`
3. Install dependencies: `npm install`
4. Make your changes
5. Test your changes by pressing F5 in VSCode
6. Submit a pull request

## Development Setup

### Prerequisites
- Node.js 22+
- VSCode 1.80+
- TypeScript 5+

### Building the Extension

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch
```

### Testing

Press `F5` in VSCode to launch the Extension Development Host with your changes loaded.

## Code Style

- Use TypeScript for all source code
- Follow existing code formatting conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and single-purpose

## File Structure

```
src/
├── extension.ts                 # Main extension entry point
├── commands/                    # Command implementations
│   ├── DistillDecisionCommand.ts
│   └── ConvertToTasksCommand.ts
├── panels/                      # Webview panels
│   └── NewDecisionPanel.ts
└── utils/                       # Utility functions
    ├── PromptGenerator.ts
    └── FileParser.ts
```

## Adding New Commands

1. Create a new command file in `src/commands/`
2. Implement the command logic
3. Register the command in `src/extension.ts`
4. Add the command to `package.json` contributions
5. Update README.md with command documentation

## Adding New Features

1. Create an issue describing the feature
2. Get feedback from maintainers
3. Implement the feature in a feature branch
4. Write tests if applicable
5. Update documentation
6. Submit a pull request

## Modifying Cursor Command Templates

Forge manages Cursor command files (`.cursor/commands/*.md`) using a template system with hash-based validation. Here's how to modify them:

### Template Location

Command templates are stored in:
```
packages/vscode-extension/src/templates/cursorCommands.ts
```

### Modification Process

1. **Edit the Template**:
   ```typescript
   // packages/vscode-extension/src/templates/cursorCommands.ts
   export const FORGE_DESIGN_TEMPLATE = `# Forge Design
   
   This command helps you work within an active Forge design session...
   `;
   ```

2. **Version Bump**:
   - Update version in `packages/vscode-extension/package.json`
   - If breaking change: increment major version
   - If new features: increment minor version
   - If bug fix: increment patch version

3. **Update CHANGELOG**:
   - Add entry describing template changes
   - Indicate if users need to re-initialize

4. **Test Thoroughly**:
   ```bash
   # Run unit tests
   npm test
   
   # Run integration tests
   npm run test:integration
   
   # Manual testing in Extension Development Host (F5)
   ```

5. **Test the Full Flow**:
   - Create a test project
   - Initialize project (should create command files with new hash)
   - Manually modify command file content
   - Re-open Forge Studio (should detect outdated command)
   - Re-initialize (should update command file)

### Impact on Existing Projects

When you modify a command template:

- **New Projects**: Will get the new template automatically
- **Existing Projects**: Command files will show as "outdated" (hash mismatch)
- **Update Path**: Users must re-initialize project to get updated commands
- **Visual Feedback**: Welcome Screen shows ⚠ orange indicator for outdated commands

### Hash Validation System

Command files include a hash comment:
```markdown
<!-- forge-hash: a1b2c3d4e5f6... -->

# Forge Design
...
```

**How it works**:
1. Hash is computed from template content (SHA-256)
2. Hash is embedded in generated command file
3. During validation, file content is re-hashed and compared
4. Mismatch indicates outdated or modified file

**Why it exists**:
- Ensures consistency across all Forge projects
- Detects when templates are updated
- Prevents manual edits from breaking workflows
- Enables automatic updating during re-initialization

### Testing Strategy

When modifying templates:

1. **Unit Tests** (`commandValidation.test.ts`):
   - Test hash computation
   - Test validation with valid/invalid content
   - Test file generation with embedded hash

2. **Integration Tests** (`InitializationIntegration.test.ts`):
   - Test initialization creates command files
   - Test outdated commands are updated
   - Test progress messages during creation

3. **Manual Tests**:
   - Create new project → verify commands created
   - Modify command file → verify marked invalid
   - Re-initialize → verify command updated
   - Delete command → verify marked missing

### Adding New Commands

To add a new command file:

1. **Add Template**:
   ```typescript
   export const FORGE_NEW_TEMPLATE = `# Forge New Command
   
   Description and usage...
   `;
   
   export const COMMAND_TEMPLATES: Record<string, string> = {
     '.cursor/commands/forge-design.md': FORGE_DESIGN_TEMPLATE,
     '.cursor/commands/forge-build.md': FORGE_BUILD_TEMPLATE,
     '.cursor/commands/forge-new.md': FORGE_NEW_TEMPLATE  // New!
   };
   ```

2. **Update Tests**: Add test cases for the new command

3. **Update Documentation**: Document the new command in README.md

4. **Version Bump**: Increment minor version (new feature)

### Breaking Changes

If a template change is breaking (changes command behavior significantly):

1. **Assess Impact**: Will existing projects break?
2. **Migration Guide**: Provide clear upgrade path
3. **Major Version Bump**: Increment major version (e.g., 1.0.0 → 2.0.0)
4. **Clear Communication**: 
   - Detailed release notes
   - Migration instructions
   - Deprecation warnings if applicable

## Prompt Generation Guidelines

When adding or modifying prompt generation:

1. **Be Specific**: Prompts should be clear and actionable
2. **Include Context**: Always include relevant file contents and relationships
3. **Be Structured**: Use consistent formatting with clear sections
4. **Avoid Bloat**: Include only necessary context to keep prompts efficient
5. **Test Thoroughly**: Verify prompts work well with AI agents

## Pull Request Process

1. Update the CHANGELOG.md with your changes
2. Update documentation if needed
3. Ensure your code compiles without errors
4. Write a clear PR description explaining your changes
5. Link any related issues

## Reporting Bugs

When reporting bugs, please include:

- VSCode version
- Forge extension version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable

## Feature Requests

We welcome feature requests! Please:

- Check if the feature already exists or is planned
- Clearly describe the feature and its benefits
- Provide use cases and examples
- Be open to discussion and refinement

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Maintain professionalism in all interactions

## Questions?

Feel free to open an issue with your questions or reach out to the maintainers.

Thank you for contributing to Forge!

