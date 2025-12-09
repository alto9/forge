// packages/vscode-extension/src/templates/cursorCommands.ts

/**
 * Template for forge.md Cursor command
 * Provides comprehensive Forge workflow guidance, replacing get_forge_about MCP tool
 */
export const FORGE_COMMAND_TEMPLATE = `# Forge

Forge is a session-driven context engineering system for AI-assisted development.

## 1. What is Forge?

Forge helps you design software systematically by:
- **Tracking changes** during design sessions
- **Converting design decisions** into minimal implementation stories
- **Providing complete context** for AI agents to implement changes
- **Following a session-driven workflow** from design to implementation

### Value Proposition

- **Context Engineering**: Build comprehensive context without overload
- **Session-Driven**: Track what changes and why during design work
- **Minimal Stories**: Break work into < 30 minute implementation stories
- **Complete Linkage**: Connect features, specs, diagrams, and code seamlessly

## 2. The Forge Workflow

### Phase 1: Start a Design Session

\`\`\`
1. Run "Forge: Start Design Session" command
2. Provide problem statement
3. Session file created in ai/sessions/ with status: design
4. Changed files tracking begins (feature files only)
\`\`\`

**What happens**:
- Session file created: \`ai/sessions/<session-id>/<session-id>.session.md\`
- Status set to \`design\`
- \`changed_files\` array tracks feature modifications at scenario-level
- \`start_commit\` records git SHA for comparison

### Phase 2: Design Changes

During an active session, you update AI documentation:

**TRACKED** (recorded in \`changed_files\`):
- ✅ **Features** (\*.feature.md) - User-facing behavior with Gherkin scenarios

**NOT TRACKED** (always editable):
- ⚪ **Specs** (\*.spec.md) - Technical implementation details
- ⚪ **Diagrams** (\*.diagram.md) - Visual architecture with React Flow
- ⚪ **Actors** (\*.actor.md) - System personas and roles

**Why Only Features?**
Features are **DIRECTIVE** (they drive code changes). Specs and diagrams are **INFORMATIVE** (they explain how to implement). Only tracking features keeps sessions focused while allowing specs to evolve freely.

### Phase 3: Distill Session

\`\`\`
1. End design session (status changes to 'scribe')
2. Run "Forge: Distill Session" command
3. System analyzes changed feature files
4. Follows linkages to discover related specs and diagrams
5. Creates Stories (code work) and Tasks (non-code work)
6. Places them in ai/sessions/<session-id>/tickets/
7. Status changes to 'development'
\`\`\`

**Distillation Magic**:
- Reads all changed feature files
- Follows \`spec_id\` linkages to find related specs
- Follows \`diagram_id\` linkages for architecture context
- Creates minimal stories (< 30 minutes each)
- Ensures complete context without overload

### Phase 4: Build Implementation

\`\`\`
1. Select a story file from ai/sessions/<session-id>/tickets/
2. Run "Forge: Build Story" command
3. AI reads story with complete linked context
4. AI implements the code changes
5. AI writes tests
6. Review and commit
\`\`\`

## 3. File Types and Structure

### Sessions (ai/sessions/)

**Purpose**: Track design work and changes

**File Format**: \`<session-id>.session.md\`

**Structure**:
\`\`\`yaml
---
session_id: unique-session-id
start_time: ISO timestamp
end_time: ISO timestamp (when ended)
status: design | scribe | development
problem_statement: What are we solving?
changed_files:
  - path: ai/features/path/to/feature.feature.md
    change_type: added | modified | removed
    scenarios_added: [list of scenario names]
    scenarios_modified: [list of scenario names]
    scenarios_removed: [list of scenario names]
start_commit: git SHA at session start
---
\`\`\`

**Status Lifecycle**:
- \`design\` → Active session, making changes
- \`scribe\` → Design complete, ready to distill into stories
- \`development\` → Stories created, ready for implementation

### Features (ai/features/)

**Purpose**: Define WHAT users can do (user-facing behavior)

**File Format**: \`<feature-name>.feature.md\`

**Structure**:
\`\`\`yaml
---
feature_id: unique-feature-id
name: Human Readable Name
description: Brief description
spec_id:
  - related-spec-id-1
  - related-spec-id-2
---

\\\`\\\`\\\`gherkin
Scenario: Scenario name
  Given a precondition
  When an action occurs
  Then an expected outcome happens
  And additional assertions
\\\`\\\`\\\`
\`\`\`

**Key Points**:
- **DIRECTIVE**: Features drive code changes
- Uses Gherkin format in code blocks
- Tracked at scenario-level during sessions
- Every features folder should have \`index.md\` with Background and Rules

### Specs (ai/specs/)

**Purpose**: Define HOW features should be implemented (technical contracts)

**File Format**: \`<spec-name>.spec.md\`

**Structure**:
\`\`\`yaml
---
spec_id: unique-spec-id
name: Human Readable Name
description: Brief description
feature_id:
  - related-feature-id-1
diagram_id:
  - related-diagram-id-1
---

# Spec Name

## Overview
High-level technical overview

## Architecture
See [diagram-name](../diagrams/path/diagram.diagram.md)

## Implementation Details
API contracts, data structures, validation rules, constraints

## Technical Requirements
Technologies, versions, dependencies
\`\`\`

**Key Points**:
- **INFORMATIVE**: Specs explain implementation details
- NOT tracked in sessions, always editable
- Links to diagrams for visual architecture
- Contains contracts, not implementation code

### Diagrams (ai/diagrams/)

**Purpose**: Visualize system architecture and flows

**File Format**: \`<diagram-name>.diagram.md\`

**Structure**:
\`\`\`yaml
---
diagram_id: unique-diagram-id
name: Human Readable Name
description: What the diagram shows
type: infrastructure | components | flows | states
spec_id:
  - related-spec-id-1
feature_id:
  - related-feature-id-1
---

# Diagram Name

Brief description

\\\`\\\`\\\`json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "default",
      "position": { "x": 100, "y": 100 },
      "data": { "label": "Component", "description": "Details" }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "label": "Connection",
      "type": "smoothstep"
    }
  ]
}
\\\`\\\`\\\`
\`\`\`

**Key Points**:
- Uses React Flow JSON format
- NOT tracked in sessions
- Types: infrastructure, components, flows, states
- Keep visual, avoid pseudocode

### Actors (ai/actors/)

**Purpose**: Define who/what interacts with the system

**File Format**: \`<actor-name>.actor.md\`

**Structure**:
\`\`\`yaml
---
actor_id: unique-actor-id
name: Human Readable Name
type: user | system | external
description: Brief description
---

# Actor Name

## Overview
Who/what this actor is

## Responsibilities
- What they do
- Actions they take

## Characteristics
- Key attributes
- Permissions/access levels
\`\`\`

**Key Points**:
- NOT tracked in sessions, always editable
- Describes system users and external systems
- Informs feature design and UX decisions

### Tickets (ai/sessions/<session-id>/tickets/)

**Purpose**: Implementation work items generated from sessions

**File Formats**:
- \`<number>-<name>.story.md\` - Code implementation (< 30 minutes)
- \`<number>-<name>.task.md\` - Manual/external work

**Story Structure**:
\`\`\`yaml
---
story_id: unique-story-id
session_id: parent-session-id
feature_id:
  - related-feature-id
spec_id:
  - related-spec-id
status: pending | in_progress | completed
---

# Story Title

## Objective
Clear goal

## Context
Why this matters

## Files to Modify
- path/to/file.ts

## Implementation Steps
1. Step one
2. Step two

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Estimated Time
< 30 minutes
\`\`\`

## 4. Key Principles

### Gherkin Format

All Gherkin MUST use code blocks:

\`\`\`gherkin
Feature: Feature Name

Scenario: Scenario Name
  Given a precondition
  When an action occurs
  Then an expected outcome happens
\`\`\`

**Why?** Consistent formatting, syntax highlighting, clear structure.

### Minimal Stories

- **Each story < 30 minutes** to implement
- **Break complex changes** into multiple small stories
- **One focused change** per story
- **Clear acceptance criteria** for verification

**Example**:
❌ "Implement user authentication" (too big)
✅ "Add login API endpoint" (15 min)
✅ "Add password validation logic" (20 min)
✅ "Create login UI component" (25 min)

### Nestable Structure

- **All folders are nestable** to group related concepts
- **Features folders have index.md** with Background and Rules
- **index.md never shows** in tree views
- **Nesting reflects** logical relationships

**Example**:
\`\`\`
ai/features/
  └── authentication/
      ├── index.md (Background, Rules)
      ├── login.feature.md
      ├── logout.feature.md
      └── password-reset/
          ├── index.md
          ├── request-reset.feature.md
          └── confirm-reset.feature.md
\`\`\`

### Complete Context

- **Stories link** to features, specs, diagrams
- **Distillation follows** all linkages to gather context
- **Context building** ensures nothing is missed
- **No overload** - only relevant context included

## 5. When to Create Stories vs Tasks

### Create Stories (*.story.md) When:

✅ **Code implementations**
- Writing or modifying application code
- Adding new features or endpoints
- Refactoring existing code
- Fixing bugs in codebase

✅ **Testable work**
- Changes are verifiable through tests
- Implementation can be validated
- Takes < 30 minutes to complete

✅ **Within codebase**
- Work happens in version-controlled code
- Changes committed to git
- Affects application functionality

### Create Tasks (*.task.md) When:

📋 **Manual work**
- Configuration in external systems
- Third-party service setup (AWS, Auth0, Stripe)
- Manual testing procedures
- Documentation outside codebase

📋 **Coordination required**
- Human decision-making needed
- External approvals or reviews
- Research or investigation
- DevOps configuration

📋 **Non-code activities**
- README updates
- Wiki documentation
- Process changes
- Manual data migrations

## 6. The Linkage System

### How Files Link Together

\`\`\`
Features ←→ Specs ←→ Diagrams
   ↓           ↓
Stories     Stories
\`\`\`

**Linkage Fields**:
- \`feature_id\` - Links features to specs and stories
- \`spec_id\` - Links specs to features, diagrams, and stories
- \`diagram_id\` - Links diagrams to specs

**Bidirectional**:
- Features reference specs (\`spec_id: []\`)
- Specs reference features (\`feature_id: []\`)
- Both directions work for context gathering

### Context Gathering Process

When distilling a session:

1. **Start with changed features**
   - Read all modified feature files
   - Understand what behavior changed

2. **Follow feature_id → spec_id**
   - For each feature, find linked specs
   - Understand technical implementation details

3. **Follow spec_id → diagram_id**
   - For each spec, find linked diagrams
   - Understand architecture and visual context

4. **Include all discovered context**
   - Stories get complete context from chain
   - No manual hunting for related files

5. **Ensure complete picture**
   - Nothing missed through systematic linkage
   - No context overload, only relevant info

**Example**:
\`\`\`
Feature: user-login.feature.md
  spec_id: [authentication-api]
  
Spec: authentication-api.spec.md
  feature_id: [user-login]
  diagram_id: [auth-flow]
  
Diagram: auth-flow.diagram.md
  spec_id: [authentication-api]

Story: 001-implement-login-endpoint.story.md
  feature_id: [user-login]
  spec_id: [authentication-api]
  // Gets complete context from feature + spec + diagram
\`\`\`

## 7. Session Status Management

### Session Statuses

| Status | Meaning | Actions Available |
|--------|---------|------------------|
| \`design\` | Active design session | Edit features, specs, diagrams |
| \`scribe\` | Design complete | Ready to distill into stories |
| \`development\` | Stories created | Implement stories with /forge-build |

### Status Transitions

\`\`\`
[Start Session] → design
      ↓
[End Session] → scribe
      ↓
[Distill Session] → development
      ↓
[Implement Stories] → (back to design for new session)
\`\`\`

### Status Rules

**design status**:
- Features can be edited (tracked in changed_files)
- Specs/diagrams/actors always editable (not tracked)
- Session file shows status: design

**scribe status**:
- Design work complete
- Ready for distillation
- Run "Forge: Distill Session" command
- System creates stories and tasks

**development status**:
- Stories created in ai/sessions/<session-id>/tickets/
- Ready for implementation
- Use "Forge: Build Story" command
- Implement, test, commit, repeat

## Usage Patterns

### Combined with other commands

\`\`\`
/forge /forge-design
# Provides complete workflow context + design guidance

/forge /forge-build <story-file>
# Provides complete workflow context + build guidance

/forge /forge-scribe <session-id>
# Provides complete workflow context + distillation guidance
\`\`\`

### When to use /forge

Use \`/forge\` when you need to understand:
- The complete Forge workflow
- How sessions work
- File types and their purposes
- How to structure documentation
- The linkage system
- When to create stories vs tasks

This command provides foundational context that other Forge commands build upon.`;

/**
 * Template for forge-design.md Cursor command
 */
export const FORGE_DESIGN_TEMPLATE = `# Forge Design

This command guides AI agents when working within Forge design sessions to update documentation.

## Prerequisites

You must have an active design session before making changes to AI documentation.

## What This Command Does

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
- **Do NOT modify implementation code**: This command is for updating features, diagrams, specs, actors only
- **Track all changes**: Ensure changed files are tracked in the active session's \`changed_files\` array
- **Use proper formats**: Features use Gherkin in code blocks, Diagrams use react-flow JSON format, Specs use markdown only
- **No MCP tools needed**: All schemas and guidance are embedded in this command - completely self-contained

## Usage

1. Ensure you have an active design session
2. Run this command
3. The AI will use embedded schemas to understand file formats
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
2. Run this command
3. The AI will analyze the story and linked documentation
4. The AI will implement the changes with tests
5. Review and commit the implementation

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

1. **Deep codebase analysis**: Systematically analyzes your entire codebase to understand:
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
   - Models (*.model.md)
   - Actors (*.actor.md)
3. **Identifies gaps and inconsistencies**:
   - Missing documentation for existing code
   - Outdated documentation that doesn't match current implementation
   - Undocumented features, APIs, or data structures
   - Inconsistent or conflicting information
4. **Creates or updates AI files**: Systematically updates documentation to reflect reality:
   - Create missing features, diagrams, specs, models
   - Update outdated information
   - Ensure all linkages are correct (feature_id, spec_id, diagram_id, etc.)
   - Maintain proper file structure and naming conventions
5. **Generates a sync report**: Provides summary of changes made

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
2. The AI will systematically analyze your codebase
3. The AI will read and compare existing AI documentation
4. The AI will create or update AI files to match reality
5. Review the sync report and any recommendations
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

