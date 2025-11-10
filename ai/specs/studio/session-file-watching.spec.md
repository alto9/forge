---
spec_id: session-file-watching
feature_id:
  - real-time-session-updates
context_id: []
---

# Spec: Session File Watching

## Overview
Defines how Forge monitors session files for external changes and propagates updates to the Studio UI in real-time.

## File System Watcher Architecture

### Watcher Components

```typescript
class SessionFileWatcherService {
  private sessionWatcher: vscode.FileSystemWatcher | undefined;
  private changeDebouncer: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(
    private webviewManager: WebviewManager,
    private sessionManager: SessionManager
  ) {}
  
  startWatchingSession(sessionPath: string): void {
    // Create watcher for specific session file
    this.sessionWatcher = vscode.workspace.createFileSystemWatcher(
      sessionPath,
      false,  // Watch creates
      false,  // Watch changes
      false   // Watch deletes
    );
    
    this.sessionWatcher.onDidChange(uri => {
      this.handleSessionChange(uri);
    });
    
    this.sessionWatcher.onDidDelete(uri => {
      this.handleSessionDelete(uri);
    });
  }
  
  stopWatchingSession(): void {
    if (this.sessionWatcher) {
      this.sessionWatcher.dispose();
      this.sessionWatcher = undefined;
    }
    
    // Clear any pending debounced updates
    for (const timeout of this.changeDebouncer.values()) {
      clearTimeout(timeout);
    }
    this.changeDebouncer.clear();
  }
  
  private handleSessionChange(uri: vscode.Uri): void {
    const path = uri.fsPath;
    
    // Debounce rapid changes
    if (this.changeDebouncer.has(path)) {
      clearTimeout(this.changeDebouncer.get(path)!);
    }
    
    const timeout = setTimeout(async () => {
      await this.reloadAndNotify(path);
      this.changeDebouncer.delete(path);
    }, 500);
    
    this.changeDebouncer.set(path, timeout);
  }
  
  private async reloadAndNotify(sessionPath: string): Promise<void> {
    try {
      // Reload session from disk
      const session = await this.sessionManager.loadSession(sessionPath);
      
      // Notify webview
      this.webviewManager.postMessage({
        type: 'sessionUpdated',
        session
      });
      
      // Update extension state
      if (session.status === 'design') {
        this.sessionManager.setActiveSession(session);
      } else {
        this.sessionManager.clearActiveSession();
      }
    } catch (error) {
      console.error('Failed to reload session:', error);
      this.webviewManager.postMessage({
        type: 'sessionError',
        message: 'Failed to reload session file'
      });
    }
  }
  
  private handleSessionDelete(uri: vscode.Uri): void {
    this.webviewManager.postMessage({
      type: 'sessionDeleted',
      path: uri.fsPath
    });
    
    this.sessionManager.clearActiveSession();
    this.stopWatchingSession();
  }
}
```

## Debouncing Strategy

### Debounce Configuration

```typescript
interface DebounceConfig {
  sessionFileChanges: 500;  // ms
  bulkChanges: 1000;        // ms for multiple rapid changes
}

const DEBOUNCE_CONFIG: DebounceConfig = {
  sessionFileChanges: 500,
  bulkChanges: 1000
};
```

### Debounce Implementation

```typescript
class ChangeDebouncer {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  
  debounce(
    key: string,
    callback: () => void | Promise<void>,
    delay: number
  ): void {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }
    
    // Set new timer
    const timer = setTimeout(async () => {
      await callback();
      this.timers.delete(key);
    }, delay);
    
    this.timers.set(key, timer);
  }
  
  flush(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }
  
  flushAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}
```

## Message Protocol

### Extension to Webview Messages

```typescript
type ExtensionToWebviewMessage =
  | SessionUpdatedMessage
  | SessionDeletedMessage
  | SessionErrorMessage
  | SessionStatusChangedMessage;

interface SessionUpdatedMessage {
  type: 'sessionUpdated';
  session: Session;
}

interface SessionDeletedMessage {
  type: 'sessionDeleted';
  path: string;
}

interface SessionErrorMessage {
  type: 'sessionError';
  message: string;
}

interface SessionStatusChangedMessage {
  type: 'sessionStatusChanged';
  sessionId: string;
  oldStatus: SessionStatus;
  newStatus: SessionStatus;
}
```

### Webview Message Handler

```typescript
// Webview side
export const useSessionFileWatcher = () => {
  const { setActiveSession, clearActiveSession } = useForgeStore();
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const message = event.data as ExtensionToWebviewMessage;
      
      switch (message.type) {
        case 'sessionUpdated':
          setIsLoading(true);
          setActiveSession(message.session);
          setIsLoading(false);
          break;
          
        case 'sessionDeleted':
          clearActiveSession();
          vscode.postMessage({
            type: 'showError',
            message: 'Active session file was deleted'
          });
          break;
          
        case 'sessionError':
          vscode.postMessage({
            type: 'showError',
            message: message.message
          });
          break;
          
        case 'sessionStatusChanged':
          // Handle status change with animation
          await handleStatusChange(
            message.sessionId,
            message.oldStatus,
            message.newStatus
          );
          break;
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  return { isLoading };
};
```

## Session Loading and Parsing

### Session File Loader

```typescript
class SessionLoader {
  async loadSession(sessionPath: string): Promise<Session> {
    const content = await fs.readFile(sessionPath, 'utf-8');
    const { data, content: body } = matter(content);
    
    // Validate session structure
    this.validateSessionData(data);
    
    // Parse session
    const session: Session = {
      session_id: data.session_id,
      start_time: new Date(data.start_time),
      end_time: data.end_time ? new Date(data.end_time) : undefined,
      status: data.status as SessionStatus,
      problem_statement: data.problem_statement,
      changed_files: data.changed_files || [],
      start_commit: data.start_commit,
      path: sessionPath
    };
    
    // Parse markdown sections
    session.goals = this.extractSection(body, 'Goals');
    session.approach = this.extractSection(body, 'Approach');
    session.key_decisions = this.extractSection(body, 'Key Decisions');
    session.notes = this.extractSection(body, 'Notes');
    
    return session;
  }
  
  private validateSessionData(data: any): void {
    const required = ['session_id', 'start_time', 'status', 'problem_statement'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Session missing required field: ${field}`);
      }
    }
    
    const validStatuses = ['design', 'scribe', 'development', 'completed'];
    if (!validStatuses.includes(data.status)) {
      throw new Error(`Invalid session status: ${data.status}`);
    }
  }
  
  private extractSection(content: string, sectionName: string): string {
    const regex = new RegExp(`^## ${sectionName}\\s*\\n([\\s\\S]*?)(?=^## |$)`, 'm');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }
}
```

## Watch Lifecycle Management

### Start Watching on Session Activate

```typescript
async function activateSession(sessionId: string): Promise<void> {
  const sessionPath = `ai/sessions/${sessionId}.session.md`;
  
  // Load session
  const session = await sessionLoader.loadSession(sessionPath);
  
  // Set as active
  sessionManager.setActiveSession(session);
  
  // Start watching
  sessionFileWatcher.startWatchingSession(sessionPath);
  
  // Notify webview
  webviewManager.postMessage({
    type: 'sessionActivated',
    session
  });
}
```

### Stop Watching on Session End

```typescript
async function endSession(sessionId: string): Promise<void> {
  // Stop watching
  sessionFileWatcher.stopWatchingSession();
  
  // Update session status
  const sessionPath = `ai/sessions/${sessionId}.session.md`;
  await updateSessionStatus(sessionPath, SessionStatus.SCRIBE, {
    end_time: new Date().toISOString()
  });
  
  // Clear active session
  sessionManager.clearActiveSession();
  
  // Notify webview
  webviewManager.postMessage({
    type: 'sessionEnded',
    sessionId
  });
}
```

## Error Handling

### File Read Errors

```typescript
async function safeLoadSession(sessionPath: string): Promise<Session | null> {
  try {
    return await sessionLoader.loadSession(sessionPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File not found
      console.error(`Session file not found: ${sessionPath}`);
      return null;
    } else if (error.code === 'EACCES') {
      // Permission denied
      console.error(`Permission denied reading session: ${sessionPath}`);
      vscode.window.showErrorMessage(
        'Permission denied reading session file'
      );
      return null;
    } else {
      // Parse error or other
      console.error(`Error loading session: ${error.message}`);
      vscode.window.showErrorMessage(
        `Failed to load session: ${error.message}`
      );
      return null;
    }
  }
}
```

### Concurrent Edit Detection

```typescript
class ConcurrentEditDetector {
  private lastKnownContent: Map<string, string> = new Map();
  
  async detectConflict(
    sessionPath: string,
    expectedContent: string
  ): Promise<boolean> {
    const currentContent = await fs.readFile(sessionPath, 'utf-8');
    const lastKnown = this.lastKnownContent.get(sessionPath);
    
    if (lastKnown && lastKnown !== expectedContent && currentContent !== expectedContent) {
      // File was modified by both user and external process
      return true;
    }
    
    this.lastKnownContent.set(sessionPath, currentContent);
    return false;
  }
  
  async resolveConflict(sessionPath: string): Promise<void> {
    const options = ['Keep Current', 'Reload from Disk', 'Show Diff'];
    const choice = await vscode.window.showWarningMessage(
      'Session file was modified externally. What would you like to do?',
      ...options
    );
    
    if (choice === 'Reload from Disk') {
      await reloadSession(sessionPath);
    } else if (choice === 'Show Diff') {
      await showSessionDiff(sessionPath);
    }
  }
}
```

## Performance Considerations

### Optimization Strategies

1. **Debounce Rapid Changes**: Group changes within 500ms window
2. **Parse Once**: Cache parsed session data
3. **Selective Updates**: Only update changed parts of UI
4. **Lazy Loading**: Don't load full file contents for metadata
5. **Batch Notifications**: Send one update for multiple changes

### Memory Management

```typescript
class SessionCache {
  private cache: Map<string, { session: Session; timestamp: number }> = new Map();
  private readonly TTL = 60000; // 1 minute
  
  set(sessionPath: string, session: Session): void {
    this.cache.set(sessionPath, {
      session,
      timestamp: Date.now()
    });
  }
  
  get(sessionPath: string): Session | null {
    const entry = this.cache.get(sessionPath);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(sessionPath);
      return null;
    }
    
    return entry.session;
  }
  
  invalidate(sessionPath: string): void {
    this.cache.delete(sessionPath);
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

## Constraints

1. **Single Session Watch**: Only watch one active session file at a time
2. **Debounce Required**: Must debounce changes to prevent excessive updates
3. **Error Resilience**: Must handle file errors gracefully
4. **Clean Disposal**: Must dispose watchers when no longer needed
5. **Conflict Detection**: Must detect and resolve concurrent edits
6. **Performance**: Updates must complete within 1 second

