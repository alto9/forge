#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

HARNESS_MARKER="resources/harness/agents/architect.md"
WEBVIEW_BUNDLE="media/superrepo/main.js"

if [[ ! -f "$HARNESS_MARKER" ]]; then
    echo "verify-packaging: missing harness marker at $HARNESS_MARKER" >&2
    exit 1
fi

if [[ ! -f "dist/extension.js" ]]; then
    echo "verify-packaging: missing dist/extension.js (run npm run build first)" >&2
    exit 1
fi

if [[ ! -f "$WEBVIEW_BUNDLE" ]]; then
    echo "verify-packaging: missing webview bundle at $WEBVIEW_BUNDLE" >&2
    exit 1
fi

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

grep -Fxq "extension/dist/extension.js" <<< "$VSIX_LISTING" || {
    echo "verify-packaging: extension bundle missing from VSIX" >&2
    exit 1
}

grep -Fxq "extension/$HARNESS_MARKER" <<< "$VSIX_LISTING" || {
    echo "verify-packaging: harness marker missing from VSIX" >&2
    exit 1
}

grep -Fxq "extension/$WEBVIEW_BUNDLE" <<< "$VSIX_LISTING" || {
    echo "verify-packaging: webview bundle missing from VSIX" >&2
    exit 1
}

echo "verify-packaging: forge v4 assets present in VSIX ($VSIX_PATH)"
