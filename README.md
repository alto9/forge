# Forge Studio

VSCode/Cursor extension for context engineering and agentic development. Forge Studio helps teams maintain product vision, technical concepts, and roadmaps—then turns milestones into actionable, implementation-ready issues via a staged agent workflow.

## Overview

Forge Studio provides:

- **Initialize Cursor Agents** – Installs agents/commands/skills/hooks to `~/.cursor/` (user-level)
- **Initialize Project** – Creates `.forge/` in the current project
- **Forge Help persona** – Workflow explainer for command/agent guidance and handoff questions
- **Agent workflow** – Visionary, Architect, Planner, Refine, and domain SMEs (runtime, business_logic, data, interface, integration, operations) for planning and documentation; Build and Review agents for implementation
- **Commands** – architect-this, plan-roadmap, refine-issue, build-from-github, build-from-pr-review, review-pr (injected via Cursor-agent initialization)
- **Chat participants** – @forge-help, @product-owner, @architect, @planner, @technical-writer, @engineer, @quality-assurance (VSCode chat participants mirror Cursor agents)

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
- **Build from PR Review** (`/build-from-pr-review`) – Retrieves PR feedback, checks out PR branch, applies requested changes, validates, and pushes updates for re-review
- **Review PR** (`/review-pr`) – Reviews code, posts review comments

## Chat Participants (VSCode)

Type `@` in chat to use Forge personas:

| Participant | Purpose |
|-------------|---------|
| **@forge-help** | Workflow guide for Forge steps, commands, handoffs, and quality gates |
| **@product-owner** | Step 1: maintain product vision and project direction |
| **@architect** | Step 2: update technical contracts and knowledge structure |
| **@planner** | Step 3: align milestones and issues with documented direction |
| **@technical-writer** | Step 4: refine GitHub issues into implementation-ready tickets |
| **@engineer** | Step 5: implement scoped issue work and prepare PRs |
| **@quality-assurance** | Step 6: review PRs for correctness and security |

## Project Structure

After setup:

**User-level (~/.cursor/):**
```
~/.cursor/
├── agents/                   # visionary, architect, planner, refine, domain SMEs, build, review
├── commands/                 # architect-this, plan-roadmap, refine-issue, build-from-github, build-from-pr-review, review-pr
├── skills/                   # gh-driven workflow skills (branch, commit, milestone operations)
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
