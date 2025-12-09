---
spec_id: forge-design-enhanced
name: Enhanced /forge-design Command with Embedded Schemas
description: Technical specification for embedding document schemas directly in the /forge-design command
feature_id:
  - cursor-commands-migration
diagram_id: []
---

# Enhanced /forge-design Command with Embedded Schemas

## Overview

The enhanced `/forge-design` command embeds all Forge document schemas directly in the command file, eliminating the need for the `get_forge_schema` MCP tool. This provides a self-contained design guidance experience.

## Command File Details

**Location**: `.cursor/commands/forge-design.md`

**Purpose**: Guide AI agents during design sessions with complete schema information

**Enhancement**: Embed Actor, Feature, Spec, and Diagram schemas inline

## Current State (Before Enhancement)

### Existing Command Structure

```markdown
# Forge Design

## Prerequisites
You must have an active design session before making changes to AI documentation.

## What This Command Does
1. **Calls MCP Tools**: Uses `get_forge_about` to understand the Forge workflow
2. **Checks for active session**: Ensures you're working within a structured design workflow
3. **Reads AI documentation**: Understands existing design patterns
4. **Guides documentation updates**: Helps create or modify features, specs, diagrams, actors
5. **Tracks all changes**: Ensures changed files are tracked in the active session

## File Type Guidance
[Brief descriptions of file types]

## Important Constraints
- This is a Forge design session
- Only modify AI documentation files
- Track all changes
- Use proper formats
```

**Issue**: References MCP tools and lacks detailed schema information

## Enhanced Structure

### New Command Organization

```markdown
# Forge Design

## Prerequisites
You must have an active design session before making changes to AI documentation.

## What This Command Does
1. **Provides complete schema information**: All document schemas embedded below
2. **Checks for active session**: Ensures you're working within a structured design workflow
3. **Reads AI documentation**: Understands existing design patterns
4. **Guides documentation updates**: Helps create or modify features, specs, diagrams, actors
5. **Tracks all changes**: Ensures changed files are tracked in the active session

## Document Schemas

### Actor Schema (*.actor.md)

[Complete Actor schema here]

### Feature Schema (*.feature.md)

[Complete Feature schema here]

### Spec Schema (*.spec.md)

[Complete Spec schema here]

### Diagram Schema (*.diagram.md)

[Complete Diagram schema here]

## File Type Guidance
[Detailed guidance on when to use each file type]

## Important Constraints
- This is a Forge design session
- Only modify AI documentation files
- Track all changes
- Use proper formats
```

## Embedded Schemas

### Actor Schema

```markdown
### Actor Schema (*.actor.md)

**Purpose**: Define system actors and personas

**File Naming**: `<actor-name>.actor.md` (kebab-case)

**Location**: `ai/actors/` (nestable)

**Frontmatter**:
```yaml
---
actor_id: unique-actor-id  # kebab-case, matches filename
name: Human Readable Actor Name
type: user | system | external  # Actor type
description: Brief description of the actor
---
```

**Content Structure**:
```markdown
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
```

**Example**:
```markdown
---
actor_id: authenticated-user
name: Authenticated User
type: user
description: A user who has successfully logged into the system
---

# Authenticated User

## Overview
A user who has completed the authentication process and has an active session.

## Responsibilities
- Access protected resources
- Manage their profile
- Perform authorized actions

## Characteristics
- Has valid session token
- Associated with user account
- Has specific role-based permissions

## Examples
An authenticated user accessing their dashboard or updating their settings.
```
```

### Feature Schema

```markdown
### Feature Schema (*.feature.md)

**Purpose**: Define user-facing behavior with Gherkin scenarios

**File Naming**: `<feature-name>.feature.md` (kebab-case)

**Location**: `ai/features/` (nestable)

**Frontmatter**:
```yaml
---
feature_id: unique-feature-id  # kebab-case, matches filename
name: Human Readable Feature Name
description: Brief description of the feature
spec_id:  # List of related specs (optional)
  - spec-id-1
  - spec-id-2
---
```

**Content Structure**:
- Gherkin scenarios in code blocks (```gherkin)
- Each scenario describes specific behavior
- Use Given/When/Then format

**Example**:
```markdown
---
feature_id: user-login
name: User Login
description: Users can authenticate with email and password
spec_id:
  - authentication-api
---

# User Login

```gherkin
Scenario: Successful login with valid credentials
  Given a registered user with email "user@example.com"
  And the password is "SecurePass123"
  When they submit the login form
  Then they should be redirected to the dashboard
  And they should have an active session token
```

```gherkin
Scenario: Failed login with invalid password
  Given a registered user with email "user@example.com"
  And the password is incorrect
  When they submit the login form
  Then they should see an error message "Invalid credentials"
  And they should remain on the login page
```
```

**Index Files**: Features folders should have `index.md` with Background and Rules:
```markdown
---
folder_id: feature-group-id
name: Feature Group Name
description: Description of feature group
---

# Feature Group Name

## Background

```gherkin
Background: Shared context for all features
  Given some common precondition
  And another shared setup
  When using these features
  Then they all operate within this context
```

## Rules

```gherkin
Rule: Shared rule for feature group
  Given a condition
  When something happens
  Then this rule applies to all features
```
```
```

### Spec Schema

```markdown
### Spec Schema (*.spec.md)

**Purpose**: Define technical implementation details

**File Naming**: `<spec-name>.spec.md` (kebab-case)

**Location**: `ai/specs/` (nestable)

**Frontmatter**:
```yaml
---
spec_id: unique-spec-id  # kebab-case, matches filename
name: Human Readable Spec Name
description: Brief description of the technical specification
feature_id:  # List of related features (optional)
  - feature-id-1
  - feature-id-2
diagram_id:  # List of related diagrams (optional)
  - diagram-id-1
  - diagram-id-2
---
```

**Content Structure**:
```markdown
# Spec Name

## Overview
High-level technical overview

## Architecture
Reference to related diagrams:
See [diagram-name](../diagrams/path/diagram-name.diagram.md) for architecture.

## Implementation Details
Detailed technical specifications, including:
- API contracts
- Data structures
- Validation rules
- Constraints
- Configuration

## Technical Requirements
Required technologies, versions, dependencies

## Best Practices
Implementation guidance and patterns
```

**Example**:
```markdown
---
spec_id: authentication-api
name: Authentication API
description: REST API endpoints for user authentication
feature_id:
  - user-login
  - user-logout
diagram_id:
  - auth-flow
---

# Authentication API

## Overview
REST API for handling user authentication with JWT tokens.

## Architecture
See [auth-flow](../diagrams/auth/auth-flow.diagram.md) for authentication flow.

## Implementation Details

### POST /api/auth/login
Request:
```json
{
  "email": "string",
  "password": "string"
}
```

Response (200):
```json
{
  "token": "jwt-token-string",
  "userId": "user-id",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

Response (401):
```json
{
  "error": "Invalid credentials"
}
```

## Technical Requirements
- Node.js >=22.14.0
- jsonwebtoken library
- bcrypt for password hashing
- Token expiration: 24 hours
```
```

### Diagram Schema

```markdown
### Diagram Schema (*.diagram.md)

**Purpose**: Provide visual architecture using React Flow JSON format

**File Naming**: `<diagram-name>.diagram.md` (kebab-case)

**Location**: `ai/diagrams/` (nestable)

**Frontmatter**:
```yaml
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
```

**Content Structure**:
```markdown
# Diagram Name

Brief description of the diagram's purpose.

```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "default",
      "position": { "x": 100, "y": 100 },
      "data": { 
        "label": "Node Label",
        "description": "Node description"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "label": "Edge label",
      "type": "smoothstep"
    }
  ]
}
```

## Diagram Notes

Additional context, explanations, or important details about the diagram.
```

**Example**:
```markdown
---
diagram_id: auth-flow
name: Authentication Flow
description: Visual representation of user authentication process
type: flows
spec_id:
  - authentication-api
feature_id:
  - user-login
---

# Authentication Flow

This diagram shows the complete flow of user authentication from login request to session establishment.

```json
{
  "nodes": [
    {
      "id": "client",
      "type": "default",
      "position": { "x": 100, "y": 100 },
      "data": { "label": "Client", "description": "Web/Mobile client" }
    },
    {
      "id": "api",
      "type": "default",
      "position": { "x": 300, "y": 100 },
      "data": { "label": "API Gateway", "description": "REST API" }
    },
    {
      "id": "auth",
      "type": "default",
      "position": { "x": 500, "y": 100 },
      "data": { "label": "Auth Service", "description": "Authentication logic" }
    },
    {
      "id": "db",
      "type": "default",
      "position": { "x": 700, "y": 100 },
      "data": { "label": "User DB", "description": "User credentials" }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "client",
      "target": "api",
      "label": "POST /auth/login",
      "type": "smoothstep"
    },
    {
      "id": "e2",
      "source": "api",
      "target": "auth",
      "label": "Validate credentials",
      "type": "smoothstep"
    },
    {
      "id": "e3",
      "source": "auth",
      "target": "db",
      "label": "Query user",
      "type": "smoothstep"
    },
    {
      "id": "e4",
      "source": "db",
      "target": "auth",
      "label": "User data",
      "type": "smoothstep"
    },
    {
      "id": "e5",
      "source": "auth",
      "target": "api",
      "label": "JWT token",
      "type": "smoothstep"
    },
    {
      "id": "e6",
      "source": "api",
      "target": "client",
      "label": "200 + token",
      "type": "smoothstep"
    }
  ]
}
```

## Flow Steps

1. Client submits credentials to API
2. API forwards to Auth Service
3. Auth Service queries User DB
4. DB returns user data
5. Auth Service generates JWT token
6. API returns token to client
```
```

## File Type Guidance Enhancement

The enhanced command includes more detailed guidance on when to use each file type:

### When to Create Features
- Defining new user-facing behavior
- Documenting expected system behavior
- Creating testable scenarios
- Specifying acceptance criteria

### When to Create Specs
- Defining technical implementation
- Documenting API contracts
- Specifying data structures
- Describing configuration requirements

### When to Create Diagrams
- Visualizing system architecture
- Showing component relationships
- Illustrating data flows
- Mapping state transitions

### When to Create Actors
- Defining new system users
- Documenting external systems
- Specifying persona characteristics
- Clarifying role responsibilities

## Implementation Approach

### Template Updates

```typescript
// packages/vscode-extension/src/templates/cursorCommands.ts

export const FORGE_DESIGN_ENHANCED_TEMPLATE = `# Forge Design

## Prerequisites
You must have an active design session before making changes to AI documentation.

## What This Command Does
1. **Provides complete schema information**: All document schemas embedded below
2. **Checks for active session**: Ensures you're working within a structured design workflow
3. **Reads AI documentation**: Understands existing design patterns
4. **Guides documentation updates**: Helps create or modify features, specs, diagrams, actors
5. **Tracks all changes**: Ensures changed files are tracked in the active session

## Document Schemas

${ACTOR_SCHEMA}

${FEATURE_SCHEMA}

${SPEC_SCHEMA}

${DIAGRAM_SCHEMA}

## File Type Guidance

${FILE_TYPE_GUIDANCE}

## Intelligent Linkage and Grouping

${LINKAGE_GUIDANCE}

## Important Constraints
- **This is a Forge design session**: You are working within a structured design workflow
- **Only modify AI documentation files**: Work exclusively within the \`ai/\` folder
- **Do NOT modify implementation code**: This command is for updating features, specs, diagrams, actors only
- **Track all changes**: Ensure changed files are tracked in the active session's \`changed_files\` array
- **Use proper formats**: Features use Gherkin in code blocks, Diagrams use react-flow JSON format
- **No MCP tools needed**: All schemas and guidance are embedded in this command

## Usage
1. Ensure you have an active design session
2. Run this command (optionally with /forge for additional context)
3. The AI will use embedded schemas to understand file formats
4. The AI will analyze existing AI documentation
5. The AI will update documentation in the ai/ folder
6. All changes will be tracked in the active design session
`;

// Schema constant strings
const ACTOR_SCHEMA = `[Actor schema content from above]`;
const FEATURE_SCHEMA = `[Feature schema content from above]`;
const SPEC_SCHEMA = `[Spec schema content from above]`;
const DIAGRAM_SCHEMA = `[Diagram schema content from above]`;
const FILE_TYPE_GUIDANCE = `[Enhanced guidance content]`;
const LINKAGE_GUIDANCE = `[Linkage and grouping guidance]`;
```

### Migration Strategy

1. **Update Template**: Add all four schemas to FORGE_DESIGN_ENHANCED_TEMPLATE
2. **Remove MCP References**: Remove "Calls MCP Tools" from command description
3. **Version Bump**: Increment extension version to trigger hash mismatch
4. **Documentation**: Update README to reflect self-contained design guidance
5. **Testing**: Validate AI agents can use embedded schemas effectively

## Context Size Considerations

### Schema Sizes
- **Actor Schema**: ~500 tokens
- **Feature Schema**: ~800 tokens
- **Spec Schema**: ~700 tokens
- **Diagram Schema**: ~900 tokens
- **Total**: ~2,900 tokens

### Impact Assessment
- Modern AI models handle 100k+ token contexts
- 2,900 tokens is **< 3% of typical context window**
- Negligible impact on context availability
- Self-contained benefit outweighs minor token cost

### Optimization
If context size becomes an issue:
- Compress schema descriptions
- Remove redundant examples
- Use more concise formatting
- Consider dynamic schema loading (future)

## Benefits of Embedded Schemas

1. **Self-Contained**: No external MCP dependencies
2. **Immediate Availability**: Schemas always accessible
3. **Version Consistency**: Schemas match command version
4. **Reduced Latency**: No MCP tool calls required
5. **Simpler Debugging**: Everything visible in one file
6. **Better Reliability**: No network/external failures

## Testing Requirements

### Unit Tests
- Validate schema content completeness
- Verify all required fields documented
- Test example validity

### Integration Tests
- AI agent can create valid files using schemas
- Frontmatter follows schema specifications
- Content structure matches schema guidance

### Manual Validation
- Compare with original get_forge_schema output
- Verify all schema information preserved
- Test with real design sessions

## Migration Checklist

- [ ] Extract schemas from MCP server code
- [ ] Format schemas for markdown embedding
- [ ] Add schemas to FORGE_DESIGN_ENHANCED_TEMPLATE
- [ ] Remove MCP tool references from command
- [ ] Update "What This Command Does" section
- [ ] Add self-contained note to constraints
- [ ] Test with AI agent creating each file type
- [ ] Verify frontmatter validation
- [ ] Update hash in command file
- [ ] Bump extension version
- [ ] Update documentation
- [ ] Release as part of v2.0.0

## Related Specifications

- `forge-command.spec.md` - /forge command specification
- `cursor-commands-management.spec.md` - Command management system
- `monorepo-to-single-package.spec.md` - Repository restructuring

## Related Features

- `cursor-commands-migration.feature.md` - User-facing migration feature

