---
name: build-from-github
description: Forge Step 5 — build from a GitHub issue; branch setup, board In Progress, implement, validate, git commit/push, PR, board completion, optional doc_repo sync, workflow retrospective.
disable-model-invocation: true
---

# Build from GitHub (Step 5: Building)

This skill drives **Step 5 (building)**: branch setup and issue link → **rebase on `main`** → **project board** (`In Progress` / after PR: `In Review` or sub-**`Done`**) → implement → **all automated tests pass** → **git commit** → **git push** → **ensure a PR exists (new or updated)** → **board completion rules + doc sync** → **Forge workflow retrospective** on the issue (see **`forge-post-workflow-retrospective`**).

The **Engineer** agent persona describes the same outcomes; invoking a separate **Engineer** Task subagent is **optional** when you implement in the same Cursor chat or IDE—the required result is the checklist below (branch, board status, validation, commit/push, PR). If your org wants traceability from the Engineer subagent, add an explicit step or checklist item to run **Task → engineer** (or equivalent) before closing the build.

**Branch creation and linking happen in this step only** (not during **`refine-issue`**).

## Input

- GitHub issue link (`https://.../issues/123`, `owner/repo#123`, or `123`)

## Workflow

1. Parse and validate issue reference.
2. **Resolve branch owner (mandatory)** — Run the **`resolve-issue-parentage`** skill from `.forge/skill_registry.json` (`agent_assignments.engineer` and `command_assignments.build-from-github`) with `owner/repo` and the issue number. Parse the **single JSON line** on stdout. Use these fields:
   - **`branch_owner_issue`** — The issue number that owns the integration branch (parent when the input is a sub-issue; otherwise the input issue).
   - **`suggested_branch`** — Always `feature/issue-{branch_owner_issue}`.
   - **`input_issue`** — The issue the user asked to build (unchanged); implement **this** issue’s scope while on **`suggested_branch`**.
3. **Branch setup** (execute before implementation). Alto9 policy: **sub-issues do not get their own git branches**. All work uses **`feature/issue-{branch_owner_issue}`** from step 2.

   **Target branch name**

   - **`feature/issue-{branch_owner_issue}`** — Use **`branch_owner_issue`** from **`resolve-issue-parentage`** for every branch lookup, link, and create operation (never use **`input_issue`** for the branch name when it differs, e.g. when building a sub-issue).

   **Steps**

   - **Check current branch:** If already on the target branch for this build, proceed.
   - **If not on target branch:** Look for an existing branch to use:
     - Branches linked to issue **`branch_owner_issue`**, open PRs for that line of work, or remotes matching **`feature/issue-{branch_owner_issue}`** (use **`get-issue-branches`** with **`branch_owner_issue`**).
   - **If a matching branch is found:** Fetch and checkout it.
   - **Otherwise:** Create and link **`feature/issue-{branch_owner_issue}`** for issue **`branch_owner_issue`** only. Prefer `gh issue develop <branch_owner_issue> --name feature/issue-{branch_owner_issue} --base main`. Fallback: **`create-issue-branch`** from `.forge/skill_registry.json` with branch name `feature/issue-{branch_owner_issue}`, issue number **`branch_owner_issue`**, base `main`. Push + link via MCP/gh when needed. Do **not** create `feature/issue-{input_issue}` when **`input_issue`** ≠ **`branch_owner_issue`** (sub-issue case).

   **Rebase on `main` (mandatory after a branch exists locally)**

   - `git fetch origin main` (or the repo’s default integration branch if the project standardizes on another name—**`main`** is the Forge default).
   - `git rebase origin/main` while on **`feature/issue-{branch_owner_issue}`**.
   - On **conflict**: resolve in-session, `git rebase --continue`, and only then proceed. If the branch was **already pushed**, coordinate before any **force-with-lease** push (do not force-push without explicit user agreement).

4. **GitHub Projects — start of build (`In Progress`)** — Read **`.forge/project.json`**. If **`github_board`** is absent, skip this step. Otherwise, for **`branch_owner_issue`**, load **sub-issues** (GitHub MCP **`issue_read`** `get_sub_issues`, or `gh api`). Use the same list in step 7. Requires `gh` with **`project`** scope (`gh auth refresh -s project` if commands fail).

   Run **`gh-project-set-status`** with **`github_board`**, **`owner/repo`**, and status **`In Progress`** as follows:

   | Situation | Issues to set **`In Progress`** |
   |-----------|----------------------------------|
   | **Sub-issue build** (`**input_issue**` ≠ `**branch_owner_issue**`) | **`branch_owner_issue`** (parent) **and** **`input_issue`** (sub) |
   | **Standalone parent** (`**input_issue**` === `**branch_owner_issue**` **and** **no** sub-issues) | **`input_issue`** only |
   | **Parent with sub-issues, building the parent ticket** (`**input_issue**` === `**branch_owner_issue**` **and** at least one sub-issue) | **`branch_owner_issue`** only (idempotent if already set from a prior sub-issue run) |

   The skill adds each issue to the project if needed.

5. **Implementation** — Implement code changes for **`input_issue`**; use `.forge` for alignment when relevant (see Engineer agent—update contracts there instead of ad hoc docs when they misrepresent the work); run repository-inferred validation (tests/lint/build as applicable, all must pass before commit); scan security. **Commit:** stage changes, then **`git commit`** with a **conventional** message (**CONTRIBUTING** / **README**). Do **not** commit on **`main`**, **`master`**, or **`develop`**. **Push:** **`git fetch origin`**, then **`git push -u origin HEAD`** when the branch has no upstream yet, else **`git push origin HEAD`**.

6. **Pull request (new or existing)** — Sub-issues share the parent branch (**`feature/issue-{branch_owner_issue}`**), so a PR for that head may **already exist** (e.g. opened for an earlier sub-issue). Before **`gh pr create`**:
   - Run **`gh pr list --head "feature/issue-{branch_owner_issue}" --state open --limit 1 --json number,title,url`** (add **`-R owner/repo`** when not in the app repo cwd; **`gh pr view` does not support `--head`**—use **`gh pr view <number>`** after listing) or list PRs for that head via MCP. **If a PR exists:** update **title** and **body** so the current **`input_issue`** is clearly in scope (use `.github/pull_request_template.md` when present); optionally add a **PR comment** or **issue comment** linking this build. **If none exists:** create the PR (same template and linking rules). **Closing keywords** (`Closes #N`, `Fixes #N`): multiple issues on one PR is normal for this branch policy; GitHub closes each referenced issue when the PR merges—confirm ordering with reviewers if some issues should stay open until others merge first.

7. **After a PR exists successfully (new or updated)** — If **`github_board`** is set, apply **one** of the following (same **`github_board`** and **`owner/repo`**). Use the sub-issue list from step 4 (refresh if needed).

   - **Sub-issue build** (`**input_issue**` ≠ `**branch_owner_issue**`) — Run **`gh-project-set-status`** for **`input_issue`** with status **`Done`**. Do **not** move the sub-issue to **In Review**. Do **not** move **`branch_owner_issue`** to **In Review** until **every** sub-issue is **`CLOSED`** on GitHub **and** this PR exists; then set **`branch_owner_issue`** → **`In Review`**.
   - **Standalone parent** (`**input_issue**` === `**branch_owner_issue**` **and** **no** sub-issues) — Set **`branch_owner_issue`** → **`In Review`**.
   - **Epic: all sub-issues closed** — If there is **at least one** sub-issue under **`branch_owner_issue`** and **every** sub-issue is **`CLOSED`**, set **`branch_owner_issue`** → **`In Review`**.

   - **Documentation sync (optional)** — If **`doc_repo`** is set in **`.forge/project.json`** **and** this PR **completes parent scope** for documentation purposes: either **`input_issue`** equals **`branch_owner_issue`**, or **`input_issue`** was the **last open sub-issue** for that parent (confirm via sub-issue list: no other sub-issue remains open for **`branch_owner_issue`** before treating this build as “scope complete”). Then:
     - Open the **Cursor workspace folder** whose **name** equals **`doc_repo`**. If that folder is not in the workspace, **stop** and report clearly.
     - In the **documentation** repo root, gather evidence from the **application** repo: `git log` / `git diff` against **`main`**, PR title/body, linked issues.
     - Update docs (Markdown / VitePress / site layout as appropriate). With **cwd** at the **documentation repository root**, run **`git commit`** (dedicated doc message) then **`git fetch origin`** and **`git push`** (or **`git push -u origin HEAD`** for a new branch). Do **not** mix doc commits into the application branch.

8. **Forge workflow retrospective (issue)** — After step 7 (including optional doc sync), run **`forge-post-workflow-retrospective`** from `.forge/skill_registry.json` in **`issue`** mode: post a concise retrospective comment on **`input_issue`** summarizing what worked or failed in the Forge workflow during this build (skills, board steps, branch/PR flow). See the skill’s **`usage`**.

## Skill Resolution

- Run skills listed under **`command_assignments.build-from-github`** in `.forge/skill_registry.json` for branch and project setup steps above.
- For **git** commit and push, follow this skill and the **Engineer** agent (no Forge script for commit/push). For other automation, use **`agent_assignments.engineer`** entries that define **`script_path`**.

## Goal

Produce a GitHub pull request ready for Quality Assurance (new or updated for the shared parent branch), with automated validation fully passing before commit, branch history rebased on **`main`**, project board updated when configured, documentation synced when **`doc_repo`** applies, and a **workflow retrospective** comment on **`input_issue`** when the retrospective skill is assigned.
