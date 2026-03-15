# Plan Roadmap

This command invokes the Planner agent to manage the GitHub roadmap. GitHub is the single source of truth. Before performing any planning action, the Planner pulls milestones and issues from GitHub to understand current state. The Planner then creates or updates milestones and issues directly via GitHub MCP or `gh` CLI.

## Input

- `.forge/vision.json`, `.forge/knowledge_map.json`

## Workflow

1. **pull-milestones** – Run `pull-milestones` with `[owner/repo]` to retrieve all milestones from GitHub.
2. **For each milestone returned** – Run `pull-milestone-issues` with the milestone number to retrieve issues for that milestone.
3. **Create/update via GitHub** – Use GitHub MCP (`mcp_github_*`) or `gh` CLI to create milestones, create issues, and assign issues to milestones.

Resolve owner/repo from `gh repo view` when run from a gh-linked repo, or pass explicitly.

## Skills

- `pull-milestones` – Fetch milestones from GitHub
- `pull-milestone-issues` – Fetch issues for a given milestone

## Goal

Synchronized GitHub milestones and issues reflecting the validated roadmap.
