#!/usr/bin/env node

/**
 * Syncs version across all package.json files in the monorepo
 * Usage: node scripts/sync-versions.js <version>
 */

const fs = require('fs');
const path = require('path');

const version = process.argv[2];

if (!version) {
  console.error('Error: Version argument is required');
  console.error('Usage: node scripts/sync-versions.js <version>');
  process.exit(1);
}

const packages = [
  'package.json',
  'packages/mcp-server/package.json',
  'packages/vscode-extension/package.json'
];

packages.forEach(pkgPath => {
  const fullPath = path.join(__dirname, '..', pkgPath);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`Warning: ${pkgPath} not found, skipping`);
    return;
  }
  
  const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  pkg.version = version;
  
  fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Updated ${pkgPath} to version ${version}`);
});

