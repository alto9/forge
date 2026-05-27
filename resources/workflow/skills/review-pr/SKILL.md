---
name: review-pr
description: Forge Step 6 — QA formal GitHub PR review (approve/request-changes/comment), optional board self-heal, forge-post-workflow-retrospective on PR.
disable-model-invocation: true
---

# Review PR (Step 6: Reviewing)

This skill invokes the Quality Assurance agent to review the PR for implementation accuracy, security, and to **submit a formal GitHub review** (approve, request changes, or comment) with a written body.

## Input

- GitHub pull request reference (`https://.../pull/123`, `owner/repo#123`, or `123`)

## Workflow

1. Parse and validate PR reference.
2. Retrieve PR details using available tools (e.g. MCP GitHub, `gh` CLI).
3. Handoff to Quality Assurance agent.
4. **Disposable `git worktree` for local inspection** — Whenever review uses this workspace’s checkout (reading files on disk, repo-local `git` commands, linters, or tests against the PR head), **do that work only inside a dedicated worktree**, then remove it.
   - **Repository root:** the Git repo that owns the PR branch (**not** an unrelated parent superproject checkout unless the PR targets that umbrella repo). For nested repos / submodules, run these commands from the submodule root that matches the PR’s **`headRepository`** / remote.
   - **Create:** from `<repo-root>`: `git fetch origin pull/<PR_NUMBER>/head` then `git worktree add <wt-path> FETCH_HEAD`. Pick `<wt-path>` outside the main working tree when practical (e.g. sibling directory `<repo-root>-pr-<PR_NUMBER>-review`) so the reviewer’s usual branch is untouched; the directory must not exist yet.
   - **Review:** perform all filesystem reads, searches, and local tooling from `<wt-path>` (or with **`git -C <wt-path>`**). Prefer GitHub/API diff data when it suffices; anything that touches the clone stays in this worktree.
   - **Remove:** after the formal GitHub review is submitted **and** orchestrated follow-ups in this workflow finish (or if the session aborts after local inspection started), run `git -C <repo-root> worktree remove <wt-path>`. Use **`--force`** only for the disposable tree when Git refuses removal (e.g. leftover locks); do **not** force-remove if unsure the path is only this PR worktree.
   - **Pure remote review:** if the session never opens local files and never runs repo-local commands, skip creating a worktree.
5. **Quality Assurance** loads the diff, linked issues, and CI; adds **line comments** when useful. Line comments are **optional supplements** — they **cannot** replace a formal review.
6. **Submit one formal PR review** (mandatory) — Must appear on the PR **Reviews** tab. **Do not** use only **`gh pr comment`** or issue notes; those are not a submitted review.
   - **Preferred:** GitHub MCP **`pull_request_review_write`** with `method: "create"`, `body`, and `event` **`APPROVE`**, **`REQUEST_CHANGES`**, or **`COMMENT`** (use **`REQUEST_CHANGES`** for a blocking / “declining” verdict). Confirm the review is recorded before continuing.
   - **Fallback:** run the **`gh-pr-review`** skill from `.forge/skill_registry.json` (`approve` | `request-changes` | `comment`) with the same body text — this wraps **`gh pr review`**, not **`gh pr comment`**.
7. **Project board self-heal (optional)** — Read **`.forge/project.json`**. If **`github_board`** is set and the PR’s **parent** issue (from linked issues / `Fixes`) has **sub-issues**, check whether **every** sub-issue is **`CLOSED`**. If so, run **`gh-project-set-status`** for that **parent issue number** with status **`In Review`** (same `owner/repo` as the PR). Idempotent repair if **Develop** already updated the board.
8. **Forge workflow retrospective** — Run **`forge-post-workflow-retrospective`** in **`pr`** mode: post a retrospective comment on the **PR conversation** (separate from the review body). See the skill’s **`usage`** in `.forge/skill_registry.json`.

## Skill Resolution

- Resolve assigned skills from `.forge/skill_registry.json` at `agent_assignments.quality_assurance` and `command_assignments.review-pr`.
- For each assigned skill ID, execute using the matching `skills[]` entry **`script_path`** and **`usage`** when **`script_path`** is present.

## Goal

Provide thorough review feedback on the PR, a **submitted** GitHub **review** (not merely a PR comment), and a **workflow retrospective** comment on the PR when the retrospective skill is assigned. Human performs merge.
