#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DEV_SERVER_ENTRY="resources/workflow/temporal/start-dev-server.js"
WORKER_ENTRY="resources/workflow/worker/start-worker.js"

if [[ ! -f "$DEV_SERVER_ENTRY" ]]; then
    echo "verify-packaging: missing dev server entry at $DEV_SERVER_ENTRY" >&2
    exit 1
fi

if [[ ! -f "$WORKER_ENTRY" ]]; then
    echo "verify-packaging: missing worker entry at $WORKER_ENTRY" >&2
    exit 1
fi

node -e "
const path = require('path');
const devServer = path.join(process.cwd(), '$DEV_SERVER_ENTRY');
const worker = path.join(process.cwd(), '$WORKER_ENTRY');
require('@temporalio/worker');
require.resolve('@temporalio/worker/package.json');
require.resolve('@temporalio/core-bridge');
require('@cursor/sdk');
require.resolve('@cursor/sdk/package.json');
console.log('dependency closure ok for', devServer, 'and', worker);
"

npm run package >/dev/null

shopt -s nullglob
VSIX=(*.vsix)
shopt -u nullglob

if [[ ${#VSIX[@]} -eq 0 ]]; then
    echo "verify-packaging: no packaged VSIX produced" >&2
    exit 1
fi

VSIX_PATH="${VSIX[0]}"
if [[ ${#VSIX[@]} -gt 1 ]]; then
    VSIX_PATH="$(ls -t "${VSIX[@]}" | head -1)"
fi

VSIX_LISTING="$(zipinfo -1 "$VSIX_PATH")"

grep -Fxq "extension/$DEV_SERVER_ENTRY" <<< "$VSIX_LISTING" || {
    echo "verify-packaging: dev server entry missing from VSIX" >&2
    exit 1
}

grep -Fxq "extension/$WORKER_ENTRY" <<< "$VSIX_LISTING" || {
    echo "verify-packaging: worker entry missing from VSIX" >&2
    exit 1
}

grep -Fxq "extension/dist/worker.js" <<< "$VSIX_LISTING" || {
    echo "verify-packaging: worker bundle missing from VSIX" >&2
    exit 1
}

echo "verify-packaging: launch assets present in VSIX ($VSIX_PATH)"
