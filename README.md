# Forge Studio

Forge Studio is a **Visual Studio Code** extension; install and use it the same way in **Cursor**. It supports **context engineering** and **agentic development** for software teams whose work already lives on **GitHub**—issues, milestones, branches, pull requests, and (optionally) GitHub Projects—so planning, refinement, and implementation stay tied to the repository you ship from.

## Overview

Forge Studio provides:

- **Initialize Cursor Agents** – Installs the **complete** agents/skills/hooks bundle to `~/.cursor/` (user-level); script skills and `gh` assume the **GitHub CLI** where they touch issues, PRs, or branches
- **Initialize Project** – Creates or updates **`.forge/`** in the current project (metadata only: `project.json`, contracts, `skill_registry.json`, etc.); it does **not** write `<repo>/.cursor/`
- **Forge Help persona** – Workflow explainer for skill/agent guidance and handoff questions
- **Agent workflow** – Six-step flow: **Product Owner** → **Architect** → **Planner** → **Technical Writer** → **Engineer** → **Quality Assurance**, plus **Forge Help** for workflow questions. Agents install to `~/.cursor/agents/` from `resources/workflow/`. Shared context lives in the project’s **`.forge/`** folder: any agent may update those files when contracts are wrong or unclear; **Product Owner** owns `vision.json` / `project.json`, and **Architect** is the primary steward of `knowledge_map.json` and cross-domain coherence — see `resources/workflow/agents/AGENT_FLOW.md`.
- **Workflow skills** – Orchestration prompts (ex-commands) live under `resources/workflow/skills/<name>/SKILL.md` and install to `~/.cursor/skills/`; invoke with **`/<skill-name>`** in Agent chat.
- **Chat participants** – @forge-help, @product-owner, @architect, @planner, @technical-writer, @engineer, @quality-assurance (VS Code chat participants mirror the Cursor agents)

## Quick Start

1. Open a **Git** working copy of your **GitHub** repository in **VS Code** or **Cursor**
2. On Cursor startup, Forge checks user-level Cursor agents in `~/.cursor/` and prompts before applying updates when changes are needed
3. Run **Forge: Initialize Cursor Agents** (Command Palette) once per machine profile so **`~/.cursor/`** receives the **full** Forge bundle (agents, skills, hooks). Nothing is partially installed—every workflow file is copied; individual skills are simply unused when not relevant.
4. Run **Forge: Initialize Project** to create or update **`.forge/`** in the repository (project metadata: `vision.json`, `project.json`, `skill_registry.json`, `knowledge_map.json`, schemas, mapped contract stubs). This step does **not** write `<repo>/.cursor/`; Cursor agents and workflow skills come from **`~/.cursor/`** in the default layout.
5. After the steps above you have:
   - `~/.cursor/` – agents, skills, hooks (user-level, shared across projects)
   - `~/.cursor/hooks.json` – JSON schema validation on .forge file edits
   - `.forge/` – vision.json, project.json, skill_registry.json, knowledge_map.json, schemas/ (project-level)

**Skills path note:** `.forge/skill_registry.json` lists **script** skills with `script_path` under `.cursor/skills/...`. Resolve those against **`~/.cursor/skills/...`** (same path suffix). **Orchestration** skills (`kind`: `orchestration`) have no `script_path`; read **`~/.cursor/skills/<id>/SKILL.md`** (or **`resources/workflow/skills/<id>/SKILL.md`** in the Forge repo). Teams that commit a repo-local `.cursor/skills/` tree may use workspace-relative paths instead.

## User Flow

After Cursor-agent initialization, use the injected agents and **Agent Skills** in the editor (invoke with **`/<skill-name>`** in Agent chat). Roadmap and delivery steps operate on **GitHub** (milestones, issues, PRs) alongside `.forge` contracts:

- **Architect** (`/architect-this`) – Aligns `.forge/knowledge_map.json` and domain contract docs with product intent; hands off to Planner
- **Plan Roadmap** (`/plan-roadmap`) – Manages GitHub milestones and issues via pull-milestones, pull-milestone-issues
- **Refine Issue** (`/refine-issue`) – Step 4 **orchestration** (normalize input, resolve parent when the link is a sub-issue, delegate, verify outputs); the **Technical Writer** agent (**`@technical-writer`**) refines GitHub issue bodies and optional sub-issues — **no** git branches in this phase. Authoritative details: `resources/workflow/skills/refine-issue/SKILL.md` and `resources/workflow/agents/technical-writer.md` (installed to `~/.cursor/agents/technical-writer.md` after **Forge: Initialize Cursor Agents**).
- **Build from GitHub** (`/build-from-github`) – Runs **`resolve-issue-parentage`**, creates/checks out **`feature/issue-{branch_owner}`**, implements, runs all tests/lint until green, then git commit/push/PR (branches are created **here**, not during refinement)
- **Build from PR Review** (`/build-from-pr-review`) – Retrieves PR feedback, checks out PR branch, applies requested changes, validates, and pushes updates for re-review
- **Review PR** (`/review-pr`) – Reviews code, posts review comments

## Chat Participants (VS Code)

In the VS Code **Chat** view, type `@` to use Forge personas (same extension in Cursor):

| Participant | Purpose |
|-------------|---------|
| **@forge-help** | Workflow guide for Forge steps, skills, handoffs, and quality gates |
| **@product-owner** | Step 1: maintain product vision and project direction |
| **@architect** | Step 2: update technical contracts and knowledge structure |
| **@planner** | Step 3: align milestones and issues with documented direction |
| **@technical-writer** | Step 4: Technical Writer agent refines issues into implementation-ready work (invocation contract for `/refine-issue` is in `resources/workflow/skills/refine-issue/SKILL.md`) |
| **@engineer** | Step 5: implement scoped issue work and prepare PRs |
| **@quality-assurance** | Step 6: review PRs for correctness and security |

## Project Structure

After setup:

**User-level (~/.cursor/):**
```
~/.cursor/
├── agents/                   # product-owner, architect, planner, technical-writer, engineer, quality-assurance, forge-help (+ AGENT_FLOW.md)
├── skills/                   # orchestration SKILL.md + script skills (branch, PR, milestone, board, …)
├── hooks/                    # JSON schema validation on .forge file edits
└── hooks.json                # Cursor hooks config
```

**Project-level (.forge/):**
```
your-project/
└── .forge/
    ├── vision.json           # Product vision, mission, strategy
    ├── project.json          # Project config (repo GitHub URL, board links, paths)
    ├── skill_registry.json   # Skill-to-agent assignments
    ├── knowledge_map.json    # Domain structure (vision → runtime, business_logic, data, etc.)
    └── schemas/              # JSON schemas for validation
```

## Installation

Install the `.vsix` in **VS Code** or **Cursor** (`code` / **Install from VSIX…** in the UI).

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
