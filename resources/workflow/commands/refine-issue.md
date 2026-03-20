# Refine Issue (Step 4: Refining)

This command invokes the Refine Agent. User → Refine Agent → parent branch (push + link) → SME consultation → optional sub-issues on GitHub (no per-sub-issue git branches).

## Input

- GitHub issue link (`https://.../issues/123`, `owner/repo#123`, or `123`)

## Refine Agent Flow

1. Retrieve issue text from GitHub using available tools.
2. **skill: create-feature-branch** – Create **parent** branch from `main`: `create-feature-branch feature/issue-{parent-number} main`.
3. **Push and link to the parent issue** – Push the branch to `origin` (use **push-branch** from `.forge/skill_registry.json` if assigned; use an empty commit first if the remote rejects an empty branch). Link the branch to the parent issue via **GitHub CLI** (`gh issue develop` or equivalent) or **GitHub MCP**.
4. Consult SME Agents (Runtime, BusinessLogic, Data, Interface, Integration, Operations) for technical information and implementation guides.
5. Update issue based on the issue template; ensure all required details are included.
6. Create sub-issues on GitHub when useful—including a single sub-issue when appropriate. **Do not** run `create-feature-branch` per sub-issue; Build creates implementation branches.

## Goal

Refined tickets ready for development with no ambiguity; parent branch visible and linked on GitHub.
