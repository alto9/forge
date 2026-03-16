# Build from GitHub

This command activates the build workflow from a GitHub issue link. Build implements changes and validates with tests, then Build Wrap commits, pushes, and creates the PR.

## Input

- GitHub issue link (`https://.../issues/123`, `owner/repo#123`, or `123`)

## Skill Resolution

- Resolve assigned skills from `.forge/skill_registry.json` at `agent_assignments.build` and `agent_assignments.build_wrap`.
- For each assigned skill ID, execute using the matching `skills[]` entry `script_path` and `usage`.
- Do not duplicate script command strings in this command document.

## Workflow

1. Parse and validate issue reference.
2. Retrieve issue details using available tools (e.g. MCP GitHub, gh CLI).
3. Build agent: implement changes; run unit-test, integration-test, lint-test.
4. Build Wrap agent: commit, push-branch; create GitHub PR (use available tools).

## Goal

Produce a GitHub pull request ready for Review. When creating the PR, build_wrap uses `.github/pull_request_template.md` if present, otherwise a standard fallback template.
