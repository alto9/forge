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
