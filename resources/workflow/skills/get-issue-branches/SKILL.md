---
name: get-issue-branches
description: [git_flow|branch-create] Get the branches associated to an issue ID
---

# Get Issue Branches

Use the provided script to list branches linked to a GitHub issue (`gh issue develop --list`). Requires the GitHub CLI (`gh`).

## Usage

Run the script: `scripts/get-issue-branches.sh <owner/repo> <issue-number>`

From a **gh-linked clone**, you may use:

`scripts/get-issue-branches.sh <issue-number>`

### Arguments

- **owner/repo** — GitHub repository (`OWNER/REPO` or `HOST/OWNER/REPO`), required when not in a gh-linked clone.
- **issue-number** — Issue number or URL, as accepted by `gh issue develop --list`.

For a **sub-issue**, GitHub may list **no** linked branches on the child; run this against the **parent** issue number to find **`feature/issue-{parent}`**.

### Example

```bash
scripts/get-issue-branches.sh myorg/myrepo 123
scripts/get-issue-branches.sh 123
```

### Output

Branch list from `gh issue develop --list` (format is defined by the GitHub CLI).

### Requirements

- **GitHub CLI (`gh`)** installed and authenticated for the target repository.
