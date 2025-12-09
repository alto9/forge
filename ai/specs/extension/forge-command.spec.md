---
spec_id: forge-command
name: /forge Command Specification
description: Technical specification for the /forge Cursor command that replaces get_forge_about MCP tool
feature_id:
  - cursor-commands-migration
diagram_id: []
---

# /forge Command Specification

## Overview

The `/forge` command is a comprehensive Cursor command file that replaces the `get_forge_about` MCP tool. It provides foundational guidance about the Forge workflow, session-driven approach, and context engineering principles.

## Command File Details

**Location**: `.cursor/commands/forge.md`

**Purpose**: Inform AI agents about Forge's complete workflow and methodology

**Usage Pattern**: Should be used WITH other Forge commands to provide foundational context
- Example: `/forge /forge-design`
- Example: `/forge /forge-build`

## Content Structure

### Section 1: What is Forge?

**Purpose**: Provide high-level overview of Forge's purpose and value proposition

**Content**:
- Context engineering for AI-assisted development
- Session-driven workflow system
- Converts design decisions into minimal implementation stories
- Tracks changes during design sessions
- Generates actionable stories with complete context

### Section 2: The Forge Workflow

**Purpose**: Explain the complete workflow from design to implementation

**Content**:

#### Phase 1: Start a Design Session
- User creates session with problem statement
- Session file created in `ai/sessions/`
- Status set to `active`
- Changed files tracking begins (feature files only)

#### Phase 2: Design Changes
During active session:
- **Features** (*.feature.md) - Define behavior with Gherkin → **TRACKED**
- **Specs** (*.spec.md) - Technical implementation details → **NOT TRACKED**
- **Diagrams** (*.diagram.md) - Visual architecture → **NOT TRACKED**
- **Actors** (*.actor.md) - System personas → **NOT TRACKED**

Only feature changes tracked at scenario-level

#### Phase 3: Distill Session
- User runs distill command
- System analyzes changed feature files
- Follows linkages to discover related specs, diagrams, contexts
- Creates Stories (code work) and Tasks (non-code work)
- Places them in `ai/tickets/<session-id>/`

#### Phase 4: Build Implementation
- User selects Story file
- Runs build command
- System provides complete context from linked files
- Agent implements the story

### Section 3: File Types and Structure

**Purpose**: Document the Forge file system and its organization

**Content**:

#### Sessions (ai/sessions/)
- Session files (*.session.md) track design work
- Contains: session_id, start_time, status, problem_statement, changed_files[]
- Tracks ONLY feature changes at scenario-level

#### Features (ai/features/)
- Feature files (*.feature.md) define user-facing functionality
- **DIRECTIVE**: Features drive code changes
- Uses Gherkin format in code blocks
- Every features folder should have index.md with Background and Rules
- Contains: feature_id, spec_id[]
- Tracked at scenario-level during design sessions

#### Specs (ai/specs/)
- Spec files (*.spec.md) define technical implementation
- **INFORMATIVE**: Specs provide HOW features should be implemented
- NOT tracked in sessions, always editable
- Includes references to diagrams for architecture
- Contains: spec_id, feature_id[], diagram_id[]

#### Diagrams (ai/diagrams/)
- Diagram files (*.diagram.md) provide visual architecture
- Uses React Flow JSON format in code blocks
- NOT tracked in sessions, always editable
- Types: infrastructure, components, flows, states
- Contains: diagram_id, spec_id[], feature_id[]

#### Actors (ai/actors/)
- Actor files (*.actor.md) define system actors and personas
- Describes who interacts with the system and their roles
- NOT tracked in sessions, always editable
- Contains: actor_id, type, responsibilities, characteristics

#### Tickets (ai/tickets/)
- Stories (*.story.md) - code implementation work (< 30 minutes each)
- Tasks (*.task.md) - external/manual work
- Organized by session in `ai/tickets/<session-id>/`
- Contains: story_id/task_id, session_id, feature_id[], spec_id[], status

### Section 4: Key Principles

**Purpose**: Document the core principles that guide Forge usage

**Content**:

#### Gherkin Format
All Gherkin must use code blocks:
```gherkin
Feature: Example Feature

Scenario: Example Scenario
  Given a precondition
  When an action occurs
  Then an expected outcome happens
```

#### Minimal Stories
- Each story should take < 30 minutes to implement
- Break complex changes into multiple small stories
- One focused change per story
- Clear acceptance criteria

#### Nestable Structure
- All folders are nestable to group related concepts
- Features folders have index.md for shared Background and Rules
- index.md files never show in tree views

#### Complete Context
- Stories link to features, specs, diagrams
- Distillation follows all linkages to gather complete information
- Context building ensures nothing is missed

### Section 5: When to Create Stories vs Tasks

**Purpose**: Guide agents on distinguishing code work from non-code work

**Content**:

#### Create Stories When:
- Work involves writing or modifying code
- Implementation takes < 30 minutes
- Changes are testable and verifiable
- Work is contained within the codebase

#### Create Tasks When:
- Work is manual or external to codebase
- Coordination with external systems required
- Documentation or research needed
- Human decision-making required
- Setup or configuration outside code

### Section 6: The Linkage System

**Purpose**: Explain how Forge files link together to build complete context

**Content**:

#### File Linkages
- Features link to Specs (feature_id → spec_id)
- Specs link to Diagrams (spec_id → diagram_id)
- Stories link to Features and Specs (story_id → feature_id, spec_id)
- All linkages are bidirectional for context gathering

#### Context Gathering Process
1. Start with changed feature files
2. Follow feature_id to discover linked specs
3. Follow spec_id to discover linked diagrams
4. Include all discovered context in story generation
5. Ensure complete picture without overload

### Section 7: Session Status Management

**Purpose**: Document session lifecycle and status transitions

**Content**:

#### Session Statuses
- `design` - Active design session, changes being made
- `complete` - Design complete, ready for distillation
- `distilled` - Stories/tasks created, ready for implementation

#### Status Transitions
- Start session → `design`
- Complete design → `complete`
- Distill session → `distilled`

## File Format

### Hash-Based Validation

Each Cursor command includes content hash for integrity:

```markdown
<!-- forge-hash: a1b2c3d4e5f6... -->

# Forge

[Command content here]
```

**Hash Algorithm**: SHA-256 of content (excluding hash comment)

**Validation**: Extension validates hash on project initialization to detect outdated commands

### Template Storage

Command template stored in extension:

```typescript
// packages/vscode-extension/src/templates/cursorCommands.ts

export const FORGE_COMMAND_TEMPLATE = `# Forge

[Full command content here]
`;

export const COMMAND_TEMPLATES: Record<string, string> = {
  '.cursor/commands/forge.md': FORGE_COMMAND_TEMPLATE,
  // ... other commands
};
```

## Integration with Extension

### Command Creation

During project initialization:
1. Extension checks for existing `.cursor/commands/forge.md`
2. If missing or invalid hash, creates/updates file
3. Generates file with hash comment
4. Notifies user of creation/update

### Validation Process

```typescript
import { validateCommandFileHash, generateCommandFile } from './utils/commandValidation';

async function ensureForgeCommand(projectUri: vscode.Uri): Promise<void> {
  const commandPath = '.cursor/commands/forge.md';
  const commandUri = vscode.Uri.joinPath(projectUri, commandPath);
  
  let needsUpdate = false;
  try {
    const fileContent = await vscode.workspace.fs.readFile(commandUri);
    const contentString = Buffer.from(fileContent).toString('utf8');
    const isValid = validateCommandFileHash(contentString, commandPath);
    needsUpdate = !isValid;
  } catch {
    needsUpdate = true;
  }
  
  if (needsUpdate) {
    const content = generateCommandFile(commandPath);
    await vscode.workspace.fs.writeFile(
      commandUri,
      Buffer.from(content, 'utf8')
    );
  }
}
```

## Migration from get_forge_about

### MCP Tool (Deprecated)

**Old Approach**:
```markdown
Call the get_forge_about MCP tool to understand Forge workflow.
```

**Issues**:
- Required MCP server installation
- Additional configuration needed
- Startup overhead
- External dependency

### Cursor Command (New Approach)

**New Approach**:
```markdown
Use the /forge command to understand Forge workflow.
```

**Benefits**:
- No external dependencies
- Works immediately after extension install
- Native Cursor integration
- Faster, more reliable

### Content Parity

The `/forge` command content MUST match what `get_forge_about` provided:
- Complete workflow documentation
- Session-driven approach
- File type descriptions
- Linkage system explanation
- Minimal story size guidance
- Context gathering process

## Usage Examples

### Example 1: Starting a design session

```markdown
/forge /forge-design

I need to start a design session for implementing user authentication.
```

**AI receives**:
1. Complete Forge workflow context from `/forge`
2. Design session guidance from `/forge-design`
3. Can properly create session file and track changes

### Example 2: Building a story

```markdown
/forge /forge-build ai/tickets/my-session/story-001.story.md

Implement this story.
```

**AI receives**:
1. Complete Forge workflow context from `/forge`
2. Build implementation guidance from `/forge-build`
3. Story details with linked features/specs
4. Can properly implement with full context

## Testing Requirements

### Unit Tests
- Validate command template content completeness
- Verify hash generation and validation
- Test file creation and update logic

### Integration Tests
- Test command file creation during initialization
- Verify hash-based validation detects outdated files
- Test command file updates when template changes

### Manual Validation
- Compare `/forge` content with old `get_forge_about` output
- Verify all workflow information is present
- Confirm AI agents can use command effectively
- Test with real design sessions

## Content Updates

### When to Update Template

Update the FORGE_COMMAND_TEMPLATE when:
- Forge workflow changes
- New file types added
- Linkage system evolves
- Principles or guidance updated

### Update Process

1. Modify FORGE_COMMAND_TEMPLATE in cursorCommands.ts
2. Bump extension version
3. Existing command files marked as outdated (hash mismatch)
4. Users re-initialize to update commands
5. Document changes in release notes

## Related Specifications

- `cursor-commands-management.spec.md` - Overall command management system
- `monorepo-to-single-package.spec.md` - Repository restructuring
- `forge-design-command.spec.md` - /forge-design command with schemas

## Related Features

- `cursor-commands-migration.feature.md` - User-facing migration feature
- `mcp-server.feature.md` - Original MCP server functionality (deprecated)

