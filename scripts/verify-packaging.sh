#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f "dist/extension.js" ]]; then
    echo "verify-packaging: missing dist/extension.js (run npm run build first)" >&2
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

if grep -q "extension/resources/harness/" <<< "$VSIX_LISTING"; then
    echo "verify-packaging: retired harness bundle must not ship in the VSIX" >&2
    exit 1
fi

echo "verify-packaging: installer bundle present in VSIX ($VSIX_PATH)"
