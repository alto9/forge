# Forge - Context Engineering Framework

A comprehensive toolkit for structured context engineering in AI-assisted development. Forge provides both a VSCode extension and an MCP server to help engineers create well-structured prompts with complete context.

## 🎯 What is Forge?

Forge is a session-driven workflow system for structured context engineering in AI-assisted development. It helps you design software systematically by tracking changes during design sessions, then distills those sessions into minimal, actionable implementation stories (< 30 minutes each) with complete context.

## 📦 Packages

This is a monorepo containing two packages:

### [@forge/vscode-extension](./packages/vscode-extension/)
VSCode extension that provides commands for session-driven design and implementation.

**Features:**
- Start and manage design sessions
- Forge Studio - Full-featured UI for creating and managing Forge files
  - Create features, specs, actors, and contexts
  - Create and navigate nested folder structures
  - Edit files with proper frontmatter and content templates
  - Session-aware workflows (requires active session for editing)
- Distill sessions into Stories and Tasks
- Build stories with complete context
- Right-click context menu integration

### [@forge/mcp-server](./packages/mcp-server/)
Model Context Protocol server that exposes Forge capabilities to AI assistants like Claude Desktop and Cursor.

**Tools:**
- `get_forge_about` - Comprehensive workflow overview and guidance
- `get_forge_schema` - Schema definitions for sessions, features, specs, actors, contexts, stories, and tasks
- `get_forge_context` - Technical object research prompts and guidance
- `get_forge_objects` - List supported spec objects from guidance library

## 🏗️ Project Structure

When you use Forge in a project, it manages files in a nestable folder structure:

```
your-project/
└── ai/
    ├── sessions/      # Design session tracking (*.session.md)
    ├── features/      # Feature definitions with Gherkin (*.feature.md, nestable, index.md)
    ├── specs/         # Technical specifications with Nomnoml (*.spec.md, nestable)
    ├── actors/        # Actor/persona definitions (*.actor.md, nestable)
    ├── contexts/      # Context references and guidance (*.context.md, nestable)
    ├── tickets/       # Implementation Stories and Tasks (*.story.md, *.task.md, by session)
    └── docs/          # Supporting documentation
```

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/alto9/cursor-context-engineering.git
cd cursor-context-engineering

# Install dependencies for all packages
npm install

# Build all packages
npm run build
```

### Project Initialization

When you first use Forge in a project, it will create:
1. **AI folder structure** - Organized folders for sessions, features, specs, actors, and contexts
2. **Cursor command files** - Pre-configured commands that guide AI agents through Forge workflows

**Note**: The `ai/tickets/` folder is not created during initialization. It's automatically created when you distill a session, with each session getting its own subdirectory (e.g., `ai/tickets/session-id/`) containing the generated stories and tasks.

#### Cursor Commands

Forge automatically installs command files to `.cursor/commands/` that provide context-aware guidance for AI agents:

- **forge-design.md** - Guides AI when working within active design sessions
- **forge-build.md** - Guides AI when implementing stories from tickets

These commands ensure AI agents follow Forge workflows correctly, tracking changes and maintaining proper file structure.

#### Command Validation

Forge uses **hash-based validation** to ensure command files stay up-to-date:

- Each command file includes an embedded content hash
- During initialization, Forge checks if existing commands match the current templates
- Outdated commands are automatically updated when you initialize the project
- This ensures all Forge projects use consistent, validated command templates

**What happens if commands are outdated?**

1. The Welcome Screen will show which commands need updating (⚠ orange indicator)
2. Running "Initialize Project" will update all outdated commands
3. You can verify command status at any time by opening Forge Studio

**Note**: Command files are managed by Forge and should not be manually edited. Any modifications will be detected and the file will be marked as outdated.

### Using the VSCode Extension

```bash
# Package the extension
npm run vscode:package

# Install the extension
code --install-extension packages/vscode-extension/forge-0.1.0.vsix
```

Then use the Command Palette (`Cmd/Ctrl+Shift+P`) to access Forge commands:
- `Forge: Open Forge Studio` - Open the visual interface for managing Forge files and sessions
- `Forge: Distill Session into Stories and Tasks` - Create a Cursor command file that distills a completed session into actionable stories and tasks (also available via right-click on .session.md files)
- `Forge: Build Story Implementation` - Generate implementation prompt for a specific story (also available via right-click on .story.md files)

**Forge Studio Features:**

**Session Management:**
- Start new design sessions with problem statements
- Persistent session panel for real-time editing
- Auto-tracked file changes during sessions
- Document goals, approach, key decisions, and notes
- Auto-save with 500ms debounce
- Resume sessions across Studio reopens (filesystem is source of truth)
- End sessions and distill into stories

**File Management:**
- **Dashboard** - View session status and counts of all Forge objects (sessions, features, specs, actors, contexts, stories, tasks)
- **Sessions Page** - Create, view, and manage all design sessions
- **Category Pages** - Browse and edit Features, Specs, Actors, and Contexts
- **Folder Navigation** - Tree view with expand/collapse, nested folder support
- **File Creation** - Create new files with proper templates and frontmatter (requires active session)
- **File Editing** - Edit frontmatter metadata and content (requires active session)
- **Gherkin Editor** - Structured visual editor for feature files with Background, Rules, and Scenarios
- **Read-Only Mode** - View files without active session, edit when session is active

**UI Features:**
- Three-panel layout (navigation sidebar, main content, session panel)
- Split view for browsing (folder tree + content)
- Real-time updates when files change on disk
- Automatic theme integration with VSCode
- Minimizable session panel

### Using the MCP Server

Add to your MCP settings file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "forge": {
      "command": "node",
      "args": ["/path/to/cursor-context-engineering/packages/mcp-server/dist/index.js"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

## 📋 File Formats

### Session Files (*.session.md)
```markdown
---
session_id: user-authentication-session
start_time: 2025-10-25T10:00:00Z
end_time: null
status: active
problem_statement: "Add user authentication with email verification"
changed_files: [
  "ai/features/user/login.feature.md",
  "ai/specs/api/auth-endpoint.spec.md"
]
---

# User Authentication Session

## Problem Statement
Add secure user authentication...

## Goals
- Secure password handling
- Email verification
- Session management
```

### Feature Files (*.feature.md)
```markdown
---
feature_id: user-login
spec_id: [authentication-spec]
---

\`\`\`gherkin
Feature: User Login

Scenario: Successful login
  Given a registered user with email "user@example.com"
  When they enter valid credentials
  Then they should be logged into the system
  And receive a session token
\`\`\`
```

### Actor Files (*.actor.md)
```markdown
---
actor_id: system-administrator
type: user
---

## Overview
System administrator responsible for managing users and system configuration.

## Responsibilities
- Manage user accounts and permissions
- Configure system settings
- Monitor system health
- Perform backups and maintenance

## Interactions
- Creates and manages user accounts
- Accesses admin dashboard
- Reviews system logs and metrics
```

### Story Files (*.story.md)
```markdown
---
story_id: add-email-validation
session_id: user-authentication-session
feature_id: [user-login]
spec_id: [authentication-spec]
status: pending
priority: high
estimated_minutes: 25
---

## Objective
Add email validation to User model

## Implementation Steps
1. Add validation function
2. Update tests
3. Apply to registration endpoint

## Acceptance Criteria
- [ ] Valid emails pass validation
- [ ] Invalid emails are rejected
```

## 🔄 The Forge Workflow

1. **Start a Session** - Begin a design session with a clear problem statement
2. **Design Changes** - Edit features, specs, and contexts during the active session
3. **Distill to Stories & Tasks** - Convert the session into minimal implementation stories (< 30 min each) and external tasks
4. **Build Stories** - Implement each story with complete context from linked features and specs

The session-driven approach ensures changes are tracked systematically, and distillation creates focused, actionable stories with all necessary context.

## 💡 Why Forge?

Traditional prompting can be ad-hoc and miss important context. Forge helps you:

- **Build Comprehensive Context** - Systematically gather all relevant information
- **Maintain Consistency** - Use standardized formats across your project
- **Improve AI Accuracy** - Provide complete context for better AI-generated code
- **Create Traceable Documentation** - Link decisions, features, specs, and tasks
- **Reduce Rework** - Get it right the first time with well-structured prompts

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Watch mode for development
npm run watch

# Lint all packages
npm run lint

# Clean build artifacts
npm run clean
```

### Working with Individual Packages

```bash
# Build just the VSCode extension
npm run build -w forge

# Build just the MCP server
npm run build -w @forge/mcp-server

# Watch the MCP server
npm run dev -w @forge/mcp-server
```

## 📚 Documentation

- [VSCode Extension README](./packages/vscode-extension/README.md)
- [MCP Server README](./packages/mcp-server/README.md)
- [File Format Examples](./EXAMPLES.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)

## 🎯 Best Practices

1. **Start with Sessions** - Begin each design phase with a clear problem statement
2. **Use Forge Studio** - Visual interface makes creating and organizing files easier
3. **Organize with Folders** - Group related features and specs in nested folders
4. **Link Everything** - Use IDs to create relationships between files (features ↔ specs ↔ contexts)
5. **Keep Stories Small** - Target < 30 minutes per story for better focus and completion
6. **Review Before Distilling** - Ensure your design (features/specs) is complete before generating stories
7. **Define Actors** - Document who interacts with your system for better feature clarity
8. **Use Contexts** - Create context files to guide technical implementation decisions

## 🔮 Future Plans

- Real-time file editing in Studio (currently requires save/reload)
- Drag-and-drop folder reorganization
- Visualization of feature/spec/model relationships
- Template customization for different project types
- Validation and linting for file formats
- Export to various documentation formats (PDF, Confluence, etc.)
- Story execution tracking and status updates
- Enhanced MCP server capabilities with more specialized tools
- AI-assisted content generation for features and specs

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- Submit issues for bugs or feature requests
- Create pull requests with improvements
- Share your experiences and use cases

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Credits

Created by alto9 to provide structured context engineering for AI-assisted development with Cursor IDE.

---

**Note**: Forge generates prompts for AI agents rather than executing tasks directly. This gives you full control and visibility into what's being requested, ensuring quality and allowing for customization before execution.
