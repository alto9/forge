---
spec_id: session-state-management
feature_id:
  - real-time-session-updates
---

# Spec: Session State Management

## Overview
Defines how session state is managed in Forge Studio, including state synchronization between extension and webview, state persistence, and real-time updates.

## State Architecture

### Extension-Side State

```typescript
class SessionStateManager {
  private activeSession: Session | null = null;
  private sessionCache: Map<string, Session> = new Map();
  private stateChangeEmitter = new vscode.EventEmitter<SessionStateChange>();
  
  readonly onDidChangeState = this.stateChangeEmitter.event;
  
  getActiveSession(): Session | null {
    return this.activeSession;
  }
  
  async setActiveSession(session: Session): Promise<void> {
    const oldSession = this.activeSession;
    this.activeSession = session;
    
    // Cache session
    this.sessionCache.set(session.session_id, session);
    
    // Emit change event
    this.stateChangeEmitter.fire({
      type: 'sessionActivated',
      oldSession,
      newSession: session
    });
    
    // Persist to workspace state
    await this.persistState();
  }
  
  clearActiveSession(): void {
    const oldSession = this.activeSession;
    this.activeSession = null;
    
    this.stateChangeEmitter.fire({
      type: 'sessionCleared',
      oldSession,
      newSession: null
    });
  }
  
  async loadSession(sessionId: string): Promise<Session | null> {
    // Check cache first
    if (this.sessionCache.has(sessionId)) {
      return this.sessionCache.get(sessionId)!;
    }
    
    // Load from disk
    const sessionPath = `ai/sessions/${sessionId}.session.md`;
    const session = await sessionLoader.loadSession(sessionPath);
    
    if (session) {
      this.sessionCache.set(sessionId, session);
    }
    
    return session;
  }
  
  private async persistState(): Promise<void> {
    const context = this.extensionContext;
    
    await context.workspaceState.update('forge.activeSessionId', 
      this.activeSession?.session_id
    );
    
    await context.workspaceState.update('forge.activeSessionPath', 
      this.activeSession?.path
    );
  }
  
  async restoreState(): Promise<void> {
    const context = this.extensionContext;
    const sessionId = context.workspaceState.get<string>('forge.activeSessionId');
    
    if (sessionId) {
      const session = await this.loadSession(sessionId);
      if (session && session.status === 'design') {
        await this.setActiveSession(session);
      }
    }
  }
}
```

### Webview-Side State (Zustand Store)

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ForgeState {
  // Session state
  activeSession: Session | null;
  sessions: Session[];
  isLoadingSession: boolean;
  
  // Actions
  setActiveSession: (session: Session) => void;
  clearActiveSession: () => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  setSessions: (sessions: Session[]) => void;
  
  // Computed
  isSessionActive: () => boolean;
  getChangedFileCount: () => number;
  isFileModified: (path: string) => boolean;
}

export const useForgeStore = create<ForgeState>()(
  devtools(
    (set, get) => ({
      // Initial state
      activeSession: null,
      sessions: [],
      isLoadingSession: false,
      
      // Actions
      setActiveSession: (session) => {
        set({ activeSession: session });
      },
      
      clearActiveSession: () => {
        set({ activeSession: null });
      },
      
      updateSession: (sessionId, updates) => {
        set(state => {
          if (state.activeSession?.session_id === sessionId) {
            return {
              activeSession: { ...state.activeSession, ...updates }
            };
          }
          
          return {
            sessions: state.sessions.map(s =>
              s.session_id === sessionId ? { ...s, ...updates } : s
            )
          };
        });
      },
      
      setSessions: (sessions) => {
        set({ sessions });
      },
      
      // Computed
      isSessionActive: () => {
        return get().activeSession !== null;
      },
      
      getChangedFileCount: () => {
        return get().activeSession?.changed_files?.length || 0;
      },
      
      isFileModified: (path) => {
        const session = get().activeSession;
        if (!session) return false;
        
        return session.changed_files.some(f => f.path === path);
      }
    }),
    { name: 'ForgeStore' }
  )
);
```

## State Synchronization

### Extension to Webview Sync

```typescript
class StateSync {
  constructor(
    private webviewPanel: vscode.WebviewPanel,
    private stateManager: SessionStateManager
  ) {
    // Listen for state changes
    stateManager.onDidChangeState(change => {
      this.syncToWebview(change);
    });
  }
  
  private syncToWebview(change: SessionStateChange): void {
    switch (change.type) {
      case 'sessionActivated':
        this.webviewPanel.webview.postMessage({
          type: 'setActiveSession',
          session: change.newSession
        });
        break;
        
      case 'sessionCleared':
        this.webviewPanel.webview.postMessage({
          type: 'clearActiveSession'
        });
        break;
        
      case 'sessionUpdated':
        this.webviewPanel.webview.postMessage({
          type: 'updateSession',
          sessionId: change.newSession.session_id,
          updates: change.updates
        });
        break;
    }
  }
  
  async syncAllToWebview(): Promise<void> {
    const activeSession = this.stateManager.getActiveSession();
    
    this.webviewPanel.webview.postMessage({
      type: 'initializeState',
      activeSession
    });
  }
}
```

### Webview to Extension Commands

```typescript
// Webview side
export const useSessionCommands = () => {
  const vscode = acquireVsCodeApi();
  
  const startSession = (problemStatement: string) => {
    vscode.postMessage({
      command: 'startSession',
      problemStatement
    });
  };
  
  const endSession = (sessionId: string) => {
    vscode.postMessage({
      command: 'endSession',
      sessionId
    });
  };
  
  const updateSession = (sessionId: string, updates: Partial<Session>) => {
    vscode.postMessage({
      command: 'updateSession',
      sessionId,
      updates
    });
  };
  
  return { startSession, endSession, updateSession };
};

// Extension side
class WebviewMessageHandler {
  async handleMessage(message: any): Promise<void> {
    switch (message.command) {
      case 'startSession':
        await this.startSession(message.problemStatement);
        break;
        
      case 'endSession':
        await this.endSession(message.sessionId);
        break;
        
      case 'updateSession':
        await this.updateSession(message.sessionId, message.updates);
        break;
    }
  }
  
  private async startSession(problemStatement: string): Promise<void> {
    const sessionId = generateSessionId();
    const sessionPath = `ai/sessions/${sessionId}.session.md`;
    
    const session: Session = {
      session_id: sessionId,
      start_time: new Date(),
      status: SessionStatus.DESIGN,
      problem_statement: problemStatement,
      changed_files: [],
      path: sessionPath
    };
    
    // Write session file
    await writeSession(sessionPath, session);
    
    // Activate session
    await this.stateManager.setActiveSession(session);
    
    // Start file watching
    this.fileWatcher.startWatchingSession(sessionPath);
  }
  
  private async endSession(sessionId: string): Promise<void> {
    const session = await this.stateManager.loadSession(sessionId);
    if (!session) return;
    
    // Update status
    await updateSessionStatus(session.path, SessionStatus.SCRIBE, {
      end_time: new Date().toISOString()
    });
    
    // Clear active session
    this.stateManager.clearActiveSession();
    
    // Stop watching
    this.fileWatcher.stopWatchingSession();
  }
}
```

## State Persistence

### Workspace State

```typescript
interface PersistedState {
  activeSessionId: string | null;
  activeSessionPath: string | null;
  lastOpenedSession: string | null;
  sessionHistory: string[];
}

class StatePersistence {
  constructor(private context: vscode.ExtensionContext) {}
  
  async saveState(state: PersistedState): Promise<void> {
    await this.context.workspaceState.update('forge.state', state);
  }
  
  async loadState(): Promise<PersistedState> {
    const state = this.context.workspaceState.get<PersistedState>('forge.state');
    
    return state || {
      activeSessionId: null,
      activeSessionPath: null,
      lastOpenedSession: null,
      sessionHistory: []
    };
  }
  
  async clearState(): Promise<void> {
    await this.context.workspaceState.update('forge.state', undefined);
  }
}
```

### Session Recovery on Startup

```typescript
async function recoverSessionOnStartup(
  stateManager: SessionStateManager,
  persistence: StatePersistence
): Promise<void> {
  const state = await persistence.loadState();
  
  if (state.activeSessionId) {
    try {
      const session = await stateManager.loadSession(state.activeSessionId);
      
      // Only restore if still in design status
      if (session && session.status === 'design') {
        await stateManager.setActiveSession(session);
        
        // Resume file watching
        fileWatcher.startWatchingSession(session.path);
        
        vscode.window.showInformationMessage(
          `Resumed design session: ${session.session_id}`
        );
      } else {
        // Clear stale state
        await persistence.clearState();
      }
    } catch (error) {
      console.error('Failed to recover session:', error);
      await persistence.clearState();
    }
  }
}
```

## State Updates and Mutations

### Immutable Updates

```typescript
// Correct: Immutable update
const updateChangedFiles = (
  session: Session,
  newFile: ChangeEntry
): Session => {
  return {
    ...session,
    changed_files: [...session.changed_files, newFile]
  };
};

// Incorrect: Mutable update (DON'T DO THIS)
const updateChangedFilesMutable = (
  session: Session,
  newFile: ChangeEntry
): Session => {
  session.changed_files.push(newFile);  // WRONG: Mutates state
  return session;
};
```

### State Update Batching

```typescript
class StateUpdateBatcher {
  private pendingUpdates: Map<string, Partial<Session>> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;
  
  queueUpdate(sessionId: string, updates: Partial<Session>): void {
    const existing = this.pendingUpdates.get(sessionId) || {};
    this.pendingUpdates.set(sessionId, { ...existing, ...updates });
    
    this.scheduleFlush();
  }
  
  private scheduleFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, 100);  // Batch within 100ms
  }
  
  private flush(): void {
    for (const [sessionId, updates] of this.pendingUpdates.entries()) {
      stateManager.updateSession(sessionId, updates);
    }
    
    this.pendingUpdates.clear();
    this.flushTimer = null;
  }
}
```

## State Validation

### Session State Validator

```typescript
class SessionStateValidator {
  validate(session: Session): ValidationResult {
    const errors: string[] = [];
    
    // Required fields
    if (!session.session_id) {
      errors.push('session_id is required');
    }
    if (!session.start_time) {
      errors.push('start_time is required');
    }
    if (!session.status) {
      errors.push('status is required');
    }
    
    // Status validation
    const validStatuses = ['design', 'scribe', 'development', 'completed'];
    if (!validStatuses.includes(session.status)) {
      errors.push(`Invalid status: ${session.status}`);
    }
    
    // changed_files validation
    if (!Array.isArray(session.changed_files)) {
      errors.push('changed_files must be an array');
    }
    
    // Status-specific validation
    if (session.status !== 'design' && !session.end_time) {
      errors.push('end_time required for non-design sessions');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

## Performance Optimization

### Memoization and Caching

```typescript
// Webview side
export const useSessionState = () => {
  const session = useForgeStore(state => state.activeSession);
  
  // Memoize changed files map
  const changedFilesMap = useMemo(() => {
    if (!session) return new Map();
    
    const map = new Map();
    for (const file of session.changed_files) {
      map.set(file.path, file);
    }
    return map;
  }, [session?.changed_files]);
  
  // Memoize file check function
  const isModified = useCallback((path: string) => {
    return changedFilesMap.has(path);
  }, [changedFilesMap]);
  
  return { session, isModified, changedFilesMap };
};
```

### Selective Re-renders

```typescript
// Only re-render when specific state changes
export const useSessionStatus = () => {
  return useForgeStore(
    state => state.activeSession?.status,
    shallow
  );
};

export const useChangedFileCount = () => {
  return useForgeStore(
    state => state.activeSession?.changed_files?.length || 0,
    shallow
  );
};
```

## Constraints

1. **Single Source of Truth**: Extension state is the source of truth
2. **Immutable Updates**: All state updates must be immutable
3. **Sync Required**: Webview state must stay in sync with extension
4. **Validation**: All state changes must be validated
5. **Performance**: State updates must not block UI
6. **Recovery**: Must recover active session on extension restart
7. **Cleanup**: Must clean up state when sessions end

