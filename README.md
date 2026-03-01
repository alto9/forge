# Forge

VSCode/Cursor extension for context engineering and agentic development. Forge helps teams maintain product vision, technical concepts, features, and roadmaps—then turns milestones into actionable, implementation-ready issues.

## Overview

Forge provides:

- **Setup Project for Cursor** – Creates `.forge` metadata, `.cursor/agents`, `.cursor/commands`, `.cursor/skills`, and hooks
- **Subagents** – Visionary, Architect, Designer, Planner, and Scribe for planning and documentation
- **Commands** – forge-scribe, forge-commit, forge-push, forge-pullrequest, forge-setup-issue, forge-build-issue
- **Roadmap view** – View milestones and issues (synced with GitHub when using pull-milestones/push-milestones)

## Quick Start

1. Open a project in Cursor or VSCode
2. Run **Forge: Setup Project for Cursor** from the Command Palette (`Cmd/Ctrl+Shift+P`)
3. Forge creates:
   - `.forge/` – vision.json, features.json, roadmap.json, technical_concepts.json, project.json
   - `.cursor/agents/` – visionary, designer, planner, architect, scribe
   - `.cursor/commands/` – forge-scribe, forge-commit, forge-push, forge-pullrequest, forge-setup-issue, forge-build-issue
   - `.cursor/skills/` – pull-milestones, push-milestones, get-issue-details, start-issue-build, create-feature-branch, commit, push-branch, make-pull-request, and more

## User Flow

### 1. Open the Roadmap

Use **Forge: Roadmap** to view project milestones and issues. The roadmap can sync with GitHub via the pull-milestones and push-milestones skills.

### 2. Engage with Subagents

| Subagent | Purpose |
|----------|---------|
| **Visionary** | Top-level product concerns, ideation. Maintains `.forge/vision.json`. Keeps vision current and research-driven. |
| **Architect** | Technical concepts, 3rd-party API docs, consistency. Maintains `.forge/technical_concepts.json`. Makes decisions based on research; asks when user input is needed. No open questions in the document—only resolved decisions. |
| **Designer** | Converts Vision + Technical Concepts into logical, nested features. Maintains `.forge/features.json`. |
| **Planner** | Owns the full general roadmap. Creates milestones and top-level milestone tickets (issues) in `.forge/roadmap.json`. These high-level tickets are later broken down by Scribe. |
| **Scribe** | Breaks down a **milestone ticket** (created by Planner) into sub-issues. Refines the ticket respecting vision, features, and technical_concepts. Writes full implementation steps, test procedures, and acceptance criteria for each sub-issue. |

### 3. Commands

| Command | Purpose |
|---------|---------|
| **forge-scribe** | Break down a milestone ticket (created by Planner) into development-ready sub-issues |
| **forge-setup-issue** | Prepare environment for an issue (get details, checkout, create branch) |
| **forge-build-issue** | Implement an issue end-to-end: implement, commit, push, create PR |
| **forge-commit** | Commit with validation and project-specific conventional commit format |
| **forge-push** | Push branch safely with pre-push validation |
| **forge-pullrequest** | Create PR with conventional commit validation |

## Project Structure

After setup:

```
your-project/
├── .forge/
│   ├── vision.json           # Product vision, mission, strategy
│   ├── features.json         # Nested feature hierarchy
│   ├── roadmap.json          # Milestones and tickets
│   ├── technical_concepts.json  # 3rd-party APIs, technical decisions
│   ├── project.json          # Project config (GitHub URL, paths)
│   └── schemas/              # JSON schemas for validation
└── .cursor/
    ├── agents/               # visionary, designer, planner, architect, scribe
    ├── commands/             # forge-scribe, forge-commit, etc.
    ├── skills/               # pull-milestones, commit, push-branch, etc.
    └── hooks/                # JSON schema validation on edit
```

## Installation

### From Source (Development)

```bash
npm install
npm run build -w forge

# Package the extension
npm run vscode:package

# Install
code --install-extension forge-0.1.0.vsix
```

### From VSIX

```bash
code --install-extension forge-0.1.0.vsix
```

## Development

```bash
npm install
npm run build -w forge
npm run watch -w forge   # Watch mode
npm run lint -w forge
npm run test -w forge
npm run vscode:package   # Package for distribution
```

## License

MIT
