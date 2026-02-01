# Forge VSCode Extension

VSCode extension that helps engineers use proper context engineering to build and maintain software using Agentic development practices.

## Features

- **Forge: Start Design Session** - Begin a new design session with a problem statement
- **Forge: Distill Session into Stories and Tasks** - Convert completed sessions into actionable work items
- **Forge: Build Story Implementation** - Generate implementation prompts for specific stories
- **Forge: Open Forge Studio** - Full-featured React-based UI for managing Forge files
  - **Dashboard**: View session status and object counts
  - **Sessions**: Create and manage design sessions
  - **Features**: Browse all features; create/edit requires active session
  - **Specs**: Browse all specs; create/edit requires active session
  - **Models**: Browse all models; create/edit requires active session
  - **Actors**: Document system actors and their responsibilities (always editable)
  - **Folder Management**: Create nested folders, navigate hierarchies
  - **File Creation**: Create new files with proper templates
  - **Context Menus**: Right-click folders to create subfolders
  - **Session-Aware**: Features/Specs/Models are read-only without session; Actors are always editable
- **Context Menu Integration** - Right-click on files and folders for quick access
- **Output Panel** - Clean, formatted prompts ready to copy and paste

## Installation

### From Source (Development)

```bash
# From the monorepo root
npm install
npm run build -w forge

# Package the extension (from root)
npm run vscode:package

# Install
code --install-extension packages/vscode-extension/forge-0.1.0.vsix
```

### From VSIX

```bash
code --install-extension forge-0.1.0.vsix
```

## Usage

### 🤖 Using AI Agents with Forge

Forge provides specialized AI personas/commands to help you design and build:

- **For Cursor Users**: Use `/forge-design` and `/forge-build` custom commands
- **For VSCode Users**: Use `@forge-design` and `@forge-build` chat participants

📖 **[Complete Guide: Using AI Agents with Forge](docs/USING-AI-AGENTS.md)**

This guide explains how to use AI agents to:
- Design features, diagrams, specs, and actors (`@forge-design` or `/forge-design`)
- Implement stories with full context (`@forge-build` or `/forge-build`)
- Workflow examples and best practices

---

### Start a Design Session

1. Open Command Palette (`Cmd/Ctrl+Shift+P`)
2. Type "Forge: Start Design Session"
3. Enter your problem statement
4. A new session file is created in `ai/sessions/`
5. You can now create and edit Forge files in the Studio

### Open Forge Studio

1. Open Command Palette (Cmd/Ctrl+Shift+P)
2. Type "Forge: Open Forge Studio"
3. The Studio opens with tabs for Dashboard, Sessions, Features, Specs, Models, and Actors

**Studio Workflows:**

- **Browsing and Reference** (No session required):
  1. Navigate to any category tab to browse existing files
  2. View Features, Specs, Models for reference
  3. Files are read-only without an active session

- **Creating Foundational Elements** (No session required):
  1. Navigate to Actors tab
  2. Create and edit at any time
  3. Define system vocabulary and guidance before design work

- **Creating Design Files** (Requires active session):
  1. Start a session from Dashboard or Sessions page
  2. Navigate to Features or Specs tab
  3. Create and edit during active session
  4. Changes are automatically tracked in session's changed_files

- **Organizing with Folders**:
  1. Right-click any folder in the tree (when session active for Features/Specs)
  2. Enter subfolder name (auto-kebab-cased)
  3. Navigate by clicking folders in the contents view

- **Editing Files**:
  1. Click a file in the contents view to open it
  2. Features/Specs/Models: Visible but read-only without session, editable with active session
  3. Actors: Always editable
  4. Edit frontmatter fields and content, then click "Save Changes"

### Distill Session into Stories and Tasks

1. Complete your design work in Studio
2. Stop the active session from Dashboard or Sessions page
3. Right-click on the `.session.md` file OR use Command Palette
4. Select "Forge: Distill Session into Stories and Tasks"
5. Copy the generated prompt
6. Paste into Cursor Agent to generate story and task files in `ai/tickets/<session-id>/`

### Build Story Implementation

1. Right-click on a `.story.md` file in `ai/tickets/`
2. Select "Forge: Build Story Implementation"
3. Copy the generated prompt (includes all linked features, specs, models, and actors)
4. Paste into Cursor Agent to implement the story

## Project Structure

Forge works with the following directory structure:

```
your-project/
└── ai/
    ├── sessions/      # Design session tracking (*.session.md)
    ├── features/      # Feature definitions with Gherkin (*.feature.md, nestable)
    ├── specs/         # Technical specifications (*.spec.md, nestable)
    ├── models/        # Data model definitions (*.model.md, nestable)
    ├── actors/        # Actor/persona definitions (*.actor.md, nestable)
    ├── tickets/       # Stories and Tasks (*.story.md, *.task.md, organized by session)
    └── docs/          # Supporting documentation
```

**Note**: All folders except `docs` and `tickets` are nestable, meaning you can create subfolders to organize your files hierarchically.

## Development

```bash
# From the monorepo root
npm install

# Build the extension
npm run build -w forge

# Watch mode (builds extension + webview)
npm run watch -w forge

# Lint
npm run lint -w forge

# Package for distribution
npm run vscode:package
```

## Architecture

```
src/
├── extension.ts                    # Extension entry point
├── commands/                       # Command implementations
│   ├── StartSessionCommand.ts      # Start design session
│   ├── DistillSessionCommand.ts    # Distill session to stories/tasks
│   └── BuildStoryCommand.ts        # Build story implementation
├── panels/                         # Webview panels
│   └── ForgeStudioPanel.ts          # Main Studio UI
├── webview/                        # React-based webview code
│   └── studio/
│       └── index.tsx               # Studio React app
└── utils/                          # Utilities
    ├── PromptGenerator.ts          # Prompt generation logic
    ├── FileParser.ts               # Frontmatter parsing
    └── GitUtils.ts                 # Git integration
```

**Key Technologies:**
- **VSCode Extension API** for commands and panels
- **React** for the Studio UI
- **WebView API** for embedded web UI
- **File System Watchers** for real-time updates
- **Gray Matter** for frontmatter parsing

## License

MIT

