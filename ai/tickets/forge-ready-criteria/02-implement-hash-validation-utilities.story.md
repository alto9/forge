---
story_id: implement-hash-validation-utilities
session_id: forge-ready-criteria
feature_id: [welcome-screen]
spec_id: [cursor-commands-management, welcome-initialization]
model_id: []
status: completed
priority: high
estimated_minutes: 30
---

## Objective

Implement hash-based validation utilities to verify Cursor command file content using SHA-256 hashes.

## Context

Command files include an embedded hash comment that allows the extension to detect if files are outdated or have been modified. This ensures all Forge projects use consistent, up-to-date command files.

## Implementation Steps

1. Create `packages/vscode-extension/src/utils/commandValidation.ts`
2. Import crypto module and template functions
3. Define `HASH_COMMENT_REGEX` constant for extracting hash from files
4. Implement `computeContentHash(content: string): string` using SHA-256
5. Implement `validateCommandFileHash(fileContent: string, commandPath: string): boolean`
   - Extract embedded hash from file
   - Get expected template
   - Remove hash comments from both
   - Compute expected hash
   - Return true if hashes match AND content matches
6. Implement `generateCommandFile(commandPath: string): string`
   - Get template
   - Compute hash
   - Return content with hash comment prepended

## Files Affected

- `packages/vscode-extension/src/utils/commandValidation.ts` - Create new utility file

## Acceptance Criteria

- [ ] commandValidation.ts file created with all functions exported
- [ ] computeContentHash() uses SHA-256 and returns 64-character hex string
- [ ] validateCommandFileHash() extracts hash using regex
- [ ] validateCommandFileHash() returns false if no hash comment found
- [ ] validateCommandFileHash() returns false if template doesn't exist
- [ ] validateCommandFileHash() validates both hash and content match
- [ ] generateCommandFile() creates file with hash comment in format `<!-- forge-hash: <hash> -->`
- [ ] generateCommandFile() throws error for unknown command path

## Dependencies

- create-command-templates-storage (needs template functions)

