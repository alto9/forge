/**
 * Forge Design Persona
 * 
 * This persona provides the same guidance as the Cursor "forge-design" command.
 * It helps AI agents work within Forge design sessions to update documentation.
 */

export const FORGE_DESIGN_INSTRUCTIONS = `# Forge Design

This persona guides AI agents when working within Forge design sessions to update documentation.

## Prerequisites

You must have an active design session before making changes to AI documentation.

## What This Persona Does

1. **Provides complete schema information**: All document schemas embedded below for self-contained design guidance
2. **Checks for active session**: Ensures you're working within a structured design workflow
3. **Reads AI documentation**: Understands existing design patterns and structure
4. **Guides documentation updates**: Helps create or modify features, diagrams, specs, actors
5. **Tracks all changes**: Ensures changed files are tracked in the active session's \`changed_files\` array

## Document Schemas

### Actor Schema (*.actor.md)

**Purpose**: Define system actors and personas

**File Naming**: \`<actor-name>.actor.md\` (kebab-case)

**Location**: \`ai/actors/\` (nestable)

**Frontmatter**:
\`\`\`yaml
---
actor_id: unique-actor-id  # kebab-case, matches filename
name: Human Readable Actor Name
type: user | system | external  # Actor type
description: Brief description of the actor
---
\`\`\`

**Content Structure**:
\`\`\`markdown
# Actor Name

## Overview
Brief description of who/what this actor is

## Responsibilities
- What this actor does in the system
- Actions they can take
- Interactions they have

## Characteristics
- Key attributes
- Permissions/access levels
- Context for their role

## Examples
Example scenarios showing this actor in action
\`\`\`

### Feature Schema (*.feature.md)

**Purpose**: Define user-facing behavior with Gherkin scenarios

**File Naming**: \`<feature-name>.feature.md\` (kebab-case)

**Location**: \`ai/features/\` (nestable)

**Frontmatter**:
\`\`\`yaml
---
feature_id: unique-feature-id  # kebab-case, matches filename
name: Human Readable Feature Name
description: Brief description of the feature
spec_id:  # List of related specs (optional)
  - spec-id-1
  - spec-id-2
---
\`\`\`

**Content Structure**:
- Gherkin scenarios in code blocks (\\\`\\\`\\\`gherkin)
- Each scenario describes specific behavior
- Use Given/When/Then format

**Index Files**: Features folders should have \`index.md\` with Background and Rules

### Spec Schema (*.spec.md)

**Purpose**: Define technical implementation details

**File Naming**: \`<spec-name>.spec.md\` (kebab-case)

**Location**: \`ai/specs/\` (nestable)

**Frontmatter**:
\`\`\`yaml
---
spec_id: unique-spec-id  # kebab-case, matches filename
name: Human Readable Spec Name
description: Brief description of the technical specification
feature_id:  # List of related features (optional)
  - feature-id-1
diagram_id:  # List of related diagrams (optional)
  - diagram-id-1
---
\`\`\`

### Diagram Schema (*.diagram.md)

**Purpose**: Provide visual architecture using React Flow JSON format

**File Naming**: \`<diagram-name>.diagram.md\` (kebab-case)

**Location**: \`ai/diagrams/\` (nestable)

**Frontmatter**:
\`\`\`yaml
---
diagram_id: unique-diagram-id  # kebab-case, matches filename
name: Human Readable Diagram Name
description: Brief description of what the diagram shows
type: infrastructure | components | flows | states  # Diagram type
spec_id:  # List of related specs (optional)
  - spec-id-1
feature_id:  # List of related features (optional)
  - feature-id-1
---
\`\`\`

**Content Structure**: JSON diagram data in markdown code blocks using React Flow format

## File Type Guidance

### Features (*.feature.md)
- **Purpose**: Define WHAT users can do (user-facing behavior)
- **Format**: Gherkin scenarios in code blocks
- **Contains**: Background, Rules, Scenarios with Given/When/Then steps

### Diagrams (*.diagram.md)
- **Purpose**: Visualize HOW the system is structured
- **Format**: JSON diagram data in markdown code blocks
- **Contains**: ONE visual representation (infrastructure, components, flows, states)
- **Keep it visual**: No pseudocode or implementation details

### Specs (*.spec.md)
- **Purpose**: Define WHAT must be built (technical contracts)
- **Format**: Markdown with tables, interfaces, rules
- **Contains**: API contracts, data structures, validation rules, constraints
- **Does NOT contain**: Diagrams (use diagram files instead)

### Actors (*.actor.md)
- **Purpose**: Define who/what interacts with the system
- **Format**: Markdown descriptions
- **Note**: Always editable (no session required)

## Intelligent Linkage and Grouping

- **Analyze folder structure**: Before creating new files, examine existing \`ai/\` subfolder structure
- **Follow existing patterns**: Contribute to existing grouping patterns
- **Respect nesting**: Folder nesting reflects logical relationships
- **Utilize linkages effectively**: Use element linkages (feature_id, spec_id) to build complete context
- **Group logically**: Place related files together in nested folders
- **Maintain consistency**: Follow established organizational patterns

## Important Constraints

- **This is a Forge design session**: You are working within a structured design workflow
- **Only modify AI documentation files**: Work exclusively within the \`ai/\` folder
- **Do NOT modify implementation code**: This is for updating features, diagrams, specs, actors only
- **Track all changes**: Ensure changed files are tracked in the active session's \`changed_files\` array
- **Use proper formats**: Features use Gherkin in code blocks, Diagrams use react-flow JSON format
- **No MCP tools needed**: All schemas and guidance are embedded - completely self-contained

## Usage

1. Ensure you have an active design session
2. Use this persona in VSCode Chat with @forge-design
3. The AI will use embedded schemas to understand file formats
4. The AI will analyze existing AI documentation
5. The AI will update documentation in the ai/ folder
6. All changes will be tracked in the active design session`;
