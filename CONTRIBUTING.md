# Contributing to Forge

Thank you for your interest in contributing to Forge! Forge Studio is the **VS Code** extension (used the same way in **Cursor**) that ships the GitHub-aligned workflow under `resources/workflow/`. This document provides guidelines for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/alto9/forge.git`
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

## Modifying Agent Skills (orchestration workflows)

**Forge: Initialize Cursor Agents** copies the full **`resources/workflow/skills/`** tree to **`~/.cursor/skills/`**. **Orchestration** workflows (Steps 2–6 prompts) live as **`resources/workflow/skills/<kebab-name>/SKILL.md`** with YAML frontmatter (`name` must match the folder; use `disable-model-invocation: true` for explicit-only workflows). **Script** skills include a **`scripts/`** subdirectory and are listed with `script_path` in **`resources/workflow/references/skill_registry.json`** (synced to `.forge/skill_registry.json` on project init).

**Skills vs agents:** Orchestration **SKILL.md** files define inputs, delegation, and output checks. Agent Markdown under **`resources/workflow/agents/`** defines **execution behavior** for each phase. For example, **`refine-issue`** pairs with **`technical-writer.md`**; if guidance conflicts, the skill governs invocation/output checks and the agent file governs refinement behavior. **Agent markdown filenames** under `resources/workflow/agents/` should match the Cursor/VS Code chat handle (e.g. `@technical-writer` → `technical-writer.md`).

**Stale `~/.cursor/commands/`:** Forge previously installed orchestration Markdown under **`~/.cursor/commands/`**. That directory is still listed in the install manifest so **removed** Forge-managed command files are **deleted** on the next **Forge: Initialize Cursor Agents** run. Invoking workflows via **`/<skill-name>`** in Agent chat uses **`~/.cursor/skills/`** instead.

### Release checklist

1. Change the relevant **`resources/workflow/skills/<id>/SKILL.md`** and/or **`resources/workflow/references/skill_registry.json`** as needed.
2. Bump **`version`** inside **`skill_registry.json`** when registry semantics change; bump `package.json` and add a **CHANGELOG** entry when shipping.
3. Run **`npm test`** and manually run **Forge: Initialize Cursor Agents** on a sample profile to confirm **`~/.cursor/skills/`** updates.

### Adding a new orchestration skill

1. Add **`resources/workflow/skills/<kebab-name>/SKILL.md`** with frontmatter and body (see [Cursor Agent Skills](https://cursor.com/docs/skills)).
2. Register it in **`resources/workflow/references/skill_registry.json`** (`kind`: **`orchestration`**, no **`script_path`**), bump **`version`**, and extend **`command_assignments`** if helper script skills apply.

### Breaking changes

If a workflow change alters behavior in a way that breaks existing teams:

1. **Assess impact** on projects that already ran **Initialize Cursor Agents**.
2. Provide a **migration note** in CHANGELOG (for example: re-run **Forge: Initialize Cursor Agents** to refresh **`~/.cursor/skills/`** and prune stale **`~/.cursor/commands`** entries).
3. **Version bump** appropriately (major if incompatible).
4. Communicate clearly in release notes.

## Prompt Generation Guidelines

When adding or modifying prompt generation:

1. **Be Specific**: Prompts should be clear and actionable
2. **Include Context**: Always include relevant file contents and relationships
3. **Be Structured**: Use consistent formatting with clear sections
4. **Avoid Bloat**: Include only necessary context to keep prompts efficient
5. **Test Thoroughly**: Verify prompts work well with AI agents

## Commit Message Conventions

Forge uses [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning and release management. When you merge to `main`, semantic-release will automatically:

- Determine the next version based on your commit messages
- Update all package.json files with the new version
- Generate/update CHANGELOG.md
- Create a git tag
- Publish to npm (for @forge/mcp-server)
- Publish to VSCode Marketplace (for the extension)

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature (increments minor version: 0.1.0 → 0.2.0)
- **fix**: A bug fix (increments patch version: 0.1.0 → 0.1.1)
- **perf**: A performance improvement (increments patch version)
- **refactor**: Code refactoring (no version bump)
- **docs**: Documentation changes (no version bump)
- **style**: Code style changes (no version bump)
- **test**: Adding or updating tests (no version bump)
- **chore**: Maintenance tasks (no version bump)
- **ci**: CI/CD changes (no version bump)
- **build**: Build system changes (no version bump)

### Breaking Changes

To indicate a breaking change (increments major version: 0.1.0 → 1.0.0), add `!` after the type/scope or include `BREAKING CHANGE:` in the footer:

```
feat!: remove deprecated API
```

or

```
feat(api): add new endpoint

BREAKING CHANGE: The old endpoint /api/v1/users is no longer available
```

### Examples

```bash
# New feature (minor version bump)
git commit -m "feat(studio): add diagram editor"

# Bug fix (patch version bump)
git commit -m "fix(session): handle missing session files"

# Breaking change (major version bump)
git commit -m "feat!: redesign session workflow

BREAKING CHANGE: Session file format has changed. Existing sessions must be migrated."

# Documentation (no version bump)
git commit -m "docs: update README with installation steps"

# Multiple changes in one commit
git commit -m "feat(studio): add new editor

- Add WYSIWYG markdown editor
- Add React Flow diagram editor
- Update navigation menu"
```

### Scope (Optional)

The scope indicates which part of the codebase is affected:

- `studio`: Forge Studio UI
- `mcp`: MCP server
- `extension`: VSCode extension
- `session`: Session management
- `build`: Build system
- `ci`: CI/CD

### What Gets Published

- **Merges to `main`**: Automatically triggers release workflow
- **Pull Requests**: No releases, but CI runs tests
- **Other branches**: No releases

### Version Bump Rules

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (0.1.0 → 0.2.0): New features
- **Patch** (0.1.0 → 0.1.1): Bug fixes

### Testing Releases Locally

You can test what semantic-release would do without actually publishing:

```bash
npm run release:dry-run
```

This will show you:
- What version would be released
- What commits would be included
- What would be published

## Pull Request Process

1. Use conventional commit messages (see above)
2. Ensure your code compiles without errors
3. Write a clear PR description explaining your changes
4. Link any related issues
5. The CHANGELOG.md will be automatically updated on merge to main

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

