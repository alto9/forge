---
spec_id: welcome-initialization
name: Welcome Screen and Project Initialization Specification
description: Technical specification for the welcome screen that checks project readiness and initializes folder structure
feature_id: [welcome-screen]
diagram_id: [welcome-component-structure, welcome-initialization-workflow]
context_id: [theme, vsce]
---

# Welcome Screen and Project Initialization Specification

## Overview

The Welcome Screen is a webview panel that appears when a user opens Forge on a project that is not yet "Forge-ready." It checks for the required folder structure, displays the project's readiness status, and provides a one-click initialization option to create missing folders. After successful initialization, it automatically transitions to Forge Studio.

## Architecture

See diagrams:
- [welcome-component-structure](../diagrams/studio/welcome-component-structure.diagram.md) - Component architecture
- [welcome-initialization-workflow](../diagrams/studio/welcome-initialization-workflow.diagram.md) - Initialization sequence

### Components

#### WelcomePanel.ts (Extension Host)

**Location**: `packages/vscode-extension/src/panels/WelcomePanel.ts`

**Responsibilities**:
- Create and manage welcome screen webview panel
- Check project readiness by verifying folder structure
- Handle initialization requests from webview
- Create missing folders using VSCode file system API
- Transition to ForgeStudioPanel after successful initialization
- Collapse left sidebar when panel opens

**Key Methods**:

```typescript
// Static factory method
static render(extensionUri: Uri, projectUri: Uri, output: OutputChannel): WelcomePanel

// Check if project has required folder structure
private async _checkProjectReadiness(): Promise<ProjectReadiness>

// Get detailed folder status
private async _getFolderStatus(): Promise<FolderStatus[]>

// Initialize project by creating missing folders
private async _initializeProject(): Promise<InitializationResult>

// Transition to Forge Studio
private _openForgeStudio(): void

// Message handlers
private _handleInitializeRequest(): Promise<void>
private _handleOpenStudioRequest(): void
```

**Lifecycle**:
1. Instantiated when project is not ready
2. Checks folder structure on creation
3. Sends initial state to webview
4. Handles user actions (initialize or open)
5. Disposes when transitioning to Studio or closing

#### Welcome Webview UI (React)

**Location**: `packages/vscode-extension/src/webview/welcome/index.tsx`

**Components**:
- `WelcomeApp`: Main container component
- `ProjectHeader`: Shows project path and title
- `StatusIndicator`: Visual ready/not-ready status
- `FolderChecklist`: List of required folders with status
- `ActionButtons`: Initialize or Open Studio buttons
- `InitializationDialog`: Confirmation modal before initialization

**State Management**:
```typescript
interface WelcomeState {
  projectPath: string;
  isReady: boolean;
  folders: FolderStatus[];
  isInitializing: boolean;
  error: string | null;
  showConfirmDialog: boolean;
}
```

## Project Readiness Detection

### Required Folder Structure

A project is "Forge-ready" when ALL of the following folders exist:

```
ai/
ai/actors
ai/contexts
ai/features
ai/sessions
ai/specs
```

**Note**: The `ai/models` folder is LEGACY and should NOT be checked. Some legacy implementations (like ProjectPicker) still check for this folder, causing inconsistent readiness status where projects show "Not Ready" when they actually are ready.

### Required Cursor Commands

In addition to folders, a project is "Forge-ready" when ALL of the following Cursor command files exist AND have valid content:

```
.cursor/commands/forge-design.md
.cursor/commands/forge-build.md
```

### Centralized Readiness Checking

**CRITICAL**: All code that checks project readiness MUST use a single, centralized implementation to ensure consistency.

**Problem**: Multiple implementations with different criteria lead to:
- Inaccurate status display in project picker
- Projects showing "Not Ready" but opening Studio anyway
- User confusion about actual project state

**Solution**: Create a shared utility module that all components import:
- `ProjectPicker` - uses shared check when displaying status
- `extension.ts` command handler - uses shared check when routing
- `WelcomePanel` - uses shared check when initializing

**Shared Location**: `packages/vscode-extension/src/utils/projectReadiness.ts`

**Implementation Requirements**:
1. Single source of truth for required folders list
2. Single source of truth for required commands list
3. Single readiness check function used everywhere
4. Consistent criteria across all entry points

**Content Validation**:
- Each Cursor command file must include a hash comment in the format: `<!-- forge-hash: SHA256_HASH -->`
- The extension computes the hash of the file content (excluding the hash comment itself)
- The computed hash must match the hash embedded in the file
- If the hash doesn't match, the file is considered outdated and needs updating

### Detection Algorithm

**Canonical Implementation Location**: `packages/vscode-extension/src/utils/projectReadiness.ts`

```typescript
// packages/vscode-extension/src/utils/projectReadiness.ts

export const REQUIRED_FOLDERS = [
  'ai',
  'ai/actors',
  'ai/contexts',
  'ai/features',
  'ai/sessions',
  'ai/specs'
];

export const REQUIRED_COMMANDS = [
  '.cursor/commands/forge-design.md',
  '.cursor/commands/forge-build.md'
];

/**
 * THE authoritative check for project readiness.
 * All components MUST use this function.
 */
export async function checkProjectReadiness(projectUri: Uri): Promise<boolean> {
  // Check folders
  for (const folder of REQUIRED_FOLDERS) {
    const folderUri = Uri.joinPath(projectUri, folder);
    try {
      await workspace.fs.stat(folderUri);
      // Folder exists, continue checking
    } catch {
      // Folder does not exist
      return false;
    }
  }
  
  // Check Cursor commands
  for (const commandPath of REQUIRED_COMMANDS) {
    const commandUri = Uri.joinPath(projectUri, commandPath);
    try {
      const fileContent = await workspace.fs.readFile(commandUri);
      const contentString = Buffer.from(fileContent).toString('utf8');
      
      // Validate content hash
      const isValid = await validateCommandFileHash(contentString, commandPath);
      if (!isValid) {
        // File exists but content is invalid/outdated
        return false;
      }
    } catch {
      // File does not exist
      return false;
    }
  }
  
  // All folders and commands exist with valid content
  return true;
}
```

**Usage in Other Components**:

```typescript
// ProjectPicker.ts
import { checkProjectReadiness } from './projectReadiness';

const isReady = await checkProjectReadiness(folder.uri);

// extension.ts
import { checkProjectReadiness } from './utils/projectReadiness';

const isReady = await checkProjectReadiness(project);

// WelcomePanel.ts
import { checkProjectReadiness } from '../utils/projectReadiness';

const isReady = await checkProjectReadiness(this._projectUri);
```

### Folder and Command Status Checking

```typescript
interface FolderStatus {
  path: string;           // Relative path (e.g., "ai/actors")
  exists: boolean;        // Whether folder currently exists
  description: string;    // Human-readable description
  type: 'folder';
}

interface CommandStatus {
  path: string;           // Relative path (e.g., ".cursor/commands/forge-design.md")
  exists: boolean;        // Whether file exists
  valid: boolean;         // Whether content hash is valid (only meaningful if exists=true)
  description: string;    // Human-readable description
  type: 'command';
}

type ProjectItemStatus = FolderStatus | CommandStatus;

async function getProjectStatus(projectUri: Uri): Promise<ProjectItemStatus[]> {
  const folders = [
    { path: 'ai', description: 'Root directory for all Forge files' },
    { path: 'ai/actors', description: 'Actor definitions and personas' },
    { path: 'ai/contexts', description: 'Context guidance files' },
    { path: 'ai/features', description: 'Feature definitions with Gherkin' },
    { path: 'ai/models', description: 'Data model definitions' },
    { path: 'ai/sessions', description: 'Design session tracking' },
    { path: 'ai/specs', description: 'Technical specifications' }
  ];
  
  const commands = [
    { path: '.cursor/commands/forge-design.md', description: 'Cursor command for design session workflow' },
    { path: '.cursor/commands/forge-build.md', description: 'Cursor command for building from tickets' }
  ];
  
  const folderStatuses = await Promise.all(folders.map(async (folder): Promise<FolderStatus> => {
    const folderUri = Uri.joinPath(projectUri, folder.path);
    let exists = false;
    try {
      await workspace.fs.stat(folderUri);
      exists = true;
    } catch {
      exists = false;
    }
    return { ...folder, exists, type: 'folder' };
  }));
  
  const commandStatuses = await Promise.all(commands.map(async (command): Promise<CommandStatus> => {
    const commandUri = Uri.joinPath(projectUri, command.path);
    let exists = false;
    let valid = false;
    try {
      const fileContent = await workspace.fs.readFile(commandUri);
      const contentString = Buffer.from(fileContent).toString('utf8');
      exists = true;
      valid = await validateCommandFileHash(contentString, command.path);
    } catch {
      exists = false;
      valid = false;
    }
    return { ...command, exists, valid, type: 'command' };
  }));
  
  return [...folderStatuses, ...commandStatuses];
}
```

### Cursor Command Hash Validation

```typescript
import * as crypto from 'crypto';

/**
 * Validates that a Cursor command file's content matches its embedded hash
 */
async function validateCommandFileHash(
  content: string,
  commandPath: string
): Promise<boolean> {
  // Extract the hash comment from the file
  const hashCommentRegex = /<!-- forge-hash: ([a-f0-9]{64}) -->/;
  const match = content.match(hashCommentRegex);
  
  if (!match) {
    // No hash comment found - file is invalid
    return false;
  }
  
  const embeddedHash = match[1];
  
  // Remove the hash comment from content before computing hash
  const contentWithoutHash = content.replace(hashCommentRegex, '').trim();
  
  // Get the expected template content for this command
  const templateContent = getCommandTemplate(commandPath);
  const templateWithoutHash = templateContent.replace(hashCommentRegex, '').trim();
  
  // Compute hash of template content
  const computedHash = crypto
    .createHash('sha256')
    .update(templateWithoutHash, 'utf8')
    .digest('hex');
  
  // Validate: content (minus hash) must match template (minus hash)
  // and embedded hash must match computed hash
  return (
    contentWithoutHash === templateWithoutHash &&
    embeddedHash === computedHash
  );
}

/**
 * Gets the template content for a specific Cursor command
 */
function getCommandTemplate(commandPath: string): string {
  // Templates are stored in extension as constants
  // This makes them easy to update in one place
  const templates: Record<string, string> = {
    '.cursor/commands/forge-design.md': FORGE_DESIGN_TEMPLATE,
    '.cursor/commands/forge-build.md': FORGE_BUILD_TEMPLATE
  };
  
  return templates[commandPath] || '';
}

/**
 * Generates a Cursor command file with embedded hash
 */
function generateCommandFile(commandPath: string): string {
  const template = getCommandTemplate(commandPath);
  
  // Compute hash of template content
  const hash = crypto
    .createHash('sha256')
    .update(template, 'utf8')
    .digest('hex');
  
  // Insert hash comment at the top of the file
  return `<!-- forge-hash: ${hash} -->\n\n${template}`;
}
```

### Command Template Storage

Templates are stored as constants in the extension code for easy maintenance:

```typescript
// packages/vscode-extension/src/templates/cursorCommands.ts

export const FORGE_DESIGN_TEMPLATE = `# Forge Design

This command helps you work within an active Forge design session to update AI documentation.

## Prerequisites

You must have an active design session before making changes to AI documentation.

## What This Command Does

1. Checks for an active design session
2. Guides you to update features, specs, models, actors, or contexts
3. Tracks all changes in the active session's changed_files array

## Usage

Run this command when you want to design or modify:
- Features (with Gherkin scenarios)
- Technical specifications (with Nomnoml diagrams)  
- Data models
- Actor definitions
- Context guidance

The AI will ensure you're in an active session and help structure your changes properly.`;

export const FORGE_BUILD_TEMPLATE = `# Forge Build

This command helps you implement a Forge story by analyzing both the codebase and AI documentation.

## Prerequisites

You must provide a story file (*.story.md) when running this command.

## What This Command Does

1. Analyzes the existing codebase to understand current implementation
2. Reads the AI folder to understand intended behavior from linked files:
   - Features (expected behavior)
   - Specs (technical implementation details)
   - Models (data structures)
   - Contexts (technology-specific guidance)
3. Implements the changes described in the story
4. Ensures implementation matches the documented design

## Usage

1. Select a story file from ai/tickets/
2. Run this command
3. The AI will analyze context and implement the story

The implementation will be consistent with your documented design and existing codebase patterns.`;
```

## Initialization Process

See [welcome-initialization-workflow](../diagrams/studio/welcome-initialization-workflow.diagram.md) diagram for the complete workflow sequence.

### Implementation

```typescript
async function initializeProject(projectUri: Uri): Promise<InitializationResult> {
  const projectStatus = await getProjectStatus(projectUri);
  const missingFolders = projectStatus.filter(
    (item): item is FolderStatus => item.type === 'folder' && !item.exists
  );
  const invalidCommands = projectStatus.filter(
    (item): item is CommandStatus => item.type === 'command' && (!item.exists || !item.valid)
  );
  
  const results: { path: string; type: 'folder' | 'file'; success: boolean; error?: string }[] = [];
  
  // Create missing folders
  for (const folder of missingFolders) {
    const folderUri = Uri.joinPath(projectUri, folder.path);
    try {
      await workspace.fs.createDirectory(folderUri);
      results.push({ path: folder.path, type: 'folder', success: true });
      
      // Send progress update to webview
      webview.postMessage({
        type: 'initializationProgress',
        item: folder.path,
        itemType: 'folder',
        status: 'created'
      });
    } catch (error) {
      results.push({ 
        path: folder.path,
        type: 'folder',
        success: false, 
        error: String(error) 
      });
    }
  }
  
  // Create or update Cursor command files
  for (const command of invalidCommands) {
    const commandUri = Uri.joinPath(projectUri, command.path);
    try {
      // Generate file with embedded hash
      const content = generateCommandFile(command.path);
      const contentBuffer = Buffer.from(content, 'utf8');
      
      // Ensure .cursor/commands directory exists
      const commandDir = Uri.joinPath(projectUri, '.cursor/commands');
      await workspace.fs.createDirectory(commandDir);
      
      // Write the file
      await workspace.fs.writeFile(commandUri, contentBuffer);
      
      const action = command.exists ? 'updated' : 'created';
      results.push({ path: command.path, type: 'file', success: true });
      
      // Send progress update to webview
      webview.postMessage({
        type: 'initializationProgress',
        item: command.path,
        itemType: 'file',
        status: action
      });
    } catch (error) {
      results.push({ 
        path: command.path,
        type: 'file',
        success: false, 
        error: String(error) 
      });
    }
  }
  
  const allSuccessful = results.every(r => r.success);
  
  return {
    success: allSuccessful,
    results,
    totalItems: missingFolders.length + invalidCommands.length,
    created: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  };
}
```

### Resource Creation Order

Resources are created in this order to ensure parent directories exist:

**Folders:**
1. `ai/` (root)
2. `ai/actors`
3. `ai/contexts`
4. `ai/features`
5. `ai/models`
6. `ai/sessions`
7. `ai/specs`

**Cursor Commands:**
1. `.cursor/commands/` (directory, created automatically)
2. `.cursor/commands/forge-design.md`
3. `.cursor/commands/forge-build.md`

The `workspace.fs.createDirectory()` API automatically creates parent directories if they don't exist, but we iterate in order for clear progress reporting.

**Note**: Cursor command files are created AFTER folders to ensure proper initialization sequence. If a command file exists but is outdated (hash mismatch), it will be overwritten with the new template during initialization.

## Message Protocol

### Webview → Extension Messages

```typescript
// Request initial project state
{
  type: 'getProjectStatus'
}

// Request to initialize project
{
  type: 'initializeProject'
}

// Request to open Forge Studio manually (when already ready)
{
  type: 'openForgeStudio'
}
```

### Extension → Webview Messages

```typescript
// Send initial project status
{
  type: 'projectStatus',
  data: {
    projectPath: string,
    isReady: boolean,
    folders: FolderStatus[]
  }
}

// Send initialization progress
{
  type: 'initializationProgress',
  folder: string,
  status: 'creating' | 'created' | 'error',
  error?: string
}

// Send initialization complete
{
  type: 'initializationComplete',
  success: boolean,
  created: number,
  failed: number
}

// Send error
{
  type: 'error',
  message: string
}
```

## UI Components

### Status Indicator

Displays the project readiness state:

**Forge Ready**:
- Green checkmark icon (✓)
- Green background (using `--vscode-testing-iconPassed`)
- Text: "Forge Ready"
- Subtitle: "All required folders exist"

**Not Ready**:
- Orange warning icon (⚠)
- Orange background (using `--vscode-inputValidation-warningBackground`)
- Text: "Not Ready"
- Subtitle: "Some folders are missing"

### Folder Checklist

Table format showing each required folder:

| Icon | Folder Path | Status | Description |
|------|-------------|--------|-------------|
| ✓ | ai/ | Exists | Root directory for all Forge files |
| ✓ | ai/features | Exists | Feature definitions with Gherkin |
| ✗ | ai/actors | Missing | Actor definitions and personas |
| ... | ... | ... | ... |

**Styling**:
- Exists: Green checkmark, normal text
- Missing: Red X, slightly dimmed text
- Compact row spacing
- Description text in smaller, lighter font

### Action Buttons

**Initialize Forge Project** (shown when not ready):
- Primary button style
- Background: `--vscode-button-background`
- Full width
- Shows loading spinner when initializing
- Disabled during initialization

**Open Forge Studio** (shown when ready):
- Primary button style
- Background: `--vscode-button-background`
- Full width
- Immediately opens Studio

### Initialization Confirmation Dialog

Modal overlay with:
- Title: "Initialize Forge Project"
- Body text: "The following folders will be created:"
- Bulleted list of folders to be created
- Confirm button (primary style)
- Cancel button (secondary style)
- Semi-transparent backdrop

## Error Handling

### Permission Errors

```typescript
try {
  await workspace.fs.createDirectory(folderUri);
} catch (error) {
  if (error.code === 'EACCES') {
    window.showErrorMessage(
      'Unable to create folders: Permission denied. ' +
      'Please check folder permissions and try again.'
    );
  }
}
```

### Disk Space Errors

```typescript
catch (error) {
  if (error.code === 'ENOSPC') {
    window.showErrorMessage(
      'Unable to create folders: Insufficient disk space.'
    );
  }
}
```

### Invalid Path Errors

```typescript
catch (error) {
  if (error.code === 'ENOENT') {
    window.showErrorMessage(
      'Invalid project path. The selected folder may have been moved or deleted.'
    );
  }
}
```

### Partial Failure Handling

If some folders are created successfully but others fail:
1. Show error message indicating which folders failed
2. Keep the welcome screen open
3. Update folder checklist to show newly created folders
4. Allow user to retry (will only attempt missing folders)
5. User can also manually create folders and retry

## Transition to Forge Studio

### Automatic Transition

After successful initialization:

```typescript
private async _transitionToStudio() {
  // Close welcome panel
  this._panel.dispose();
  
  // Open Forge Studio with same project
  ForgeStudioPanel.render(
    this._extensionUri,
    this._projectUri,
    this._output
  );
}
```

The transition should:
1. Close welcome panel (no animation)
2. Immediately open Studio panel
3. Studio loads dashboard
4. Left sidebar remains collapsed
5. No intermediate screens or confirmations

### Manual Open (When Ready)

If a project is already ready but welcome screen is shown:
1. User clicks "Open Forge Studio"
2. Same transition flow as automatic
3. Studio opens with existing data

## Theme Integration

Welcome screen uses VSCode CSS variables:

```css
/* Status indicators */
--vscode-testing-iconPassed (green checkmark)
--vscode-testing-iconFailed (red X)
--vscode-inputValidation-warningBackground (orange)

/* Layout */
--vscode-editor-background
--vscode-editor-foreground
--vscode-panel-border

/* Buttons */
--vscode-button-background
--vscode-button-foreground
--vscode-button-secondaryBackground
--vscode-button-secondaryForeground

/* Text */
--vscode-descriptionForeground
--vscode-font-family
```

## Content Security Policy

Same CSP as Forge Studio:

```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'none'; 
  script-src 'nonce-${nonce}'; 
  style-src 'unsafe-inline' ${webview.cspSource}; 
  font-src ${webview.cspSource};" />
```

## Build Process

### Webview Bundle

```bash
esbuild src/webview/welcome/index.tsx \
  --bundle \
  --outfile=media/welcome/main.js \
  --format=iife \
  --platform=browser \
  --minify
```

Separate bundle from Studio for:
- Smaller initial load
- Independent updates
- Clear separation of concerns

## Testing Strategy

### Unit Tests

**WelcomePanel**:
- Test folder status checking
- Test readiness detection
- Test initialization logic
- Test message handling

**Webview Components**:
- Test status indicator rendering
- Test checklist display
- Test button states
- Test confirmation dialog

### Integration Tests

**Full Flow**:
1. Open Forge on non-ready project
2. Welcome screen appears
3. Click initialize
4. Confirm dialog
5. Folders created
6. Studio opens

**Partial Initialization**:
1. Project has some folders
2. Initialize creates only missing ones
3. Existing folders preserved

**Error Scenarios**:
1. Permission denied
2. Disk space error
3. Path invalid
4. Retry after error

### Manual Testing Checklist

- [ ] Welcome screen appears for non-ready project
- [ ] All required folders shown in checklist
- [ ] Status indicators accurate
- [ ] Initialize button works
- [ ] Confirmation dialog shows correct folders
- [ ] Folders created in correct location
- [ ] Progress updates during creation
- [ ] Studio opens after successful initialization
- [ ] Error handling for permission issues
- [ ] Retry after partial failure
- [ ] Theme changes update colors
- [ ] Sidebar collapsed when welcome opens
- [ ] Works on Windows, macOS, Linux

## Performance Considerations

### Folder Checking

- Asynchronous checks using `Promise.all()`
- Single stat call per folder
- Cache results until user action
- Total check time: < 50ms for typical project

### Initialization

- Sequential folder creation (for progress reporting)
- Each folder creation: < 10ms
- Total initialization: < 100ms for all 7 folders
- Non-blocking UI during process

### Memory

- Lightweight panel (< 1MB)
- Disposes completely on transition
- No persistent watchers
- Clean resource cleanup

## Known Limitations

1. **No undo**: Once folders are created, they cannot be removed through UI
2. **No customization**: Folder list is fixed, cannot be customized
3. **No validation**: Doesn't check if folders contain valid Forge files
4. **No backup**: Doesn't create backups before initialization
5. **Single project**: Can only initialize one project at a time

## Future Enhancements

1. **Smart detection**: Check for existing Forge-like structures (e.g., `design/` instead of `ai/`)
2. **Template selection**: Offer different folder structure templates
3. **Sample content**: Optionally populate folders with example files
4. **Undo option**: Allow removal of created folders
5. **Import existing**: Detect and import files from other locations
6. **Custom structure**: Allow users to define their own folder structure
7. **Validation**: Check folder contents for valid Forge files
8. **Migration**: Offer to migrate from other context systems





