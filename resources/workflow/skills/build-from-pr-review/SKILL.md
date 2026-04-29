---
name: build-from-pr-review
description: Forge — Engineer applies PR review feedback on the PR branch; re-validate, git commit/push, keep PR ready for QA re-review.
disable-model-invocation: true
---

# Build from PR Review (Feedback Implementation)

This skill invokes the **Engineer** agent to apply pull request review feedback on the existing PR branch while preserving original issue intent.

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

## Skill Resolution

- Resolve assigned **script** skills from `.forge/skill_registry.json` at `agent_assignments.engineer` when they apply (`script_path` + `usage`).
- Git commit/push: use **git** directly per Engineer agent and this skill.

## Goal

Update the existing pull request branch so review feedback is fully addressed and the PR is ready for re-review by Quality Assurance.
