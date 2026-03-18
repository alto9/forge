# Review PR (Step 6: Reviewing)

This command invokes the Quality Assurance agent to review the PR for implementation accuracy, security, and post review feedback.

## Input

- GitHub pull request reference (`https://.../pull/123`, `owner/repo#123`, or `123`)

## Workflow

1. Parse and validate PR reference.
2. Retrieve PR details using available tools (e.g. MCP GitHub, gh CLI).
3. Handoff to Quality Assurance agent.

## Skill Resolution

- Resolve assigned skills from `.forge/skill_registry.json` at `agent_assignments.quality_assurance`.
- For each assigned skill ID, execute using the matching `skills[]` entry `script_path` and `usage`.

## Goal

Provide thorough review feedback on the PR. Human performs merge.
