---
spec_id: session-change-tracking
feature_id: []
---

# Spec: Session Change Tracking

## Overview
Defines how Forge tracks file changes during design sessions using scenario-level tracking for features only.

## Implementation

### Changed Files Format

The `changed_files` array in session files tracks **feature changes only** with scenario-level detail:

```typescript
interface SessionFrontmatter {
  session_id: string;
  start_time: string;
  end_time?: string;
  status: 'design' | 'scribe' | 'development' | 'completed';
  problem_statement: string;
  changed_files: FeatureChangeEntry[];  // Only features, with scenario detail
}
```

### Example Session File

```yaml
---
session_id: user-authentication-improvements
start_time: '2025-11-11T10:00:00.000Z'
status: design
problem_statement: Add two-factor authentication and improve login error handling
changed_files:
  - path: ai/features/auth/user-login.feature.md
    change_type: modified
    scenarios_added:
      - "User logs in with two-factor authentication"
    scenarios_modified:
      - "User logs in with email and password"
---
```

### File Tracking

The Studio tracks **only feature file changes** during a design session:
- Features are tracked with scenario-level detail
- Specs, Diagrams, Models, Actors, and Contexts are NOT tracked
- Changed features are input for forge-scribe command
- Visual indicators shown for changed features in Studio UI

## Tracking Structure

### Feature File Entry

```typescript
interface FeatureChangeEntry {
  path: string;                      // Relative path from workspace root
  change_type: 'added' | 'modified'; // Type of change
  scenarios_added?: string[];        // Scenario names that were added
  scenarios_modified?: string[];     // Scenario names that were modified
  scenarios_removed?: string[];      // Scenario names that were removed
}
```

**Note**: Only features are tracked in sessions. Specs, Diagrams, Models, Actors, and Contexts are always editable and NOT tracked.

### Scenario Extraction from Features

#### Parsing Gherkin Scenarios

```typescript
function extractScenarios(featureContent: string): string[] {
  const scenarioPattern = /^\s*Scenario:\s*(.+)$/gm;
  const scenarios: string[] = [];
  
  let match;
  while ((match = scenarioPattern.exec(featureContent)) !== null) {
    scenarios.push(match[1].trim());
  }
  
  return scenarios;
}
```

### Detecting Scenario Changes

```typescript
interface ScenarioChanges {
  added: string[];
  modified: string[];
  removed: string[];
}

function detectScenarioChanges(
  oldContent: string,
  newContent: string
): ScenarioChanges {
  const oldScenarios = extractScenarios(oldContent);
  const newScenarios = extractScenarios(newContent);
  
  // Extract scenario names and content
  const oldMap = buildScenarioMap(oldContent);
  const newMap = buildScenarioMap(newContent);
  
  const added: string[] = [];
  const modified: string[] = [];
  const removed: string[] = [];
  
  // Find added and modified scenarios
  for (const [name, content] of Object.entries(newMap)) {
    if (!oldMap[name]) {
      added.push(name);
    } else if (oldMap[name] !== content) {
      modified.push(name);
    }
  }
  
  // Find removed scenarios
  for (const name of Object.keys(oldMap)) {
    if (!newMap[name]) {
      removed.push(name);
    }
  }
  
  return { added, modified, removed };
}

function buildScenarioMap(content: string): Record<string, string> {
  const map: Record<string, string> = {};
  const scenarioBlocks = content.split(/^\s*Scenario:/gm);
  
  for (let i = 1; i < scenarioBlocks.length; i++) {
    const block = scenarioBlocks[i];
    const lines = block.split('\n');
    const name = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    map[name] = content;
  }
  
  return map;
}
```

### File Watching and Change Detection

#### FileSystemWatcher Setup

```typescript
import * as vscode from 'vscode';

class SessionFileTracker {
  private watcher: vscode.FileSystemWatcher | undefined;
  private fileBaseline: Map<string, string> = new Map();
  
  async startTracking(workspaceRoot: string) {
    // Watch ONLY feature files
    const pattern = '**/ai/features/**/*.feature.md';
    
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceRoot, pattern)
    );
    
    watcher.onDidCreate(uri => this.handleFileCreate(uri));
    watcher.onDidChange(uri => this.handleFileChange(uri));
    watcher.onDidDelete(uri => this.handleFileDelete(uri));
    
    this.watcher = watcher;
  }
  
  private async handleFileCreate(uri: vscode.Uri) {
    const content = await vscode.workspace.fs.readFile(uri);
    const contentStr = Buffer.from(content).toString('utf-8');
    
    this.fileBaseline.set(uri.fsPath, contentStr);
    
    await this.recordChange(uri.fsPath, 'added', contentStr, '');
  }
  
  private async handleFileChange(uri: vscode.Uri) {
    const content = await vscode.workspace.fs.readFile(uri);
    const contentStr = Buffer.from(content).toString('utf-8');
    
    const oldContent = this.fileBaseline.get(uri.fsPath) || '';
    
    await this.recordChange(uri.fsPath, 'modified', contentStr, oldContent);
    
    this.fileBaseline.set(uri.fsPath, contentStr);
  }
  
  private async recordChange(
    filePath: string,
    changeType: 'added' | 'modified',
    newContent: string,
    oldContent: string
  ) {
    const relativePath = vscode.workspace.asRelativePath(filePath);
    
    let changeEntry: any = {
      path: relativePath,
      change_type: changeType
    };
    
    // Extract scenario changes from feature file
    if (filePath.endsWith('.feature.md')) {
      const changes = detectScenarioChanges(oldContent, newContent);
      if (changes.added.length > 0) {
        changeEntry.scenarios_added = changes.added;
      }
      if (changes.modified.length > 0) {
        changeEntry.scenarios_modified = changes.modified;
      }
      if (changes.removed.length > 0) {
        changeEntry.scenarios_removed = changes.removed;
      }
    }
    
    await this.updateSessionFile(changeEntry);
  }
  
  private async updateSessionFile(changeEntry: any) {
    // Get active session file path
    const sessionPath = await this.getActiveSessionPath();
    if (!sessionPath) return;
    
    // Read session file
    const content = await fs.readFile(sessionPath, 'utf-8');
    const { data, content: body } = matter(content);
    
    // Update changed_files array
    if (!data.changed_files) {
      data.changed_files = [];
    }
    
    // Check if file already tracked
    const existingIndex = data.changed_files.findIndex(
      (entry: any) => entry.path === changeEntry.path
    );
    
    if (existingIndex >= 0) {
      // Merge with existing entry
      data.changed_files[existingIndex] = this.mergeChangeEntries(
        data.changed_files[existingIndex],
        changeEntry
      );
    } else {
      // Add new entry
      data.changed_files.push(changeEntry);
    }
    
    // Write back to session file
    const updated = matter.stringify(body, data);
    await fs.writeFile(sessionPath, updated, 'utf-8');
  }
  
  private mergeChangeEntries(existing: any, newEntry: any): any {
    const merged = { ...existing };
    
    // Merge scenario arrays
    if (newEntry.scenarios_added) {
      merged.scenarios_added = Array.from(new Set([
        ...(merged.scenarios_added || []),
        ...newEntry.scenarios_added
      ]));
    }
    if (newEntry.scenarios_modified) {
      merged.scenarios_modified = Array.from(new Set([
        ...(merged.scenarios_modified || []),
        ...newEntry.scenarios_modified
      ]));
    }
    if (newEntry.scenarios_removed) {
      merged.scenarios_removed = Array.from(new Set([
        ...(merged.scenarios_removed || []),
        ...newEntry.scenarios_removed
      ]));
    }
    
    // Merge section arrays
    if (newEntry.sections_modified) {
      merged.sections_modified = Array.from(new Set([
        ...(merged.sections_modified || []),
        ...newEntry.sections_modified
      ]));
    }
    
    return merged;
  }
}
```

### Example Session with Scenario Tracking

```yaml
---
session_id: user-authentication-improvements
start_time: '2025-11-10T10:00:00.000Z'
status: design
problem_statement: >-
  Add two-factor authentication and improve login error handling
changed_files:
  - path: ai/features/auth/user-login.feature.md
    change_type: modified
    scenarios_added:
      - "User logs in with two-factor authentication"
      - "User receives SMS code for 2FA"
    scenarios_modified:
      - "User logs in with email and password"
  - path: ai/features/auth/password-reset.feature.md
    change_type: added
    scenarios_added:
      - "User requests password reset"
      - "User resets password with valid token"
---
```

Note: Only features are tracked in sessions. Specs, Diagrams, Models, Actors, and Contexts are discovered via linkages during distillation.

## Constraints

1. **Feature-Only Tracking**: Only track files in `ai/features/**/*.feature.md`
2. **Scenario-Level Detail**: Track added/modified/removed scenarios within features
3. **No Duplicates**: Scenario names should not be duplicated in the same array
4. **Automatic Tracking**: Changes must be tracked automatically without user intervention
5. **Real-Time Updates**: Session file must update within 1 second of a file save
6. **Preserve Order**: Maintain order of changed_files entries (chronological)
7. **Merge Intelligently**: When a file is modified multiple times, merge the changes
8. **Relative Paths**: All paths are relative to workspace root
9. **Ignore Session Changes**: Do not track changes to the session file itself
10. **No Spec/Diagram Tracking**: Specs, Diagrams, Models, Actors, and Contexts are NOT tracked

