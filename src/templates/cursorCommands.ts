// packages/vscode-extension/src/templates/cursorCommands.ts

/**
 * Template for forge.md Cursor command
 * Introduces AI agents to the Forge documentation system
 */
export const FORGE_COMMAND_TEMPLATE = `# Forge

Forge is a session-driven context engineering system for AI-assisted development. This command introduces you to the Forge documentation system and how its elements work together.

## What is Forge?

Forge helps you design software systematically by tracking design changes during sessions and converting them into minimal implementation stories with complete context.

## Documentation Elements

### Sessions (ai/sessions/)

**Purpose**: Track design work and changes over time

Sessions are the only time-bound element in Forge. They capture:
- What problem is being solved
- Which features changed during the session
- The progression from design → scribe → development

**Status Lifecycle**:
- \`design\` - Active session, making design changes
- \`scribe\` - Design complete, ready to distill into stories
- \`development\` - Stories created, ready for implementation

### Features (ai/features/)

**Purpose**: Define WHAT users can do (user-facing behavior)

Features describe user-facing functionality using Gherkin scenarios. They are **DIRECTIVE** - they drive code changes and are tracked during design sessions.

**Key Characteristics**:
- Uses Gherkin format in code blocks
- Tracked at scenario-level during sessions
- Links to specs via \`spec_id\` field
- Folders can have \`index.md\` with Background and Rules

### Specs (ai/specs/)

**Purpose**: Define HOW features should be implemented (technical contracts)

Specs describe technical implementation details, API contracts, data structures, and validation rules. They are **INFORMATIVE** - they explain how to implement features.

**Key Characteristics**:
- NOT tracked in sessions (always editable)
- Links to features via \`feature_id\` field
- Links to diagrams via \`diagram_id\` field
- Contains contracts, not implementation code

### Diagrams (ai/diagrams/)

**Purpose**: Visualize system architecture and workflows

Diagrams provide visual representation of system structure using React Flow JSON format. They support both technical implementations and user workflows.

**Key Characteristics**:
- Uses React Flow JSON format
- Types: infrastructure, components, flows, states
- NOT tracked in sessions (always editable)
- Links to specs via \`spec_id\` field
- Links to features via \`feature_id\` field

### Actors (ai/actors/)

**Purpose**: Define who/what interacts with the system

Actors describe system users, external systems, and other entities that interact with the system.

**Key Characteristics**:
- Types: user, system, external
- NOT tracked in sessions (always editable)
- Informs feature design and UX decisions

### Tickets (ai/sessions/<session-id>/tickets/)

**Purpose**: Implementation work items generated from sessions

Tickets are created during session distillation:
- **Stories** (*.story.md) - Code implementation work (< 30 minutes each)
- **Tasks** (*.task.md) - Manual/external work

## How the System Works

### The Linkage System

Files link together through ID references:
- Features link to Specs (\`spec_id\`)
- Specs link to Features (\`feature_id\`) and Diagrams (\`diagram_id\`)
- Diagrams link to Specs (\`spec_id\`) and Features (\`feature_id\`)
- Tickets link to Features (\`feature_id\`) and Specs (\`spec_id\`)

These linkages enable systematic context gathering - when working with a feature, you can follow links to discover all related specs and diagrams.

### Session-Driven Workflow

1. **Design**: Create/modify features during a design session
2. **Scribe**: Distill changed features into stories and tasks
3. **Development**: Implement stories using linked documentation

Only features are tracked during sessions. Specs, diagrams, and actors are always editable and evolve independently.

## Key Principles

- **Timeless Documentation**: All documents (except sessions) describe the ideal state, not changes or decisions
- **Complete Context**: Linkages ensure all related documentation is discoverable
- **Minimal Stories**: Each story should take < 30 minutes to implement
- **Nestable Structure**: Folders can be nested to group related concepts

## When to Use This Command

Use \`/forge\` when you need to understand:
- What Forge is and how it works
- The purpose of each documentation element
- How the linkage system enables context gathering
- The session-driven workflow

For detailed schemas and implementation guidance, use \`/forge-design\`.`;

/**
 * Template for forge-design.md Cursor command
 */
export const FORGE_DESIGN_TEMPLATE = `# Forge Design

This command guides AI agents when working within Forge design sessions to update documentation.

## Prerequisites

If you're not familiar with Forge, run \`/forge\` first to understand the documentation system.

You must have an active design session before making changes to AI documentation.

## What This Command Does

1. **Provides complete schema information**: All document schemas embedded below
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

**Example**:
\`\`\`markdown
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

**Example**:
\`\`\`markdown
---
feature_id: user-login
name: User Login
description: Users can authenticate with email and password
spec_id:
  - authentication-api
---

# User Login

\\\`\\\`\\\`gherkin
Scenario: Successful login with valid credentials
  Given a registered user with email "user@example.com"
  And the password is "SecurePass123"
  When they submit the login form
  Then they should be redirected to the dashboard
  And they should have an active session token
\\\`\\\`\\\`

\\\`\\\`\\\`gherkin
Scenario: Failed login with invalid password
  Given a registered user with email "user@example.com"
  And the password is incorrect
  When they submit the login form
  Then they should see an error message "Invalid credentials"
  And they should remain on the login page
\\\`\\\`\\\`
\`\`\`

**Index Files**: Features folders should have \`index.md\` with Background and Rules:
\`\`\`markdown
---
folder_id: feature-group-id
name: Feature Group Name
description: Description of feature group
---

# Feature Group Name

## Background

\\\`\\\`\\\`gherkin
Background: Shared context for all features
  Given some common precondition
  And another shared setup
  When using these features
  Then they all operate within this context
\\\`\\\`\\\`

## Rules

\\\`\\\`\\\`gherkin
Rule: Shared rule for feature group
  Given a condition
  When something happens
  Then this rule applies to all features
\\\`\\\`\\\`
\`\`\`

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
  - feature-id-2
diagram_id:  # List of related diagrams (optional)
  - diagram-id-1
  - diagram-id-2
---
\`\`\`

**Content Structure**:
\`\`\`markdown
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
\`\`\`

**Example**:
\`\`\`markdown
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
\\\`\\\`\\\`json
{
  "email": "string",
  "password": "string"
}
\\\`\\\`\\\`

Response (200):
\\\`\\\`\\\`json
{
  "token": "jwt-token-string",
  "userId": "user-id",
  "expiresAt": "2024-12-31T23:59:59Z"
}
\\\`\\\`\\\`

Response (401):
\\\`\\\`\\\`json
{
  "error": "Invalid credentials"
}
\\\`\\\`\\\`

## Technical Requirements
- Node.js >=22.14.0
- jsonwebtoken library
- bcrypt for password hashing
- Token expiration: 24 hours
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

**Content Structure**:
\`\`\`markdown
# Diagram Name

Brief description of the diagram's purpose.

\\\`\\\`\\\`json
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
\\\`\\\`\\\`

## Diagram Notes

Additional context, explanations, or important details about the diagram.
\`\`\`

**Example**:
\`\`\`markdown
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

\\\`\\\`\\\`json
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
    }
  ]
}
\\\`\\\`\\\`

## Flow Steps

1. Client submits credentials to API
2. API forwards to Auth Service
3. Auth Service validates and generates token
4. Token returned to client
\`\`\`

### Session Schema (*.session.md)

**Purpose**: Track design work and changes over time

**File Naming**: \`<session-id>.session.md\` (kebab-case)

**Location**: \`ai/sessions/<session-id>/\` (nested structure)

**Frontmatter**:
\`\`\`yaml
---
session_id: unique-session-id  # kebab-case, matches filename
start_time: 2024-01-15T10:30:00Z  # ISO 8601 timestamp
end_time: 2024-01-15T14:00:00Z | null  # ISO 8601 timestamp or null if active
status: design | scribe | development | completed  # Session status
problem_statement: Brief description of what we're solving
changed_files: []  # Array of FeatureChangeEntry objects (feature files only)
github_issue:  # Optional GitHub issue reference
  url: "https://github.com/owner/repo/issues/123"
  number: 123
  title: "Issue title"
---
\`\`\`

**Content Structure**:
\`\`\`markdown
# Session Title

## Problem Statement

(Description of what we're solving)

## Goals

(What we aim to achieve)

## Approach

(How we're tackling the problem)

## Key Decisions

(Important decisions made during the session)

## Notes

(Additional context, concerns, or considerations)
\`\`\`

**Example**:
\`\`\`markdown
---
session_id: add-user-authentication
start_time: 2024-01-15T10:30:00Z
end_time: null
status: design
problem_statement: Add secure user authentication to the application
changed_files: []
github_issue:
  url: "https://github.com/owner/repo/issues/42"
  number: 42
  title: "Implement user authentication system"
---

# Add User Authentication

## Problem Statement

Users need a secure way to authenticate and access protected resources.

## Goals

- Implement JWT-based authentication
- Support email/password login
- Add session management

## Approach

Using JWT tokens with 24-hour expiration, bcrypt for password hashing.

## Key Decisions

- Chose JWT over session-based auth for stateless API
- 24-hour token expiration for security

## Notes

Will need to add refresh token support in future iteration.
\`\`\`

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

## The Linkage System

### How Files Link Together

Files connect through ID references in their frontmatter:

\`\`\`
Features ←→ Specs ←→ Diagrams
   ↓           ↓
Tickets     Tickets
\`\`\`

**Linkage Fields**:
- \`feature_id\` - Links features to specs and tickets
- \`spec_id\` - Links specs to features, diagrams, and tickets
- \`diagram_id\` - Links diagrams to specs

**Bidirectional Relationships**:
- Features reference specs (\`spec_id: []\`)
- Specs reference features (\`feature_id: []\`)
- Both directions work for context gathering

**Multiple Relationships**:
- Multiple diagram objects can share the same spec if it makes sense
- A diagram can link to multiple specs
- A spec can link to multiple diagrams
- Relationships are not mutually exclusive

### Context Gathering Process

When following linkages:

1. **Start with a feature or spec**
2. **Follow \`spec_id\` or \`feature_id\`** to discover related files
3. **Follow \`diagram_id\`** to find visual architecture
4. **Build complete context** by following all linkages
5. **Ensure nothing is missed** through systematic traversal

**Example**:
\`\`\`
Feature: user-login.feature.md
  spec_id: [authentication-api]
  
Spec: authentication-api.spec.md
  feature_id: [user-login]
  diagram_id: [auth-flow, api-architecture]
  
Diagram: auth-flow.diagram.md
  spec_id: [authentication-api]
  
Diagram: api-architecture.diagram.md
  spec_id: [authentication-api, user-management-api]
\`\`\`

## Diagram-First Approach

### Create Diagrams Before Specs

**CRITICAL**: When designing new functionality, create diagrams first, then derive specs from diagram objects.

**Workflow**:
1. **Create diagrams** that visualize:
   - Technical implementations (infrastructure, components)
   - User workflows (flows, states)
2. **Analyze diagram objects** (nodes, edges, components)
3. **Create specs** based on what the diagrams show
4. **Link specs to diagrams** via \`diagram_id\`

### Diagram Types

Diagrams should support both:
- **Technical implementations**: Infrastructure, components, system architecture
- **User workflows**: Flows, states, user journeys

**Types**:
- \`infrastructure\` - System infrastructure and deployment
- \`components\` - Component architecture and relationships
- \`flows\` - Process flows and user workflows
- \`states\` - State machines and state transitions

### Spec Creation from Diagrams

When creating specs based on diagrams:
- **Identify diagram objects** that need technical contracts
- **Group related objects** into logical specs
- **Multiple diagram objects can share a spec** if they represent the same technical concept
- **Prefer specs that reflect diagram structure** rather than arbitrary groupings

**Example**: If a diagram shows "API Gateway → Auth Service → Database", create specs for:
- API Gateway contract (based on API Gateway node)
- Auth Service contract (based on Auth Service node)
- Database schema (based on Database node)

These specs link back to the diagram via \`diagram_id\`.

## Timeless Documentation

**CRITICAL**: All Forge documents (except sessions) must describe the **ideal state**, not changes or decisions.

**Do NOT**:
- ❌ Describe what changed or why
- ❌ Reference specific decisions or alternatives considered
- ❌ Use language like "we decided to..." or "changed from X to Y"
- ❌ Include timestamps or version history
- ❌ Describe implementation status

**DO**:
- ✅ Describe what the system IS
- ✅ Describe how it SHOULD work
- ✅ Use present tense ("The system authenticates users...")
- ✅ Focus on the ideal, complete state
- ✅ Write as if the system already exists perfectly

**Example**:

❌ **Bad**: "We decided to use JWT tokens for authentication. This replaced the previous session-based approach."

✅ **Good**: "The system authenticates users using JWT tokens. Tokens are issued upon successful login and included in subsequent requests."

Sessions are the only exception - they track changes over time. All other documentation is timeless.

## Intelligent Linkage and Grouping

When working with Forge documentation:

- **Analyze folder structure**: Examine existing \`ai/\` subfolder structure to understand grouping patterns
- **Follow existing patterns**: Contribute to existing patterns rather than creating arbitrary structures
- **Respect nesting**: Folder nesting reflects logical relationships
- **Utilize linkages effectively**: Use all element linkages to build complete context
- **Group logically**: Place related files together in nested folders
- **Maintain consistency**: Follow established organizational patterns

## Important Constraints

- **This is a Forge design session**: You are working within a structured design workflow
- **Only modify AI documentation files**: Work exclusively within the \`ai/\` folder
- **Do NOT modify implementation code**: This command is for updating features, diagrams, specs, actors only
- **Track all changes**: Ensure changed files are tracked in the active session's \`changed_files\` array (features only)
- **Use proper formats**: Features use Gherkin in code blocks, Diagrams use react-flow JSON format, Specs use markdown only
- **Timeless documentation**: Write about ideal state, not changes or decisions
- **Diagram-first**: Create diagrams before specs, derive specs from diagram objects
- **Follow linkages**: Use the linkage system to discover related documentation

## Usage

1. Run \`/forge\` if you need to understand the Forge system
2. Ensure you have an active design session
3. Run this command
4. Use embedded schemas to understand file formats
5. Analyze existing AI documentation
6. Update documentation following diagram-first approach and timeless principles
7. Track all feature changes in the active session

The documentation updates will be consistent with your existing design patterns and the Forge workflow.`;

/**
 * Template for forge-build.md Cursor command
 */
export const FORGE_BUILD_TEMPLATE = `# Forge Build

This command helps you implement a Forge story by analyzing both the codebase and AI documentation.

## Prerequisites

If you're not familiar with Forge, run \`/forge\` first to understand the documentation system.

You must provide a story file (*.story.md) when running this command.

## What This Command Does

1. **Reads the story file**: Understands what needs to be implemented
2. **Reads all linked AI documentation**: Follows linkages to gather complete context:
   - Features (expected behavior with Gherkin scenarios)
   - Specs (technical implementation details with diagram references)
   - Diagrams (visual architecture)
   - Actors (system personas)
3. **Reads the session**: Understands the session context from \`ai/sessions/<session-id>/<session-id>.session.md\`
4. **Analyzes the existing codebase**: Understands current implementation patterns and structure
5. **Implements the changes**: Writes actual code as described in the story
6. **Runs linting**: Seeks out and runs lint packages after each change
7. **Runs tests**: Seeks out and runs test packages after each change
8. **Marks story complete**: Updates story status to 'completed' when all work is done and tests pass

## Important Guidelines

- **Follow the story**: Implement exactly what the story describes (< 30 minutes of work)
- **Read all linked documentation**: Follow \`feature_id\` and \`spec_id\` linkages to gather complete context
- **Read the session**: Understand the problem statement and session context
- **Use AI documentation as reference**: Features and specs define the intended behavior
- **Match existing patterns**: Follow the codebase's existing architecture and conventions
- **Write tests**: Include unit tests as specified in the story
- **Run linting**: After each change, seek out lint packages (ESLint, Prettier, etc.) and run them
- **Run tests**: After each change, seek out test packages (Jest, Vitest, etc.) and run them
- **Stay focused**: If the story is too large, break it into smaller stories
- **Mark story as completed**: Update the story file's status field to 'completed' when all work is done and all tests pass

## Usage

1. Select a story file from \`ai/sessions/<session-id>/tickets/\`
2. Run this command
3. The AI will read the story, linked documentation, and session
4. The AI will implement the changes with tests
5. The AI will run linting and tests after each change
6. The AI will mark the story as completed when done
7. Review and commit the implementation

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

If you're not familiar with Forge, run \`/forge\` first to understand the documentation system.

If you need to understand file schemas, run \`/forge-design\` to see complete schemas for all document types.

## What This Command Does

1. **Examines the codebase fully**: Systematically analyzes your entire codebase to understand:
   - Project structure and architecture
   - Component hierarchy and relationships
   - API endpoints and contracts
   - Data models and schemas
   - Business logic and workflows
   - Dependencies and integrations
   - Existing documentation (README, comments, etc.)

2. **Reads existing AI documentation**: Reviews all existing AI files:
   - Features (*.feature.md)
   - Diagrams (*.diagram.md)
   - Specs (*.spec.md)
   - Actors (*.actor.md)

3. **Represents the codebase**:
   - **Technically**: With diagrams and specs
   - **Behaviorally**: With actors and features

4. **Generates documentation**:
   - **Technical diagrams**: Infrastructure, components, flows, states
   - **Workflow diagrams**: User flows and process flows
   - **Specs**: Technical contracts based on diagram objects
   - **Actors**: System users and external systems
   - **Features**: User-facing behavior with Gherkin scenarios

5. **Ensures proper linkages**: Links all generated files using the linkage system

## Sync Strategy

### Phase 1: Codebase Analysis
- Scan the entire codebase systematically
- Map file structure and organization
- Identify key components, services, modules
- Discover API routes and handlers
- Understand data models and schemas
- Analyze business logic and workflows

### Phase 2: Technical Representation
- **Create diagrams** that visualize:
  - Infrastructure and deployment architecture
  - Component relationships and interactions
  - Technical flows and data flows
- **Create specs** based on diagram objects:
  - API contracts from API components
  - Data structures from data components
  - Service contracts from service components

### Phase 3: Behavioral Representation
- **Create actors** for:
  - System users (from authentication/user code)
  - External systems (from integration code)
  - System services (from service code)
- **Create features** for:
  - User-facing functionality (from UI/API endpoints)
  - User workflows (from flow analysis)
  - Business processes (from business logic)

### Phase 4: Linkages
- Link features to specs via \`spec_id\`
- Link specs to diagrams via \`diagram_id\`
- Link diagrams to specs via \`spec_id\`
- Link features to actors (implicitly through behavior)
- Ensure bidirectional relationships where appropriate

## Important Constraints

- **Read the code, don't modify it**: This command ONLY updates AI documentation, never implementation code
- **Be thorough**: Don't skip files or make assumptions; actually read and analyze the code
- **Timeless documentation**: Write about ideal state, not changes or decisions
- **Diagram-first**: Create diagrams before specs, derive specs from diagram objects
- **Respect Forge patterns**: Use correct file types, formats (Gherkin, react-flow JSON), and frontmatter
- **Complete representation**: Ensure both technical (diagrams/specs) and behavioral (actors/features) aspects are covered

## Output Format

After sync, provide a summary report:

### Created
- List of new AI files created with brief description
- Organized by type (diagrams, specs, actors, features)

### Updated
- List of existing AI files updated with what changed

### Linkages
- Summary of linkages created between files

### Recommendations
- Areas that may need deeper documentation
- Suggestions for design sessions if major gaps exist

## Usage

1. Run \`/forge\` if needed to understand the system
2. Run \`/forge-design\` if needed to understand schemas
3. Run this command from the project root
4. The AI will systematically analyze your codebase
5. The AI will generate technical and workflow diagrams, actors, features, and specs
6. Review the sync report and verify linkages

This command ensures your Forge documentation accurately represents your codebase.`;

/**
 * Template for forge-scribe.md Cursor command
 */
export const FORGE_SCRIBE_TEMPLATE = `# Forge Scribe

This command distills a completed design session into actionable Stories and Tasks.

## Prerequisites

If you're not familiar with Forge, run \`/forge\` first to understand the documentation system.

You must have a session in 'scribe' status before running this command.

## Finding the Session

1. **Seek out the open design session** in Scribe mode in the current project
2. **Look for session files** in \`ai/sessions/\` with status: 'scribe'
3. **Or use the session name** if provided by the user in the prompt
4. **Read the session file** at \`ai/sessions/<session-id>/<session-id>.session.md\`

## What This Command Does

1. **Analyzes session changes**: Reviews all changed files and their scenario-level modifications
2. **Creates Stories**: Generates implementation stories (< 30 minutes each) for code changes
3. **Creates Tasks**: Generates manual work items for non-code activities
4. **Updates session status**: Transitions session from 'scribe' to 'development'

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
- Story schema (see \`/forge-design\` command for complete schema)
- Task schema (see \`/forge-design\` command for complete schema)

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
3. AI reads session file and changed files
4. AI creates 5-10 small stories in \`ai/sessions/<session-id>/tickets/\`
6. AI updates session status to 'development'
7. User can now implement stories using \`@forge-build\`

This command ensures clean, minimal, implementable work items with complete context.`;

/**
 * Map of command paths to their templates
 */
export const COMMAND_TEMPLATES: Record<string, string> = {
  '.cursor/commands/forge.md': FORGE_COMMAND_TEMPLATE,
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

