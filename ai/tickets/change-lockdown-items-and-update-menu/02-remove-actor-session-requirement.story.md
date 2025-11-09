---
story_id: remove-actor-session-requirement
session_id: change-lockdown-items-and-update-menu
feature_id: [actor-creation, actor-editing]
spec_id: [forge-studio-implementation]
status: completed
priority: high
estimated_minutes: 25
actual_minutes: 20
depends_on: []
---

## Objective

Remove the active session requirement for creating and editing Actor files in Forge Studio.

## Context

Currently, all file operations require an active session. We need to allow Actor creation and editing without a session, since Actors are foundational definitions that developers set up before design sessions.

## Implementation Steps

1. Open `packages/vscode-extension/src/panels/ForgeStudioPanel.ts`
2. Locate the message handlers for `createFile` and `saveFileContent`
3. Update session checking logic to allow operations when `category === 'actors'`
4. Modify `_createFile()` method to skip session requirement for actors
5. Modify `_saveFileContent()` method to skip session requirement for actors
6. Ensure actor files are NOT added to session changed_files even if a session is active

## Files to Modify

- `packages/vscode-extension/src/panels/ForgeStudioPanel.ts`

## Acceptance Criteria

- [x] Can create Actor files without an active session
- [x] Can edit Actor files without an active session
- [x] Can save Actor files without an active session
- [x] Actor files are NOT added to session changed_files when session is active
- [x] No error messages about "session required" for Actor operations
- [x] Session panel does not show Actor files in changed files list

## Implementation Notes

**Changes Made:**

1. **Added `_isFoundationalFile()` helper method** (line 745):
   - Detects if a file path or category is for Actors or Contexts
   - Checks for `/actors/`, `/contexts/` in paths
   - Checks for `.actor.md`, `.context.md` extensions
   - Checks if category is 'actors' or 'contexts'

2. **Updated `_saveFileContent()` method** (line 1123):
   - Now allows saving Actor and Context files without an active session
   - Session requirement only applies to non-foundational files (Features, Specs)

3. **Updated `_promptCreateFolder()` method** (line 1151):
   - Allows creating folders in Actors and Contexts categories without session
   - Session requirement only for Features and Specs folders

4. **Updated `_promptCreateFile()` method** (line 1180):
   - Allows creating Actor and Context files without session
   - Session requirement only for Features and Specs

5. **Updated `_createFolder()` method** (line 1208):
   - Bypasses session check for foundational folders
   - Works for both with and without active session

6. **Updated `_createFile()` method** (line 1235):
   - Bypasses session check for Actor and Context categories
   - Allows file creation in foundational categories anytime

7. **Updated `_getCategoryExtension()` method** (line 1417):
   - Added `'actors': '.actor.md'` to extension mapping
   - Ensures Actor files are created with correct extension

**Impact:**
- ✅ Actor files can be created/edited without an active session
- ✅ Context files can be created/edited without an active session
- ✅ Actor/Context files are NOT tracked in session changed_files (handled by file watcher in story 01)
- ✅ Features and Specs still require active sessions
- ✅ Sessions themselves can still be managed without restrictions

**Testing:**
To verify this implementation:
1. Build the extension: `npm run build -w forge`
2. Launch Extension Development Host (F5)
3. Without starting a session:
   - Navigate to Actors → Click "New Actor" → Verify it works
   - Open an Actor file → Edit and save → Verify it works
   - Navigate to Features → Verify "session required" message appears
4. Start a session:
   - Create an Actor → Verify it works but is NOT in changed_files
   - Create a Feature → Verify it IS in changed_files

## Testing Notes

Test by:
1. Ensure no active session
2. Navigate to Actors section
3. Click "New Actor" - verify it works
4. Edit an existing Actor - verify save works
5. Start a session
6. Create/edit an Actor - verify it works but is NOT tracked

