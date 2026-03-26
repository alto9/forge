---
name: assign-issue-to-me
description: Assign the specified Github issue ID to me
---

# Assign Issue to Me

Use the provided script to assign a GitHub issue to the authenticated user. Requires the GitHub CLI (`gh`).

## Usage

Run the script: `scripts/assign-issue-to-me.sh <owner/repo> <issue-number>`

When you run the script from a **clone** linked to `gh`, you may omit the repo and pass only the issue:

`scripts/assign-issue-to-me.sh <issue-number>`

### Arguments

- **owner/repo** — GitHub repository (`OWNER/REPO` or `HOST/OWNER/REPO`), required when not in a gh-linked clone (e.g. skills installed under `~/.cursor`).
- **issue-number** — Issue number or URL, as accepted by `gh issue edit`.

### Examples

```bash
scripts/assign-issue-to-me.sh myorg/myrepo 123
scripts/assign-issue-to-me.sh 123
```

### Requirements

- **GitHub CLI (`gh`)** installed and authenticated for the target repository.
