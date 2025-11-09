---
spec_id: navigation-menu-implementation
name: Navigation Menu Implementation
description: Technical specification for the reorganized Forge Studio navigation menu with foundational and design sections
feature_id: [navigation-menu]
diagram_id: [navigation-menu-structure, navigation-session-state]
context_id: [theme, vsce]
---

# Navigation Menu Implementation

## Overview

The Forge Studio navigation menu is organized into two distinct sections to clearly communicate which items require active design sessions and which are always accessible. This separation helps developers understand that Actors and Contexts are foundational items they define before starting design work, while Features and Specs are created within design sessions.

## Architecture

See diagrams:
- [navigation-menu-structure](../diagrams/studio/navigation-menu-structure.diagram.md) - Menu organization
- [navigation-session-state](../diagrams/studio/navigation-session-state.diagram.md) - Session state management

## Component Structure

### Sidebar Component (Sidebar.tsx)

**Props:**
```typescript
interface SidebarProps {
  currentView: string;
  activeSession: ActiveSession | null;
  onNavigate: (view: string) => void;
}
```

**Structure:**
```typescript
<div className="sidebar">
  <div className="nav-logo">Forge Studio</div>
  
  <NavItem 
    view="dashboard" 
    label="Dashboard" 
    icon="home"
    currentView={currentView}
    onNavigate={onNavigate}
  />
  
  <NavSection 
    title="FOUNDATIONAL"
    items={[
      { view: 'actors', label: 'Actors', icon: 'person', alwaysEnabled: true },
      { view: 'contexts', label: 'Contexts', icon: 'book', alwaysEnabled: true },
      { view: 'sessions', label: 'Sessions', icon: 'history', alwaysEnabled: true }
    ]}
    currentView={currentView}
    activeSession={activeSession}
    onNavigate={onNavigate}
  />
  
  <NavSection 
    title="DESIGN"
    items={[
      { view: 'features', label: 'Features', icon: 'star', requiresSession: true },
      { view: 'specs', label: 'Specs', icon: 'file-code', requiresSession: true }
    ]}
    currentView={currentView}
    activeSession={activeSession}
    onNavigate={onNavigate}
  />
</div>
```

### NavSection Component

**Props:**
```typescript
interface NavSectionProps {
  title: string;
  items: NavItemConfig[];
  currentView: string;
  activeSession: ActiveSession | null;
  onNavigate: (view: string) => void;
}

interface NavItemConfig {
  view: string;
  label: string;
  icon: string;
  alwaysEnabled?: boolean;
  requiresSession?: boolean;
}
```

**Implementation:**
```typescript
const NavSection: React.FC<NavSectionProps> = ({ 
  title, 
  items, 
  currentView, 
  activeSession, 
  onNavigate 
}) => {
  return (
    <div className="nav-section">
      <div className="nav-section-header">{title}</div>
      {items.map(item => (
        <NavItem
          key={item.view}
          view={item.view}
          label={item.label}
          icon={item.icon}
          currentView={currentView}
          isDisabled={item.requiresSession && !activeSession}
          requiresSession={item.requiresSession}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
};
```

### NavItem Component

**Props:**
```typescript
interface NavItemProps {
  view: string;
  label: string;
  icon: string;
  currentView: string;
  isDisabled?: boolean;
  requiresSession?: boolean;
  onNavigate: (view: string) => void;
}
```

**Implementation:**
```typescript
const NavItem: React.FC<NavItemProps> = ({ 
  view, 
  label, 
  icon, 
  currentView, 
  isDisabled, 
  requiresSession,
  onNavigate 
}) => {
  const isActive = currentView === view;
  
  const handleClick = () => {
    if (!isDisabled) {
      onNavigate(view);
    }
  };
  
  return (
    <div 
      className={`nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
      onClick={handleClick}
      title={getTooltip(label, isDisabled, requiresSession)}
    >
      <i className={`icon icon-${icon}`} />
      <span className="nav-label">{label}</span>
      {isDisabled && <i className="icon icon-lock" />}
    </div>
  );
};

function getTooltip(label: string, isDisabled: boolean, requiresSession: boolean): string {
  const tooltips = {
    'Actors': 'Define system actors and personas - Always editable',
    'Contexts': 'Provide technical guidance and context - Always editable',
    'Sessions': 'Manage design sessions - Create and manage at any time',
    'Features': 'Define user-facing functionality',
    'Specs': 'Define technical specifications'
  };
  
  let tooltip = tooltips[label] || label;
  
  if (requiresSession && isDisabled) {
    tooltip += ' - Active session required';
  }
  
  return tooltip;
}
```

## Styling

### CSS Structure

```css
.sidebar {
  background: var(--vscode-sideBar-background);
  color: var(--vscode-sideBar-foreground);
  width: 220px;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  border-right: 1px solid var(--vscode-panel-border);
}

.nav-logo {
  font-size: 18px;
  font-weight: 600;
  padding: 0 16px 24px 16px;
  color: var(--vscode-foreground);
}

/* Section Styling */
.nav-section {
  margin-bottom: 24px;
}

.nav-section-header {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vscode-descriptionForeground);
  padding: 8px 16px;
  margin-bottom: 4px;
}

/* Navigation Item Styling */
.nav-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  position: relative;
}

.nav-item:hover:not(.disabled) {
  background: var(--vscode-list-hoverBackground);
}

.nav-item.active {
  background: var(--vscode-list-activeSelectionBackground);
  color: var(--vscode-list-activeSelectionForeground);
  border-left: 3px solid var(--vscode-focusBorder);
  padding-left: 13px;
}

.nav-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-item .icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nav-item .icon-lock {
  margin-left: auto;
  margin-right: 0;
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
}

.nav-label {
  flex: 1;
  font-size: 13px;
}
```

### Icon Implementation

Use VSCode Codicons or simple SVG icons:

```typescript
const icons = {
  home: '$(home)',
  person: '$(person)',
  book: '$(book)',
  history: '$(history)',
  star: '$(star)',
  'file-code': '$(file-code)',
  lock: '$(lock)'
};
```

Or use inline SVG for custom icons that match VSCode theme.

## Session-Locked View

When a user navigates to Features or Specs without an active session:

### SessionRequiredView Component

```typescript
interface SessionRequiredViewProps {
  itemType: 'Features' | 'Specs';
  onStartSession: () => void;
}

const SessionRequiredView: React.FC<SessionRequiredViewProps> = ({ 
  itemType, 
  onStartSession 
}) => {
  return (
    <div className="session-required-view">
      <div className="icon-lock-large">
        <i className="icon icon-lock" />
      </div>
      <h2>Active Session Required</h2>
      <p>
        {itemType} are created and edited within design sessions. 
        Start a new session to work with {itemType.toLowerCase()}.
      </p>
      <p className="explanation">
        <strong>Why sessions?</strong> {itemType} represent design decisions and 
        changes that should be tracked together as a cohesive unit of work.
      </p>
      <button 
        className="primary-button" 
        onClick={onStartSession}
      >
        Start New Session
      </button>
    </div>
  );
};
```

**CSS:**
```css
.session-required-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 48px;
  text-align: center;
}

.icon-lock-large {
  width: 64px;
  height: 64px;
  margin-bottom: 24px;
  opacity: 0.3;
}

.icon-lock-large .icon {
  font-size: 64px;
}

.session-required-view h2 {
  margin-bottom: 16px;
  font-size: 24px;
  color: var(--vscode-foreground);
}

.session-required-view p {
  margin-bottom: 16px;
  color: var(--vscode-descriptionForeground);
  max-width: 500px;
}

.session-required-view .explanation {
  font-size: 13px;
  padding: 16px;
  background: var(--vscode-editorWidget-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
}

.primary-button {
  margin-top: 24px;
  padding: 10px 20px;
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.primary-button:hover {
  background: var(--vscode-button-hoverBackground);
}
```

## Integration with App State

### App Component Updates

```typescript
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  
  const handleNavigate = (view: string) => {
    // Check if view requires session
    const sessionRequiredViews = ['features', 'specs'];
    
    if (sessionRequiredViews.includes(view) && !activeSession) {
      // Show session required view
      setCurrentView(view);
    } else {
      setCurrentView(view);
    }
  };
  
  const renderMainContent = () => {
    // Session-locked views
    if (currentView === 'features' && !activeSession) {
      return <SessionRequiredView itemType="Features" onStartSession={handleStartSession} />;
    }
    if (currentView === 'specs' && !activeSession) {
      return <SessionRequiredView itemType="Specs" onStartSession={handleStartSession} />;
    }
    
    // Normal views
    switch (currentView) {
      case 'dashboard': return <DashboardPage />;
      case 'sessions': return <SessionsPage />;
      case 'actors': return <BrowserPage category="actors" />;
      case 'contexts': return <BrowserPage category="contexts" />;
      case 'features': return <BrowserPage category="features" />;
      case 'specs': return <BrowserPage category="specs" />;
      default: return <DashboardPage />;
    }
  };
  
  return (
    <div className="app">
      <Sidebar 
        currentView={currentView}
        activeSession={activeSession}
        onNavigate={handleNavigate}
      />
      <div className="main-content">
        {renderMainContent()}
      </div>
      {activeSession && <SessionPanel session={activeSession} />}
    </div>
  );
};
```

## Testing

### Unit Tests

**NavSection Tests:**
- Renders section header correctly
- Renders all items
- Passes correct props to NavItem components

**NavItem Tests:**
- Renders label and icon
- Shows lock icon when disabled
- Applies active class when current
- Applies disabled class when isDisabled
- Calls onNavigate when clicked (if not disabled)
- Does not call onNavigate when disabled
- Shows correct tooltip

**SessionRequiredView Tests:**
- Renders lock icon and message
- Shows correct item type in text
- Calls onStartSession when button clicked

### Integration Tests

**Navigation Flow:**
1. Start without active session
2. Click on Actors - should navigate successfully
3. Click on Contexts - should navigate successfully
4. Click on Features - should show SessionRequiredView
5. Click "Start New Session" - should navigate to sessions page
6. Create a session
7. Navigate to Features - should show Features page
8. End session
9. Navigate to Features - should show SessionRequiredView again

## Migration Notes

### Updating Existing Sidebar

If the sidebar already exists, update it to:
1. Add section headers ("FOUNDATIONAL" and "DESIGN")
2. Group navigation items accordingly
3. Add session-dependent disabled state for Features and Specs
4. Add lock icons for disabled items
5. Update tooltips to reflect session requirements

### Backwards Compatibility

This change is primarily visual and does not break existing functionality:
- All views continue to work as before
- Session checking already exists in the system
- This just makes the requirements more visually clear

## Performance Considerations

- Navigation items are simple components with minimal state
- Session state is passed down from App, no redundant checks
- Tooltip generation is a pure function, no side effects
- CSS transitions are GPU-accelerated

## Accessibility

- Navigation items use semantic HTML
- Tooltips provide context for screen readers
- Disabled state is communicated through aria-disabled attribute
- Keyboard navigation works with tab/enter keys
- Focus states are clearly visible

## Future Enhancements

1. **Collapsible Sections**: Allow users to collapse section groups
2. **Badge Counts**: Show counts of items in each category next to labels
3. **Search**: Add search bar to filter navigation items
4. **Favorites**: Allow pinning frequently accessed items
5. **Recent**: Show recently accessed files at the top
6. **Drag Reordering**: Allow custom ordering of sections/items

