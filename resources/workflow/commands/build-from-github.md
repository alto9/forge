# Build from GitHub (Step 5: Building)

This command invokes the Engineer agent to implement code changes, validate, scan for security, commit, push, and create a PR.

## Input

- GitHub issue link (`https://.../issues/123`, `owner/repo#123`, or `123`)

## Workflow

1. Parse and validate issue reference.
2. Retrieve issue details using available tools (e.g. MCP GitHub, gh CLI).
3. Handoff to Engineer agent.

## Skill Resolution

- Resolve assigned skills from `.forge/skill_registry.json` at `agent_assignments.engineer`.
- For each assigned skill ID, execute using the matching `skills[]` entry `script_path` and `usage`.

## Goal

Produce a GitHub pull request ready for Quality Assurance.
