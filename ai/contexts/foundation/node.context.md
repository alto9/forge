---
context_id: node
category: foundation
name: Node.js Development Guidance
description: Guidance for Node.js development in the Forge project
---

# Node.js Development Context

## When to Use This Context

Use this context when:
- Developing Node.js applications for Forge
- Working with TypeScript in Node.js
- Managing dependencies and build processes
- Implementing file system operations

## Node.js Development Patterns

```gherkin
Scenario: Implement Node.js application
  Given you are building a Node.js application
  When implementing core functionality
  Then use TypeScript for type safety
  And implement proper error handling
  And use async/await for asynchronous operations
  And follow Node.js best practices

Scenario: Handle file system operations
  Given you need to work with files
  When implementing file operations
  Then use fs/promises for async operations
  And handle file not found errors gracefully
  And validate file paths for security
  And implement proper cleanup
```

## Technical Requirements

### Node.js Version
- **Minimum**: Node.js 22.14.0
- **Package Manager**: npm 10.0.0+
- **TypeScript**: 5.0.0+

### Dependencies
- **Core**: `@modelcontextprotocol/sdk`, `gray-matter`, `zod`
- **Build**: TypeScript, ESLint, Webpack
- **Development**: `tsx` for development, `vitest` for testing

### File System Operations
- Use `fs/promises` for async file operations
- Handle file not found errors gracefully
- Validate file paths for security
- Implement proper error boundaries

## Best Practices

### TypeScript Usage
- Use strict type checking
- Define proper interfaces for data structures
- Use Zod for runtime validation
- Implement proper error types

### Async Operations
- Use async/await consistently
- Handle Promise rejections properly
- Implement proper timeout handling
- Use proper error propagation

### File Operations
- Validate file paths before operations
- Handle file system errors gracefully
- Implement proper cleanup
- Use appropriate file permissions
