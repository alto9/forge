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
4. **Guides documentation updates**: Helps create or modify features, diagrams, specs, models, actors, and contexts
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
- **Format**: Single nomnoml diagram per file
- **Contains**: ONE visual representation (infrastructure, components, flows, states)
- **Example**: "User authentication flow through API gateway to Lambda"
- **Keep it visual**: No pseudocode or implementation details

### Specs (*.spec.md)
- **Purpose**: Define WHAT must be built (technical contracts)
- **Format**: Markdown with tables, interfaces, rules
- **Contains**: API contracts, data structures, validation rules, constraints
- **Does NOT contain**: Diagrams (use diagram files instead), implementation code (use context files)
- **Example**: "Login API endpoint accepts email/password, returns JWT token"

### Models (*.model.md)
- **Purpose**: Define data structures and their properties
- **Format**: Markdown tables with property definitions
- **Contains**: Properties, relationships, validation rules, constraints

### Actors (*.actor.md)
- **Purpose**: Define who/what interacts with the system
- **Format**: Markdown descriptions
- **Contains**: Responsibilities, characteristics, context
- **Note**: Always editable (no session required)

### Contexts (*.context.md)
- **Purpose**: Provide HOW-TO implementation guidance
- **Format**: Gherkin scenarios with technical guidance
- **Contains**: When to use patterns, code examples, best practices
- **Note**: Always editable (no session required)

## Important Constraints

- **This is a Forge design session**: You are working within a structured design workflow
- **Only modify AI documentation files**: Work exclusively within the \`ai/\` folder
- **Do NOT modify implementation code**: This command is for updating features, diagrams, specs, models, actors, and contexts only
- **Track all changes**: Ensure changed files are tracked in the active session's \`changed_files\` array
- **Use proper formats**: Features use Gherkin in code blocks, Diagrams use single nomnoml diagrams, Specs use markdown only
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
   - Contexts (*.context.md)
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
- **Respect Forge patterns**: Use correct file types, formats (Gherkin, nomnoml), and frontmatter
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
 * Map of command paths to their templates
 */
export const COMMAND_TEMPLATES: Record<string, string> = {
  '.cursor/commands/forge-design.md': FORGE_DESIGN_TEMPLATE,
  '.cursor/commands/forge-build.md': FORGE_BUILD_TEMPLATE,
  '.cursor/commands/forge-sync.md': FORGE_SYNC_TEMPLATE
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

