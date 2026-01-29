# Using AI Agents with Forge

Forge provides specialized AI personas/commands to help you design documentation and implement code. The same instructions are available in both **Cursor** (custom commands) and **VSCode** (chat participants).

## For Cursor Users 🎯

Use Cursor's custom commands in the `.cursor/commands/` folder:

### `/forge-design` 📐
**Purpose**: Design features, diagrams, specs, and actors during a design session

**When to use**:
- Creating or modifying features with Gherkin scenarios
- Designing system diagrams with React Flow
- Writing technical specifications
- Defining system actors and personas

**How to use**:
1. Start a design session (create a `*.session.md` file)
2. Run `/forge-design` command in Cursor
3. Ask the AI to create or modify Forge documentation
4. All changes are tracked in your active session

**Example**:
```
/forge-design

Create a user-login feature with these scenarios:
- Successful login with valid credentials
- Failed login with invalid password
- Account locked after too many attempts
```

### `/forge-build` 🛠️
**Purpose**: Implement stories from `ai/tickets/` by analyzing code and documentation

**When to use**:
- Implementing a specific story file
- Writing code based on documented design
- Creating tests for new features
- Following existing codebase patterns

**How to use**:
1. Have a story file ready in `ai/tickets/`
2. Run `/forge-build` command in Cursor
3. Provide the story file path
4. AI implements the changes with tests

**Example**:
```
/forge-build

Implement ai/tickets/session-1/authentication-api.story.md
```

---

## For VSCode Users 💬

Use VSCode Chat participants (type `@` in chat to see available personas):

### `@forge-design` 📐
**Purpose**: Design features, diagrams, specs, and actors during a design session

**When to use**:
- Creating or modifying features with Gherkin scenarios
- Designing system diagrams with React Flow
- Writing technical specifications
- Defining system actors and personas

**How to use**:
1. Open VSCode Chat (Cmd/Ctrl+I)
2. Type `@forge-design` followed by your request
3. Ask the AI to create or modify Forge documentation
4. All changes are tracked in your active session

**Example**:
```
@forge-design Create a user-login feature with these scenarios:
- Successful login with valid credentials
- Failed login with invalid password
- Account locked after too many attempts
```

### `@forge-build` 🛠️
**Purpose**: Implement stories from `ai/tickets/` by analyzing code and documentation

**When to use**:
- Implementing a specific story file
- Writing code based on documented design
- Creating tests for new features
- Following existing codebase patterns

**How to use**:
1. Open VSCode Chat (Cmd/Ctrl+I)
2. Type `@forge-build` followed by your request
3. Provide the story file path or attach it
4. AI implements the changes with tests

**Example**:
```
@forge-build Implement ai/tickets/session-1/authentication-api.story.md
```

### `@forge` (General Helper)
Main Forge assistant for:
- Getting help and guidance
- Understanding Forge concepts
- Checking session status
- General questions

---

## Workflow Example

Here's a complete workflow using either Cursor or VSCode:

### 1. Design Phase
**Cursor**: `/forge-design`  
**VSCode**: `@forge-design`

"Create a user authentication feature with login, logout, and password reset scenarios"

The AI will:
- Create feature files with Gherkin scenarios
- Design authentication flow diagrams
- Write technical specs for the API
- Track all changes in your session

### 2. Build Phase
**Cursor**: `/forge-build`  
**VSCode**: `@forge-build`

"Implement the login-api.story.md"

The AI will:
- Read the story and linked documentation
- Analyze existing codebase patterns
- Implement the authentication endpoints
- Write unit tests
- Mark the story as completed

---

## Tips for Best Results

### For Design Sessions
- Start with a clear problem statement
- Describe the user's perspective (what they want to do)
- Reference existing features or patterns when relevant
- Ask the AI to link related specs and diagrams

### For Build Sessions
- Ensure your story file is well-defined
- Have related features and specs documented
- Let the AI analyze the codebase first
- Review generated tests carefully

---

## Differences Between Cursor and VSCode

| Aspect | Cursor | VSCode |
|--------|--------|--------|
| **How to invoke** | `/forge-design` or `/forge-build` | `@forge-design` or `@forge-build` |
| **Interface** | Custom commands | Chat participants |
| **Setup** | Commands auto-created by Forge | Personas auto-registered by extension |
| **Instructions** | Identical | Identical |
| **Capabilities** | Same | Same |

**Both provide the same powerful AI-assisted workflow!**

---

## Getting Help

- **@forge** (VSCode) or ask in chat - General questions and guidance
- Check the [Forge Documentation](https://github.com/alto9/forge)
- Review existing features and specs in `ai/` folder as examples

## Next Steps

1. Create a new session file in `ai/sessions/`
2. Use `@forge-design` or `/forge-design` to design features
3. Let Forge distill your session into stories
4. Use `@forge-build` or `/forge-build` to implement stories
5. Save and commit your work

**Happy building with Forge! 🔨**
