# Review PR

This command activates the Review agent from a PR link. Review validates correctness and security, then adds review comments to the PR. Human performs merge.

## Input

- GitHub pull request reference (`https://.../pull/123`, `owner/repo#123`, or `123`)

## Skill Resolution

- Resolve assigned skills from `.forge/skill_registry.json` at `command_assignments.review-pr` if present.
- For each assigned skill ID, execute using the matching `skills[]` entry `script_path` and `usage`.
- Do not duplicate script command strings in this command document.

## Workflow

1. Parse and validate PR reference.
2. Retrieve PR details using available tools (e.g. MCP GitHub, gh CLI).
3. Checkout PR source branch using available tools.
4. Review agent: examine changes for correctness and security; add review comments to PR.
5. Do not merge; human performs merge.

## Goal

Provide thorough review feedback on the PR. Human performs merge.
