---
name: gh-pr-review
description: [git_flow|github-pr-review] Submit an approving, request-changes, or comment review on a pull request via gh CLI
---

# GitHub PR review (submit)

Submits a **single formal PR review** (the review record GitHub shows on the **Reviews** tab / in the PR timeline) using **`gh pr review`**. This is **not** the same as a general conversation comment (`gh pr comment`). Use when GitHub MCP `pull_request_review_write` is unavailable.

Requires `gh` with `repo` scope. For org/private repos, ensure authentication is valid.

## Usage

```
scripts/gh-pr-review.sh <owner/repo> <pr-number> <approve|request-changes|comment> <body>
scripts/gh-pr-review.sh <pr-number> <approve|request-changes|comment> <body>
```

- `body` is required (non-empty). Pass a short summary plus verdict rationale.
- `request-changes` maps to GitHub “Request changes” (use for a declining / blocking verdict).
- `comment` leaves a comment review without approve or request-changes.

When `owner/repo` is omitted, the current `gh repo view` context is used.
