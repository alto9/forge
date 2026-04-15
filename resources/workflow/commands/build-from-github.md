# Build from GitHub (Step 5: Building)

This command invokes the **Engineer** agent. User → Engineer → branch setup and issue link → implement → **all automated tests pass** → commit → push → create PR.

## Input

- GitHub issue link (`https://.../issues/123`, `owner/repo#123`, or `123`)

## Workflow

1. Parse and validate issue reference.
2. Retrieve issue details using available tools (e.g. MCP GitHub, gh CLI). Determine whether the issue is a **sub-issue** and resolve its **parent** issue number (GitHub sub-issue relationship / API).
3. **Branch setup** (execute before Engineer handoff). Alto9 policy: **sub-issues do not get their own git branches**. All work for a sub-issue happens on the parent’s branch **`feature/issue-{parent}`**.

   **Target branch name**

   - **Top-level issue** (not a sub-issue): `feature/issue-{N}` where `{N}` is this issue’s number.
   - **Sub-issue:** `feature/issue-{parent}` where `{parent}` is the parent issue’s number—**not** the sub-issue’s number.

   **Steps**

   - **Check current branch:** If already on the target branch for this build, proceed.
   - **If not on target branch:** Look for an existing branch to use:
     - For a **top-level** issue: branches linked to **this** issue, open PRs, or remotes matching `feature/issue-{N}`.
     - For a **sub-issue:** branches linked to the **parent** issue (the child issue may have no linked branch), open PRs for the parent line of work, or remotes matching `feature/issue-{parent}`.
   - **If a matching branch is found:** Fetch and checkout it.
   - **Otherwise — top-level issue:** Create and link. Prefer `gh issue develop <N> --name feature/issue-{N} --base main`. Fallback: **`create-issue-branch`** from `.forge/skill_registry.json` with root `main`, then push + link via MCP/gh.
   - **Otherwise — sub-issue:** Do **not** create `feature/issue-{child}` or run `gh issue develop <child>`. Create/checkout **`feature/issue-{parent}`** only: prefer `gh issue develop <parent> --name feature/issue-{parent} --base main` if the parent branch does not exist; if it exists remotely, fetch and checkout. Fallback: **`create-issue-branch`** with branch name `feature/issue-{parent}`, issue number **`parent`** (not the sub-issue number), base `main`. Push when needed.
4. Handoff to Engineer: implement code changes; use `.forge` for alignment when relevant (see Engineer agent—update contracts there instead of ad hoc docs when they misrepresent the work); run repository-inferred validation (tests/lint/build as applicable, all must pass before commit); scan security; commit; push; create-pr. Use `.github/pull_request_template.md` if present.

## Skill Resolution

- Resolve assigned skills from `.forge/skill_registry.json` at `agent_assignments.engineer`.
- For each assigned skill ID, execute using the matching `skills[]` entry `script_path` and `usage`.

## Goal

Produce a GitHub pull request ready for Quality Assurance, with automated validation fully passing before commit.
