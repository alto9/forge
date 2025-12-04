#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Forge MCP Server
 * Provides context engineering capabilities for Agentic development
 */
class ForgeMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'forge-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_forge_about',
            description: 'Get a comprehensive overview of the Forge workflow, including the session-driven approach, the powerful linkage system for context gathering, when to create Stories vs Tasks, and guidance on implementation. The linkage system is CRITICAL - it shows how to systematically gather complete context by following document relationships (feature_id, spec_id, context_id, diagram_id) and using get_forge_context for technical object types.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_forge_schema',
            description: 'Get the schema specification for a Forge file type (session, feature, spec, diagram, actor, story, task, or context)',
            inputSchema: {
              type: 'object',
              properties: {
                schema_type: {
                  type: 'string',
                  enum: ['session', 'feature', 'spec', 'diagram', 'actor', 'story', 'task', 'context'],
                  description: 'The type of schema to retrieve',
                },
              },
              required: ['schema_type'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'get_forge_about':
          return {
            content: [
              {
                type: 'text',
                text: this.getForgeAbout(),
              },
            ],
          };

        case 'get_forge_schema':
          if (!args || typeof args.schema_type !== 'string') {
            throw new Error('schema_type is required');
          }
          return {
            content: [
              {
                type: 'text',
                text: this.getForgeSchema(args.schema_type),
              },
            ],
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private getForgeAbout(): string {
    return `# Forge - Session-Driven Context Engineering

## Overview
Forge is a comprehensive workflow system for structured context engineering in AI-assisted development. It uses a session-driven approach with explicit status transitions to manage design decisions and convert them into actionable implementation steps.

## Core Philosophy
1. **Accurate Context Without Overload** - Provide exactly what's needed, when it's needed
2. **Features Are Directive** - Features drive code changes and are tracked in sessions at scenario-level; Specs/Diagrams/Actors/Contexts are informative and editable anytime
3. **Session-Driven Design** - Track feature changes made during design sessions with scenario-level granularity
4. **Minimal Story Size** - Keep implementation stories small, focused, and actionable (< 30 minutes each)
5. **Status-Driven Workflow** - Sessions progress through explicit phases: design → scribe → development → completed
6. **Nestable Organization** - Use folder hierarchies to organize related concepts

## File Structure
\`\`\`
your-project/
└── ai/
    ├── sessions/              # Design session tracking (nested structure)
    │   └── <session-id>/
    │       ├── <session-id>.session.md  # Session file inside session folder
    │       └── tickets/       # Stories & Tasks for this session
    │           ├── *.story.md
    │           └── *.task.md
    ├── features/              # Feature definitions with Gherkin (nestable)
    ├── diagrams/              # Visual architecture with react-flow JSON (nestable)
    ├── specs/                 # Technical specifications (nestable)
    ├── actors/                # Actor/persona definitions (nestable)
    ├── contexts/              # Context guidance (nestable)
    └── docs/                  # Supporting documentation
\`\`\`

## Design Document Philosophy

### Directive vs Informative Documents

Forge documents are organized by their role in the workflow:

#### DIRECTIVE DOCUMENTS (Features)
**Features (*.feature.md)** drive code changes and are tracked in sessions:

- **Timeless**: Always represent current desired state
- **Behavior-Driven**: Strictly Gherkin instructions only
- **Tracked in Sessions**: Changes tracked at scenario-level during design sessions
- **Drive Implementation**: Features dictate WHAT code should do
- **Organization is CRITICAL**: Feature folder structure should directly inform automated tests
- **Abstract Logically**: Group features by abstracting large concepts into smaller, focused ones
- **Git Controls History**: Never document "old" or "transitional" states in the file itself

#### INFORMATIVE DOCUMENTS (Specs, Diagrams, Actors, Contexts)
These documents provide context and guidance but are NOT tracked in sessions:

**Specs (*.spec.md)**
- **Timeless**: Always represent most up-to-date business logic and technical information
- **Not Tracked in Sessions**: Always editable, changes not recorded in session files
- **Inform Implementation**: Provide HOW features should be implemented
- **Data Structures**: Can define data structures inline using TypeScript interfaces or tables
- **No Implementation Code**: Only pseudocode for clarity, never real code
- **No Diagrams**: Specs can LINK to diagram files, but don't embed diagrams
- **Contracts**: Commonly used to define contracts between two systems
- **Git Controls History**: Change tracking is Git's responsibility

**Diagrams (*.diagram.md)**
- **Timeless**: Always represent current desired state
- **Not Tracked in Sessions**: Always editable, changes not recorded in session files
- **Visual Architecture**: Show technical implementations or workflows as they should exist NOW
- **No Transitions**: Never show "old way" vs "new way" - just show the current architecture
- **Single Purpose**: One diagram per file representing one aspect of the system
- **React-Flow JSON Format**: Use JSON format with react-flow for visual diagram editing
- **Element-Level Spec Linking**: Individual diagram nodes can link to specs via node.data.spec_id
- **Git Controls History**: Change history is in Git, not in the diagram content

**Actors (*.actor.md)**
- **Always Editable**: Not tracked in sessions, can be modified at any time
- **Define Personas**: Who interacts with the system and their roles

**Contexts (*.context.md)**
- **Always Editable**: Not tracked in sessions, can be modified at any time
- **For Agent Benefit**: Technical guidance when implementing features
- **Patterns & Practices**: Implementation patterns, best practices, technical constraints

#### TRANSITIONAL DOCUMENTS (Sessions, Stories, Tasks)
These documents **capture point-in-time state and workflow**:

**Sessions (*.session.md)**
- **Transitional**: Records what feature scenarios were changed during a specific design session
- **Workflow State**: Tracks progress through design → scribe → development → completed
- **Changed Files**: Contains snapshot of which feature scenarios were added/modified/removed
- **Features Only**: Only tracks changes to *.feature.md files, not specs/diagrams/actors/contexts
- **Historical Record**: Preserved as-is to understand what happened during the session

**Stories (*.story.md) and Tasks (*.task.md)**
- **Transitional**: Represents work to be done at a specific point in time
- **Status Tracking**: Progress through pending → in_progress → completed
- **Implementation Context**: May reference specific transitional states or changes
- **Historical Record**: Once completed, preserved to understand what was implemented

**Key Distinction**: 
- **Features are DIRECTIVE**: They drive code changes and are tracked in sessions at scenario-level
- **Specs/Diagrams/Actors/Contexts are INFORMATIVE**: They provide guidance and context but are NOT tracked in sessions
- When editing Features, update them to reflect current desired state; Git preserves the history
- Sessions, Stories, and Tasks capture transitional state and should be preserved as historical records

## Session Status Workflow

Sessions progress through four distinct phases:

### 1. Design (status: 'design')
- **Active design session** - Feature files are being modified
- Session folder created at \`ai/sessions/<session-id>/\`
- Session file created at \`ai/sessions/<session-id>/<session-id>.session.md\`
- **Feature changes tracked** automatically with scenario-level detail
- **Specs/Diagrams/Actors/Contexts** can be edited anytime (not tracked in sessions)
- Session is "active" for editing in Forge Studio
- **Transition**: User clicks "End Design Session" → status becomes 'scribe'

### 2. Scribe (status: 'scribe')
- **Design complete, ready for distillation**
- Session is ended, \`end_time\` is set
- Changed files are locked in the session file
- User runs \`@forge-scribe\` (Cursor command) to analyze changes
- **Transition**: forge-scribe creates tickets in \`ai/sessions/<session-id>/tickets/\` → status becomes 'development'

### 3. Development (status: 'development')
- **Stories and tasks are being implemented**
- Ticket files exist in \`ai/sessions/<session-id>/tickets/\`
- Developers implement stories using \`@forge-build\` command
- Story status tracked individually (pending → in_progress → completed)
- **Transition**: User clicks "Mark Complete" (validates all tickets are completed) → status becomes 'completed'

### 4. Completed (status: 'completed')
- **All work is finished**
- All stories/tasks have status: 'completed'
- Session is archived
- No further changes expected

## The Complete Forge Workflow

### Phase 1: Start Design Session (→ status: 'design')
1. User clicks "Start Design Session" in Forge Studio
2. Enters problem statement
3. Session folder created at \`ai/sessions/<session-id>/\`
4. Session file created at \`ai/sessions/<session-id>/<session-id>.session.md\`
5. File watchers begin tracking changes to **features only** (\`**/*.feature.md\`)
6. Session is now "active"
7. Specs/Diagrams/Actors/Contexts remain editable without tracking

### Phase 2: Design Changes (status: 'design')
During active session, user edits design documents:

#### DIRECTIVE DOCUMENTS (Tracked in Session)
- **Features** (*.feature.md): Define user-facing behavior with Gherkin scenarios
  - **DIRECTIVE**: Drive code changes, tracked at scenario-level in session
  - **TIMELESS**: Always represent current desired state, NOT what's changing
  - Strictly behavior-driven Gherkin instructions only
  - Update to show all current features and scenarios; remove outdated ones
  - NO transitional information (Git handles change history)
  - Organization is CRITICAL: structure should inform automated tests
  - Group logically by abstracting large concepts into smaller ones
  - **Analyze existing folder structure** before creating new features
  - **Changes tracked**: scenarios_added, scenarios_modified, scenarios_removed

#### INFORMATIVE DOCUMENTS (Not Tracked, Always Editable)
- **Specs** (*.spec.md): Define technical contracts, APIs, validation rules
  - **INFORMATIVE**: Provide HOW features should be implemented
  - NOT tracked in sessions, editable anytime
  - NO code (except pseudocode for clarity)
  - NO diagrams (use diagram files instead; specs can LINK to diagrams)
  - Common use-case: contracts between systems
  - **Analyze existing folder structure** before creating new specs
  
- **Diagrams** (*.diagram.md): Create visual architecture representations (react-flow JSON)
  - **INFORMATIVE**: Visualize system architecture and flows
  - NOT tracked in sessions, editable anytime
  - Show technical implementations OR workflows as they should exist NOW
  - One diagram per file for clarity
  - Use react-flow JSON format stored in markdown code blocks
  - **Element-level spec linking**: Individual nodes can reference specs via node.data.spec_id
  - **Analyze existing folder structure** before creating new diagrams
  
- **Actors** (*.actor.md): Define system actors and personas
  - **INFORMATIVE**: Define who interacts with the system
  - NOT tracked in sessions, editable anytime
  - **Analyze existing folder structure** before creating new actors
  
- **Contexts** (*.context.md): Add guidance for specific technologies
  - **INFORMATIVE**: Technical guidance when implementing features
  - NOT tracked in sessions, editable anytime
  - Provide implementation patterns, best practices, and technical constraints
  - Help agents make consistent technical decisions
  - **Analyze existing folder structure** before creating new contexts

### Phase 3: End Design Session (design → scribe)
1. User clicks "End Design Session" in Forge Studio
2. System validates session is in 'design' status
3. Session \`end_time\` is set
4. Status transitions to 'scribe'
5. File watchers are stopped
6. Changed files array is finalized

### Phase 4: Run forge-scribe (scribe → development)
1. User runs \`@forge-scribe\` Cursor command
2. AI calls \`get_forge_about\` and \`get_forge_schema\` MCP tools
3. AI analyzes session's \`changed_files\` array with scenario-level detail
4. AI reads git diffs (if available) to understand exact changes
5. AI follows context linkages to gather technical guidance
6. AI creates Stories (*.story.md) for code changes
7. AI creates Tasks (*.task.md) for manual work
8. All tickets placed in \`ai/sessions/<session-id>/tickets/\`
9. Session status updated to 'development'

### Phase 5: Build Stories (status: 'development')
1. User selects a story file from \`ai/sessions/<session-id>/tickets/\`
2. Runs \`@forge-build\` Cursor command
3. System generates prompt with full context from linked features/specs
4. Developer implements the story
5. Updates story status to 'completed'
6. Repeat for all stories

### Phase 6: Mark Complete (development → completed)
1. User clicks "Mark Complete" in Forge Studio
2. System validates session is in 'development' status
3. System checks all tickets in \`ai/sessions/<session-id>/tickets/\`
4. Validates ALL tickets have status: 'completed'
5. If validation passes, status transitions to 'completed'
6. If validation fails, shows list of incomplete tickets
7. Session is now archived

## Stories vs Tasks

### Stories (*.story.md)
- **Code changes and implementation work**
- Require development and testing
- Should be MINIMAL in scope - one focused change
- **Target time**: < 30 minutes to implement
- Located in \`ai/sessions/<session-id>/tickets/\`
- Examples:
  - "Add email validation to User model"
  - "Implement JWT token generation in auth service"
  - "Create database migration for users table"

### Tasks (*.task.md)
- **Non-code work external to the system**
- Manual processes, configuration, documentation
- No implementation in codebase
- Located in \`ai/sessions/<session-id>/tickets/\`
- Examples:
  - "Configure AWS IAM role in console"
  - "Set up Stripe webhook endpoint"
  - "Create API keys in third-party service"

## The Linkage System: Forge's Secret Weapon

**CRITICAL**: Forge's linkage system is the foundation of its power. By systematically following linkages, you gather complete, accurate context without information overload. **Always capitalize on the linkage system for maximum effectiveness.**

### Understanding the Linkage Graph

Forge documents are interconnected through explicit ID references:

\`\`\`
Features (*.feature.md)
  └─ spec_id[] ──────────┐
  └─ diagram_id[] ───┐   │
  └─ context_id[] ┐  │   │
                  │  │   │
Specs (*.spec.md) │  │   │
  ├─ feature_id[] ◄──┘   │
  ├─ diagram_id[] ◄──────┘
  └─ context_id[] ─┐  
                   │  
Diagrams (*.diagram.md)
  ├─ frontmatter.feature_id[]
  ├─ frontmatter.actor_id[]
  └─ node.data.spec_id ◄──────┘ (element-level) ⭐
                      
Contexts              
  ◄───────────────────┘
  
Stories & Tasks
  ├─ session_id
  ├─ feature_id[]
  ├─ spec_id[]
  └─ diagram_id[]
\`\`\`

**⭐ Element-Level Spec Linking**: Diagram nodes reference specs via \`node.data.spec_id\`, enabling granular documentation mapping for specific components. Specs are NOT linked in diagram frontmatter.

### Systematic Context Gathering (CRITICAL for forge-scribe)

When distilling a session, follow this EXACT methodical process:

#### Phase 1: Global Context Discovery
1. **Find ALL global contexts**
   - Search \`ai/contexts/**/*.context.md\`
   - Read every global context file
   - These provide overarching technical guidance

#### Phase 2: Changed Files Analysis
1. **Read all changed feature files**
   - Extract from session's \`changed_files\` array (features only)
   - Identify all \`*.feature.md\` files with scenario-level changes
   
2. **Extract context_id linkages**
   - From each feature's frontmatter, find \`context_id\` arrays
   - From referenced specs (via spec_id), extract \`context_id\` arrays
   - Read each referenced context file
   - These provide technology-specific guidance

#### Phase 3: Spec Linkage Discovery
1. **Follow spec_id references**
   - For each changed \`*.feature.md\`, examine \`spec_id\` array
   - Read all referenced spec files
   - Cross-reference: check if specs reference features in their \`feature_id\` array
   
2. **Build bidirectional relationship map**
   - Map feature → spec relationships
   - Map spec → feature relationships
   - Understand complete technical implementation

#### Phase 4: Object Type Context Discovery
1. **Extract technical object types from specs**
   - Read specs linked from changed features (via spec_id)
   - Scan all linked specs for object references: \`<object-type>ObjectName\`
   - Examples:
     - \`<lambda>ProcessOrder\` → "lambda"
     - \`<dynamodb>UsersTable\` → "dynamodb"
     - \`<api>PaymentEndpoint\` → "api"
     - \`<component>LoginForm\` → "component"
   
2. **Query MCP for each object type**
   - Call \`get_forge_context(objectType)\` for each unique type
   - This provides just-in-time technical guidance
   - Examples: \`get_forge_context("lambda")\`, \`get_forge_context("dynamodb")\`

#### Phase 5: Architectural Understanding
1. **Read all diagrams from linked specs**
   - Check \`diagram_id\` linkages in specs (from Phase 3)
   - Read all referenced diagram files
   - Understand:
     - System architecture
     - Component relationships
     - Data flow patterns
     - Integration boundaries
     - Sequence diagrams for interactions
   
2. **Synthesize architectural context**
   - Build mental model of component interactions
   - Identify integration points
   - Understand story dependencies

#### Phase 6: Complete Context Synthesis
1. **Validate coverage**
   - Every changed feature analyzed
   - All linked specs read
   - All context linkages followed
   - All object types queried
   - All linked diagrams read
   
2. **Build comprehensive understanding**
   - Complete feature behavior (from changed features)
   - Technical implementation (from linked specs)
   - Technology guidance (from contexts)
   - Object-specific patterns (from get_forge_context)
   - Architecture understanding (from linked diagrams)

### Why the Linkage System is Powerful

**Without Linkages**: Agent reads changed files → creates stories with incomplete context → poor implementation

**With Linkages**: Agent follows complete graph → gathers all technical guidance → creates informed stories → excellent implementation

### Context Building Checklist (Use Every Time)

Before creating tickets from a session, verify:
- [ ] All global contexts read from \`ai/contexts/\`
- [ ] All changed features read from session's \`changed_files\` array
- [ ] All feature \`context_id\` references followed and read
- [ ] All \`spec_id\` linkages followed from changed features
- [ ] All spec \`context_id\` references followed and read
- [ ] All technical object types (e.g., \`<lambda>X\`) extracted from linked specs
- [ ] \`get_forge_context\` called for each unique object type
- [ ] All \`diagram_id\` references followed from linked specs
- [ ] All linked diagrams analyzed
- [ ] Complete architectural understanding achieved
- [ ] Context map synthesized and validated

**Only after completing this checklist should you create tickets.**

**Remember**: Sessions track ONLY features. Specs/Diagrams are discovered via linkages, not from changed_files.

### Linkage Best Practices

1. **Always Follow the Chain**: When you encounter a reference ID, always read that file
2. **Bidirectional Checking**: Check both directions of relationships (feature→spec AND spec→feature)
3. **Object Type Extraction**: Don't skip the \`<object-type>Name\` extraction step
4. **Use MCP Tools**: Call \`get_forge_context\` for every unique object type found
5. **Diagram Analysis**: Visual architecture is critical for understanding system design
6. **Context Prioritization**: Global contexts apply everywhere; specific contexts apply to linked features/specs

## Key Principles for Distillation

When running forge-scribe to distill a session:

1. **Call MCP Tools First**
   - \`get_forge_about\` - Understand the workflow
   - \`get_forge_schema story\` - Get story file format
   - \`get_forge_schema task\` - Get task file format

2. **Execute Complete Context Gathering** (See "The Linkage System" above)
   - Follow ALL linkages systematically
   - Use the Context Building Checklist
   - Don't skip any phase of context discovery

3. **Keep Stories Minimal**
   - One story should take < 30 minutes to implement
   - Break complex changes into multiple small stories
   - Each story focuses on ONE specific change

4. **Use Scenario-Level Detail**
   - Read \`changed_files\` array for precise scenario tracking
   - Focus on what was added, modified, or removed
   - Don't create stories for unchanged parts

5. **Follow Context Linkages** (Critical - see linkage system above)
   - Check \`context_id\` references in frontmatter
   - Read context files for technical guidance
   - Apply patterns consistently
   - Extract and query object types via \`get_forge_context\`

6. **Create Complete Stories**
   - Include file paths involved
   - Link to feature_id, spec_id, model_id, diagram_id
   - Add clear acceptance criteria
   - Set dependencies and order

7. **Verify Completeness**
   - Every changed file should be covered by at least one story/task
   - All stories should have clear objectives
   - Dependencies between stories should be identified

8. **Update Session Status**
   - After creating all tickets, update session status to 'development'
   - This signals that implementation can begin

## Ticket File Location

**CRITICAL**: All tickets MUST be created in:
\`ai/sessions/<session-id>/tickets/\`

NOT in \`ai/tickets/<session-id>/\`

The tickets folder is nested INSIDE the session folder for better organization.

## Gherkin Format

All Gherkin scenarios MUST use code blocks:

\`\`\`gherkin
Feature: User Authentication

Scenario: Successful login
  Given a registered user with email "user@example.com"
  When they enter valid credentials
  Then they should be logged into the system
  And receive a session token
\`\`\`

## Index Files for Features

Every features folder should contain \`index.md\` with:
- **Frontmatter**: folder-level metadata
- **Background** (Gherkin): shared context for all features in folder
- **Rules** (Gherkin): business rules that apply to all features

## Analyzing Existing Folder Structures

**CRITICAL**: Before creating or modifying any files, ALWAYS analyze the existing folder structure to understand the project's organizational patterns.

### Required Analysis Steps

1. **Examine Existing Organization**
   - List the contents of relevant ai/ subdirectories (features/, specs/, diagrams/, etc.)
   - Identify existing folder hierarchies and naming patterns
   - Understand the logical grouping of related concepts

2. **Respect Established Patterns**
   - If features are organized by domain (e.g., ai/features/user/, ai/features/admin/), continue that pattern
   - If specs are grouped by layer (e.g., ai/specs/api/, ai/specs/database/), follow that convention
   - Match the level of nesting and abstraction used in existing folders

3. **Determine Proper Placement**
   - Don't create files directly in ai/features/ if subfolders exist
   - Place new features alongside related existing features
   - Create new subfolders only when starting a new logical grouping
   - When in doubt, mirror the structure of similar existing files

4. **Validate Placement Logic**
   - Ask: "Does this placement make sense given the existing structure?"
   - Ask: "Will someone looking for this feature find it in an intuitive location?"
   - Ask: "Does this follow the project's established organizational principles?"

### Examples

**BAD**: Creating \`ai/features/new-login-feature.feature.md\` when \`ai/features/authentication/\` exists with other auth features.

**GOOD**: Creating \`ai/features/authentication/social-login.feature.md\` alongside existing \`ai/features/authentication/email-login.feature.md\`.

**BAD**: Creating \`ai/specs/my-spec.spec.md\` at the root when all other specs are organized in \`ai/specs/api/\`, \`ai/specs/database/\`, etc.

**GOOD**: Analyzing the spec domain and placing it in the appropriate subfolder like \`ai/specs/api/new-endpoint.spec.md\`.

### When Creating New Folders

Only create NEW folders when:
- You're starting a completely new logical grouping that doesn't fit existing categories
- The new concept is sufficiently distinct to warrant its own organizational unit
- You've verified no existing folder is appropriate

Even when creating new folders, ensure they align with the project's organizational philosophy.

## Best Practices

1. **Features Are Directive** - Features drive code changes and are tracked in sessions at scenario-level; Specs/Diagrams/Actors/Contexts are informative and always editable
2. **Analyze Folder Structure First** - Always examine existing folder organization before creating or modifying files; respect established patterns and place files logically
3. **Feature Organization is CRITICAL** - Structure features logically to directly inform automated test organization; abstract large concepts into smaller ones
4. **Specs Without Code/Diagrams** - Specs contain business logic and contracts, but NO code (except pseudocode) and NO diagrams (link to diagram files instead)
5. **Contexts for Agents** - Use context files to provide technical guidance that helps agents implement features consistently
6. **Nested Organization** - Group related features/specs in folders that reflect conceptual hierarchy; don't create files at root level if subfolders exist
7. **Status Awareness** - Respect session status transitions (design → scribe → development → completed)
8. **Minimal Stories** - Keep stories small and focused (< 30 minutes each)
9. **Follow Linkages** - Discover specs/diagrams/contexts through feature linkages (spec_id, diagram_id, context_id), not from session tracking
10. **Iterative Sessions** - Keep sessions focused on one problem area
11. **Clear Naming** - Use descriptive kebab-case IDs that align with existing naming patterns
12. **Git Controls History** - Never document "old" vs "new" in design files; Git handles change tracking

## Output Expectations for forge-scribe

When distilling a session, the AI MUST:
- Create multiple small stories (< 30 min each) rather than one large story
- Place ALL tickets in \`ai/sessions/<session-id>/tickets/\`
- Link each story to session_id, feature_id, spec_id, diagram_id
- Include specific file paths and clear objectives
- Add acceptance criteria to verify completion
- Order stories logically with dependencies
- Create tasks for any manual/external work
- Update session status to 'development' after creating tickets

**Important Reminders**:
- **Features Are Directive** - Only features are tracked in sessions at scenario-level
- **Specs/Diagrams/Actors/Contexts Are Informative** - Always editable, never tracked in sessions
- **Analyze folder structure first** - Always examine existing organization before creating files
- **Feature organization is CRITICAL** - Structure should inform test organization; place files logically within existing folder hierarchies
- **Discover via Linkages** - Find specs/diagrams through feature linkages (spec_id, diagram_id), not from session tracking
- **Specs never contain actual code** (only pseudocode) or diagrams (only links to diagrams)
- **Contexts provide technical guidance** to agents during implementation
- **Stories implement the current state** as defined in features and their linked specs
- **Git handles history** for all design documents; never document "old" vs "new" states

This workflow ensures implementation has complete, accurate context without information overload, with features driving work and specs/diagrams providing necessary guidance.`;
  }

  private getForgeSchema(schemaType: string): string {
    const schemas: Record<string, string> = {
      session: `# Session File Schema

## File Format
- **Filename**: <session-id>.session.md
- **Location**: ai/sessions/<session-id>/ (nested structure - session file inside session folder)
- **Format**: Frontmatter + Markdown

## Frontmatter Fields
---
session_id: kebab-case-id  # Must match filename without .session.md
start_time: 2025-10-25T10:00:00Z  # ISO 8601 timestamp
end_time: 2025-10-25T12:30:00Z  # ISO 8601 timestamp (null if in design)
status: design  # design, scribe, development, completed
problem_statement: "Brief description of what we're solving"
changed_files: []  # Array of FeatureChangeEntry objects with scenario-level tracking (only feature files are tracked)
---

## Session Status Workflow
Sessions progress through distinct phases:

1. **design** - Active design session, feature files are being modified
   - **Only feature changes** are tracked automatically at scenario-level
   - Specs/Diagrams/Actors/Contexts can be edited but are NOT tracked
   - Session is "active" for editing
   - User can end session to transition to 'scribe'

2. **scribe** - Design complete, ready to distill into stories
   - Session is ended, end_time is set
   - User runs forge-scribe to create stories
   - Stories are created in ai/sessions/<session-id>/tickets/
   - Status transitions to 'development' when stories are created

3. **development** - Stories are being implemented
   - Implementation work is in progress
   - Stories are in ai/sessions/<session-id>/tickets/
   - User can mark complete when all stories are done

4. **completed** - All work is finished
   - All stories have status: completed
   - Session is archived
   - No further changes expected

## Changed Files Structure

**IMPORTANT**: Sessions track ONLY feature files (*.feature.md). Specs, Diagrams, Actors, and Contexts are NOT tracked in sessions.

### Feature Changes (*.feature.md)
Changed files track scenario-level detail for features:

\`\`\`yaml
changed_files:
  - path: "ai/features/user/authentication.feature.md"
    change_type: modified  # added or modified
    scenarios_added:
      - "Two-factor authentication"
      - "Password reset flow"
    scenarios_modified:
      - "Successful login with valid credentials"
    scenarios_removed:
      - "Deprecated SSO login"
  - path: "ai/features/user/profile.feature.md"
    change_type: added
    scenarios_added:
      - "User can update profile"
      - "User can upload avatar"
\`\`\`

### What is NOT Tracked
- **Specs** (*.spec.md) - Always editable, never tracked in sessions
- **Diagrams** (*.diagram.md) - Always editable, never tracked in sessions
- **Actors** (*.actor.md) - Always editable, never tracked in sessions
- **Contexts** (*.context.md) - Always editable, never tracked in sessions

These informative documents are discovered during distillation via linkages from features (spec_id, diagram_id, context_id).

## Content Structure
The session document should describe:

1. **Problem Statement** - What problem are we solving?
2. **Goals** - What are we trying to achieve?
3. **Approach** - High-level approach to the solution
4. **Key Decisions** - Important decisions made during the session
5. **Notes** - Additional context, concerns, or considerations

## Workflow
1. Session starts with status: design, problem_statement, and start_time
2. During design phase, changed_files array tracks **feature modifications only** with scenario detail
3. Specs/Diagrams/Actors/Contexts can be edited but are NOT tracked
4. User ends design session, status changes to 'scribe', end_time is set
5. User runs forge-scribe to distill session into stories
6. forge-scribe analyzes changed feature files with scenario-level detail
7. forge-scribe follows linkages to discover specs, diagrams, and contexts
8. Stories are created in ai/sessions/<session-id>/tickets/
9. Status changes to 'development' when stories are created
10. User implements stories
11. User marks session complete when all stories done
12. Status changes to 'completed'

## Linkages
- Sessions generate **story** and **task** files in ai/sessions/<session-id>/tickets/
- Stories and tasks reference the session_id
- **Only features** are tracked in changed_files with scenario-level granularity
- Specs/Diagrams/Contexts are discovered via feature linkages (spec_id, diagram_id, context_id)`,

      feature: `# Feature File Schema

## File Format
- **Filename**: <feature-id>.feature.md
- **Location**: ai/features/ (nestable with index.md support)
- **Format**: Frontmatter + Gherkin Scenarios

## Frontmatter Fields
---
feature_id: kebab-case-id  # Must match filename without .feature.md
spec_id: [spec-id-1, spec-id-2]  # Array of related spec IDs
diagram_id: [diagram-id-1]  # Optional: Array of related diagram IDs
tags: []  # Optional array of tags for categorization
---

## Content Structure
Feature files use Gherkin format in code blocks:

\`\`\`gherkin
Feature: User Login

Background:
  Given the user authentication system is available
  And the database is accessible

Scenario: Successful login with valid credentials
  Given a registered user with email "user@example.com"
  And the user has a valid password
  When they submit their credentials
  Then they should be logged into the system
  And receive a session token
  And be redirected to the dashboard

Scenario: Failed login with invalid password
  Given a registered user with email "user@example.com"
  When they submit an incorrect password
  Then they should see an error message
  And remain on the login page
  And no session should be created
\`\`\`

## Index Files (index.md)
Every features folder should have an index.md with:

---
title: "User Management Features"
description: "All features related to user management"
---

\`\`\`gherkin
Background:
  Given the application is running
  And user data is properly seeded

Rule: All user operations require authentication
  Example: Viewing user profile
    Given an authenticated user
    When they view their profile
    Then they should see their information

Rule: Email addresses must be unique
  Example: Duplicate email registration
    Given a user with email "user@example.com" exists
    When another user tries to register with "user@example.com"
    Then the registration should fail
\`\`\`

## Linkages
- References one or more **spec_id** values
- May reference **diagram_id** values for visual architecture
- Specs and Stories will reference this feature_id`,

      spec: `# Spec File Schema

## File Format
- **Filename**: <spec-id>.spec.md
- **Location**: ai/specs/ (nestable)
- **Format**: Frontmatter + Markdown

## Frontmatter Fields
---
spec_id: kebab-case-id  # Must match filename without .spec.md
feature_id: [feature-id-1, feature-id-2]  # Array of related feature IDs
diagram_id: [diagram-id-1, diagram-id-2]  # Optional: related diagrams
context_id: [context-id-1, context-id-2]  # Optional: related contexts
---

## Content Structure
Specification documents define WHAT must be built through technical contracts, interfaces, and rules. Specs should focus on:

1. **Overview** - High-level description of what's being specified
2. **API Contracts** - Endpoints, methods, parameters, responses
3. **Data Structures** - Interfaces, types, schemas defined inline
4. **Validation Rules** - Constraints, business rules, data validation
5. **Integration Points** - External dependencies and how they connect
6. **Error Handling** - Expected error cases and responses

## What Specs Should Contain
- API endpoint definitions (methods, paths, parameters, responses)
- TypeScript interfaces and type definitions
- Validation rules and constraints
- Integration contracts with external systems
- Error handling specifications
- Business rules and logic constraints

## What Specs Should NOT Contain
- **Diagrams**: Use separate diagram files (*.diagram.md) and link via diagram_id
- **Implementation code**: Use context files (*.context.md) for code examples and patterns
- **Step-by-step guides**: Use context files for implementation guidance

## Example Content
\`\`\`markdown
## Login API Contract

### Endpoint
POST /api/auth/login

### Request Schema
\`\`\`typescript
interface LoginRequest {
  email: string;
  password: string;
}
\`\`\`

### Response Schema
\`\`\`typescript
interface LoginResponse {
  token: string;
  user: UserProfile;
}
\`\`\`

### Validation Rules
- Email must be valid email format
- Password must be at least 8 characters
- Rate limit: 5 attempts per 15 minutes per IP
\`\`\`

## Linkages
- References one or more **feature_id** values for user-facing behavior
- References **diagram_id** values for visual architecture (create separate diagram files)
- May reference **context_id** values for implementation guidance
- **Referenced BY diagram elements**: Individual diagram nodes link to specs via node.data.spec_id
- Specs can define data structures inline using TypeScript interfaces or tables
- Stories will reference this spec_id for implementation

### Diagram Element Linking
Specs are frequently linked from individual diagram elements to provide technical context for specific components:
- Visual diagram editor shows a 📋 badge on elements linked to specs
- Enables granular documentation mapping (e.g., each AWS service in a diagram can link to its config spec)
- Provides just-in-time technical context when viewing or editing diagrams
- Specs are linked at the element level, not in diagram frontmatter`,

      actor: `# Actor File Schema

## File Format
- **Filename**: <actor-id>.actor.md
- **Location**: ai/actors/ (nestable)
- **Format**: Frontmatter + Markdown

## Frontmatter Fields
---
actor_id: kebab-case-id  # Must match filename without .actor.md
type: user  # user, system, external
tags: []  # Optional array of tags for categorization
---

## Content Structure

Actors represent entities that interact with or participate in your system. Use markdown to describe:

### Overview
Brief description of who or what this actor is and their role.

### Responsibilities
What this actor is responsible for or what actions they can perform.

### Characteristics
Key attributes, behaviors, or constraints that define this actor.

### Context
How this actor fits into the larger system or organization.

## Actor Types

### User
Human users who directly interact with the system.
- End users, administrators, operators
- Have specific roles and permissions
- Perform actions through the user interface

### System
Automated systems or services that interact with your system.
- External APIs, microservices, background jobs
- Automated processes and integrations
- System-to-system communication

### External
External entities that interact with the system indirectly.
- Third-party services, partners, regulatory bodies
- External data sources or destinations
- Stakeholders who don't directly use the system

## Example

\`\`\`markdown
---
actor_id: customer-service-rep
type: user
---

# Customer Service Representative

## Overview
Front-line support staff who assist customers with issues, questions, and account management.

## Responsibilities
- Respond to customer inquiries via phone, email, and chat
- Process returns and refunds
- Update customer account information
- Escalate complex issues to specialized teams

## Characteristics
- Requires authentication and role-based access
- Works primarily during business hours
- Needs quick access to customer history and order details
- Must follow company policies and compliance requirements

## Context
Part of the customer support team, reporting to Support Manager. Primary interface between customers and the company for issue resolution.
\`\`\`

## Linkages
- Will be referenced by **feature_id** values in Gherkin scenarios (future enhancement)
- May reference related actors for hierarchical or collaborative relationships`,

      story: `# Story File Schema

## File Format
- **Filename**: <story-id>.story.md
- **Location**: ai/tickets/<session-id>/ (nestable)
- **Format**: Frontmatter + Markdown

## Frontmatter Fields
---
story_id: kebab-case-id  # Must match filename without .story.md
session_id: session-id  # Originating session
feature_id: [feature-id-1]  # Related features
spec_id: [spec-id-1, spec-id-2]  # Related specs
diagram_id: [diagram-id-1]  # Optional: Related diagrams
status: pending  # pending, in-progress, completed, blocked
priority: high  # low, medium, high
estimated_minutes: 25  # Estimated time to complete
---

## Content Structure

### Objective
Clear, concise statement of what needs to be implemented.

### Context
Why this story exists and how it fits into the larger feature.

### Implementation Steps
1. Specific step to take
2. Another specific step
3. Final step

### Files Affected
- \`src/models/User.ts\` - Add email validation
- \`src/api/auth.ts\` - Update login endpoint
- \`tests/auth.test.ts\` - Add validation tests

### Acceptance Criteria
- [ ] Email validation function returns true for valid emails
- [ ] Email validation function returns false for invalid emails
- [ ] Login endpoint rejects invalid email formats
- [ ] All tests pass

### Dependencies
- None (or list other story IDs that must be completed first)

## Best Practices
- Keep stories small (< 30 minutes of work)
- One focused change per story
- Clear, actionable steps
- Measurable acceptance criteria

## Linkages
- References a **session_id** (required)
- References **feature_id**, **spec_id**, and optionally **diagram_id** values
- May depend on other **story_id** values`,

      task: `# Task File Schema

## File Format
- **Filename**: <task-id>.task.md
- **Location**: ai/tickets/<session-id>/ (nestable)
- **Format**: Frontmatter + Markdown

## Frontmatter Fields
---
task_id: kebab-case-id  # Must match filename without .task.md
session_id: session-id  # Originating session
type: external  # external, manual, documentation, configuration
status: pending  # pending, in-progress, completed, blocked
priority: medium  # low, medium, high
---

## Content Structure

### Description
Clear description of the non-code work that needs to be done.

### Reason
Why this task is necessary and how it supports the implementation.

### Steps
1. Specific manual step to perform
2. Another step
3. Verification step

### Resources
- Links to documentation
- Access credentials needed
- Tools required

### Completion Criteria
- [ ] Specific verifiable outcome
- [ ] Another verifiable outcome

## Task Types

### External
Work done outside the codebase (e.g., cloud console configuration, third-party service setup)

### Manual
Manual processes that can't be automated yet

### Documentation
Creating or updating documentation that isn't code comments

### Configuration
Configuration changes in external systems

## Linkages
- References a **session_id** (required)
- No code dependencies - these are external/manual work items`,

      context: `# Context File Schema

## File Format
- **Filename**: <context-id>.context.md
- **Location**: ai/contexts/ (nestable, folder structure defines categories)
- **Format**: Frontmatter + Gherkin Scenarios

## Frontmatter Fields
---
context_id: kebab-case-id  # Must match filename without .context.md
name: Optional Name  # Optional human-readable name
description: Optional Description  # Optional brief description
tags: []  # Optional array of tags for categorization
---

## Content Structure
Context files provide guidance on when and how to use specific information or tools using Gherkin scenarios.

Use \`\`\`gherkin code blocks for structured guidance scenarios.

### Example Structure

\`\`\`markdown
\`\`\`gherkin
Scenario: When to use this context
  Given a specific technical situation
  When implementing a feature
  Then follow these guidelines
  And reference appropriate documentation

Scenario: How to implement
  Given you need to implement this pattern
  When writing code
  Then use these best practices
  And ensure proper error handling
\`\`\`
\`\`\`

## Purpose
Context files prevent information overload by providing just-in-time guidance:
- When to consult documentation
- Which tools to use for specific technologies
- Where to find additional information
- Research strategies for unknown technologies

## Organization
- Use nested folders to organize contexts by category
- Folder structure replaces the deprecated category field
- Example: ai/contexts/foundation/, ai/contexts/vscode/

## Linkages
- Referenced by **spec_id** and **story_id** values
- May reference documentation in ai/docs/
- May reference MCP tools or external resources`,

      diagram: `# Diagram File Schema

## File Format
- **Filename**: <diagram-id>.diagram.md
- **Location**: ai/diagrams/ (nestable)
- **Format**: Frontmatter + JSON Diagram Data

## Frontmatter Fields
---
diagram_id: kebab-case-id  # Must match filename without .diagram.md
name: Human Readable Name
description: Brief description of what this diagram shows
diagram_type: flow  # flow, infrastructure, component, state, sequence
feature_id: []  # Optional: related features
actor_id: []  # Optional: actors shown in diagram
---

**Note**: Specs are linked at the element level via \`node.data.spec_id\`, not in the diagram frontmatter.

## Content Structure
Diagram files contain JSON diagram data stored in a markdown code block that visualizes system architecture, flows, or relationships.

### JSON Diagram Format
Each diagram file should contain exactly ONE JSON code block with react-flow node and edge data:

\`\`\`json
{
  "nodes": [
    { 
      "id": "user", 
      "type": "default", 
      "position": { "x": 0, "y": 0 }, 
      "data": { 
        "label": "User",
        "spec_id": "user-authentication"  // Optional: link node to spec
      } 
    },
    { 
      "id": "api", 
      "type": "aws-apigateway", 
      "position": { "x": 200, "y": 0 }, 
      "data": { 
        "label": "API Gateway",
        "spec_id": "api-gateway-config"  // Optional: link node to spec
      } 
    },
    { 
      "id": "lambda", 
      "type": "aws-lambda", 
      "position": { "x": 400, "y": 0 }, 
      "data": { 
        "label": "Lambda Function",
        "spec_id": "lambda-processing"  // Optional: link node to spec
      } 
    },
    { 
      "id": "dynamodb", 
      "type": "aws-dynamodb", 
      "position": { "x": 600, "y": 0 }, 
      "data": { "label": "DynamoDB" } 
    }
  ],
  "edges": [
    { "id": "e1", "source": "user", "target": "api" },
    { "id": "e2", "source": "api", "target": "lambda" },
    { "id": "e3", "source": "lambda", "target": "dynamodb" }
  ]
}
\`\`\`

### Node Data Properties
Each node's \`data\` object can include:
- **label** (required): Display name for the node
- **spec_id** (optional): Link this specific diagram element to a technical specification
- **classifier**: Node type identifier (auto-populated by shape library)
- **properties**: Custom key-value pairs for the element
- **isContainer**: Boolean indicating if node can contain other nodes

### Element-Level Spec Linking
Individual diagram elements (nodes) can be linked to specifications using the \`spec_id\` field in their data object. This creates a granular connection between visual elements and their technical documentation.

**When to link specs to diagram elements:**
- When specific components have detailed technical specifications
- When different parts of a diagram need different implementation guidance
- When you want to provide just-in-time context for individual elements
- When showing system architecture with documented components

**Visual Indicator:**
- Nodes with a spec_id display a 📋 badge in the diagram editor
- Makes it easy to see which components have technical documentation

The description field in the frontmatter should provide any necessary context or legend information for the diagram.

## Purpose
Diagrams provide visual representations for:
- **Infrastructure**: AWS resources, databases, services, deployment topology
- **Component Relationships**: React component hierarchy, service dependencies
- **Data Flow**: How data moves through the system, request/response cycles
- **Actor Interactions**: Who talks to what, system boundaries
- **State Machines**: Session lifecycles, workflow states

## What Diagrams Are NOT
- Do NOT include implementation code or pseudocode
- Do NOT include detailed technical specifications
- Do NOT include multiple diagrams in one file
- Keep it visual and high-level

## Linkages

### Diagram-Level Linkages (Frontmatter)
- May reference **feature_id[]** to show feature architecture
- May reference **actor_id[]** to show which actors are involved
- Stories may reference **diagram_id** for visual context

### Element-Level Linkages (Node Data)
- Individual nodes link to specs via **node.data.spec_id**
- Provides granular specification mapping for specific components
- Enables just-in-time technical context for diagram elements
- Visual indicator (📋) shown on diagram nodes that have linked specs
- Each component in a diagram can have its own technical specification

**Note**: Specs are linked at the element level only. There is no diagram-level spec_id in the frontmatter.`,
    };

    const schema = schemas[schemaType];
    if (!schema) {
      throw new Error(`Unknown schema type: ${schemaType}`);
    }

    return schema;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Forge MCP Server started');
  }
}

// Start the server
const server = new ForgeMCPServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

