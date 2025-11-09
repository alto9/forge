---
context_id: theme
category: vscode
name: VSCode Extension Theme Guidance
description: Guidance for VSCode extension theming and UI consistency
---

# VSCode Extension Theme Context

## When to Use This Context

Use this context when:
- Designing VSCode extension UI components
- Implementing consistent theming
- Creating webview interfaces
- Ensuring accessibility and usability

## VSCode Extension UI Patterns

```gherkin
Scenario: Implement VSCode extension UI
  Given you are building a VSCode extension
  When implementing user interfaces
  Then use VSCode's built-in theming system
  And follow VSCode UI guidelines
  And ensure accessibility compliance
  And maintain consistent styling

Scenario: Create webview interfaces
  Given you need a custom UI in VSCode
  When creating webview panels
  Then use React for component structure
  And implement proper VSCode theming
  And handle webview lifecycle properly
  And ensure responsive design
```

## Technical Implementation

### VSCode Extension Structure
- **Main Extension**: TypeScript with VSCode API
- **Webview**: React components with esbuild
- **Theming**: VSCode's built-in theme variables
- **Commands**: Command palette integration

### UI Components
- **Forge Studio**: Main webview interface
- **Dashboard**: Overview of Forge objects
- **File Management**: Create/edit Forge files
- **Session Management**: Track design sessions

### Theming Integration
- Use VSCode's CSS variables for theming
- Support light and dark themes
- Implement proper contrast ratios
- Handle theme changes dynamically

## Best Practices

### VSCode Integration
- Follow VSCode UI guidelines
- Use proper command registration
- Implement context menu integration
- Handle extension lifecycle properly

### Webview Development
- Use React for component structure
- Implement proper state management
- Handle webview communication
- Ensure responsive design

### Accessibility
- Implement proper ARIA labels
- Ensure keyboard navigation
- Support screen readers
- Maintain proper contrast ratios
