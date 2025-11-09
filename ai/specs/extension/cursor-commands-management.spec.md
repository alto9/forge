---
spec_id: cursor-commands-management
name: Cursor Commands Management and Distribution
description: Technical specification for managing, validating, and distributing Cursor command files as part of Forge initialization
feature_id: [welcome-screen]
context_id: [vsce]
---

# Cursor Commands Management and Distribution

## Overview

Forge distributes Cursor command files (`.cursor/commands/*.md`) as part of project initialization. These command files provide developer-facing instructions that guide AI agents through Forge workflows. The extension manages these files by:

1. Storing templates within the extension code
2. Validating existing files using content hashing
3. Creating or updating files during initialization
4. Ensuring consistency across Forge projects

## Architecture

```nomnoml
#direction: down
#padding: 10
#fontSize: 12

[Extension Activation] -> [Load Command Templates]
[Load Command Templates] -> [Templates Stored in Memory|<success>]

[Check Project Readiness] -> [Read Command Files]
[Read Command Files] -> [Validate Hash]
[Validate Hash] -> [<choice>Hash Valid?]
[<choice>Hash Valid?] Yes -> [File is Valid|<success>]
[<choice>Hash Valid?] No -> [File is Invalid/Outdated|<error>]

[Initialize Project] -> [Generate Commands]
[Generate Commands] -> [Compute Hash]
[Compute Hash] -> [Embed Hash Comment]
[Embed Hash Comment] -> [Write File to Project]
```

## Command Files

### forge-design.md

**Purpose**: Guides AI agents when working within Forge design sessions to update documentation.

**Location**: `.cursor/commands/forge-design.md`

**Responsibilities**:
- Calls `get_forge_about` MCP tool to understand Forge workflow
- Ensures agent is working within an active design session
- Only modifies files in the `ai/` folder (features, specs, models, actors, contexts)
- Reads AI documentation for context
- Tracks all changes in the active session's `changed_files` array
- Ensures proper formatting (Gherkin in features, Nomnoml in specs)

**Template Content**:

```markdown
# Forge Design

This command guides AI agents when working within Forge design sessions to update documentation.

## Prerequisites

You must have an active design session before making changes to AI documentation.

## What This Command Does

1. **Calls MCP Tools**: Uses `get_forge_about` to understand the Forge workflow and session-driven approach
2. **Checks for active session**: Ensures you're working within a structured design workflow
3. **Reads AI documentation**: Understands existing design patterns and structure
4. **Guides documentation updates**: Helps create or modify features, specs, models, actors, and contexts
5. **Tracks all changes**: Ensures changed files are tracked in the active session's `changed_files` array

## Important Constraints

- **This is a Forge design session**: You are working within a structured design workflow
- **Only modify AI documentation files**: Work exclusively within the `ai/` folder
- **Do NOT modify implementation code**: This command is for updating features, specs, models, actors, and contexts only
- **Track all changes**: Ensure changed files are tracked in the active session's `changed_files` array
- **Use proper formats**: Features use Gherkin in code blocks, Specs use Nomnoml diagrams
- **Call MCP tools**: Always start by calling `get_forge_about` to understand the current Forge workflow

## Usage

1. Ensure you have an active design session
2. Run this command
3. The AI will call `get_forge_about` MCP tool
4. The AI will analyze existing AI documentation
5. The AI will update documentation in the ai/ folder
6. All changes will be tracked in the active design session

The documentation updates will be consistent with your existing design patterns and the Forge workflow.
```

### forge-build.md

**Purpose**: Guides AI agents when implementing Forge stories by analyzing codebase and AI documentation.

**Location**: `.cursor/commands/forge-build.md`

**Responsibilities**:
- Calls `get_forge_about` MCP tool to understand Forge workflow and story structure
- Reads the story file to understand implementation requirements
- Analyzes existing codebase to understand patterns and structure
- Reads linked AI documentation (features, specs, models, contexts) for design intent
- Implements actual code changes described in the story
- Writes unit tests for the implementation
- Ensures implementation matches documented design

**Template Content**:

```markdown
# Forge Build

This command helps you implement a Forge story by analyzing both the codebase and AI documentation.

## Prerequisites

You must provide a story file (*.story.md) when running this command.

## What This Command Does

1. **Calls MCP Tools**: Uses `get_forge_about` to understand the Forge workflow and story structure
2. **Reads the story file**: Understands what needs to be implemented
3. **Analyzes the existing codebase**: Understands current implementation patterns and structure
4. **Reads AI documentation**: Understands intended behavior from linked files:
   - Features (expected behavior with Gherkin scenarios)
   - Specs (technical implementation details with Nomnoml diagrams)
   - Models (data structures)
   - Contexts (technology-specific guidance)
5. **Implements the changes**: Writes actual code as described in the story
6. **Writes tests**: Creates unit tests for the implementation
7. **Ensures consistency**: Implementation matches the documented design

## Important Guidelines

- **Follow the story**: Implement exactly what the story describes (< 30 minutes of work)
- **Use AI documentation as reference**: Features and specs define the intended behavior
- **Match existing patterns**: Follow the codebase's existing architecture and conventions
- **Write tests**: Include unit tests as specified in the story
- **Stay focused**: If the story is too large, break it into smaller stories

## Usage

1. Select a story file from ai/tickets/
2. Run this command
3. The AI will call `get_forge_about` MCP tool
4. The AI will analyze the story and linked documentation
5. The AI will implement the changes with tests
6. Review and commit the implementation

The implementation will be consistent with your documented design and existing codebase patterns.
```

## Template Storage

### File Organization

```
packages/vscode-extension/src/
└── templates/
    └── cursorCommands.ts    # Command template constants
```

### Template Module

```typescript
// packages/vscode-extension/src/templates/cursorCommands.ts

/**
 * Template for forge-design.md Cursor command
 */
export const FORGE_DESIGN_TEMPLATE = `# Forge Design

This command guides AI agents when working within Forge design sessions to update documentation.

## Prerequisites

You must have an active design session before making changes to AI documentation.

## What This Command Does

1. **Calls MCP Tools**: Uses \`get_forge_about\` to understand the Forge workflow and session-driven approach
2. **Checks for active session**: Ensures you're working within a structured design workflow
3. **Reads AI documentation**: Understands existing design patterns and structure
4. **Guides documentation updates**: Helps create or modify features, specs, models, actors, and contexts
5. **Tracks all changes**: Ensures changed files are tracked in the active session's \`changed_files\` array

## Important Constraints

- **This is a Forge design session**: You are working within a structured design workflow
- **Only modify AI documentation files**: Work exclusively within the \`ai/\` folder
- **Do NOT modify implementation code**: This command is for updating features, specs, models, actors, and contexts only
- **Track all changes**: Ensure changed files are tracked in the active session's \`changed_files\` array
- **Use proper formats**: Features use Gherkin in code blocks, Specs use Nomnoml diagrams
- **Call MCP tools**: Always start by calling \`get_forge_about\` to understand the current Forge workflow

## Usage

1. Ensure you have an active design session
2. Run this command
3. The AI will call \`get_forge_about\` MCP tool
4. The AI will analyze existing AI documentation
5. The AI will update documentation in the ai/ folder
6. All changes will be tracked in the active design session

The documentation updates will be consistent with your existing design patterns and the Forge workflow.`;

/**
 * Template for forge-build.md Cursor command
 */
export const FORGE_BUILD_TEMPLATE = `# Forge Build

This command helps you implement a Forge story by analyzing both the codebase and AI documentation.

## Prerequisites

You must provide a story file (*.story.md) when running this command.

## What This Command Does

1. **Calls MCP Tools**: Uses \`get_forge_about\` to understand the Forge workflow and story structure
2. **Reads the story file**: Understands what needs to be implemented
3. **Analyzes the existing codebase**: Understands current implementation patterns and structure
4. **Reads AI documentation**: Understands intended behavior from linked files:
   - Features (expected behavior with Gherkin scenarios)
   - Specs (technical implementation details with Nomnoml diagrams)
   - Models (data structures)
   - Contexts (technology-specific guidance)
5. **Implements the changes**: Writes actual code as described in the story
6. **Writes tests**: Creates unit tests for the implementation
7. **Ensures consistency**: Implementation matches the documented design

## Important Guidelines

- **Follow the story**: Implement exactly what the story describes (< 30 minutes of work)
- **Use AI documentation as reference**: Features and specs define the intended behavior
- **Match existing patterns**: Follow the codebase's existing architecture and conventions
- **Write tests**: Include unit tests as specified in the story
- **Stay focused**: If the story is too large, break it into smaller stories

## Usage

1. Select a story file from ai/tickets/
2. Run this command
3. The AI will call \`get_forge_about\` MCP tool
4. The AI will analyze the story and linked documentation
5. The AI will implement the changes with tests
6. Review and commit the implementation

The implementation will be consistent with your documented design and existing codebase patterns.`;

/**
 * Map of command paths to their templates
 */
export const COMMAND_TEMPLATES: Record<string, string> = {
  '.cursor/commands/forge-design.md': FORGE_DESIGN_TEMPLATE,
  '.cursor/commands/forge-build.md': FORGE_BUILD_TEMPLATE
};

/**
 * Get all command paths that Forge manages
 */
export function getManagedCommandPaths(): string[] {
  return Object.keys(COMMAND_TEMPLATES);
}

/**
 * Get the template content for a specific command path
 */
export function getCommandTemplate(commandPath: string): string | undefined {
  return COMMAND_TEMPLATES[commandPath];
}
```

## Hash-Based Validation

### Hash Format

Each Cursor command file includes a hash comment at the top:

```markdown
<!-- forge-hash: a1b2c3d4e5f6... -->

# Forge Design
...
```

**Format**: `<!-- forge-hash: <64-character-hex-string> -->`

**Hash Algorithm**: SHA-256

**Hashed Content**: Template content (without the hash comment itself)

### Validation Process

```typescript
// packages/vscode-extension/src/utils/commandValidation.ts

import * as crypto from 'crypto';
import { getCommandTemplate } from '../templates/cursorCommands';

/**
 * Regex to extract hash comment from file content
 */
const HASH_COMMENT_REGEX = /<!-- forge-hash: ([a-f0-9]{64}) -->/;

/**
 * Validates that a command file's content matches its embedded hash
 */
export function validateCommandFileHash(
  fileContent: string,
  commandPath: string
): boolean {
  // Extract the embedded hash
  const match = fileContent.match(HASH_COMMENT_REGEX);
  if (!match) {
    // No hash comment found - file is invalid
    return false;
  }
  
  const embeddedHash = match[1];
  
  // Get the expected template
  const template = getCommandTemplate(commandPath);
  if (!template) {
    // Unknown command path
    return false;
  }
  
  // Remove hash comment from both file content and template before comparing
  const fileContentWithoutHash = fileContent.replace(HASH_COMMENT_REGEX, '').trim();
  const templateWithoutHash = template.trim();
  
  // Compute expected hash
  const expectedHash = computeContentHash(templateWithoutHash);
  
  // Validate: embedded hash matches expected AND content matches template
  return (
    embeddedHash === expectedHash &&
    fileContentWithoutHash === templateWithoutHash
  );
}

/**
 * Computes SHA-256 hash of content
 */
export function computeContentHash(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content, 'utf8')
    .digest('hex');
}

/**
 * Generates a command file with embedded hash comment
 */
export function generateCommandFile(commandPath: string): string {
  const template = getCommandTemplate(commandPath);
  if (!template) {
    throw new Error(`Unknown command path: ${commandPath}`);
  }
  
  // Compute hash of template content
  const hash = computeContentHash(template);
  
  // Return content with hash comment at top
  return `<!-- forge-hash: ${hash} -->\n\n${template}`;
}
```

### Why Hash Validation?

**Benefits**:
1. **Version Control**: Detects when command files are outdated
2. **Consistency**: Ensures all Forge projects use the same command templates
3. **Auto-Update**: Enables automatic updating of outdated commands
4. **Developer Protection**: Prevents manual edits from breaking command functionality

**Trade-offs**:
- Users cannot customize command files (by design)
- Any template update invalidates all existing command files
- Requires re-initialization to update commands

## Integration with Project Readiness

### Readiness Criteria

A project is "Forge Ready" when:
1. All required `ai/` folders exist
2. All required Cursor command files exist
3. All Cursor command files have valid content (hash matches)

### Readiness Check Flow

```typescript
// packages/vscode-extension/src/utils/projectReadiness.ts

import * as vscode from 'vscode';
import { getManagedCommandPaths } from '../templates/cursorCommands';
import { validateCommandFileHash } from './commandValidation';

export async function checkProjectReadiness(
  projectUri: vscode.Uri
): Promise<boolean> {
  // Check folders (existing logic)
  const foldersReady = await checkRequiredFolders(projectUri);
  if (!foldersReady) {
    return false;
  }
  
  // Check Cursor commands
  const commandsReady = await checkCursorCommands(projectUri);
  return commandsReady;
}

async function checkCursorCommands(
  projectUri: vscode.Uri
): Promise<boolean> {
  const commandPaths = getManagedCommandPaths();
  
  for (const commandPath of commandPaths) {
    const commandUri = vscode.Uri.joinPath(projectUri, commandPath);
    
    try {
      // Read file
      const fileContent = await vscode.workspace.fs.readFile(commandUri);
      const contentString = Buffer.from(fileContent).toString('utf8');
      
      // Validate hash
      const isValid = validateCommandFileHash(contentString, commandPath);
      if (!isValid) {
        // File exists but is invalid
        return false;
      }
    } catch {
      // File doesn't exist
      return false;
    }
  }
  
  return true;
}
```

## Initialization Process

### Creating Command Files

When initializing a project, command files are created after folders:

```typescript
// packages/vscode-extension/src/panels/WelcomePanel.ts (excerpt)

import { getManagedCommandPaths } from '../templates/cursorCommands';
import { generateCommandFile, validateCommandFileHash } from '../utils/commandValidation';

private async _initializeProject(): Promise<void> {
  // 1. Create missing folders (existing logic)
  await this._createMissingFolders();
  
  // 2. Create or update Cursor commands
  await this._initializeCursorCommands();
  
  // 3. Transition to Studio
  this._openForgeStudio();
}

private async _initializeCursorCommands(): Promise<void> {
  const commandPaths = getManagedCommandPaths();
  
  for (const commandPath of commandPaths) {
    const commandUri = vscode.Uri.joinPath(this._projectUri, commandPath);
    
    // Check if file needs creation/updating
    let needsUpdate = false;
    try {
      const fileContent = await vscode.workspace.fs.readFile(commandUri);
      const contentString = Buffer.from(fileContent).toString('utf8');
      const isValid = validateCommandFileHash(contentString, commandPath);
      needsUpdate = !isValid;
    } catch {
      // File doesn't exist
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      // Ensure .cursor/commands directory exists
      const commandDir = vscode.Uri.joinPath(this._projectUri, '.cursor/commands');
      await vscode.workspace.fs.createDirectory(commandDir);
      
      // Generate file with hash
      const content = generateCommandFile(commandPath);
      const contentBuffer = Buffer.from(content, 'utf8');
      
      // Write file
      await vscode.workspace.fs.writeFile(commandUri, contentBuffer);
      
      // Send progress update
      this._panel.webview.postMessage({
        type: 'initializationProgress',
        item: commandPath,
        itemType: 'file',
        status: needsUpdate ? 'updated' : 'created'
      });
    }
  }
}
```

## Extension Lifecycle

### Activation

When the extension activates:
1. Load command templates into memory
2. No validation happens at activation
3. Templates are ready for use

### Project Open

When a project is opened:
1. User runs "Forge: Open Forge Studio" command
2. Extension checks project readiness
3. Validates command files if they exist
4. Routes to Welcome Screen or Studio based on readiness

### Startup Validation

The extension does NOT automatically validate or update command files on startup. Validation only occurs:
1. When checking project readiness (user-initiated)
2. When initializing a project (user-initiated)

**Rationale**: Avoid unexpected file modifications without user consent.

## UI Integration

### Welcome Screen Checklist

The welcome screen displays command file status alongside folders:

```typescript
interface CommandStatus {
  path: string;
  exists: boolean;
  valid: boolean;
  description: string;
  type: 'command';
}

// Example status objects
[
  {
    path: '.cursor/commands/forge-design.md',
    exists: true,
    valid: false,  // Hash mismatch
    description: 'Cursor command for design session workflow',
    type: 'command'
  },
  {
    path: '.cursor/commands/forge-build.md',
    exists: false,
    valid: false,
    description: 'Cursor command for building from tickets',
    type: 'command'
  }
]
```

### Status Indicators

**Command File States**:

| Exists | Valid | Indicator | Description |
|--------|-------|-----------|-------------|
| No | N/A | ✗ Red | File missing |
| Yes | No | ⚠ Orange | File outdated (hash mismatch) |
| Yes | Yes | ✓ Green | File valid |

## Testing Strategy

### Unit Tests

**commandValidation.test.ts**:
- Test hash computation
- Test validation with valid content
- Test validation with invalid content
- Test validation with missing hash
- Test validation with tampered content
- Test file generation with embedded hash

**projectReadiness.test.ts**:
- Test readiness check with valid commands
- Test readiness check with missing commands
- Test readiness check with invalid commands
- Test readiness check with mixed states

### Integration Tests

**WelcomePanel.test.ts**:
- Test initialization creates command files
- Test initialization updates outdated commands
- Test initialization preserves valid commands
- Test progress messages during command creation

### Manual Testing

- [ ] Create new project, initialize, verify command files created
- [ ] Manually edit command file, verify marked as invalid
- [ ] Re-initialize project, verify command file updated
- [ ] Delete command file, verify marked as missing
- [ ] Initialize project, verify hash comments present
- [ ] Compare file hash with template, verify match

## Template Updates

### Process for Updating Templates

When a template needs updating:

1. **Modify Template**:
   - Edit `FORGE_DESIGN_TEMPLATE` or `FORGE_BUILD_TEMPLATE` in `cursorCommands.ts`
   - Update the content as needed

2. **Version Bump**:
   - Bump extension version in `package.json`
   - Document changes in CHANGELOG

3. **Existing Projects**:
   - Existing command files will show as invalid (hash mismatch)
   - Users can re-initialize to update commands
   - Welcome screen will show orange warning for outdated commands

4. **Communication**:
   - Release notes should mention command template updates
   - Users should be encouraged to re-initialize

### Breaking Changes

If a template change is breaking (changes command behavior):
1. Consider backward compatibility
2. Provide migration guide
3. Major version bump
4. Clear communication in release notes

## Security Considerations

### File System Safety

- Only writes to `.cursor/commands/` directory
- Never modifies files outside project directory
- Validates paths before writing
- Handles permission errors gracefully

### Content Safety

- Templates are hardcoded in extension
- No external content injection
- No user input in template content
- Hash prevents unauthorized modifications

### User Control

- Users must explicitly initialize/update
- Clear preview before creating/updating files
- Confirmation dialog before initialization
- Users can manually inspect command files

## Performance Considerations

### Hash Computation

- SHA-256 is fast for small files (< 1KB)
- Synchronous computation is acceptable
- Each validation: < 1ms

### File I/O

- Async file operations using VSCode API
- Parallel status checks using `Promise.all()`
- Total validation time: < 50ms for 2 command files

### Memory

- Templates stored in memory (< 10KB total)
- No caching of file contents
- Minimal memory footprint

## Session Distillation Prompt Generation

### Overview

When a completed session is ready to be distilled into stories and tasks, the system generates a comprehensive prompt that guides the AI agent through the distillation process. This prompt is written to `.cursor/commands/create-stories-{session-id}.md` and includes all necessary context for story generation.

### Distillation Prompt Structure

The generated prompt follows this structure:

1. **STEP 0**: Call MCP tools to get Forge schemas
2. **STEP 1**: Read session file and understand the problem
3. **STEP 2**: Review changed files with git diffs
4. **STEP 3**: Include global contexts (if any)
5. **STEP 4**: Follow context guidance from linked specs
6. **STEP 5**: Analyze and create Stories/Tasks
7. **STEP 6**: Verify completeness

### Global Contexts

**Purpose**: Global contexts provide foundational guidance that should be available for ALL story generation, regardless of specific feature or spec linkages.

**Discovery Process**:
```typescript
// Scan ai/contexts/ recursively for files with global: true
async function findGlobalContexts(workspaceRoot: string): Promise<ContextFile[]> {
  const contextsDir = path.join(workspaceRoot, 'ai', 'contexts');
  const globalContexts: ContextFile[] = [];
  
  // Recursively scan all .context.md files
  const contextFiles = await recursiveScan(contextsDir, '.context.md');
  
  for (const filePath of contextFiles) {
    const content = await readFile(filePath);
    const parsed = parseFrontmatter(content);
    
    // Check if global property is true
    if (parsed.frontmatter.global === true) {
      globalContexts.push({
        contextId: parsed.frontmatter.context_id,
        filePath: filePath,
        content: content  // Full markdown + Gherkin content
      });
    }
  }
  
  return globalContexts;
}
```

**Inclusion in Prompt**:

When global contexts are found, they are included in the distillation prompt:

```markdown
## Global Contexts

The following contexts are marked as global and should inform all story generation:

### build-procedures (ai/contexts/foundation/build-procedures.context.md)

[FULL CONTENT OF build-procedures.context.md]

### local-development (ai/contexts/foundation/local-development.context.md)

[FULL CONTENT OF local-development.context.md]

---

Use the guidance above when creating stories and tasks. These foundational contexts ensure consistency across all implementation work.
```

**Placement**: Global contexts appear after the changed files section and before the main distillation steps, ensuring the agent has foundational guidance before analyzing specific changes.

**When to Mark as Global**:
- Build procedures and packaging
- Local development standards
- Core architecture patterns
- Universal coding standards
- Critical technical constraints

**When NOT to Mark as Global**:
- Technology-specific guidance (AWS Lambda, React patterns)
- Feature-specific contexts
- Optional or situational guidance

### PromptGenerator Implementation

The `PromptGenerator.generateDistillSessionPrompt()` method:

1. Reads the session file
2. Gathers git diffs for changed files
3. **Scans for global contexts** (new)
4. **Includes global context content** (new)
5. Lists changed files with diffs
6. Provides step-by-step distillation instructions
7. Links to relevant features, specs, and models

```typescript
// packages/vscode-extension/src/utils/PromptGenerator.ts

static async generateDistillSessionPrompt(sessionUri: vscode.Uri): Promise<string> {
  // ... existing session and changed files logic ...
  
  // NEW: Find and include global contexts
  const globalContexts = await this.findGlobalContexts(workspaceFolder.uri.fsPath);
  
  if (globalContexts.length > 0) {
    prompt += `\n## Global Contexts\n\n`;
    prompt += `The following contexts are marked as global and should inform all story generation:\n\n`;
    
    for (const context of globalContexts) {
      const relativePath = path.relative(workspaceFolder.uri.fsPath, context.filePath);
      prompt += `### ${context.contextId} (${relativePath})\n\n`;
      prompt += context.content + '\n\n';
      prompt += `---\n\n`;
    }
    
    prompt += `Use the guidance above when creating stories and tasks. These foundational contexts ensure consistency across all implementation work.\n\n`;
  }
  
  // ... continue with distillation steps ...
}
```

### Benefits of Global Contexts

1. **Consistent Guidance**: Ensures foundational standards are always applied
2. **Reduced Errors**: Critical information never missed in story generation
3. **Better Stories**: Stories include proper build, test, and deployment considerations
4. **Developer Experience**: Less rework from missing foundational requirements

### Example Use Cases

**Example 1: Build Procedures Always Included**
- Session changes add a new API endpoint
- Global context `build-procedures` ensures story includes build steps
- Global context `local-development` ensures testing guidance is provided
- Stories automatically reference proper build and test procedures

**Example 2: Technology-Specific vs Global**
- `build-procedures` → Global (always needed)
- `aws-lambda-patterns` → Not global (only needed for Lambda stories)
- `aws-lambda-patterns` linked via spec_id when relevant

## Future Enhancements

### Additional Commands

**Possible Future Commands**:
- `forge-review.md` - Guide for reviewing changes
- `forge-migrate.md` - Guide for migrating projects

**Implementation**: Add new templates to `COMMAND_TEMPLATES` map

### Command Versioning

Instead of binary valid/invalid, support version checking:
- Store version in hash comment: `<!-- forge-hash: v1.0.0:hash -->`
- Allow backward-compatible versions
- Provide migration paths

### Customization Options

Allow users to extend (not replace) commands:
- Support `.cursor/commands/forge-design.local.md` for local additions
- Maintain validation for base commands
- Merge base + local content when presenting to AI

### Template Marketplace

Community-contributed command templates:
- Registry of optional command templates
- User can install additional commands
- Separate namespace: `.cursor/commands/community/*.md`

## Related Specifications

- `welcome-initialization.spec.md` - Welcome screen and initialization flow
- `forge-studio-implementation.spec.md` - Studio architecture and entry points

## Related Features

- `welcome-screen.feature.md` - Welcome screen and readiness detection

