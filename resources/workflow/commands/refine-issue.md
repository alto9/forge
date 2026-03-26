# Refine Issue (Step 4: Refining)

This command invokes the **Technical Writer** agent. User → Technical Writer → parent branch (push + link) → use `.forge` contracts (patch when misleading) → optional sub-issues on GitHub (no per-sub-issue git branches).

## Input

- GitHub issue link (`https://.../issues/123`, `owner/repo#123`, or `123`)

## Workflow

1. Retrieve issue text from GitHub using available tools.
2. **Create parent branch and link** – Use `gh issue develop <parent-issue-number> --name feature/issue-{parent-number} --base main` when available; otherwise `create-issue-branch` (pass `<owner/repo>` when not in a clone) + push + link via MCP/gh.
3. Read relevant `.forge` domain contracts from `.forge/knowledge_map.json` for technical context. Update `.forge` when contracts are wrong or stale for this issue; escalate to Architect for structural or cross-domain design work.
4. Update issue based on the issue template; ensure all required details are included.
5. Create sub-issues on GitHub when useful—including a single sub-issue when appropriate. **Do not** create branches for sub-issues; build-from-github or Engineer creates them when work starts.

## Goal

Refined tickets ready for development with no ambiguity; parent branch visible and linked on GitHub.
