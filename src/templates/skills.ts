/**
 * Skill templates for pull-milestones and push-milestones.
 * Adapted for .forge/project.json (single project) instead of projects.json.
 */

export const PULL_MILESTONES_SKILL_MD = `---
name: pull-milestones
description: Pull the milestones from Github for this project
---

# Pull Milestones

Use the provided script to pull Github project milestones and save them into \`.forge/roadmap.json\`.

## Usage

Run the script: \`scripts/pull-milestones.sh\`

The script reads \`.forge/project.json\` to find the GitHub repo. No project name argument needed (single project per repo).
`;

export const PUSH_MILESTONES_SKILL_MD = `---
name: push-milestones
description: Push the milestones to Github for this project
---

# Push Milestones

Use the provided script to push project milestones from \`.forge/roadmap.json\` to the corresponding Github project.

## Usage

Run the script: \`scripts/push-milestones.sh\`

The script reads \`.forge/project.json\` to find the GitHub repo. No project name argument needed (single project per repo).
`;

export const PULL_MILESTONES_SCRIPT = `#!/usr/bin/env bash

set -euo pipefail

usage() {
    echo "Usage: $0"
    echo "Pulls milestones from the GitHub repo defined in .forge/project.json"
}

require_command() {
    local cmd="$1"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Error: required command '$cmd' is not installed." >&2
        exit 1
    fi
}

require_command jq
require_command gh

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
# Resolve project root: scripts -> pull-milestones -> skills -> .cursor or .github -> project root
PROJECT_ROOT="$(cd "\${SCRIPT_DIR}/../../../.." && pwd)"
PROJECT_FILE="\${PROJECT_ROOT}/.forge/project.json"

if [[ ! -f "\${PROJECT_FILE}" ]]; then
    echo "Error: .forge/project.json not found at \${PROJECT_FILE}" >&2
    exit 1
fi

PROJECT_JSON="$(jq -c '.' "\${PROJECT_FILE}")"
GITHUB_URL="$(jq -r '.github_url // empty' <<<"\${PROJECT_JSON}")"
if [[ -z "\${GITHUB_URL}" ]]; then
    echo "Error: project does not have a github_url in .forge/project.json" >&2
    exit 1
fi

METADATA_PATH_RAW="$(jq -r '.metadata_path // ".forge"' <<<"\${PROJECT_JSON}")"
if [[ "\${METADATA_PATH_RAW}" == "~"* ]]; then
    METADATA_PATH="\${HOME}\${METADATA_PATH_RAW:1}"
elif [[ "\${METADATA_PATH_RAW}" == "."* ]] || [[ "\${METADATA_PATH_RAW}" != /* ]]; then
    METADATA_PATH="\${PROJECT_ROOT}/\${METADATA_PATH_RAW#./}"
else
    METADATA_PATH="\${METADATA_PATH_RAW}"
fi

ROADMAP_FILE="\${METADATA_PATH}/roadmap.json"
mkdir -p "\${METADATA_PATH}"

REPO_PATH="$(sed -E 's#^https?://github.com/##; s#/$##; s#\\.git$##' <<<"\${GITHUB_URL}")"
if [[ "\${REPO_PATH}" != */* ]]; then
    echo "Error: could not parse owner/repo from github_url '\${GITHUB_URL}'" >&2
    exit 1
fi

echo "Pulling milestones from \${REPO_PATH}..."
MILESTONES_JSON="$(gh api "repos/\${REPO_PATH}/milestones?state=all&per_page=100")"

if [[ -f "\${ROADMAP_FILE}" ]]; then
    EXISTING_ROADMAP_JSON="$(jq -c '.' "\${ROADMAP_FILE}" 2>/dev/null || echo '{"roadmap":{"milestones":[]}}')"
else
    EXISTING_ROADMAP_JSON='{"roadmap":{"milestones":[]}}'
fi

UPDATED_ROADMAP_JSON="$(
    jq -n \\
        --argjson milestones "\${MILESTONES_JSON}" \\
        --argjson existing "\${EXISTING_ROADMAP_JSON}" \\
        '
        {
          roadmap: {
            milestones: (
              $milestones
              | sort_by((.due_on // "9999-12-31T23:59:59Z"), .title)
              | map(
                  . as $m
                  | {
                      id: ($m.number | tostring),
                      title: $m.title,
                      description: ($m.description // ""),
                      due_date: (if $m.due_on then ($m.due_on | split("T")[0]) else "" end),
                      technical_concepts: (
                        (
                          $existing.roadmap.milestones // []
                          | map(
                              select(
                                (
                                  (.id // "") != ""
                                  and ((.id | tostring) == ($m.number | tostring))
                                )
                                or (.title == $m.title)
                              )
                            )
                          | .[0].technical_concepts
                        ) // []
                      ),
                      tickets: (
                        (
                          $existing.roadmap.milestones // []
                          | map(
                              select(
                                (
                                  (.id // "") != ""
                                  and ((.id | tostring) == ($m.number | tostring))
                                )
                                or (.title == $m.title)
                              )
                            )
                          | .[0].tickets
                        ) // []
                      )
                    }
                )
            )
          }
        }
        '
)"

jq '.' <<<"\${UPDATED_ROADMAP_JSON}" >"\${ROADMAP_FILE}"
echo "Wrote \${ROADMAP_FILE}"
`;

export const PUSH_MILESTONES_SCRIPT = `#!/usr/bin/env bash

set -euo pipefail

usage() {
    echo "Usage: $0"
    echo "Pushes milestones from .forge/roadmap.json to the GitHub repo"
}

require_command() {
    local cmd="$1"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Error: required command '$cmd' is not installed." >&2
        exit 1
    fi
}

require_command jq
require_command gh

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "\${SCRIPT_DIR}/../../../.." && pwd)"
PROJECT_FILE="\${PROJECT_ROOT}/.forge/project.json"

if [[ ! -f "\${PROJECT_FILE}" ]]; then
    echo "Error: .forge/project.json not found at \${PROJECT_FILE}" >&2
    exit 1
fi

PROJECT_JSON="$(jq -c '.' "\${PROJECT_FILE}")"
GITHUB_URL="$(jq -r '.github_url // empty' <<<"\${PROJECT_JSON}")"
if [[ -z "\${GITHUB_URL}" ]]; then
    echo "Error: project does not have a github_url in .forge/project.json" >&2
    exit 1
fi

METADATA_PATH_RAW="$(jq -r '.metadata_path // ".forge"' <<<"\${PROJECT_JSON}")"
if [[ "\${METADATA_PATH_RAW}" == "~"* ]]; then
    METADATA_PATH="\${HOME}\${METADATA_PATH_RAW:1}"
elif [[ "\${METADATA_PATH_RAW}" == "."* ]] || [[ "\${METADATA_PATH_RAW}" != /* ]]; then
    METADATA_PATH="\${PROJECT_ROOT}/\${METADATA_PATH_RAW#./}"
else
    METADATA_PATH="\${METADATA_PATH_RAW}"
fi

ROADMAP_FILE="\${METADATA_PATH}/roadmap.json"
if [[ ! -f "\${ROADMAP_FILE}" ]]; then
    echo "Error: roadmap file not found at \${ROADMAP_FILE}" >&2
    exit 1
fi

REPO_PATH="$(sed -E 's#^https?://github.com/##; s#/$##; s#\\.git$##' <<<"\${GITHUB_URL}")"
if [[ "\${REPO_PATH}" != */* ]]; then
    echo "Error: could not parse owner/repo from github_url '\${GITHUB_URL}'" >&2
    exit 1
fi

LOCAL_MILESTONES="$(
    jq -c '
      (.roadmap.milestones // [])
      | map(
          {
            id: ((.id // "") | tostring),
            title: (.title // ""),
            description: (.description // ""),
            due_date: (.due_date // "")
          }
        )
      | map(select(.title != ""))
    ' "\${ROADMAP_FILE}"
)"

echo "Pushing milestones to \${REPO_PATH}..."
REMOTE_MILESTONES="$(gh api "repos/\${REPO_PATH}/milestones?state=all&per_page=100")"

TOTAL_LOCAL="$(jq 'length' <<<"\${LOCAL_MILESTONES}")"
if [[ "\${TOTAL_LOCAL}" -eq 0 ]]; then
    echo "No local milestones with titles found in \${ROADMAP_FILE}. Nothing to push."
    exit 0
fi

for ((i = 0; i < TOTAL_LOCAL; i++)); do
    LOCAL_ROW="$(jq -c ".[$i]" <<<"\${LOCAL_MILESTONES}")"
    LOCAL_ID="$(jq -r '.id // ""' <<<"\${LOCAL_ROW}")"
    TITLE="$(jq -r '.title // ""' <<<"\${LOCAL_ROW}")"
    DESCRIPTION="$(jq -r '.description // ""' <<<"\${LOCAL_ROW}")"
    DUE_DATE="$(jq -r '.due_date // ""' <<<"\${LOCAL_ROW}")"

    TARGET_NUMBER=""
    if [[ -n "\${LOCAL_ID}" ]]; then
        TARGET_NUMBER="$(jq -r --arg id "\${LOCAL_ID}" 'map(select((.number | tostring) == $id) | .number) | .[0] // ""' <<<"\${REMOTE_MILESTONES}")"
    fi
    if [[ -z "\${TARGET_NUMBER}" ]]; then
        TARGET_NUMBER="$(jq -r --arg title "\${TITLE}" 'map(select(.title == $title) | .number) | .[0] // ""' <<<"\${REMOTE_MILESTONES}")"
    fi

    PAYLOAD="$(jq -cn --arg title "\${TITLE}" --arg description "\${DESCRIPTION}" --arg due "\${DUE_DATE}" '
      { title: $title, description: $description } + (if $due == "" then { due_on: null } else { due_on: ($due + "T00:00:00Z") } end)
    ')"

    if [[ -n "\${TARGET_NUMBER}" ]]; then
        echo "Updating milestone #\${TARGET_NUMBER}: \${TITLE}"
        gh api --method PATCH "repos/\${REPO_PATH}/milestones/\${TARGET_NUMBER}" --input - <<<"\${PAYLOAD}" >/dev/null
    else
        echo "Creating milestone: \${TITLE}"
        CREATED="$(gh api --method POST "repos/\${REPO_PATH}/milestones" --input - <<<"\${PAYLOAD}")"
        LOCAL_ID="$(jq -r '.number' <<<"\${CREATED}")"
    fi

    ROADMAP_JSON="$(jq -c '.' "\${ROADMAP_FILE}")"
    UPDATED_ROADMAP_JSON="$(jq --arg title "\${TITLE}" --arg id "\${LOCAL_ID}" '
      .roadmap.milestones |= map(if .title == $title then . + { id: $id } else . end)
    ' <<<"\${ROADMAP_JSON}")"
    jq '.' <<<"\${UPDATED_ROADMAP_JSON}" >"\${ROADMAP_FILE}"

    REMOTE_MILESTONES="$(gh api "repos/\${REPO_PATH}/milestones?state=all&per_page=100")"
done

echo "Milestone push complete. Updated local IDs in \${ROADMAP_FILE}."
`;

// --- New skills for issue workflow ---

export const GET_ISSUE_DETAILS_SKILL_MD = `---
name: get-issue-details
description: Get GitHub issue details and determine if sub-issue or top-level
---

# Get Issue Details

Use the provided script to fetch a GitHub issue and output structured JSON including whether it is a sub-issue.

## Usage

Run the script: \`scripts/get-issue-details.sh <issue-ref>\`

Where \`issue-ref\` is a GitHub issue URL, \`owner/repo#123\`, or just \`123\` (with repo from project.json).

The script reads \`.forge/project.json\` for github_url. Output is JSON with number, title, body, is_sub_issue, parent_number, parent_title, root_branch.
`;

export const GET_ISSUE_DETAILS_SCRIPT = `#!/usr/bin/env bash

set -euo pipefail

usage() {
    echo "Usage: $0 <issue-ref>"
    echo "  issue-ref: GitHub URL, owner/repo#123, or issue number"
}

require_command() {
    local cmd="$1"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Error: required command '\$cmd' is not installed." >&2
        exit 1
    fi
}

require_command jq
require_command gh

if [[ -z "\${1:-}" ]]; then
    usage
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "\${SCRIPT_DIR}/../../../.." && pwd)"
PROJECT_FILE="\${PROJECT_ROOT}/.forge/project.json"

if [[ ! -f "\${PROJECT_FILE}" ]]; then
    echo "Error: .forge/project.json not found" >&2
    exit 1
fi

GITHUB_URL="$(jq -r '.github_url // empty' "\${PROJECT_FILE}")"
REPO_PATH="$(sed -E 's#^https?://github.com/##; s#/$##; s#\\.git$##' <<<"\${GITHUB_URL}")"

ARG="\${1}"
if [[ "\${ARG}" =~ ^https://github.com/([^/]+)/([^/]+)/issues/([0-9]+) ]]; then
    REPO_PATH="\${BASH_REMATCH[1]}/\${BASH_REMATCH[2]}"
    ISSUE_NUM="\${BASH_REMATCH[3]}"
elif [[ "\${ARG}" =~ ^([^/]+)/([^/]+)#([0-9]+) ]]; then
    REPO_PATH="\${BASH_REMATCH[1]}/\${BASH_REMATCH[2]}"
    ISSUE_NUM="\${BASH_REMATCH[3]}"
elif [[ "\${ARG}" =~ ^[0-9]+$ ]]; then
    ISSUE_NUM="\${ARG}"
else
    echo "Error: could not parse issue ref '\${ARG}'" >&2
    exit 1
fi

ISSUE_JSON="$(gh issue view "\${ISSUE_NUM}" --repo "\${REPO_PATH}" --json number,title,body,labels,state 2>/dev/null)" || {
    echo "Error: could not fetch issue \${ISSUE_NUM}" >&2
    exit 1
}

PARENT_JSON=""
PARENT_NUM=""
PARENT_TITLE=""
IS_SUB="false"
ROOT_BRANCH="main"

if PARENT_JSON="$(gh api "repos/\${REPO_PATH}/issues/\${ISSUE_NUM}/parent" 2>/dev/null)"; then
    IS_SUB="true"
    PARENT_NUM="$(jq -r '.number' <<<"\${PARENT_JSON}")"
    PARENT_TITLE="$(jq -r '.title' <<<"\${PARENT_JSON}")"
    ROOT_BRANCH="feature/issue-\${PARENT_NUM}"
fi

DEFAULT_BRANCH="$(git -C "\${PROJECT_ROOT}" symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's#^refs/remotes/origin/##' || echo "main")"
if [[ "\${IS_SUB}" == "false" ]]; then
    ROOT_BRANCH="\${DEFAULT_BRANCH}"
fi

jq -n \
    --argjson issue "\${ISSUE_JSON}" \
    --arg is_sub "\${IS_SUB}" \
    --arg parent_num "\${PARENT_NUM}" \
    --arg parent_title "\${PARENT_TITLE}" \
    --arg root_branch "\${ROOT_BRANCH}" \
    '\$issue + { is_sub_issue: (\$is_sub == "true"), parent_number: \$parent_num, parent_title: \$parent_title, root_branch: \$root_branch }'
`;

export const START_ISSUE_BUILD_SKILL_MD = `---
name: start-issue-build
description: Reset to clean state for issue work - checkout main, pull, npm install
---

# Start Issue Build

Use the provided script to reset the working directory to a clean state before starting work on an issue.

## Usage

Run the script: \`scripts/start-issue-build.sh\`

The script checks out the default branch, pulls latest, and runs the package manager install (npm/pnpm/yarn).

When present, the agent may read CONTRIBUTING.md and README.md for project SDLC: commit message format, testing requirements, validation steps.
`;

export const START_ISSUE_BUILD_SCRIPT = `#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "\${SCRIPT_DIR}/../../../.." && pwd)"
PROJECT_FILE="\${PROJECT_ROOT}/.forge/project.json"

if [[ ! -f "\${PROJECT_FILE}" ]]; then
    echo "Error: .forge/project.json not found" >&2
    exit 1
fi

CODE_PATH="$(jq -r '.code_path // "."' "\${PROJECT_FILE}")"
if [[ "\${CODE_PATH}" == "."* ]] || [[ "\${CODE_PATH}" != /* ]]; then
    CODE_PATH="\${PROJECT_ROOT}/\${CODE_PATH#./}"
fi

cd "\${CODE_PATH}"

DEFAULT_BRANCH="$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's#^refs/remotes/origin/##' || echo "main")"
git checkout "\${DEFAULT_BRANCH}"
git pull

if [[ -f "pnpm-lock.yaml" ]]; then
    pnpm i
elif [[ -f "yarn.lock" ]]; then
    yarn install
else
    npm i
fi

echo "Ready. On \${DEFAULT_BRANCH}, up to date, dependencies installed."
`;

export const CREATE_FEATURE_BRANCH_SKILL_MD = `---
name: create-feature-branch
description: Create a feature branch from the root branch
---

# Create Feature Branch

Use the provided script to create a new branch from the specified root branch.

## Usage

Run the script: \`scripts/create-feature-branch.sh <branch-name> [root-branch]\`

Default root branch is main. For sub-issues, use the parent issue branch (e.g. feature/issue-123).

When present, check CONTRIBUTING.md for project-specific branching conventions (e.g. feature/issue-N, fix/scope).
`;

export const CREATE_FEATURE_BRANCH_SCRIPT = `#!/usr/bin/env bash

set -euo pipefail

if [[ -z "\${1:-}" ]]; then
    echo "Usage: $0 <branch-name> [root-branch]"
    exit 1
fi

BRANCH_NAME="\${1}"
ROOT_BRANCH="\${2:-main}"

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "\${SCRIPT_DIR}/../../../.." && pwd)"

cd "\${PROJECT_ROOT}"
git checkout "\${ROOT_BRANCH}"
git pull
git checkout -b "\${BRANCH_NAME}"

echo "\${BRANCH_NAME}"
`;

export const COMMIT_SKILL_MD = `---
name: commit
description: Commit changes with conventional commit validation
---

# Commit

Use the provided script to commit staged changes. Validates branch and runs pre-commit checks.

## Usage

Run the script: \`scripts/commit.sh -m "<message>"\`

When present, read CONTRIBUTING.md and README.md in the repository root to determine:
- Commit message format (types, scopes, subject rules)
- Project SDLC: pre-commit validation steps, breaking change notation
- Project-specific examples

The agent generates the commit message from the changes and passes it with -m.
`;

export const COMMIT_SCRIPT = `#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "\${SCRIPT_DIR}/../../../.." && pwd)"

cd "\${PROJECT_ROOT}"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "\${BRANCH}" == "main" ]] || [[ "\${BRANCH}" == "master" ]] || [[ "\${BRANCH}" == "develop" ]]; then
    echo "Error: cannot commit on main branch. Create a feature branch first." >&2
    exit 1
fi

if [[ "\${1:-}" == "-m" ]] && [[ -n "\${2:-}" ]]; then
    MSG="\${2}"
else
    echo "Error: pass commit message with -m \"message\"" >&2
    exit 1
fi

[[ -d .git/hooks ]] && [[ -f .git/hooks/pre-commit ]] && .git/hooks/pre-commit || true
command -v npm >/dev/null 2>&1 && npm run lint 2>/dev/null || true
command -v npm >/dev/null 2>&1 && npm run test 2>/dev/null || true

git add -A
git status
git commit -m "\${MSG}"
echo "Committed successfully."
`;

export const PUSH_SKILL_MD = `---
name: push-branch
description: Push current branch to remote
---

# Push

Use the provided script to push the current branch safely.

## Usage

Run the script: \`scripts/push-branch.sh\`

When present, the agent may read CONTRIBUTING.md and README.md for project SDLC: pre-push validation (lint, test, build), branch conventions.
`;

export const PUSH_SCRIPT = `#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "\${SCRIPT_DIR}/../../../.." && pwd)"

cd "\${PROJECT_ROOT}"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "\${BRANCH}" == "main" ]] || [[ "\${BRANCH}" == "master" ]] || [[ "\${BRANCH}" == "develop" ]]; then
    echo "Error: cannot push main branch directly." >&2
    exit 1
fi

git fetch origin
if ! git ls-remote --heads origin "\${BRANCH}" | grep -q .; then
    git push -u origin HEAD
else
    git push origin HEAD
fi
echo "Pushed successfully."
`;

export const MAKE_PULL_REQUEST_SKILL_MD = `---
name: make-pull-request
description: Create a pull request via gh CLI
---

# Make Pull Request

Use the provided script to create a PR for the current branch.

## Usage

Run the script: \`scripts/make-pull-request.sh [base-branch]\`

Validates conventional commits. When present, the agent may read CONTRIBUTING.md for project-specific commit types, scopes, and subject rules before validating. Uses gh pr create.
`;

export const MAKE_PULL_REQUEST_SCRIPT = `#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "\${SCRIPT_DIR}/../../../.." && pwd)"

cd "\${PROJECT_ROOT}"

require_command() {
    if ! command -v "\$1" >/dev/null 2>&1; then
        echo "Error: \$1 not installed" >&2
        exit 1
    fi
}
require_command gh

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
BASE="\${1:-$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's#^refs/remotes/origin/##' || echo "main")}"

if [[ "\${BRANCH}" == "main" ]] || [[ "\${BRANCH}" == "master" ]] || [[ "\${BRANCH}" == "develop" ]]; then
    echo "Error: cannot create PR from main branch." >&2
    exit 1
fi

git push -u origin "\${BRANCH}" 2>/dev/null || git push origin "\${BRANCH}"

TITLE="$(git log -1 --format=%s "\${BASE}..HEAD")"
BODY="$(git log "\${BASE}..HEAD" --format="- %s%n%b" | head -50)"

gh pr create --base "\${BASE}" --title "\${TITLE}" --body "\${BODY}"
echo "PR created."
`;

export const MAKE_MILESTONE_SKILL_MD = `---
name: make-milestone
description: Create a GitHub milestone via gh CLI
---

# Make Milestone

Use the provided script to create a milestone.

## Usage

Run the script: \`scripts/make-milestone.sh <title> [description] [due_date]\`

Or pipe JSON: echo '{"title":"X","description":"Y","due_date":"2025-12-31"}' | scripts/make-milestone.sh
`;

export const MAKE_MILESTONE_SCRIPT = `#!/usr/bin/env bash

set -euo pipefail

require_command() {
    if ! command -v "\$1" >/dev/null 2>&1; then
        echo "Error: \$1 not installed" >&2
        exit 1
    fi
}
require_command jq
require_command gh

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "\${SCRIPT_DIR}/../../../.." && pwd)"
PROJECT_FILE="\${PROJECT_ROOT}/.forge/project.json"

if [[ ! -f "\${PROJECT_FILE}" ]]; then
    echo "Error: .forge/project.json not found" >&2
    exit 1
fi

GITHUB_URL="$(jq -r '.github_url // empty' "\${PROJECT_FILE}")"
REPO_PATH="$(sed -E 's#^https?://github.com/##; s#/$##; s#\\.git$##' <<<"\${GITHUB_URL}")"

if [[ -n "\${1:-}" ]]; then
    TITLE="\${1}"
    DESCRIPTION="\${2:-}"
    DUE="\${3:-}"
else
    INPUT="$(cat)"
    TITLE="$(jq -r '.title' <<<"\${INPUT}")"
    DESCRIPTION="$(jq -r '.description // ""' <<<"\${INPUT}")"
    DUE="$(jq -r '.due_date // ""' <<<"\${INPUT}")"
fi

PAYLOAD="$(jq -cn --arg t "\${TITLE}" --arg d "\${DESCRIPTION}" --arg due "\${DUE}" \
    '{ title: \$t, description: \$d } + (if \$due == "" then {} else { due_on: (\$due + "T00:00:00Z") } end)')"

gh api --method POST "repos/\${REPO_PATH}/milestones" --input - <<<"\${PAYLOAD}"
echo "Milestone created."
`;

export const MAKE_ISSUE_SKILL_MD = `---
name: make-issue
description: Create a top-level GitHub issue via gh CLI
---

# Make Issue

Use the provided script to create a top-level issue.

## Usage

Run the script: \`scripts/make-issue.sh <title> [body]\`
`;

export const MAKE_ISSUE_SCRIPT = `#!/usr/bin/env bash

set -euo pipefail

if [[ -z "\${1:-}" ]]; then
    echo "Usage: $0 <title> [body]"
    exit 1
fi

require_command() {
    if ! command -v "\$1" >/dev/null 2>&1; then
        echo "Error: \$1 not installed" >&2
        exit 1
    fi
}
require_command gh

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "\${SCRIPT_DIR}/../../../.." && pwd)"
PROJECT_FILE="\${PROJECT_ROOT}/.forge/project.json"

if [[ ! -f "\${PROJECT_FILE}" ]]; then
    echo "Error: .forge/project.json not found" >&2
    exit 1
fi

GITHUB_URL="$(jq -r '.github_url // empty' "\${PROJECT_FILE}")"
REPO_PATH="$(sed -E 's#^https?://github.com/##; s#/$##; s#\\.git$##' <<<"\${GITHUB_URL}")"

TITLE="\${1}"
BODY="\${2:-}"

gh issue create --repo "\${REPO_PATH}" --title "\${TITLE}" --body "\${BODY}"
echo "Issue created."
`;

export const MAKE_SUB_ISSUE_SKILL_MD = `---
name: make-sub-issue
description: Create a sub-issue under a parent issue via gh API
---

# Make Sub-Issue

Use the provided script to create a sub-issue under a parent.

## Usage

Run the script: \`scripts/make-sub-issue.sh <parent-issue-number> <title> [body]\`
`;

export const MAKE_SUB_ISSUE_SCRIPT = `#!/usr/bin/env bash

set -euo pipefail

if [[ -z "\${1:-}" ]] || [[ -z "\${2:-}" ]]; then
    echo "Usage: $0 <parent-issue-number> <title> [body]"
    exit 1
fi

require_command() {
    if ! command -v "\$1" >/dev/null 2>&1; then
        echo "Error: \$1 not installed" >&2
        exit 1
    fi
}
require_command jq
require_command gh

PARENT_NUM="\${1}"
TITLE="\${2}"
BODY="\${3:-}"

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "\${SCRIPT_DIR}/../../../.." && pwd)"
PROJECT_FILE="\${PROJECT_ROOT}/.forge/project.json"

if [[ ! -f "\${PROJECT_FILE}" ]]; then
    echo "Error: .forge/project.json not found" >&2
    exit 1
fi

GITHUB_URL="$(jq -r '.github_url // empty' "\${PROJECT_FILE}")"
REPO_PATH="$(sed -E 's#^https?://github.com/##; s#/$##; s#\\.git$##' <<<"\${GITHUB_URL}")"

PAYLOAD="$(jq -cn --arg t "\${TITLE}" --arg b "\${BODY}" '{ title: \$t, body: \$b }')"
NEW_ISSUE="$(gh api --method POST "repos/\${REPO_PATH}/issues" --input - <<<"\${PAYLOAD}")"
NEW_ID="$(jq -r '.id' <<<"\${NEW_ISSUE}")"
NEW_NUM="$(jq -r '.number' <<<"\${NEW_ISSUE}")"

gh api --method POST "repos/\${REPO_PATH}/issues/\${PARENT_NUM}/sub_issues" -f sub_issue_id="\${NEW_ID}"
echo "Sub-issue created: \${NEW_NUM}"
`;

export const REVIEW_PR_SKILL_MD = `---
name: review-pr
description: Checkout a PR branch locally for review
---

# Review PR

Use the provided script to fetch and checkout a PR branch locally.

## Usage

Run the script: \`scripts/review-pr.sh <pr-ref>\`

Where \`pr-ref\` is a GitHub PR URL, \`owner/repo#123\`, or just \`123\` (with repo from project.json).

The script reads \`.forge/project.json\` for github_url when only a number is provided. After checkout, the working directory is on the PR branch ready for review.
`;

export const REVIEW_PR_SCRIPT = `#!/usr/bin/env bash

set -euo pipefail

usage() {
    echo "Usage: $0 <pr-ref>"
    echo "  pr-ref: GitHub PR URL, owner/repo#123, or PR number"
}

require_command() {
    local cmd="$1"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Error: required command '\$cmd' is not installed." >&2
        exit 1
    fi
}

require_command gh

if [[ -z "\${1:-}" ]]; then
    usage
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "\${SCRIPT_DIR}/../../../.." && pwd)"
PROJECT_FILE="\${PROJECT_ROOT}/.forge/project.json"

REPO_PATH=""
PR_NUM=""

ARG="\${1}"
if [[ "\${ARG}" =~ ^https://github.com/([^/]+)/([^/]+)/pull/([0-9]+) ]]; then
    REPO_PATH="\${BASH_REMATCH[1]}/\${BASH_REMATCH[2]}"
    PR_NUM="\${BASH_REMATCH[3]}"
elif [[ "\${ARG}" =~ ^([^/]+)/([^/]+)#([0-9]+) ]]; then
    REPO_PATH="\${BASH_REMATCH[1]}/\${BASH_REMATCH[2]}"
    PR_NUM="\${BASH_REMATCH[3]}"
elif [[ "\${ARG}" =~ ^[0-9]+$ ]]; then
    PR_NUM="\${ARG}"
    if [[ -f "\${PROJECT_FILE}" ]]; then
        GITHUB_URL="$(jq -r '.github_url // empty' "\${PROJECT_FILE}")"
        REPO_PATH="$(sed -E 's#^https?://github.com/##; s#/$##; s#\\.git$##' <<<"\${GITHUB_URL}")"
    fi
    if [[ -z "\${REPO_PATH}" ]] || [[ "\${REPO_PATH}" != *"/"* ]]; then
        echo "Error: could not determine repo from .forge/project.json. Use owner/repo#123 or full URL." >&2
        exit 1
    fi
else
    echo "Error: could not parse PR ref '\${ARG}'" >&2
    exit 1
fi

cd "\${PROJECT_ROOT}"
gh pr checkout "\${PR_NUM}" --repo "\${REPO_PATH}"
echo "Checked out PR #\${PR_NUM}. Branch ready for review."
`;
