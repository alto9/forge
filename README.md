# Forge Studio

VSCode/Cursor extension for context engineering and agentic development. Forge Studio helps teams maintain product vision, technical concepts, and roadmaps—then turns milestones into actionable, implementation-ready issues via a staged agent workflow.

## Overview

Forge Studio provides:

- **Setup Project for Cursor/VSCode** – Creates `.forge` metadata, `.cursor/agents`, `.cursor/commands`, `.cursor/skills`, and hooks from workflow templates
- **Agent workflow** – Visionary, Architect, Planner, Refine, and domain SMEs (runtime, business_logic, data, interface, integration, operations) for planning and documentation; Build and Review agents for implementation
- **Commands** – architect-this, plan-roadmap, refine-issue, build-from-github, review-pr
- **Chat participants** – @forge, @forge-refine, @forge-commit, @forge-push, @forge-pullrequest, @forge-setup-issue, @forge-build-issue, @forge-review-pr
- **Roadmap view** – View milestones and issues (synced with GitHub)
- **Refine Issue** – Refine GitHub issues into development-ready sub-issues via webview

## Quick Start

1. Open a project in Cursor or VSCode
2. Run **Forge: Setup Project for Cursor** (or **Forge: Setup Project for VSCode**) from the Command Palette (`Cmd/Ctrl+Shift+P`)
3. Forge creates:
   - `.forge/` – vision.json, project.json, skill_registry.json, knowledge_map.json, schemas/
   - `.cursor/agents/` – visionary, architect, planner, refine, runtime, business_logic, data, interface, integration, operations, build agents, review agents
   - `.cursor/commands/` – architect-this, plan-roadmap, refine-issue, build-from-github, review-pr
   - `.cursor/skills/` – init-forge, fetch-url, create-feature-branch, commit, push-branch, pull-milestones, pull-milestone-issues, unit-test, lint-test, integration-test
   - `.cursor/hooks/` – JSON schema validation
   - `hooks.json` – in `~/.cursor/`

## User Flow

### 1. Architect (`/architect-this`)

Invoke the Architect agent with a prompt. The Architect examines vision.json, delegates to domain SME agents (runtime, business_logic, data, interface, integration, operations) when scope matches, and invokes the Planner with a recap. Updates `.forge` documents.

### 2. Plan Roadmap (`/plan-roadmap`)

The Planner manages the GitHub roadmap. GitHub is the single source of truth. Before any planning action, the Planner:

1. **pull-milestones** – Retrieves all milestones from GitHub
2. **pull-milestone-issues** – For each milestone, retrieves its issues
3. **Create/update via GitHub** – Uses GitHub MCP or `gh` CLI to create milestones, create issues, and assign issues to milestones

The Planner breaks out desired functionality into milestones and issues that work within the existing roadmap (which is likely in flight).

### 3. Refine Issue (`/refine-issue` or **Forge: Refine Issue**)

Provide a GitHub issue link. The Refine agent retrieves the issue, creates a parent branch, consults SME agents for technical context, updates the issue, creates sub-issues, and creates branches for each sub-issue. You can also use **Forge: Refine Issue** to open a refinement webview.

### 4. Build from GitHub (`/build-from-github`)

Provide a GitHub issue link. Build Development performs code changes and runs unit-test, lint-test, integration-test. Build Security scans for vulnerabilities. Build Wrap commits, pushes, and creates a PR.

### 5. Review PR (`/review-pr`)

Provide a PR link. Review Implementation reviews the code, Review Security checks for vulnerabilities, Review Wrap posts the review to the PR (human performs merge).

### 6. Roadmap

Use **Forge: Roadmap** to view project milestones and issues from GitHub.

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

```
your-project/
├── .forge/
│   ├── vision.json           # Product vision, mission, strategy
│   ├── project.json          # Project config (GitHub URL, paths)
│   ├── skill_registry.json   # Skill-to-agent assignments
│   ├── knowledge_map.json    # Domain structure (vision → runtime, business_logic, data, etc.)
│   └── schemas/              # JSON schemas for validation
├── .cursor/
│   ├── agents/               # visionary, architect, planner, refine, domain SMEs, build, review
│   ├── commands/             # architect-this, plan-roadmap, refine-issue, build-from-github, review-pr
│   ├── skills/               # init-forge, fetch-url, pull-milestones, pull-milestone-issues, etc.
│   └── hooks/                # JSON schema validation on edit
└── hooks.json                # Cursor hooks config (~/.cursor/)
```

Run the **init-forge** skill to scaffold the full domain structure from knowledge_map (e.g. `.forge/runtime/`, `.forge/business_logic/`, `.forge/data/`, etc.).

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
