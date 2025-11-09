#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
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
            description: 'Get a comprehensive overview of the Forge workflow, including the session-driven approach, when to create Stories vs Tasks, and guidance on implementation',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_forge_schema',
            description: 'Get the schema specification for a Forge file type (session, feature, spec, model, actor, story, task, or context)',
            inputSchema: {
              type: 'object',
              properties: {
                schema_type: {
                  type: 'string',
                  enum: ['session', 'feature', 'spec', 'model', 'actor', 'story', 'task', 'context'],
                  description: 'The type of schema to retrieve',
                },
              },
              required: ['schema_type'],
            },
          },
          {
            name: 'get_forge_objects',
            description: 'List supported spec objects with brief guidance. Use these object IDs with get_forge_context.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_forge_context',
            description: 'Return guidance for a supported spec object from the guidance library; if none exists, return a best-practice research prompt for that object.',
            inputSchema: {
              type: 'object',
              properties: {
                spec_object: {
                  type: 'string',
                  description: 'A technical object or concept that needs to be researched (e.g., "AWS CDK Stack", "React component architecture", "PostgreSQL indexes")',
                },
              },
              required: ['spec_object'],
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

        case 'get_forge_objects':
          return {
            content: [
              {
                type: 'text',
                text: this.getForgeObjects(),
              },
            ],
          };

        case 'get_forge_context':
          if (!args || typeof args.spec_object !== 'string') {
            throw new Error('spec_object is required');
          }
          return {
            content: [
              {
                type: 'text',
                text: this.getForgeContext(args.spec_object),
              },
            ],
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private getGuidanceDir(): string {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    return path.resolve(__dirname, 'guidance');
  }

  private normalizeObjectId(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-_]/g, '')
      .replace(/\s+/g, '-')
      .replace(/_+/g, '-');
  }

  private readGuidanceIndex(): Array<{ id: string; title: string; aliases: string[]; filePath: string; summary: string }> {
    const dir = this.getGuidanceDir();
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return [];
    }

    const items: Array<{ id: string; title: string; aliases: string[]; filePath: string; summary: string }> = [];
    for (const name of entries) {
      if (!name.endsWith('.spec.md')) continue;
      const filePath = path.join(dir, name);
      let content = '';
      try {
        content = fs.readFileSync(filePath, 'utf8');
      } catch {
        continue;
      }

      let fm: Record<string, unknown> = {};
      let body = content;
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
      if (fmMatch) {
        const raw = fmMatch[1];
        body = content.slice(fmMatch[0].length);
        fm = this.parseSimpleFrontmatter(raw);
      }

      const id = (this.normalizeObjectId(String((fm as any).object_id || '')) || this.normalizeObjectId(name.replace(/\.spec\.md$/, '')));
      const title = String((fm as any).title || id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
      const aliases: string[] = Array.isArray((fm as any).aliases)
        ? (fm as any).aliases.map((a: unknown) => this.normalizeObjectId(String(a)))
        : [];
      const summary = this.extractSummary(body);

      items.push({ id, title, aliases, filePath, summary });
    }
    return items;
  }

  private parseSimpleFrontmatter(raw: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
      if (!m) continue;
      const key = m[1];
      const value = m[2].trim();
      if (value.startsWith('[') && value.endsWith(']')) {
        const arr = value
          .slice(1, -1)
          .split(',')
          .map((v) => v.trim().replace(/^"|"$/g, ''))
          .filter((v) => v.length > 0);
        result[key] = arr;
      } else {
        result[key] = value.replace(/^"|"$/g, '');
      }
    }
    return result;
  }

  private extractSummary(body: string): string {
    const lines = body.split(/\r?\n/).map((l) => l.trim());
    for (const line of lines) {
      if (line.length === 0) continue;
      // Skip headings
      if (line.startsWith('#')) continue;
      return line.length > 200 ? line.slice(0, 200) + '…' : line;
    }
    return '';
  }

  private getForgeObjects(): string {
    const items = this.readGuidanceIndex();
    if (items.length === 0) {
      return `No spec objects are currently registered. To add guidance, create markdown files in guidance/*.spec.md (e.g., guidance/lambda.spec.md).`;
    }
    const header = `Supported Spec Objects (${items.length})\n`;
    const lines = items
      .map((it) => {
        const aliasStr = it.aliases.length > 0 ? `\n  aliases: ${it.aliases.join(', ')}` : '';
        const summary = it.summary ? `\n  summary: ${it.summary}` : '';
        return `- ${it.id} — ${it.title}${aliasStr}${summary}`;
      })
      .join('\n');
    const footer = `\n\nUse get_forge_context with spec_object set to one of the IDs above.`;
    return header + lines + footer;
  }

  private getForgeAbout(): string {
    return `# Forge - Session-Driven Context Engineering

## Overview
Forge is a comprehensive workflow system for structured context engineering in AI-assisted development. It uses a session-driven approach to manage design decisions and convert them into actionable implementation steps.

## Core Philosophy
1. **Accurate Context Without Overload** - Provide exactly what's needed, when it's needed
2. **Session-Driven Design** - Track all changes made during design sessions
3. **Minimal Story Size** - Keep implementation stories small, focused, and actionable
4. **Nestable Organization** - Use folder hierarchies to organize related concepts

## File Structure
\`\`\`
your-project/
└── ai/
    ├── sessions/     # Design session tracking (nestable)
    ├── features/     # Feature definitions with Gherkin (nestable, index.md at each level)
    ├── specs/        # Technical specifications with Nomnoml (nestable)
    ├── models/       # Data model definitions (nestable)
    ├── actors/       # Actor definitions and profiles (nestable)
    ├── contexts/     # Context references and guidance (nestable)
    ├── tickets/      # Implementation Stories and Tasks (nestable, organized by session)
    └── docs/         # Supporting documentation
\`\`\`

## The Forge Workflow

### Phase 1: Start a Design Session
1. User starts a session from Forge Studio or command
2. Session file created in \`ai/sessions/\` with problem statement
3. Session begins tracking all file changes

### Phase 2: Design Changes
During an active session:
- Edit Features: Define or modify feature behavior using Gherkin
- Edit Specs: Create or update technical specifications with Nomnoml diagrams
- Edit Models: Define data structures and their properties
- Edit Actors: Define actors and their roles in the system
- Edit Contexts: Add guidance for specific technical areas
- All changes are tracked in the session's changed_files array

### Phase 3: Distill Session
When design is complete:
1. User runs "Distill Session" command
2. System generates a comprehensive prompt that:
   - Calls \`get_forge_about\` to understand the workflow
   - Analyzes all changed features/specs/models
   - Follows context linkages to gather necessary information
   - Creates Stories (code changes) and Tasks (non-code work)
   - Places them in \`ai/tickets/<session-id>/\`

### Phase 4: Build Implementation
1. User selects a Story from the tickets folder
2. Runs "Build Story" command
3. System generates prompt with full context to implement the story

## Stories vs Tasks

### Stories (*.story.md)
- Code changes and implementation work
- Require development and testing
- Should be MINIMAL in scope - one focused change
- Located in \`ai/tickets/<session-id>/\`
- Example: "Add email validation to User model"

### Tasks (*.task.md)
- Non-code work external to the system
- Manual processes, configuration, documentation
- No implementation in codebase
- Located in \`ai/tickets/<session-id>/\`
- Example: "Configure AWS IAM role in console"

## Key Principles for Distillation

When distilling a session into Stories and Tasks:

1. **Call get_forge_schema** - Validate all file formats
2. **Keep Stories Minimal** - One story should take < 30 minutes to implement
3. **Break Down Large Changes** - Split complex features into multiple stories
4. **Use Proper Linkages** - Link stories to features, specs, and models
5. **Follow Context Rules** - Check context files for guidance on technical approaches
6. **Verify Completeness** - Ensure all changed files are accounted for in stories/tasks

## Gherkin Format

All Gherkin scenarios MUST use code blocks for consistency:

\`\`\`gherkin
Feature: User Authentication

Scenario: Successful login
  Given a registered user with email "user@example.com"
  When they enter valid credentials
  Then they should be logged into the system
  And receive a session token
\`\`\`

## Index Files

Every Features folder should contain an \`index.md\` with:
- Frontmatter with folder-level metadata
- Background (Gherkin) - shared context for all features in folder
- Rules (Gherkin) - business rules that apply to all features in folder

## Best Practices

1. **Nested Organization** - Group related features/specs in folders
2. **Context Links** - Use context files to avoid repeating technical guidance
3. **Model-First** - Define data models before specs that use them
4. **Iterative Sessions** - Keep sessions focused on one problem area
5. **Clear Naming** - Use descriptive kebab-case IDs for all files

## Output Expectations

When distilling, the AI should:
- Create multiple small stories rather than one large story
- Link each story to relevant features, specs, and models
- Include specific file paths and clear objectives
- Add acceptance criteria to verify completion
- Order stories logically with dependencies
- Create tasks for any manual/external work

This workflow ensures that implementation has complete, accurate context without information overload.`;
  }

  private getForgeSchema(schemaType: string): string {
    const schemas: Record<string, string> = {
      session: `# Session File Schema

## File Format
- **Filename**: <session-id>.session.md
- **Location**: ai/sessions/ (nestable)
- **Format**: Frontmatter + Markdown

## Frontmatter Fields
---
session_id: kebab-case-id  # Must match filename without .session.md
start_time: 2025-10-25T10:00:00Z  # ISO 8601 timestamp
end_time: 2025-10-25T12:30:00Z  # ISO 8601 timestamp (null if active)
status: active  # active, completed, cancelled
problem_statement: "Brief description of what we're solving"
changed_files: [
  "ai/features/user/authentication.feature.md",
  "ai/specs/api/auth-endpoint.spec.md",
  "ai/models/user.model.md"
]
---

## Content Structure
The session document should describe:

1. **Problem Statement** - What problem are we solving?
2. **Goals** - What are we trying to achieve?
3. **Approach** - High-level approach to the solution
4. **Key Decisions** - Important decisions made during the session
5. **Notes** - Additional context, concerns, or considerations

## Workflow
1. Session starts with problem_statement and start_time
2. During session, changed_files array tracks all modifications
3. Session ends with end_time and status: completed
4. Distillation creates Stories and Tasks in ai/tickets/<session-id>/

## Linkages
- Sessions generate **story** and **task** files in ai/tickets/<session-id>/
- Stories and tasks reference the session_id
- Changed files are analyzed during distillation`,

      feature: `# Feature File Schema

## File Format
- **Filename**: <feature-id>.feature.md
- **Location**: ai/features/ (nestable with index.md support)
- **Format**: Frontmatter + Gherkin Scenarios

## Frontmatter Fields
---
feature_id: kebab-case-id  # Must match filename without .feature.md
spec_id: [spec-id-1, spec-id-2]  # Array of related spec IDs
model_id: [model-id-1]  # Array of related model IDs
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
- May reference **model_id** values for data structures
- Specs and Stories will reference this feature_id`,

      spec: `# Spec File Schema

## File Format
- **Filename**: <spec-id>.spec.md
- **Location**: ai/specs/ (nestable)
- **Format**: Frontmatter + Markdown + Nomnoml Diagrams

## Frontmatter Fields
---
spec_id: kebab-case-id  # Must match filename without .spec.md
feature_id: [feature-id-1, feature-id-2]  # Array of related feature IDs
model_id: [model-id-1, model-id-2]  # Array of related model IDs
context_id: [context-id-1, context-id-2]  # Optional: related contexts
---

## Content Structure
Specification documents should include:

1. **Overview** - High-level description of what's being specified
2. **Requirements** - Detailed functional and non-functional requirements
3. **Architecture** - Technical architecture with Nomnoml diagrams
4. **Implementation Notes** - Key technical considerations
5. **Dependencies** - External dependencies and integrations

### Nomnoml Diagrams
Use Nomnoml for visual representations:

\`\`\`nomnoml
#direction: down
#padding: 10

[User] -> [API|POST /login]
[API] -> [Database|Query user]
[Database] -> [API|User data]
[API] -> [User|JWT token]
\`\`\`

## Linkages
- References one or more **feature_id** values
- References **model_id** values for data structures used
- May reference **context_id** values for additional guidance
- Stories will reference this spec_id`,

      model: `# Model File Schema

## File Format
- **Filename**: <model-id>.model.md
- **Location**: ai/models/ (nestable)
- **Format**: Frontmatter + Structured Property Definitions

## Frontmatter Fields
---
model_id: kebab-case-id  # Must match filename without .model.md
type: entity  # entity, dto, value-object, interface, enum
related_models: [user-address, user-role]  # Array of related model IDs
---

## Content Structure

### Overview
Brief description of the model and its purpose.

### Properties

| Property | Type | Required | Description | Validation |
|----------|------|----------|-------------|------------|
| id | string (UUID) | Yes | Unique identifier | Must be valid UUID v4 |
| email | string | Yes | User email address | Must be valid email format, unique |
| name | string | Yes | Full name | 2-100 characters |
| created_at | datetime | Yes | Creation timestamp | ISO 8601 format |
| status | enum | Yes | Account status | One of: active, suspended, deleted |

### Relationships
- **One-to-Many**: User has many Orders
- **Many-to-One**: User belongs to one Organization
- **Many-to-Many**: User has many Roles through UserRoles

### Validation Rules
1. Email must be unique across all users
2. Email must be validated before account activation
3. Password must be hashed using bcrypt with cost factor 12
4. Status cannot be changed from deleted to active

### Constraints
- Unique constraint on email field
- Check constraint: status IN ('active', 'suspended', 'deleted')
- Not null constraints on id, email, name, created_at, status

## Example

\`\`\`typescript
interface User {
  id: string; // UUID
  email: string;
  name: string;
  created_at: Date;
  status: 'active' | 'suspended' | 'deleted';
}
\`\`\`

## Linkages
- Referenced by **feature_id** and **spec_id** values
- May reference other **model_id** values for relationships`,

      actor: `# Actor File Schema

## File Format
- **Filename**: <actor-id>.actor.md
- **Location**: ai/actors/ (nestable)
- **Format**: Frontmatter + Markdown

## Frontmatter Fields
---
actor_id: kebab-case-id  # Must match filename without .actor.md
type: user  # user, system, external
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
model_id: [model-id-1]  # Related models
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
- References **feature_id**, **spec_id**, and **model_id** values
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
- **Location**: ai/contexts/ (nestable)
- **Format**: Frontmatter + Markdown Instructions + Gherkin Scenarios

## Frontmatter Fields
---
context_id: kebab-case-id  # Must match filename without .context.md
category: technical  # technical, business, process, tool
name: Optional Name  # Optional human-readable name
description: Optional Description  # Optional brief description
---

## Content Structure
Context files provide guidance on when and how to use specific information or tools. The content consists of:

1. **Instructions Section** (Markdown)
   - Free-form markdown content providing context and guidance
   - Appears before or outside gherkin code blocks
   - Can include headings, lists, links, and other markdown formatting

2. **Gherkin Section** (Code blocks)
   - Full Gherkin support with Background, Rules, and Scenarios
   - Use \`\`\`gherkin code blocks for structured guidance

### Example Structure

\`\`\`markdown
# Context Title

## Instructions

Free-form markdown content providing context and guidance.
Can include any markdown formatting.

## Gherkin Scenarios

\`\`\`gherkin
Background:
  Given shared context for all scenarios

Rule: Rule Title
  Scenario: Example scenario
    Given a precondition
    When an action occurs
    Then an expectation is met

Scenario: Standalone scenario
  Given a precondition
  When an action occurs
  Then an expectation is met
\`\`\`
\`\`\`

## Purpose
Context files prevent information overload by providing just-in-time guidance:
- When to consult documentation
- Which tools to use for specific technologies
- Where to find additional information
- Research strategies for unknown technologies

## Gherkin Support
Context files support full Gherkin syntax:
- **Background**: Shared context steps for all scenarios
- **Rules**: Business rules containing Example scenarios
- **Scenarios**: Standalone scenarios defining guidance

## Linkages
- Referenced by **spec_id** and **story_id** values
- May reference documentation in ai/docs/
- May reference MCP tools or external resources`,
    };

    const schema = schemas[schemaType];
    if (!schema) {
      throw new Error(`Unknown schema type: ${schemaType}`);
    }

    return schema;
  }

  private getForgeContext(specObject: string): string {
    const items = this.readGuidanceIndex();
    const requested = this.normalizeObjectId(specObject);

    // Attempt to find a matching guidance file by id or alias
    const match = items.find((it) => it.id === requested || it.aliases.includes(requested));
    if (match) {
      try {
        const content = fs.readFileSync(match.filePath, 'utf8');
        return content;
      } catch {
        // Fall through to research prompt if file cannot be read
      }
    }

    return `# Research Prompt for: ${specObject}

You need to research and understand "${specObject}" to properly implement or work with it in the current project context.

## Research Instructions

Execute the following research steps in order:

### 1. Check Project Documentation
First, search the project's ai/docs/ directory for any existing documentation about "${specObject}":
- Look for markdown files that might contain relevant information
- Check for naming patterns that relate to this object

### 2. Search Codebase
Use codebase_search to find existing implementations or references:
- Query: "How is ${specObject} implemented in this codebase?"
- Query: "Where is ${specObject} used?"
- Review the results to understand current usage patterns

### 3. External Research (if needed)
If the above steps don't provide sufficient information, perform web research:
- Search for official documentation for "${specObject}"
- Look for best practices and common patterns
- Find implementation examples and tutorials
- Check for version-specific considerations

### 4. Synthesize Findings
After gathering information, create a summary that includes:
- **Definition**: What is ${specObject}?
- **Purpose**: Why is it used?
- **Implementation**: How should it be implemented in this project?
- **Best Practices**: What are the recommended approaches?
- **Gotchas**: What are common pitfalls to avoid?
- **Dependencies**: What does it depend on or integrate with?

### 5. Create Context (if needed)
If this is a recurring concept that will be needed in multiple stories, consider creating a context file at:
ai/contexts/${specObject.toLowerCase().replace(/\s+/g, '-')}-guidance.context.md

This context file should follow the context schema and provide Gherkin scenarios for when and how to use this information in future work.

## Output Format
Provide your research findings in a structured format that can be easily referenced during implementation. Include specific code examples, configuration patterns, and integration points relevant to this project.

---

**Note**: This is a research prompt. Execute each step thoroughly before proceeding to implementation. Document your findings for future reference.`;
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

