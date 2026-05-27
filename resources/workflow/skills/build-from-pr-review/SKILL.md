---
name: build-from-pr-review
description: Forge — Engineer applies PR review feedback on the PR branch; re-validate, git commit/push, optional parent In Review via gh-project-set-status when ticket + CI complete.
disable-model-invocation: true
---

# Build from PR Review (Feedback Implementation)

This skill invokes the **Engineer** agent to apply pull request review feedback on the existing PR branch while preserving original issue intent. When **`.forge/project.json`** configures **`github_board`**, it can move the **parent** issue to **`In Review`** via **`gh-project-set-status`** only after **GitHub PR checks** succeed **and** the same **ticket completion** rules as **`build-from-github`** apply.

## Input

- GitHub pull request reference (`https://.../pull/123`, `owner/repo#123`, or `123`)

## Workflow

1. Parse and validate PR reference.
2. Retrieve PR details using available tools (e.g. MCP GitHub, gh CLI), including:
   - PR head branch and head repository.
   - Associated issue (linked issue, closing keywords, or referenced issue).
3. Retrieve PR review feedback using available tools:
   - Pull request reviews.
   - Pull request review comments.
   - Pull request conversation comments relevant to requested changes.
4. **Verify branch context** before Engineer handoff:
   - If current branch already matches PR head branch, proceed.
   - Otherwise, fetch and checkout the PR head branch.
5. Handoff to Engineer to satisfy feedback:
   - Preserve original issue intent and acceptance scope.
   - Address requested changes from Quality Assurance and other review feedback.
   - Run repository-inferred validation (tests/lint/build as applicable; all must pass before commit).
   - Scan changes for security vulnerabilities.
   - **Commit and push** using **`git commit`** (conventional messages; not on `main`/`master`/`develop`) and **`git fetch origin`** then **`git push`** (`git push -u origin HEAD` when no upstream).

6. **GitHub Projects — parent `In Review` when the ticket is complete** — After the **commit** and **push** in step 5, if **`.forge/project.json`** has **`github_board`**, evaluate whether the **parent** (`**branch_owner_issue**`) should move to **`In Review`** using the **`gh-project-set-status`** skill from `.forge/skill_registry.json`. Requires `gh` with **`project`** scope. **Skip this step** if **`github_board`** is absent.

   - **`owner/repo`** — Use the PR’s base repository (unless this is a **fork** PR; then use the repo where the **issue** lives, typically the base repo for **`resolve-issue-parentage`**).
   - **Resolve parentage** — From the PR (body **`Closes` / `Fixes`**, linked issues, development metadata), pick issue number(s) and run **`resolve-issue-parentage`** from `.forge/skill_registry.json`. All linked issues on the same line of work must yield the same **`branch_owner_issue`**; if they disagree, stop and reconcile before updating the board. Confirm the PR **head branch** is **`feature/issue-{branch_owner_issue}`** (same policy as **`build-from-github`**); otherwise **do not** apply parent **`In Review`** rules here—report the mismatch.
   - **Sub-issues** — For **`branch_owner_issue`**, load **sub-issues** (GitHub MCP **`issue_read`** `get_sub_issues`, or `gh api`). Refresh this list when deciding completion.
   - **Verify CI** — Run **`gh pr checks <pr-number> -R owner/repo --watch`** until **required** checks **finish** (`gh` may exit **8** while still pending). **Do not** set **`In Review`** if any **required** check **`bucket`** is **`fail`** after completion. If checks remain pending beyond a reasonable wait, report that and **skip** the board update until CI completes (user may re-invoke this step).
   - **Parent ticket complete for board `In Review`** — Same definition as **`build-from-github`** step 7: **open** PR with head **`feature/issue-{branch_owner_issue}`**, **required** checks **passing**, and **sub-issue completeness** (**no** sub-issues **or** **every** sub-issue **closed** on GitHub).
   - **Action** — If **Parent ticket complete** is satisfied, run **`gh-project-set-status`** with **`github_board`**, **`owner/repo`**, issue **`branch_owner_issue`**, status **`In Review`**. **Do not** move sub-issues to **`Done`** here (that remains **`build-from-github`**). If criteria are **not** met, report what is missing instead of calling **`gh-project-set-status`** → **`In Review`**.

## Skill Resolution

- Resolve **`resolve-issue-parentage`** and **`gh-project-set-status`** from `.forge/skill_registry.json` when they apply; use **git** directly per Engineer agent and this skill for commit/push.

## Goal

Update the existing pull request branch so review feedback is fully addressed and the PR is ready for re-review by Quality Assurance, and when **`github_board`** is configured, set the **parent** issue to **`In Review`** only if **required** PR checks pass **and** the ticket meets the **`build-from-github`** completion rules (**no** sub-issues, **or** **every** sub-issue **closed**).
