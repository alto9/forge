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
4. **Guides documentation updates**: Helps create or modify features, diagrams, specs, actors, and contexts
5. **Tracks all changes**: Ensures changed files are tracked in the active session's \`changed_files\` array

## File Type Guidance

When working in design sessions, use the correct file type for each purpose:

### Features (*.feature.md)
- **Purpose**: Define WHAT users can do (user-facing behavior)
- **Format**: Gherkin scenarios in code blocks
- **Contains**: Background, Rules, Scenarios with Given/When/Then steps
- **Example**: "User can log in with email and password"

### Diagrams (*.diagram.md)
- **Purpose**: Visualize HOW the system is structured
- **Format**: JSON diagram data in markdown code blocks
- **Contains**: ONE visual representation (infrastructure, components, flows, states)
- **Example**: "User authentication flow through API gateway to Lambda"
- **Keep it visual**: No pseudocode or implementation details

### Specs (*.spec.md)
- **Purpose**: Define WHAT must be built (technical contracts)
- **Format**: Markdown with tables, interfaces, rules
- **Contains**: API contracts, data structures, validation rules, constraints
- **Does NOT contain**: Diagrams (use diagram files instead), implementation code (use context files)
- **Example**: "Login API endpoint accepts email/password, returns JWT token"

### Actors (*.actor.md)
- **Purpose**: Define who/what interacts with the system
- **Format**: Markdown descriptions
- **Contains**: Responsibilities, characteristics, context
- **Note**: Always editable (no session required)

## Intelligent Linkage and Grouping

When working with Forge documentation, it's essential to understand and respect the existing organizational structure:

- **Analyze folder structure**: Before creating new files, examine the existing \`ai/\` subfolder structure to understand how elements are logically grouped
- **Follow existing patterns**: Contribute to existing grouping patterns rather than creating new arbitrary structures
- **Respect nesting**: Folder nesting reflects logical relationships - preserve and extend these relationships when adding new files
- **Utilize linkages effectively**: Use all element linkages (feature_id, spec_id) to build complete context, but avoid over-verbosity
- **Group logically**: Place related files together in nested folders that reflect their relationships and dependencies
- **Maintain consistency**: When adding new documentation, follow the same organizational patterns already established in the project

Understanding the existing structure helps maintain coherence and makes the documentation easier to navigate and understand.

## Important Constraints

- **This is a Forge design session**: You are working within a structured design workflow
- **Only modify AI documentation files**: Work exclusively within the \`ai/\` folder
- **Do NOT modify implementation code**: This command is for updating features, diagrams, specs, actors, and contexts only
- **Track all changes**: Ensure changed files are tracked in the active session's \`changed_files\` array
- **Use proper formats**: Features use Gherkin in code blocks, Diagrams use react-flow JSON format, Specs use markdown only
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
   - Specs (technical implementation details with diagram references)
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
- **Run tests**: After implementing changes, always run the test suite to verify the implementation works correctly
- **Mark story as completed**: Update the story file's status field to 'completed' when all work is done and tests pass

## Usage

1. Select a story file from ai/tickets/
2. Run this command
3. The AI will call \`get_forge_about\` MCP tool
4. The AI will analyze the story and linked documentation
5. The AI will implement the changes with tests
6. Review and commit the implementation

The implementation will be consistent with your documented design and existing codebase patterns.`;

/**
 * Template for forge-sync.md Cursor command
 */
export const FORGE_SYNC_TEMPLATE = `# Forge Sync

This command synchronizes your Forge AI documentation with your actual codebase. Use this when:
- You've just installed Forge on an existing project with no documentation
- Your codebase has changed and the AI documentation is out of date
- You've manually modified code without updating the design documentation

## Prerequisites

None. This command can be run at any time, with or without an active design session.

## What This Command Does

1. **Calls MCP Tools**: Uses \`get_forge_about\` to understand the Forge workflow and documentation structure
2. **Deep codebase analysis**: Systematically analyzes your entire codebase to understand:
   - Project structure and architecture
   - Component hierarchy and relationships
   - API endpoints and contracts
   - Data models and schemas
   - Business logic and workflows
   - Dependencies and integrations
   - Existing documentation (README, comments, etc.)
3. **Reads existing AI documentation**: Reviews all existing AI files:
   - Features (*.feature.md)
   - Diagrams (*.diagram.md)
   - Specs (*.spec.md)
   - Models (*.model.md)
   - Actors (*.actor.md)
4. **Identifies gaps and inconsistencies**:
   - Missing documentation for existing code
   - Outdated documentation that doesn't match current implementation
   - Undocumented features, APIs, or data structures
   - Inconsistent or conflicting information
5. **Creates or updates AI files**: Systematically updates documentation to reflect reality:
   - Create missing features, diagrams, specs, models
   - Update outdated information
   - Ensure all linkages are correct (feature_id, spec_id, diagram_id, etc.)
   - Maintain proper file structure and naming conventions
6. **Generates a sync report**: Provides summary of changes made

## Sync Strategy

### Phase 1: Discovery
- Scan the entire codebase to map:
  - File structure and organization
  - Key components, services, modules
  - API routes and handlers
  - Database models and schemas
  - Configuration and environment
  - External dependencies

### Phase 2: Analysis
- Compare discovered code with existing AI documentation
- Identify what exists in code but not in docs
- Identify what exists in docs but not in code (potentially obsolete)
- Check for version mismatches and inconsistencies

### Phase 3: Actors & Contexts (Always Editable)
- Create/update **Actors** first (who/what uses the system)
- Create/update **Contexts** for technologies used (AWS, React, Node.js, etc.)
- These are foundational and don't require a session

### Phase 4: Design Documentation (May Require Session)
- Create/update **Features** for user-facing functionality
- Create/update **Diagrams** for architecture visualization
- Create/update **Specs** for technical contracts and APIs
- Create/update **Models** for data structures
- **Note**: If no active session exists, provide recommendations but do not create these files

### Phase 5: Linkages & Validation
- Ensure all cross-references are correct (feature_id, spec_id, diagram_id, model_id)
- Validate frontmatter completeness
- Check for orphaned or unreferenced files
- Verify file naming conventions

## Important Constraints

- **Read the code, don't modify it**: This command ONLY updates AI documentation, never implementation code
- **Be thorough**: Don't skip files or make assumptions; actually read and analyze the code
- **Maintain accuracy**: Documentation must reflect actual implementation, not aspirational design
- **Preserve existing docs**: Update rather than replace when possible; don't lose valuable context
- **Respect Forge patterns**: Use correct file types, formats (Gherkin, react-flow JSON), and frontmatter
- **Session awareness**: Actors and Contexts can be created freely; Features/Diagrams/Specs may require a session

## Output Format

After sync, provide a summary report:

### Created
- List of new AI files created with brief description

### Updated
- List of existing AI files updated with what changed

### Warnings
- Files that need attention (obsolete docs, missing linkages, etc.)

### Recommendations
- Suggestions for design sessions to address major gaps
- Areas that need deeper documentation

## Usage

1. Run this command from the project root
2. The AI will call \`get_forge_about\` MCP tool
3. The AI will systematically analyze your codebase
4. The AI will read and compare existing AI documentation
5. The AI will create or update AI files to match reality
6. Review the sync report and any recommendations
7. Consider starting a design session to address any major architectural changes

This command ensures your Forge documentation stays in sync with your actual implementation.`;

/**
 * Template for forge-scribe.md Cursor command
 */
export const FORGE_SCRIBE_TEMPLATE = `# Forge Scribe

This command distills a completed design session into actionable Stories and Tasks.

## Prerequisites

You must have a session in 'scribe' status before running this command.

## What This Command Does

1. **Calls MCP Tools**: Uses \`get_forge_about\` and \`get_forge_schema\` to understand distillation principles
2. **Analyzes session changes**: Reviews all changed files and their scenario-level modifications
3. **Creates Stories**: Generates implementation stories (< 30 minutes each) for code changes
4. **Creates Tasks**: Generates manual work items for non-code activities
5. **Updates session status**: Transitions session from 'scribe' to 'development'

## When to Use This Command

Run \`forge-scribe\` after:
- Ending a design session (status: 'scribe')
- All design changes have been committed and reviewed
- You're ready to break the design down into implementable work items

## How It Works

The command will:
1. Read the session file at \`ai/sessions/<session-id>/<session-id>.session.md\`
2. Analyze the \`changed_files\` array with scenario-level granularity
3. Review git diffs (if available) to understand precise changes
4. Follow context linkages to gather implementation guidance
5. Create story/task files in \`ai/sessions/<session-id>/tickets/\`
6. Update session status to 'development'

## Intelligent Context Building

**CRITICAL**: Before creating any tickets, you must systematically gather complete context through the following methodical procedure. This ensures tickets are informed by all relevant design artifacts, technical guidance, and architectural understanding.

### Phase 1: Feature and Spec Discovery
1. **Read all changed features and specs**
   - Read each file listed in the session's \`changed_files\` array
   - Pay special attention to \`*.feature.md\` and \`*.spec.md\` files

### Phase 2: Spec Linkage Discovery
1. **Follow feature-to-spec relationships**
   - For each modified \`*.feature.md\` file, examine the \`spec_id\` property
   - Read all specs referenced in the \`spec_id\` array
   - This ensures you understand the technical implementation behind each feature
   
2. **Cross-reference bidirectionally**
   - Also check if any specs reference the modified features in their \`feature_id\` property
   - Capture the complete bidirectional relationship graph

### Phase 3: Architectural Understanding
1. **Read all diagram files**
   - Examine every diagram file referenced in modified specs
   - Understand:
     - System architecture
     - Component relationships
     - Data flow
     - Integration points
     - Sequence diagrams for complex interactions
   
2. **Synthesize architectural context**
   - Build a mental model of how components interact
   - Identify integration boundaries
   - Understand dependencies between stories

### Phase 4: Synthesis and Validation
1. **Build complete context map**
   - Combine all gathered context into a comprehensive understanding
   - Map relationships between features and specs
   - Identify potential story dependencies
   
2. **Validate coverage**
   - Ensure every changed file has been analyzed
   - Confirm all \`spec_id\` linkages have been followed
   - Verify all diagram files have been analyzed

### Context Building Checklist

Before creating tickets, verify:
- [ ] All \`spec_id\` linkages followed
- [ ] All diagram files analyzed
- [ ] Complete architectural understanding achieved
- [ ] Context map synthesized

**Only after completing this methodical context gathering should you proceed to create tickets.** This ensures every story and task is informed by complete, accurate context and technical guidance.

## Story vs Task Decision

**Create Stories (*.story.md)** for:
- Code implementations
- New features or feature modifications
- Technical debt improvements
- Refactoring work
- API changes
- Database migrations

**Create Tasks (*.task.md)** for:
- Manual configuration in external systems
- Third-party service setup (AWS, Stripe, etc.)
- Documentation updates outside code
- Manual testing procedures
- DevOps configuration

## Critical Requirements

### 1. Keep Stories Minimal
Each story should take **< 30 minutes** to implement. Break large changes into multiple small stories.

### 2. Complete Context
Each story must include:
- Clear objective
- Acceptance criteria
- File paths involved
- Links to feature_id, spec_id
- Link to session_id

### 3. Sequential Numbering
All stories and tasks must use sequential numbering in their filenames to indicate implementation order:

- **Format**: Use three-digit numbers with leading zeros (001-, 002-, 003-, etc.)
- **Sequential dependencies**: Tickets that must be done in order get sequential numbers
- **Parallel work**: Tickets that can be done synchronously (no dependencies) share the same number
- **Example**: 
  - \`001-implement-user-login.story.md\` (must be done first)
  - \`002-add-jwt-validation.story.md\` (depends on 001)
  - \`003-setup-auth0-integration.task.md\` (can be done in parallel with next two)
  - \`003-add-error-handling.story.md\` (can be done in parallel with previous)
  - \`003-update-documentation.task.md\` (can be done in parallel with previous two)
  - \`004-add-logging.story.md\` (depends on 003 tickets being complete)

This numbering system helps track implementation order and identifies opportunities for parallel work.

### 4. Proper File Structure
All tickets go in: \`ai/sessions/<session-id>/tickets/\`

Example structure:
\`\`\`
ai/sessions/
  └── session-123/
      ├── session-123.session.md
      └── tickets/
          ├── 001-implement-user-login.story.md
          ├── 002-setup-auth0-integration.task.md
          ├── 003-add-jwt-validation.story.md
          └── ...
\`\`\`

### 5. Follow Schemas
All files must adhere to:
- Story schema (call \`get_forge_schema story\`)
- Task schema (call \`get_forge_schema task\`)

### 6. Link Everything
Every story/task MUST include:
\`\`\`yaml
session_id: '<session-id>'
feature_id: [] # From changed files
spec_id: [] # From changed files
\`\`\`

## Output Format

After distillation, provide a summary:

### Stories Created
- List of story files with brief description

### Tasks Created
- List of task files with brief description

### Coverage Report
- Which changed files are covered by which stories/tasks
- Ensure 100% coverage (every changed file accounted for)

## Example Usage

1. User ends design session → status changes to 'scribe'
2. User runs \`@forge-scribe\`
3. AI calls \`get_forge_about\` and \`get_forge_schema\`
4. AI reads session file and changed files
5. AI creates 5-10 small stories in \`ai/sessions/<session-id>/tickets/\`
6. AI updates session status to 'development'
7. User can now implement stories using \`@forge-build\`

This command ensures clean, minimal, implementable work items with complete context.`;

/**
 * Map of command paths to their templates
 */
export const COMMAND_TEMPLATES: Record<string, string> = {
  '.cursor/commands/forge-design.md': FORGE_DESIGN_TEMPLATE,
  '.cursor/commands/forge-build.md': FORGE_BUILD_TEMPLATE,
  '.cursor/commands/forge-sync.md': FORGE_SYNC_TEMPLATE,
  '.cursor/commands/forge-scribe.md': FORGE_SCRIBE_TEMPLATE
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

