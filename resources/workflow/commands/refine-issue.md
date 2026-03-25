# Refine Issue (Step 4: Refining)

This command invokes the **Technical Writer** agent. User → Technical Writer → parent branch (push + link) → read `.forge` contracts → optional sub-issues on GitHub (no per-sub-issue git branches).

## Input

- GitHub issue link (`https://.../issues/123`, `owner/repo#123`, or `123`)

## Workflow

1. Retrieve issue text from GitHub using available tools.
2. **Create parent branch and link** – Use `gh issue develop <parent-issue-number> --name feature/issue-{parent-number} --base main` when available; otherwise `create-feature-branch` + push + link via MCP/gh.
3. Read relevant `.forge` domain contracts from `.forge/knowledge_map.json` for technical context. If contracts need changes, escalate to Architect.
4. Update issue based on the issue template; ensure all required details are included.
5. Create sub-issues on GitHub when useful—including a single sub-issue when appropriate. **Do not** create branches for sub-issues; build-from-github or Engineer creates them when work starts.

## Goal

Refined tickets ready for development with no ambiguity; parent branch visible and linked on GitHub.
