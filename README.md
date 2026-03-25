# Forge Studio

VSCode/Cursor extension for context engineering and agentic development. Forge Studio helps teams maintain product vision, technical concepts, and roadmaps—then turns milestones into actionable, implementation-ready issues via a staged agent workflow.

## Overview

Forge Studio provides:

- **Initialize Cursor Agents** – Installs agents/commands/skills/hooks to `~/.cursor/` (user-level)
- **Initialize Project** – Creates `.forge/` in the current project
- **Agent workflow** – Visionary, Architect, Planner, Refine, and domain SMEs (runtime, business_logic, data, interface, integration, operations) for planning and documentation; Build and Review agents for implementation
- **Commands** – architect-this, plan-roadmap, refine-issue, build-from-github, review-pr (injected via Cursor-agent initialization)
- **Chat participants** – @forge, @forge-refine, @forge-commit, @forge-push, @forge-pullrequest, @forge-setup-issue, @forge-build-issue, @forge-review-pr (VSCode chat participants mirror Cursor agents)

## Quick Start

1. Open a project in Cursor or VSCode
2. On Cursor startup, Forge checks user-level Cursor agents in `~/.cursor/` and prompts before applying updates when changes are needed
3. Run **Forge: Initialize Project** from the Command Palette (`Cmd/Ctrl+Shift+P`) to create project-level `.forge/`
4. Forge creates:
   - `~/.cursor/` – agents, commands, skills, hooks (user-level, shared across projects)
   - `~/.cursor/hooks.json` – JSON schema validation on .forge file edits
   - `.forge/` – vision.json, project.json, skill_registry.json, knowledge_map.json, schemas/ (project-level)

## User Flow

After Cursor-agent initialization, use the injected agents and commands:

- **Architect** (`/architect-this`) – Examines vision.json, delegates to domain SME agents, invokes Planner
- **Plan Roadmap** (`/plan-roadmap`) – Manages GitHub milestones and issues via pull-milestones, pull-milestone-issues
- **Refine Issue** (`/refine-issue`) – Refines GitHub issues with SME context; creates parent branch (push + link); optional sub-issues on GitHub (no per-sub-issue git branches)
- **Build from GitHub** (`/build-from-github`) – Creates/links implementation branch for the issue, implements, runs all tests/lint until green, then commit/PR
- **Review PR** (`/review-pr`) – Reviews code, posts review comments

## Chat Participants (VSCode)

Type `@` in chat to use Forge personas:

| Participant | Purpose |
|-------------|---------|
| **@forge** | Main Forge helper for guidance and general questions |
| **@forge-refine** | Refine GitHub issues to clarify business value and requirements |
| **@forge-commit** | Commit with validation and conventional commit messages |
| **@forge-push** | Safely push to remote |
| **@forge-pullrequest** | Create PR with conventional commit validation |
| **@forge-setup-issue** | Prepare environment for issue work (create-feature-branch from parent or main) |
| **@forge-build-issue** | Implement issue end-to-end via build-from-github workflow |
| **@forge-review-pr** | Pull PR branch, review code, post review comments |

## Project Structure

After setup:

**User-level (~/.cursor/):**
```
~/.cursor/
├── agents/                   # visionary, architect, planner, refine, domain SMEs, build, review
├── commands/                 # architect-this, plan-roadmap, refine-issue, build-from-github, review-pr
├── skills/                   # fetch-url, pull-milestones, pull-milestone-issues, etc.
├── hooks/                    # JSON schema validation on .forge file edits
└── hooks.json                # Cursor hooks config
```

**Project-level (.forge/):**
```
your-project/
└── .forge/
    ├── vision.json           # Product vision, mission, strategy
    ├── project.json          # Project config (GitHub URL, paths)
    ├── skill_registry.json   # Skill-to-agent assignments
    ├── knowledge_map.json    # Domain structure (vision → runtime, business_logic, data, etc.)
    └── schemas/              # JSON schemas for validation
```

## Installation

### From Source (Development)

```bash
npm install
npm run build
npm run package
code --install-extension forge-studio-*.vsix
```

### From VSIX

```bash
code --install-extension forge-studio-*.vsix
```

## Development

```bash
npm install
npm run build
npm run watch      # Watch mode
npm run lint
npm run test
npm run package    # Package for distribution
```

## License

MIT
