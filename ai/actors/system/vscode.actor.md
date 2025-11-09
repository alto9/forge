---
actor_id: vscode
name: VSCode
type: system
description: The VSCode system that Forge is installed upon
---

# VSCode Actor

## Profile
VSCode is the extension host environment that runs the Forge extension. It provides the platform infrastructure for Forge's session-driven context engineering workflow, including command execution, file system access, webview hosting, and user interface integration.

## Capabilities
- Extension hosting and lifecycle management
- Command palette and context menu integration
- Webview rendering for rich UI experiences (Forge Studio)
- File system operations and workspace management
- Output channel for prompt display
- Theme and styling integration
- Event system for file changes and user actions

## Responsibilities
- Host the Forge extension and provide runtime environment
- Execute Forge commands (Start Session, Distill Session, Build Story)
- Render Forge Studio webview interface
- Display generated prompts in output panel for copy/paste
- Provide file system access within workspace boundaries
- Track active sessions and file changes
- Integrate Forge UI with VSCode theme system
- Expose Forge functionality through command palette and context menus

## Characteristics
- **Platform**: Cross-platform desktop application (Windows, macOS, Linux)
- **Architecture**: Electron-based with extension host separation
- **Performance**: Optimized for developer workflows with fast file operations
- **Extensibility**: Rich extension API with webview support
- **Integration**: Deep workspace and file system integration
- **User Experience**: Familiar interface for developers

## Interfaces

### Command Palette
- `Foundry: Start Design Session`
- `Foundry: Distill Session into Stories and Tasks`
- `Foundry: Build Story Implementation`
- `Forge: Open Forge Studio`

### Context Menus
- Right-click on `sessions` folder → Start Design Session
- Right-click on `*.session.md` files → Distill Session
- Right-click on `*.story.md` files → Build Story Implementation

### Webview (Forge Studio)
- Dashboard with project overview
- File management for all Forge types
- Nested folder navigation
- Session-aware editing
- Real-time state management

### Output Panel
- Displays generated prompts
- Allows copy/paste to Agent window
- Shows command execution status

## Constraints
- **No Direct File Modification**: VSCode/Forge never modifies files directly
- **Prompt Generation Only**: Commands generate prompts for the AI Agent to execute
- **Workspace Boundaries**: All operations confined to workspace root
- **Session Enforcement**: File modifications require active session
- **Extension Sandboxing**: Limited access outside workspace

## Integration Points

### With Developer (Human Actor)
- Receives commands through UI interactions
- Displays generated prompts for copy/paste
- Provides visual feedback and navigation
- Hosts editing environment

### With AI Agent (System Actor)
- Generates structured prompts with complete context
- Includes MCP tool calls in prompts
- Provides file contents and linkages
- Ensures context completeness

### With MCP Server (System Actor)
- Prompts call MCP tools (get_forge_about, get_forge_schema, get_forge_context)
- MCP provides workflow guidance and schemas
- Enables intelligent prompt construction

### With File System
- Reads Forge files to build prompts
- Tracks file changes during sessions
- Navigates nestable folder structures
- Manages workspace organization

## Design Principles
1. **Indirect Modification**: Generate prompts, don't change files
2. **Complete Context**: Include all linked files in prompts
3. **User Control**: Developer copies/pastes prompts to Agent
4. **Session Awareness**: Track and enforce active session requirements
5. **Minimal Stories**: Generate prompts that create < 30 minute stories
6. **Theme Integration**: Match VSCode appearance and UX patterns
