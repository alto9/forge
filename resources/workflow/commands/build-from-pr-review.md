# Build from PR Review (Feedback Implementation)

This command invokes the **Engineer** agent to apply pull request review feedback on the existing PR branch while preserving original issue intent.

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
   - Run `unit-test`, `integration-test`, `lint-test` (all must pass before commit).
   - Scan changes for security vulnerabilities.
   - Commit and push updates to the same PR branch.

## Skill Resolution

- Resolve assigned skills from `.forge/skill_registry.json` at `agent_assignments.engineer`.
- For each assigned skill ID, execute using the matching `skills[]` entry `script_path` and `usage`.

## Goal

Update the existing pull request branch so review feedback is fully addressed and the PR is ready for re-review by Quality Assurance.
