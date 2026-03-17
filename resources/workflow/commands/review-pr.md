# Review PR (Step 6: Reviewing)

This command activates the Review flow. User → Review Implementation Agent → Review Security Agent → Review Wrap Agent. Human performs merge.

## Input

- GitHub pull request reference (`https://.../pull/123`, `owner/repo#123`, or `123`)

## Review Flow

### Review Implementation Agent
1. Retrieve Github PR Details
2. Checkout PR Source Branch
3. Review Implementation for Accuracy

### Review Security Agent
1. Check for Security Vulnerabilities introduced in the changeset

### Review Wrap Agent
1. Add the review to the PR

## Skill Resolution

- Resolve assigned skills from `.forge/skill_registry.json` at `command_assignments.review-pr` if present.
- For each assigned skill ID, execute using the matching `skills[]` entry `script_path` and `usage`.

## Goal

Provide thorough review feedback on the PR. Human performs merge.
