## <small>3.2.2 (2026-02-05)</small>

* Merge pull request #11 from alto9/forgePullRename ([4add1d8](https://github.com/alto9/forge/commit/4add1d8)), closes [#11](https://github.com/alto9/forge/issues/11)
* fix: update refinement and pull request ([ba4d4d4](https://github.com/alto9/forge/commit/ba4d4d4))

## <small>3.2.1 (2026-02-05)</small>

* Merge pull request #10 from alto9/forgeRefinement ([21a3d0f](https://github.com/alto9/forge/commit/21a3d0f)), closes [#10](https://github.com/alto9/forge/issues/10)
* fix: refinement instructions ([a96dbc3](https://github.com/alto9/forge/commit/a96dbc3))

## 3.2.0 (2026-02-05)

* Merge pull request #9 from alto9/forgePullRequest ([be9d27e](https://github.com/alto9/forge/commit/be9d27e)), closes [#9](https://github.com/alto9/forge/issues/9)
* feat(commands): add forge-pull command for PR creation with conventional commit validation ([3e77b81](https://github.com/alto9/forge/commit/3e77b81))

## 3.1.0 (2026-02-05)

* Merge pull request #8 from alto9/forgeCommit ([e831554](https://github.com/alto9/forge/commit/e831554)), closes [#8](https://github.com/alto9/forge/issues/8)
* test: update projectReadiness tests for 5 commands ([abb92e5](https://github.com/alto9/forge/commit/abb92e5))
* feat: commit and push commands ([4056153](https://github.com/alto9/forge/commit/4056153))

## 3.0.0 (2026-02-01)

* feat!: release v2.0.0 - GitHub issue workflow migration ([21c84a9](https://github.com/alto9/forge/commit/21c84a9))


### BREAKING CHANGE

* This release migrates from design session workflow to GitHub issue workflow. Removed Forge Studio UI, design session commands, and forge-design command. Added forge-refine and forge-scribe commands for GitHub issue workflow.

## 2.0.0 (2026-02-01)

* chore: latest changes ([2c40403](https://github.com/alto9/forge/commit/2c40403))
* chore: latest code ([32c45ec](https://github.com/alto9/forge/commit/32c45ec))
* chore: remove old webview ([50e9d80](https://github.com/alto9/forge/commit/50e9d80))
* chore: stage all v2 changes so far ([bae9808](https://github.com/alto9/forge/commit/bae9808))
* chore: trigger release workflow ([2175868](https://github.com/alto9/forge/commit/2175868))
* chore: v2 latest updates ([589f1b7](https://github.com/alto9/forge/commit/589f1b7))
* feat!: migrate to GitHub issue workflow ([e8404b4](https://github.com/alto9/forge/commit/e8404b4))
* Merge pull request #7 from alto9/v2poc ([f807a7a](https://github.com/alto9/forge/commit/f807a7a)), closes [#7](https://github.com/alto9/forge/issues/7)


### BREAKING CHANGE

* Removed Forge Studio UI and design session workflow.
Replaced with GitHub issue-based workflow using forge-refine and forge-scribe commands.

- Remove Forge Studio tree provider and webview
- Remove design session commands (BuildStoryCommand, DistillSessionCommand)
- Remove forge-design command
- Add forge-refine command for issue refinement
- Add forge-scribe command for technical breakdown
- Remove Work Issue command and webview
- Simplify extension architecture
- Update workflow documentation

## <small>1.1.3 (2025-12-10)</small>

* fix: adjust cursor commands ([734970e](https://github.com/alto9/forge/commit/734970e))

## <small>1.1.2 (2025-12-09)</small>

* ci: fix package name for marketplace ([a49fe02](https://github.com/alto9/forge/commit/a49fe02))

## <small>1.1.1 (2025-12-09)</small>

* feat!: remove mcp server and refine extension code ([727fa4e](https://github.com/alto9/forge/commit/727fa4e))
* Merge pull request #6 from alto9/5-migrate-mcp-server-functionality-to-cursor-commands-and-simplify- ([554eb32](https://github.com/alto9/forge/commit/554eb32)), closes [#6](https://github.com/alto9/forge/issues/6)
* ci: fix unit tests ([f9bc700](https://github.com/alto9/forge/commit/f9bc700))

# [1.1.0](https://github.com/alto9/forge/compare/v1.0.1...v1.1.0) (2025-12-07)


### Features

* **actors:** add actors to diagrams ([a57028d](https://github.com/alto9/forge/commit/a57028d71d66740bb046a3cb9e6006b6d71f64bd))

## [1.0.1](https://github.com/alto9/forge/compare/v1.0.0...v1.0.1) (2025-12-05)

# 1.0.0 (2025-12-05)


### Bug Fixes

* **extension:** remove ai/contexts from REQUIRED_FOLDERS ([aac9e0a](https://github.com/alto9/forge/commit/aac9e0aa32acedb0e56a7c9636c64c3b1ca7b500))
* **mcp:** remove context from schema_type enum ([43fd532](https://github.com/alto9/forge/commit/43fd5326919e72ef17337c7cd587a4dedbdcf93d))

# Changelog

All notable changes to the Forge extension will be documented in this file.

## [0.1.0] - 2025-10-01

### Added
- Initial release of Forge extension
- `Forge: New Decision` command with webview form
- `Forge: Distill Decision into Features and Specs` command
- `Forge: Convert Decision to Tasks` command
- Intelligent prompt generation with context awareness
- Frontmatter parsing for Forge file formats
- Right-click context menu integration
- Output panel for displaying generated prompts
- Support for decision, feature, spec, context, and task file formats

### Features
- Webview-based form for creating new decisions
- Automatic discovery of related files (features, specs, contexts)
- File format validation for .decision.md files
- Quick pick menus for file selection
- Comprehensive prompt generation with full context inclusion

## [Unreleased]

### Added
- **Cursor Command Management System** - Forge now automatically manages Cursor command files (`.cursor/commands/*.md`) during project initialization
  - `forge-design.md` command for design session workflows
  - `forge-build.md` command for story implementation workflows
  - Hash-based validation ensures command files stay up-to-date
  - Automatic detection and updating of outdated command files
  - Visual indicators in Welcome Screen for command status (missing, outdated, or valid)
  - Commands provide context-aware guidance to AI agents for proper Forge workflow adherence

### Technical
- Added command template storage system in `packages/vscode-extension/src/templates/cursorCommands.ts`
- Implemented SHA-256 hash validation for command file integrity
- Enhanced project readiness checks to include command file validation
- Updated initialization flow to create/update command files alongside folder structure
- Command files include embedded hash comments for version tracking
- Integration tests for command validation and initialization flow

### Documentation
- Updated README.md with Cursor command management section
- Added explanation of hash-based validation system
- Documented command update workflow for users
- Included troubleshooting guidance for outdated commands

### Planned
- Direct Cursor Agent CLI integration
- Custom template support
- Prompt history and versioning
- File format validation and linting
- Relationship visualization
- Batch operations for multiple files
