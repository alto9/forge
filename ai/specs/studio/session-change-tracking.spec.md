---
spec_id: session-change-tracking
feature_id: []
context_id: []
---

# Spec: Session Change Tracking

## Overview
Defines how Forge tracks file changes during design sessions. Currently implements simple file path tracking. Scenario-level granular tracking is planned for future enhancement.

## Current Implementation

### Changed Files Format

The `changed_files` array in session files is currently a **simple array of file path strings**:

```typescript
interface SessionFrontmatter {
  session_id: string;
  start_time: string;
  end_time?: string;
  status: 'design' | 'scribe' | 'development' | 'completed';
  problem_statement: string;
  changed_files: string[];  // Simple array of relative file paths
}
```

### Example Session File

```yaml
---
session_id: navigation-fixes
start_time: '2025-11-10T03:40:24.249Z'
status: design
problem_statement: navigation fixes
changed_files:
  - ai/diagrams/studio/navigation-menu-structure.diagram.md
  - ai/specs/studio/navigation-menu-implementation.spec.md
---
```

### File Tracking

The Studio tracks which files were modified during a design session by adding their relative paths to the `changed_files` array. This provides:
- A list of all design files modified during the session
- Input for the forge-scribe command to analyze changes
- Visual indicators in the Studio UI

## Future Enhancement: Scenario-Level Tracking

The following enhanced tracking format is planned but **not yet implemented**:

### Feature File Entry (Planned)

```typescript
interface FeatureChangeEntry {
  path: string;                      // Relative path from workspace root
  change_type: 'added' | 'modified'; // Type of change
  scenarios_added?: string[];        // Scenario names that were added
  scenarios_modified?: string[];     // Scenario names that were modified
  scenarios_removed?: string[];      // Scenario names that were removed
}
```

### Spec File Entry (Planned)

```typescript
interface SpecChangeEntry {
  path: string;
  change_type: 'added' | 'modified';
  sections_modified?: string[];      // Section headers that were modified
  description?: string;              // Brief description of changes
}
```

### Diagram File Entry (Planned)

```typescript
interface DiagramChangeEntry {
  path: string;
  change_type: 'added' | 'modified';
  description: string;               // Description from diagram frontmatter
}
```

### Model File Entry (Planned)

```typescript
interface ModelChangeEntry {
  path: string;
  change_type: 'added' | 'modified';
  description?: string;
}
```

### Scenario Extraction from Features (Planned Implementation)

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

### Section Extraction from Specs (Planned Implementation)

#### Parsing Markdown Sections

```typescript
function extractSections(specContent: string): string[] {
  const sectionPattern = /^##\s+(.+)$/gm;
  const sections: string[] = [];
  
  let match;
  while ((match = sectionPattern.exec(specContent)) !== null) {
    sections.push(match[1].trim());
  }
  
  return sections;
}
```

### Detecting Section Changes

```typescript
function detectSectionChanges(
  oldContent: string,
  newContent: string
): string[] {
  const oldSections = buildSectionMap(oldContent);
  const newSections = buildSectionMap(newContent);
  
  const modified: string[] = [];
  
  // Check for added or modified sections
  for (const [name, content] of Object.entries(newSections)) {
    if (!oldSections[name] || oldSections[name] !== content) {
      modified.push(name);
    }
  }
  
  return modified;
}

function buildSectionMap(content: string): Record<string, string> {
  const map: Record<string, string> = {};
  const sections = content.split(/^##\s+/gm);
  
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const lines = section.split('\n');
    const name = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    map[name] = content;
  }
  
  return map;
}
```

### File Watching and Change Detection (Planned Implementation)

#### FileSystemWatcher Setup

```typescript
import * as vscode from 'vscode';

class SessionFileTracker {
  private watcher: vscode.FileSystemWatcher | undefined;
  private fileBaseline: Map<string, string> = new Map();
  
  async startTracking(workspaceRoot: string) {
    // Watch all design files
    const patterns = [
      '**/ai/features/**/*.feature.md',
      '**/ai/specs/**/*.spec.md',
      '**/ai/diagrams/**/*.diagram.md',
      '**/ai/models/**/*.model.md'
    ];
    
    for (const pattern of patterns) {
      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(workspaceRoot, pattern)
      );
      
      watcher.onDidCreate(uri => this.handleFileCreate(uri));
      watcher.onDidChange(uri => this.handleFileChange(uri));
      watcher.onDidDelete(uri => this.handleFileDelete(uri));
    }
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
    
    // Determine file type and extract details
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
    } else if (filePath.endsWith('.spec.md')) {
      const sections = detectSectionChanges(oldContent, newContent);
      if (sections.length > 0) {
        changeEntry.sections_modified = sections;
      }
    } else if (filePath.endsWith('.diagram.md')) {
      // Extract description from frontmatter
      const { data } = matter(newContent);
      changeEntry.description = data.title || 'Diagram updated';
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

### Example Session with Scenario Tracking (Planned Format)

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
  - path: ai/specs/auth/authentication-api.spec.md
    change_type: modified
    sections_modified:
      - "Login Endpoint"
      - "Two-Factor Authentication"
      - "Error Responses"
  - path: ai/diagrams/auth/2fa-flow.diagram.md
    change_type: added
    description: "Two-factor authentication flow diagram"
---
```

Note: This is the planned enhanced format. The current implementation uses a simple string array as shown in the "Current Implementation" section above.

## Current Constraints

1. **File-Level Tracking**: Currently tracks files as simple paths in an array
2. **No Duplicates**: File paths should not be duplicated in the array
3. **Only Track Design Files**: Only track files in ai/features, ai/specs, ai/diagrams, ai/models
4. **Relative Paths**: All paths are relative to workspace root

## Future Constraints (For Scenario-Level Tracking)

1. **Automatic Tracking**: Changes must be tracked automatically without user intervention
2. **Real-Time Updates**: Session file must update within 1 second of a file save
3. **No Duplicates**: Scenario names should not be duplicated in the same array
4. **Preserve Order**: Maintain order of changed_files entries (chronological)
5. **Merge Intelligently**: When a file is modified multiple times, merge the changes
6. **Ignore Session-Level Changes**: Do not track changes to the session file itself

