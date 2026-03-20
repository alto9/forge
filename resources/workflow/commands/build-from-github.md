# Build from GitHub (Step 5: Building)

This command activates the Build Development Agent flow. User → Build Development Agent → branch setup and issue link → implement → **all automated tests pass** → commit → push → create PR.

## Input

- GitHub issue link (`https://.../issues/123`, `owner/repo#123`, or `123`)

## Build Development Agent Flow

1. **Branch setup and link** – For the **issue in the link** (parent or sub-issue): create/checkout `feature/issue-{N}` from `main` or parent branch; push; link branch to that issue on GitHub if not already linked.
2. **Perform Code Changes** – Fetch issue details; implement scoped work (read parent issue if sub-issue).
3. **Validate Success** – Run `unit-test`, `integration-test`, and `lint-test` from `.forge/skill_registry.json`. **Do not commit or open a PR until every command succeeds.** Re-run after substantive edits.
4. **Scan changes for security vulnerabilities** – Examine the changeset before proceeding.
5. **skill: commit-code** – Commit approved changes.
6. **skill: push-branch** – Push branch state to remote.
7. **skill: create-pr** – Create GitHub PR for review handoff. Use `.github/pull_request_template.md` if present.

## Skill Resolution

- Resolve assigned skills from `.forge/skill_registry.json` at `agent_assignments.build` and `agent_assignments.build_wrap`.
- For each assigned skill ID, execute using the matching `skills[]` entry `script_path` and `usage`.

## Goal

Produce a GitHub pull request ready for Review, with automated validation fully passing before commit.
