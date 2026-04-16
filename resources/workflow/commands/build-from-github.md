# Build from GitHub (Step 5: Building)

This command invokes the **Engineer** agent. User → Engineer → branch setup and issue link → implement → **all automated tests pass** → commit → push → create PR.

**Branch creation and linking happen in this step only** (not during `/refine-issue`).

## Input

- GitHub issue link (`https://.../issues/123`, `owner/repo#123`, or `123`)

## Workflow

1. Parse and validate issue reference.
2. **Resolve branch owner (mandatory)** — Run the **`resolve-issue-parentage`** skill from `.forge/skill_registry.json` (`agent_assignments.engineer`) with `owner/repo` and the issue number. Parse the **single JSON line** on stdout. Use these fields:
   - **`branch_owner_issue`** — The issue number that owns the integration branch (parent when the input is a sub-issue; otherwise the input issue).
   - **`suggested_branch`** — Always `feature/issue-{branch_owner_issue}`.
   - **`input_issue`** — The issue the user asked to build (unchanged); Engineer implements **this** issue’s scope while on **`suggested_branch`**.
3. **Branch setup** (execute before Engineer handoff). Alto9 policy: **sub-issues do not get their own git branches**. All work uses **`feature/issue-{branch_owner_issue}`** from step 2.

   **Target branch name**

   - **`feature/issue-{branch_owner_issue}`** — Use **`branch_owner_issue`** from **`resolve-issue-parentage`** for every branch lookup, link, and create operation (never use **`input_issue`** for the branch name when it differs, e.g. when building a sub-issue).

   **Steps**

   - **Check current branch:** If already on the target branch for this build, proceed.
   - **If not on target branch:** Look for an existing branch to use:
     - Branches linked to issue **`branch_owner_issue`**, open PRs for that line of work, or remotes matching **`feature/issue-{branch_owner_issue}`** (use **`get-issue-branches`** with **`branch_owner_issue`**).
   - **If a matching branch is found:** Fetch and checkout it.
   - **Otherwise:** Create and link **`feature/issue-{branch_owner_issue}`** for issue **`branch_owner_issue`** only. Prefer `gh issue develop <branch_owner_issue> --name feature/issue-{branch_owner_issue} --base main`. Fallback: **`create-issue-branch`** from `.forge/skill_registry.json` with branch name `feature/issue-{branch_owner_issue}`, issue number **`branch_owner_issue`**, base `main`. Push + link via MCP/gh when needed. Do **not** create `feature/issue-{input_issue}` when **`input_issue`** ≠ **`branch_owner_issue`** (sub-issue case).
4. Handoff to Engineer: implement code changes for **`input_issue`**; use `.forge` for alignment when relevant (see Engineer agent—update contracts there instead of ad hoc docs when they misrepresent the work); run repository-inferred validation (tests/lint/build as applicable, all must pass before commit); scan security; commit; push; create-pr. Use `.github/pull_request_template.md` if present.

## Skill Resolution

- Resolve assigned skills from `.forge/skill_registry.json` at `agent_assignments.engineer`.
- For each assigned skill ID, execute using the matching `skills[]` entry `script_path` and `usage`.

## Goal

Produce a GitHub pull request ready for Quality Assurance, with automated validation fully passing before commit.
