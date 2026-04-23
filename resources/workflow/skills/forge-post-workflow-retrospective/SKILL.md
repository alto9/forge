---
name: forge-post-workflow-retrospective
description: [git_flow|github-forge-retrospective] Post a Forge workflow retrospective comment on an issue or PR conversation (not a PR review body)
---

# Forge workflow retrospective comment

Posts a **short retrospective** about how the **Forge workflow** behaved during the session: what worked, what failed (skills, commands, project board, branch policy, review flow). This is **meta** commentary on the process, not a duplicate of the technical PR review.

## Usage

```
scripts/forge-post-workflow-retrospective.sh issue <owner/repo> <issue-number> <body-file>
scripts/forge-post-workflow-retrospective.sh issue <issue-number> <body-file>
scripts/forge-post-workflow-retrospective.sh pr <owner/repo> <pr-number> <body-file>
scripts/forge-post-workflow-retrospective.sh pr <pr-number> <body-file>
```

- **`issue` mode** — **`gh issue comment`**: use at end of **Develop** (`/build-from-github`) on **`input_issue`**.
- **`pr` mode** — **`gh pr comment`**: use at end of **Review** (`/review-pr`) on the **same PR** as a **conversation** comment — **after** the formal submitted review; **do not** paste this into the review body.

`body-file` must be non-empty. The agent should write Markdown to a temp file (e.g. summary bullets, honest gaps).

Requires **`gh`** with **`repo`** scope.

## Distinctions

| Mechanism | Purpose |
|-----------|---------|
| This skill (`issue`) | Retrospective on the **issue** after development |
| This skill (`pr`) | Retrospective on the **PR thread** after QA |
| **`gh-pr-review`** / MCP `pull_request_review_write` | **Formal code review** (approve / request changes / comment) |
