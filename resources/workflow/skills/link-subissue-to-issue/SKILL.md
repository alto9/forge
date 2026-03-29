---
name: link-subissue-to-issue
description: Link an existing child GitHub issue to a parent issue as a sub-issue using the GitHub REST API via gh.
---

# Link Sub-Issue to Issue

Use the provided script to attach an existing child GitHub issue to a parent issue. Requires the GitHub CLI (`gh`).

## Usage

Run the script:

`scripts/link-subissue-to-issue.sh [--replace-parent|-r] <owner/repo> <parent-issue-number> <child-issue-number>`

When running from a clone linked to `gh`, you may omit the repo and pass:

`scripts/link-subissue-to-issue.sh [--replace-parent|-r] <parent-issue-number> <child-issue-number>`

### Arguments

- **owner/repo** - GitHub repository (`OWNER/REPO` or `HOST/OWNER/REPO`), required when not in a gh-linked clone.
- **parent-issue-number** - Parent issue number or issue URL.
- **child-issue-number** - Child issue number or issue URL.
- **--replace-parent**, **-r** - Replace the child issue's current parent relationship if one already exists.

### Important behavior

GitHub's `POST /repos/{owner}/{repo}/issues/{issue_number}/sub_issues` endpoint expects `sub_issue_id` as the child issue's internal numeric `id`, not the visible issue number. This script resolves the child `id` automatically before linking.

### Examples

```bash
scripts/link-subissue-to-issue.sh myorg/myrepo 120 121
scripts/link-subissue-to-issue.sh 120 121
scripts/link-subissue-to-issue.sh -r myorg/myrepo 120 121
```

### Requirements

- **GitHub CLI (`gh`)** installed and authenticated for the target repository.
