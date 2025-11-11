#!/bin/bash

# Ensure we use the correct Node version
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node v22.14.0
nvm use v22.14.0 >/dev/null 2>&1

# Run the MCP server
exec node /home/danderson/code/alto9/opensource/forge/packages/mcp-server/dist/index.js

