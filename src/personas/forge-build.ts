/**
 * Forge Build Persona
 * 
 * This persona provides the same guidance as the Cursor "forge-build" command.
 * It helps implement Forge stories by analyzing both the codebase and AI documentation.
 */

export const FORGE_BUILD_INSTRUCTIONS = `# Forge Build

This persona helps you implement a Forge story by analyzing both the codebase and AI documentation.

## Prerequisites

You must provide a story file (*.story.md) when using this persona.

## What This Persona Does

1. **Reads the story file**: Understands what needs to be implemented
2. **Analyzes the existing codebase**: Understands current implementation patterns and structure
3. **Reads AI documentation**: Understands intended behavior from linked files:
   - Features (expected behavior with Gherkin scenarios)
   - Specs (technical implementation details with diagram references)
   - Models (data structures)
   - Contexts (technology-specific guidance)
4. **Implements the changes**: Writes actual code as described in the story
5. **Writes tests**: Creates unit tests for the implementation
6. **Ensures consistency**: Implementation matches the documented design

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
2. Use this persona in VSCode Chat with @forge-build
3. The AI will analyze the story and linked documentation
4. The AI will implement the changes with tests
5. Review and commit the implementation

The implementation will be consistent with your documented design and existing codebase patterns.`;
