---
spec_id: session-ui-indicators
feature_id:
  - session-visual-indicators
---

# Spec: Session UI Indicators

## Overview
Defines the visual indicators that highlight modified files and scenarios during active design sessions in Forge Studio.

**NOTE**: This spec describes both current implementation (file-level indicators) and planned enhancements (scenario-level indicators). The current implementation tracks `changed_files` as a simple string array. The scenario-level tracking with `change_type`, `scenarios_added`, etc. is planned but not yet implemented. See `session-change-tracking.spec.md` for details on current vs. planned implementation.

## Indicator Types

### Border Indicator for Modified Files (CURRENT IMPLEMENTATION)

Applied to file cards in list views (Features, Specs, Diagrams) when the file path appears in the session's `changed_files` array.

```typescript
interface BorderIndicator {
  position: 'left';
  width: '3px';
  color: string;
  style: 'solid';
}

const SESSION_BORDER_INDICATOR: BorderIndicator = {
  position: 'left',
  width: '3px',
  color: 'var(--vscode-charts-blue)',  // Blue in light, adjusted in dark
  style: 'solid'
};
```

### Badge Indicator for Change Type (PLANNED ENHANCEMENT)

Applied to file cards to show if they are new or modified. This requires the enhanced tracking format.

```typescript
interface BadgeIndicator {
  text: string;
  backgroundColor: string;
  textColor: string;
  size: 'sm';
}

const NEW_FILE_BADGE: BadgeIndicator = {
  text: 'New',
  backgroundColor: 'var(--vscode-charts-green)',
  textColor: 'white',
  size: 'sm'
};

const MODIFIED_FILE_BADGE: BadgeIndicator = {
  text: 'Modified',
  backgroundColor: 'var(--vscode-charts-blue)',
  textColor: 'white',
  size: 'sm'
};
```

### Scenario-Level Indicators

Applied within feature detail views to highlight scenario changes.

```typescript
const SCENARIO_INDICATORS = {
  added: {
    color: 'var(--vscode-charts-green)',
    icon: 'add',
    tooltip: 'Scenario added in current session'
  },
  modified: {
    color: 'var(--vscode-charts-yellow)',
    icon: 'edit',
    tooltip: 'Scenario modified in current session'
  },
  removed: {
    color: 'var(--vscode-charts-red)',
    icon: 'remove',
    tooltip: 'Scenario removed in current session'
  }
};
```

## UI Component Implementation

### Modified File Card

```tsx
interface FileCardProps {
  file: FeatureFile | SpecFile;
  isModified: boolean;
  changeType?: 'added' | 'modified';
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  isModified,
  changeType
}) => {
  return (
    <div
      className={cn(
        'file-card',
        isModified && 'file-card--modified'
      )}
      style={{
        borderLeft: isModified
          ? '3px solid var(--vscode-charts-blue)'
          : undefined
      }}
    >
      <div className="file-card__header">
        <span className="file-card__title">{file.name}</span>
        {changeType && (
          <Badge
            text={changeType === 'added' ? 'New' : 'Modified'}
            variant={changeType === 'added' ? 'success' : 'info'}
          />
        )}
      </div>
      {/* Rest of card content */}
    </div>
  );
};
```

### Scenario List with Indicators

```tsx
interface ScenarioListProps {
  scenarios: Scenario[];
  changedScenarios: {
    added: string[];
    modified: string[];
    removed: string[];
  };
}

export const ScenarioList: React.FC<ScenarioListProps> = ({
  scenarios,
  changedScenarios
}) => {
  const getScenarioChangeType = (scenarioName: string) => {
    if (changedScenarios.added.includes(scenarioName)) return 'added';
    if (changedScenarios.modified.includes(scenarioName)) return 'modified';
    if (changedScenarios.removed.includes(scenarioName)) return 'removed';
    return null;
  };

  return (
    <div className="scenario-list">
      {scenarios.map(scenario => {
        const changeType = getScenarioChangeType(scenario.name);
        return (
          <div
            key={scenario.name}
            className={cn(
              'scenario-item',
              changeType && `scenario-item--${changeType}`
            )}
          >
            {changeType && (
              <span
                className="scenario-item__indicator"
                style={{
                  backgroundColor: SCENARIO_INDICATORS[changeType].color
                }}
                title={SCENARIO_INDICATORS[changeType].tooltip}
              />
            )}
            <span className="scenario-item__name">{scenario.name}</span>
          </div>
        );
      })}
    </div>
  );
};
```

## State Management

### Session Indicator Context

```typescript
interface SessionIndicatorState {
  activeSessionId: string | null;
  changedFiles: Map<string, ChangeEntry>;
  isModified: (filePath: string) => boolean;
  getChangeType: (filePath: string) => 'added' | 'modified' | null;
  getScenarioChanges: (filePath: string) => ScenarioChanges | null;
}

// CURRENT IMPLEMENTATION (Simple string array)
const useSessionIndicators = (): SessionIndicatorState => {
  const { activeSession } = useForgeStore();
  
  const changedFiles = useMemo(() => {
    if (!activeSession) return new Set();
    
    const set = new Set();
    for (const filePath of activeSession.changed_files) {
      set.add(filePath);
    }
    return set;
  }, [activeSession]);
  
  const isModified = useCallback((filePath: string) => {
    return changedFiles.has(filePath);
  }, [changedFiles]);
  
  return {
    activeSessionId: activeSession?.session_id || null,
    changedFiles,
    isModified
  };
};

// PLANNED ENHANCEMENT (Object-based tracking with scenario details)
const useSessionIndicatorsEnhanced = (): SessionIndicatorState => {
  const { activeSession } = useForgeStore();
  
  const changedFiles = useMemo(() => {
    if (!activeSession) return new Map();
    
    const map = new Map();
    for (const entry of activeSession.changed_files) {
      map.set(entry.path, entry);
    }
    return map;
  }, [activeSession]);
  
  const isModified = useCallback((filePath: string) => {
    return changedFiles.has(filePath);
  }, [changedFiles]);
  
  const getChangeType = useCallback((filePath: string) => {
    const entry = changedFiles.get(filePath);
    return entry?.change_type || null;
  }, [changedFiles]);
  
  const getScenarioChanges = useCallback((filePath: string) => {
    const entry = changedFiles.get(filePath);
    if (!entry) return null;
    
    return {
      added: entry.scenarios_added || [],
      modified: entry.scenarios_modified || [],
      removed: entry.scenarios_removed || []
    };
  }, [changedFiles]);
  
  return {
    activeSessionId: activeSession?.session_id || null,
    changedFiles,
    isModified,
    getChangeType,
    getScenarioChanges
  };
};
```

### Integration with File Lists

```tsx
export const FeaturesList: React.FC = () => {
  const features = useFeatures();
  const { isModified, getChangeType } = useSessionIndicators();
  
  return (
    <div className="features-list">
      {features.map(feature => (
        <FileCard
          key={feature.id}
          file={feature}
          isModified={isModified(feature.path)}
          changeType={getChangeType(feature.path)}
        />
      ))}
    </div>
  );
};
```

## CSS Styles

### Indicator Styles

```css
.file-card--modified {
  border-left: 3px solid var(--vscode-charts-blue);
  transition: border-color 0.2s ease;
}

.file-card--modified:hover {
  border-left-color: var(--vscode-charts-blue);
  filter: brightness(1.1);
}

.scenario-item__indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.scenario-item--added .scenario-item__indicator {
  background-color: var(--vscode-charts-green);
}

.scenario-item--modified .scenario-item__indicator {
  background-color: var(--vscode-charts-yellow);
}

.scenario-item--removed .scenario-item__indicator {
  background-color: var(--vscode-charts-red);
}
```

## Color Scheme

### VSCode Theme Variables

Use VSCode theme colors for consistency across themes:

| Indicator | Light Theme | Dark Theme | Variable |
|-----------|-------------|------------|----------|
| Session Border | Blue (#3B82F6) | Blue (#60A5FA) | `--vscode-charts-blue` |
| Scenario Added | Green (#10B981) | Green (#34D399) | `--vscode-charts-green` |
| Scenario Modified | Yellow (#F59E0B) | Yellow (#FBBF24) | `--vscode-charts-yellow` |
| Scenario Removed | Red (#EF4444) | Red (#F87171) | `--vscode-charts-red` |

### Fallback Colors

If VSCode theme variables are not available:

```css
:root {
  --forge-indicator-blue: #3B82F6;
  --forge-indicator-green: #10B981;
  --forge-indicator-yellow: #F59E0B;
  --forge-indicator-red: #EF4444;
}

@media (prefers-color-scheme: dark) {
  :root {
    --forge-indicator-blue: #60A5FA;
    --forge-indicator-green: #34D399;
    --forge-indicator-yellow: #FBBF24;
    --forge-indicator-red: #F87171;
  }
}
```

## Real-Time Updates

### Indicator Update Flow

1. Session file is modified (changed_files array updated)
2. File watcher detects change and notifies webview
3. Webview updates session state
4. React components re-render with new indicators
5. UI updates within 500ms

```typescript
// Extension side
sessionFileWatcher.onDidChange(async (uri) => {
  const session = await loadSession(uri.fsPath);
  
  webviewPanel.webview.postMessage({
    type: 'sessionUpdated',
    session
  });
});

// Webview side
useEffect(() => {
  const handler = (event: MessageEvent) => {
    if (event.data.type === 'sessionUpdated') {
      setActiveSession(event.data.session);
    }
  };
  
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, []);
```

## Performance Considerations

### Optimizations

1. **Memoization**: Use `useMemo` for changed files map
2. **Callback Stability**: Use `useCallback` for indicator check functions
3. **Efficient Lookups**: Use Map for O(1) file path lookups
4. **Batch Updates**: Debounce session file changes (500ms)
5. **Lazy Rendering**: Only render indicators for visible items (virtual scrolling)

### Memory Management

```typescript
// Clear indicators when session ends
useEffect(() => {
  if (!activeSession) {
    // Clear all indicator state
    setChangedFiles(new Map());
  }
}, [activeSession]);
```

## Constraints

1. **Theme Consistency**: Use VSCode theme variables for all colors
2. **Performance**: Indicators must not impact list rendering performance
3. **Accessibility**: Indicators must have proper ARIA labels and tooltips
4. **Persistence**: Indicators only show during active sessions
5. **Accuracy**: Indicators must reflect actual session state at all times

