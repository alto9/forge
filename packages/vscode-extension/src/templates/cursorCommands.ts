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

