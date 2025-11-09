---
story_id: remove-context-session-requirement
session_id: change-lockdown-items-and-update-menu
feature_id: [context-creation, context-editing]
spec_id: [forge-studio-implementation]
status: completed
priority: high
estimated_minutes: 25
actual_minutes: 0
depends_on: []
---

## Objective

Remove the active session requirement for creating and editing Context files in Forge Studio.

## Context

Currently, all file operations require an active session. We need to allow Context creation and editing without a session, since Contexts are foundational guidance files that developers set up before design sessions.

## Implementation Steps

1. Open `packages/vscode-extension/src/panels/ForgeStudioPanel.ts`
2. Locate the message handlers for `createFile` and `saveFileContent`
3. Update session checking logic to allow operations when `category === 'contexts'`
4. Modify `_createFile()` method to skip session requirement for contexts
5. Modify `_saveFile Content()` method to skip session requirement for contexts
6. Ensure context files are NOT added to session changed_files even if a session is active

## Files to Modify

- `packages/vscode-extension/src/panels/ForgeStudioPanel.ts`

## Acceptance Criteria

- [x] Can create Context files without an active session
- [x] Can edit Context files without an active session
- [x] Can save Context files without an active session
- [x] Context files are NOT added to session changed_files when session is active
- [x] No error messages about "session required" for Context operations
- [x] Session panel does not show Context files in changed files list

## Implementation Notes

**Status**: ✅ Already implemented in story 02 (remove-actor-session-requirement)

**Explanation:**
This story was completed as part of story 02 because Actors and Contexts are both "foundational" file types that share the same permission logic. Rather than duplicate code, the implementation treats them as a single category.

**Implementation Reference:**
See story 02 for full implementation details. All changes apply to both Actors and Contexts:

1. **`_isFoundationalFile()` helper method** checks for both:
   - Contexts: `/contexts/` paths, `.context.md` extensions, `category === 'contexts'`
   - Actors: `/actors/` paths, `.actor.md` extensions, `category === 'actors'`

2. **All 5 session check updates** use this helper, so they work for both:
   - `_saveFileContent()` - ✅ Contexts allowed without session
   - `_promptCreateFolder()` - ✅ Context folders allowed without session
   - `_promptCreateFile()` - ✅ Context files allowed without session
   - `_createFolder()` - ✅ Context folders bypass session check
   - `_createFile()` - ✅ Context files bypass session check

3. **Extension mapping** includes:
   - `'contexts': '.context.md'` ✅ Already added in story 02

**Combined Effect with Story 01:**
- Story 01: File watcher excludes Contexts → Never tracked
- Story 02/03: Session checks allow Contexts → Always editable

**Impact:**
- ✅ Context files can be created/edited without an active session
- ✅ Context files are NEVER tracked in session `changed_files`
- ✅ Features and Specs still require active sessions
- ✅ Zero duplicate code - single foundational file handler

**Testing:**
Same testing procedure as story 02, but for Contexts:
1. Build extension: `npm run build -w forge`
2. Launch Extension Development Host (F5)
3. Without session: Navigate to Contexts → Create/edit → Verify works
4. With session: Create Context → Verify NOT in changed_files
5. Create Feature → Verify IS in changed_files

## Testing Notes

Test by:
1. Ensure no active session
2. Navigate to Contexts section
3. Click "New Context" - verify it works
4. Edit an existing Context - verify save works
5. Start a session
6. Create/edit a Context - verify it works but is NOT tracked

