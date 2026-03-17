# Build from GitHub (Step 5: Building)

This command activates the Build Development Agent flow. User → Build Development Agent → validate → commit → push → create PR.

## Input

- GitHub issue link (`https://.../issues/123`, `owner/repo#123`, or `123`)

## Build Development Agent Flow

1. **Perform Code Changes** – Retrieve sub-issue details; ensure branch exists; implement subtask-scoped changes.
2. **Validate Success** – Run skills: `unit-test`, `integration-test`, `lint-test`.
3. **Scan changes for security vulnerabilities** – Examine the changeset before proceeding.
4. **skill: commit-code** – Commit approved changes.
5. **skill: push-branch** – Push branch state to remote.
6. **skill: create-pr** – Create GitHub PR for review handoff. Use `.github/pull_request_template.md` if present.

## Skill Resolution

- Resolve assigned skills from `.forge/skill_registry.json` at `agent_assignments.build` and `agent_assignments.build_wrap`.
- For each assigned skill ID, execute using the matching `skills[]` entry `script_path` and `usage`.

## Goal

Produce a GitHub pull request ready for Review.
