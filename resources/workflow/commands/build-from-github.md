# Build from GitHub (Step 5: Building)

This command invokes the **Engineer** agent. User → Engineer → branch setup and issue link → implement → **all automated tests pass** → commit → push → create PR.

## Input

- GitHub issue link (`https://.../issues/123`, `owner/repo#123`, or `123`)

## Workflow

1. Parse and validate issue reference.
2. Retrieve issue details using available tools (e.g. MCP GitHub, gh CLI).
3. **Branch setup** (execute before Engineer handoff):
   - **Check current branch:** If already on the correct branch for the issue (e.g. `feature/issue-123`), proceed.
   - **If not on correct branch:** Check for an existing branch linked to the issue (GitHub linked branches, open PRs referencing it, remote branches matching convention).
   - **If linked/existing branch found:** Fetch and checkout that branch.
   - **Otherwise:** Create and link. Prefer `gh issue develop <issue-number> --name feature/issue-{N} --base <base>`. For sub-issues: base = `feature/issue-{parent}`; for parent issues: base = `main`. Fallback: `create-feature-branch` + push + link via MCP/gh.
4. Handoff to Engineer: implement code changes; run repository-inferred validation (tests/lint/build as applicable, all must pass before commit); scan security; commit; push; create-pr. Use `.github/pull_request_template.md` if present.

## Skill Resolution

- Resolve assigned skills from `.forge/skill_registry.json` at `agent_assignments.engineer`.
- For each assigned skill ID, execute using the matching `skills[]` entry `script_path` and `usage`.

## Goal

Produce a GitHub pull request ready for Quality Assurance, with automated validation fully passing before commit.
