# Review PR (Step 6: Reviewing)

This command invokes the Quality Assurance agent to review the PR for implementation accuracy, security, and to **submit a formal GitHub review** (approve, request changes, or comment) with a written body.

## Input

- GitHub pull request reference (`https://.../pull/123`, `owner/repo#123`, or `123`)

## Workflow

1. Parse and validate PR reference.
2. Retrieve PR details using available tools (e.g. MCP GitHub, `gh` CLI).
3. Handoff to Quality Assurance agent.
4. **Quality Assurance** loads the diff, linked issues, and CI; adds **line comments** when useful. Line comments are **optional supplements** — they **cannot** replace a formal review.
5. **Submit one formal PR review** (mandatory) — Must appear on the PR **Reviews** tab. **Do not** use only **`gh pr comment`** or issue notes; those are not a submitted review.
   - **Preferred:** GitHub MCP **`pull_request_review_write`** with `method: "create"`, `body`, and `event` **`APPROVE`**, **`REQUEST_CHANGES`**, or **`COMMENT`** (use **`REQUEST_CHANGES`** for a blocking / “declining” verdict). Confirm the review is recorded before continuing.
   - **Fallback:** run the **`gh-pr-review`** skill from `.forge/skill_registry.json` (`approve` | `request-changes` | `comment`) with the same body text — this wraps **`gh pr review`**, not **`gh pr comment`**.
6. **Project board self-heal (optional)** — Read **`.forge/project.json`**. If **`github_board`** is set and the PR’s **parent** issue (from linked issues / `Fixes`) has **sub-issues**, check whether **every** sub-issue is **`CLOSED`**. If so, run **`gh-project-set-status`** for that **parent issue number** with status **`In Review`** (same `owner/repo` as the PR). Idempotent repair if **Develop** already updated the board.
7. **Forge workflow retrospective** — Run **`forge-post-workflow-retrospective`** in **`pr`** mode: post a retrospective comment on the **PR conversation** (separate from the review body). See the skill’s **`usage`** in `.forge/skill_registry.json`.

## Skill Resolution

- Resolve assigned skills from `.forge/skill_registry.json` at `agent_assignments.quality_assurance` and `command_assignments.review-pr`.
- For each assigned skill ID, execute using the matching `skills[]` entry `script_path` and `usage`.

## Goal

Provide thorough review feedback on the PR, a **submitted** GitHub **review** (not merely a PR comment), and a **workflow retrospective** comment on the PR when the retrospective skill is assigned. Human performs merge.
