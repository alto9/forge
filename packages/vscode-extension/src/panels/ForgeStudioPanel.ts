import * as vscode from 'vscode';
import * as path from 'path';
import { FileParser } from '../utils/FileParser';
import { PromptGenerator } from '../utils/PromptGenerator';
import { GitUtils } from '../utils/GitUtils';
import { CommandFileWriter } from '../utils/CommandFileWriter';
import { GherkinParser } from '../utils/GherkinParser';
import { FeatureChangeEntry } from '../types/FeatureChangeEntry';

interface ActiveSession {
    sessionId: string;
    problemStatement: string;
    startTime: string;
    changedFiles: FeatureChangeEntry[];
}

export class ForgeStudioPanel {
    public static currentPanel: ForgeStudioPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _projectUri: vscode.Uri;
    private readonly _output: vscode.OutputChannel;
    private _disposables: vscode.Disposable[] = [];
    private _activeSession: ActiveSession | null = null;
    private _fileWatcher: vscode.FileSystemWatcher | undefined;
    private _structureWatcher: vscode.FileSystemWatcher | undefined;
    private _fileBaselines: Map<string, string> = new Map();

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, projectUri: vscode.Uri, output: vscode.OutputChannel) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._projectUri = projectUri;
        this._output = output;

        this._update();
        
        // Load active session from disk (filesystem is source of truth)
        this._loadActiveSessionFromDisk().catch(err => {
            console.error('Failed to load active session from disk:', err);
        });
        
        // Start persistent structure watcher
        this._startStructureWatcher();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'getInitialState': {
                    this._panel.webview.postMessage({ type: 'initialState', data: await this._getInitialState() });
                    break;
                }
                case 'getCounts': {
                    const counts = await this._getCounts();
                    this._panel.webview.postMessage({ type: 'counts', data: counts });
                    break;
                }
                case 'getActiveSession': {
                    // Always reload from disk to ensure filesystem is source of truth
                    await this._loadActiveSessionFromDisk();
                    this._panel.webview.postMessage({ type: 'activeSession', data: this._activeSession });
                    break;
                }
                case 'listSessions': {
                    const sessions = await this._listSessions();
                    this._panel.webview.postMessage({ type: 'sessions', data: sessions });
                    break;
                }
                case 'createSession': {
                    await this._createSession(message.problemStatement);
                    break;
                }
                case 'updateSession': {
                    await this._updateSession(message.frontmatter, message.content);
                    break;
                }
                case 'stopSession': {
                    await this._stopSessionWithConfirmation();
                    break;
                }
                case 'endSession': {
                    await this._endSession(message.sessionId);
                    break;
                }
                case 'markComplete': {
                    await this._markSessionComplete(message.sessionId);
                    break;
                }
                case 'switchProject': {
                    if (message.data?.projectPath) {
                        this._projectUri = vscode.Uri.file(message.data.projectPath);
                        // Load active session for the new project
                        await this._loadActiveSessionFromDisk();
                        // Restart the structure watcher for the new project
                        this._startStructureWatcher();
                        this._panel.webview.postMessage({ type: 'initialState', data: await this._getInitialState() });
                        const counts = await this._getCounts();
                        this._panel.webview.postMessage({ type: 'counts', data: counts });
                        this._panel.webview.postMessage({ type: 'activeSession', data: this._activeSession });
                    }
                    break;
                }
                case 'getFolderTree': {
                    const tree = await this._getFolderTree(message.category);
                    this._panel.webview.postMessage({ type: 'folderTree', data: tree, category: message.category });
                    break;
                }
                case 'getFolderContents': {
                    const contents = await this._getFolderContents(message.folderPath, message.category);
                    this._panel.webview.postMessage({ type: 'folderContents', data: contents });
                    break;
                }
                case 'getFileContent': {
                    const content = await this._getFileContent(message.filePath);
                    this._panel.webview.postMessage({ type: 'fileContent', data: content });
                    break;
                }
                case 'saveFileContent': {
                    await this._saveFileContent(message.filePath, message.frontmatter, message.content);
                    break;
                }
                case 'createFolder': {
                    await this._createFolder(message.folderPath);
                    break;
                }
                case 'createFile': {
                    await this._createFile(message.folderPath, message.category, message.title);
                    break;
                }
                case 'promptCreateFolder': {
                    await this._promptCreateFolder(message.folderPath, message.category);
                    break;
                }
                case 'promptCreateFile': {
                    await this._promptCreateFile(message.folderPath, message.category);
                    break;
                }
                case 'openFile': {
                    await this._openFile(message.filePath);
                    break;
                }
                case 'checkFileExists': {
                    const exists = await this._checkFileExists(message.filePath);
                    this._panel.webview.postMessage({ 
                        type: 'fileExists', 
                        filePath: message.filePath,
                        exists 
                    });
                    break;
                }
                case 'getSpecs': {
                    console.log('ForgeStudioPanel: Received getSpecs request');
                    const specs = await this._listSpecs();
                    console.log('ForgeStudioPanel: Found specs:', specs.length, specs);
                    this._panel.webview.postMessage({ type: 'specs', data: specs });
                    break;
                }
                default:
                    break;
            }
        }, null, this._disposables);
    }

    public static render(extensionUri: vscode.Uri, projectUri: vscode.Uri, output: vscode.OutputChannel) {
        if (ForgeStudioPanel.currentPanel) {
            ForgeStudioPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
            return;
        }

        const projectName = path.basename(projectUri.fsPath);
        const panel = vscode.window.createWebviewPanel(
            'forgeStudio',
            `Forge Studio - ${projectName}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                ],
            }
        );

        // Hide the primary sidebar when Studio opens
        vscode.commands.executeCommand('workbench.action.closeSidebar');

        ForgeStudioPanel.currentPanel = new ForgeStudioPanel(panel, extensionUri, projectUri, output);
    }

    public dispose() {
        ForgeStudioPanel.currentPanel = undefined;
        this._panel.dispose();
        if (this._fileWatcher) {
            this._fileWatcher.dispose();
        }
        if (this._structureWatcher) {
            this._structureWatcher.dispose();
        }
        if (this._refreshTimeout) {
            clearTimeout(this._refreshTimeout);
        }
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _getInitialState(): Promise<{ projectPath: string }> {
        return { projectPath: this._projectUri.fsPath };
    }

    private _update() {
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'studio', 'main.js'));
        const reactFlowCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'studio', 'reactflow.css'));
        const projectName = path.basename(this._projectUri.fsPath);
        const nonce = getNonce();
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob: data:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline' ${webview.cspSource}; font-src ${webview.cspSource};" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Forge Studio - ${projectName}</title>
  <link rel="stylesheet" href="${reactFlowCssUri}" />
  <style>
    /* Base styles */
    html, body, #root { height: 100%; margin: 0; padding: 0; }
    body { 
      font-family: var(--vscode-font-family); 
      color: var(--vscode-editor-foreground); 
      background: var(--vscode-editor-background);
      font-size: 13px;
      line-height: 1.5;
    }
    
    /* Layout */
    .container { display: flex; height: 100%; }
    .sidebar { 
      width: 220px; 
      border-right: 1px solid var(--vscode-panel-border);
      background: var(--vscode-sideBar-background);
    }
    .main-content { flex: 1; overflow: auto; }
    
    /* Tree view styles */
    .tree-view { padding: 8px 0; }
    .tree-folder { 
      display: flex; 
      align-items: center; 
      padding: 4px 8px; 
      cursor: pointer;
      user-select: none;
    }
    .tree-folder:hover { background: var(--vscode-list-hoverBackground); }
    .tree-folder.selected { background: var(--vscode-list-activeSelectionBackground); }
    .tree-chevron {
      display: inline-block;
      width: 16px;
      text-align: center;
      font-size: 10px;
      transition: transform 0.1s;
    }
    .tree-chevron.expanded { transform: rotate(90deg); }
    .tree-label { margin-left: 4px; }
    .tree-children { padding-left: 16px; }
    
    /* Content sections */
    .content-section {
      padding: 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .content-section:last-child { border-bottom: none; }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    /* File list */
    .file-list-item {
      padding: 12px;
      margin-bottom: 8px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.1s;
    }
    .file-list-item:hover {
      background: var(--vscode-list-hoverBackground);
      border-color: var(--vscode-focusBorder);
    }
    .file-name {
      font-weight: 500;
      margin-bottom: 4px;
    }
    .file-meta {
      font-size: 11px;
      opacity: 0.7;
    }
    
    /* Form styles */
    .form-group {
      margin-bottom: 16px;
    }
    .form-label {
      display: block;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 500;
    }
    .form-input,
    .form-textarea {
      width: 100%;
      padding: 6px 8px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 3px;
      font-family: var(--vscode-font-family);
      font-size: 13px;
      box-sizing: border-box;
    }
    .form-input:focus,
    .form-textarea:focus {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: -1px;
    }
    .form-input:read-only,
    .form-textarea:read-only {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .form-textarea {
      resize: vertical;
      min-height: 200px;
      font-family: var(--vscode-editor-font-family);
    }
    
    /* Button styles */
    .btn {
      padding: 6px 14px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 13px;
      font-family: var(--vscode-font-family);
      transition: opacity 0.1s;
    }
    .btn:hover { opacity: 0.9; }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .btn-group {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    
    /* Card styles */
    .card {
      padding: 16px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      margin-bottom: 16px;
    }
    
    /* Split view */
    .split-view {
      display: flex;
      height: 100%;
    }
    .split-sidebar {
      width: 220px;
      border-right: 1px solid var(--vscode-panel-border);
      overflow: auto;
    }
    .split-content {
      flex: 1;
      overflow: auto;
    }
    
    /* Toolbar */
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
      background: var(--vscode-editor-background);
    }
    
    /* Empty state */
    .empty-state {
      padding: 48px 24px;
      text-align: center;
      opacity: 0.7;
    }
    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    /* Alert styles */
    .alert {
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 16px;
    }
    .alert-info {
      background: var(--vscode-inputValidation-infoBackground);
      border: 1px solid var(--vscode-inputValidation-infoBorder);
    }
    .alert-warning {
      background: var(--vscode-inputValidation-warningBackground);
      border: 1px solid var(--vscode-inputValidation-warningBorder);
    }
    
    /* Utility classes */
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .gap-8 { gap: 8px; }
    .gap-16 { gap: 16px; }
    .mb-8 { margin-bottom: 8px; }
    .mb-16 { margin-bottom: 16px; }
    .mt-16 { margin-top: 16px; }
    .p-16 { padding: 16px; }
    .text-sm { font-size: 12px; }
    .text-xs { font-size: 11px; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .opacity-70 { opacity: 0.7; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private async _getCounts(): Promise<{ sessions: number; features: number; diagrams: number; specs: number; actors: number; stories: number; tasks: number; }>
    {
        const sessions = await this._countRecursive(['ai', 'sessions'], (name) => name.endsWith('.session.md'));
        const features = await this._countRecursive(['ai', 'features'], (name) => name.endsWith('.feature.md'));
        const diagrams = await this._countRecursive(['ai', 'diagrams'], (name) => name.endsWith('.diagram.md'));
        const specs = await this._countRecursive(['ai', 'specs'], (name) => name.endsWith('.spec.md'));
        const actors = await this._countRecursive(['ai', 'actors'], (name) => name.endsWith('.actor.md'));
        const stories = await this._countRecursive(['ai', 'tickets'], (name) => name.endsWith('.story.md'));
        const tasks = await this._countRecursive(['ai', 'tickets'], (name) => name.endsWith('.task.md'));
        return { sessions, features, diagrams, specs, actors, stories, tasks };
    }

    private async _countRecursive(pathSegs: string[], predicate: (name: string) => boolean): Promise<number> {
        const root = vscode.Uri.joinPath(this._projectUri, ...pathSegs);
        return this._walkCount(root, predicate);
    }

    private async _walkCount(uri: vscode.Uri, predicate: (name: string) => boolean): Promise<number> {
        try {
            // Check if directory exists first to avoid VSCode logging ENOENT errors
            try {
                const stat = await vscode.workspace.fs.stat(uri);
                // If it's not a directory, return 0
                if (stat.type !== vscode.FileType.Directory) {
                    return 0;
                }
            } catch (statError: any) {
                // Directory doesn't exist or can't be accessed
                // Return 0 without attempting to read it (avoids VSCode's internal error logging)
                return 0;
            }

            // Directory exists, now read it
            const entries = await vscode.workspace.fs.readDirectory(uri);
            let count = 0;
            for (const [name, type] of entries) {
                const child = vscode.Uri.joinPath(uri, name);
                if (type === vscode.FileType.File) {
                    if (predicate(name)) count += 1;
                } else if (type === vscode.FileType.Directory) {
                    count += await this._walkCount(child, predicate);
                }
            }
            return count;
        } catch (error: any) {
            // This catch should rarely be hit now since we check existence first
            // But keep it as a safety net
            return 0;
        }
    }

    private async _listSessions(): Promise<any[]> {
        const sessionsDir = vscode.Uri.joinPath(this._projectUri, 'ai', 'sessions');
        const sessions: any[] = [];

        try {
            const files = await this._listFilesRecursive(sessionsDir, '.session.md');
            
            for (const file of files) {
                const content = await FileParser.readFile(file.fsPath);
                const parsed = FileParser.parseFrontmatter(content);
                const sessionId = parsed.frontmatter.session_id || path.basename(file.fsPath, '.session.md');
                
                // Migrate changed_files from old format if needed
                const migrationResult = this._migrateChangedFiles(parsed.frontmatter.changed_files);
                
                sessions.push({
                    sessionId,
                    filePath: file.fsPath,
                    frontmatter: {
                        ...parsed.frontmatter,
                        changed_files: migrationResult.entries
                    }
                });
            }
        } catch (error) {
            // Sessions directory doesn't exist yet
        }

        // Sort by start_time descending
        sessions.sort((a, b) => {
            const timeA = a.frontmatter?.start_time || '';
            const timeB = b.frontmatter?.start_time || '';
            return timeB.localeCompare(timeA);
        });

        return sessions;
    }

    private async _listSpecs(): Promise<Array<{ id: string; name: string }>> {
        const specsDir = vscode.Uri.joinPath(this._projectUri, 'ai', 'specs');
        const specs: Array<{ id: string; name: string }> = [];

        try {
            const files = await this._listFilesRecursive(specsDir, '.spec.md');
            
            for (const file of files) {
                const content = await FileParser.readFile(file.fsPath);
                const parsed = FileParser.parseFrontmatter(content);
                const specId = parsed.frontmatter.spec_id || path.basename(file.fsPath, '.spec.md');
                const name = parsed.frontmatter.name || specId;
                
                specs.push({
                    id: specId,
                    name: name
                });
            }
        } catch (error) {
            // Specs directory doesn't exist yet
        }

        // Sort alphabetically by name
        specs.sort((a, b) => a.name.localeCompare(b.name));

        return specs;
    }

    /**
     * Load active session from disk by scanning for session files with status: "active"
     * This makes the filesystem the source of truth for session state
     */
    private async _loadActiveSessionFromDisk(): Promise<void> {
        const sessionsDir = vscode.Uri.joinPath(this._projectUri, 'ai', 'sessions');
        
        try {
            const files = await this._listFilesRecursive(sessionsDir, '.session.md');
            
            for (const file of files) {
                const content = await FileParser.readFile(file.fsPath);
                const parsed = FileParser.parseFrontmatter(content);
                
                // Check if this session is in design status (active design session)
                if (parsed.frontmatter.status === 'design') {
                    const sessionId = parsed.frontmatter.session_id || path.basename(file.fsPath, '.session.md');
                    
                    // Migrate changed_files from old format if needed
                    const migrationResult = this._migrateChangedFiles(parsed.frontmatter.changed_files);
                    
                    // If migration occurred, optionally save the migrated session back to disk
                    if (migrationResult.wasMigrated) {
                        try {
                            const updatedFrontmatter = {
                                ...parsed.frontmatter,
                                changed_files: migrationResult.entries,
                                _migrated: true
                            };
                            const text = FileParser.stringifyFrontmatter(updatedFrontmatter, parsed.content);
                            await vscode.workspace.fs.writeFile(file, Buffer.from(text, 'utf-8'));
                        } catch (error) {
                            console.error('Failed to save migrated session:', error);
                        }
                    }
                    
                    // Load this as the active session
                    this._activeSession = {
                        sessionId,
                        problemStatement: parsed.frontmatter.problem_statement || '',
                        startTime: parsed.frontmatter.start_time || new Date().toISOString(),
                        changedFiles: migrationResult.entries
                    };
                    
                    // Start file watcher for this session
                    this._startFileWatcher();
                    
                    // Only take the first design session found
                    // If multiple exist, we take the first one (could log a warning)
                    return;
                }
            }
            
            // No active session found - clear any in-memory state
            this._activeSession = null;
            if (this._fileWatcher) {
                this._fileWatcher.dispose();
                this._fileWatcher = undefined;
            }
        } catch (error) {
            // Sessions directory doesn't exist yet or other error
            this._activeSession = null;
        }
    }

    private async _listFilesRecursive(dir: vscode.Uri, extension: string): Promise<vscode.Uri[]> {
        const files: vscode.Uri[] = [];
        
        try {
            const entries = await vscode.workspace.fs.readDirectory(dir);
            
            for (const [name, type] of entries) {
                const fullPath = vscode.Uri.joinPath(dir, name);
                if (type === vscode.FileType.File && name.endsWith(extension)) {
                    files.push(fullPath);
                } else if (type === vscode.FileType.Directory) {
                    files.push(...await this._listFilesRecursive(fullPath, extension));
                }
            }
        } catch {
            // Directory doesn't exist
        }
        
        return files;
    }

    private async _createSession(problemStatement: string) {
        const sessionId = this._generateId(problemStatement);
        const startTime = new Date().toISOString();
        
        // Ensure sessions directory exists
        const sessionsDir = vscode.Uri.joinPath(this._projectUri, 'ai', 'sessions');
        try {
            await vscode.workspace.fs.createDirectory(sessionsDir);
        } catch {
            // Directory already exists
        }

        // Create session folder (nested structure)
        const sessionFolder = vscode.Uri.joinPath(sessionsDir, sessionId);
        try {
            await vscode.workspace.fs.createDirectory(sessionFolder);
        } catch {
            // Directory already exists
        }

        // Try to get current git commit for precise diff tracking
        let startCommit: string | null = null;
        const isGitRepo = await GitUtils.isGitRepository(this._projectUri.fsPath);
        if (isGitRepo) {
            startCommit = await GitUtils.getCurrentCommit(this._projectUri.fsPath);
        }

        // Create session file inside session folder
        const sessionFile = vscode.Uri.joinPath(sessionFolder, `${sessionId}.session.md`);
        const frontmatter: any = {
            session_id: sessionId,
            start_time: startTime,
            end_time: null,
            status: 'design',
            problem_statement: problemStatement,
            // changed_files tracks only feature file changes with scenario-level detail.
            // Each entry is a FeatureChangeEntry with path, change_type, and optional
            // scenario arrays (scenarios_added, scenarios_modified, scenarios_removed).
            // Specs, diagrams, actors, and contexts are NOT tracked in sessions.
            changed_files: [] as FeatureChangeEntry[]
        };

        // Add start_commit if git is available
        if (startCommit) {
            frontmatter.start_commit = startCommit;
        }

        const content = `## Problem Statement

${problemStatement}

## Goals

(To be filled during the session)

## Approach

(To be filled during the session)

## Key Decisions

(Track important decisions made during the session)

## Notes

(Additional context, concerns, or considerations)
`;

        const text = FileParser.stringifyFrontmatter(frontmatter, content);
        await vscode.workspace.fs.writeFile(sessionFile, Buffer.from(text, 'utf-8'));

        // Set as active session
        this._activeSession = {
            sessionId,
            problemStatement,
            startTime,
            changedFiles: []
        };

        // Start file watcher for ai directory
        this._startFileWatcher();

        // Notify webview
        this._panel.webview.postMessage({ type: 'sessionCreated', data: this._activeSession });

        vscode.window.showInformationMessage(`Design session "${sessionId}" started!`);
    }

    /**
     * Start file watcher to track feature file changes during active design sessions.
     * Only feature files (*.feature.md) are tracked - specs, diagrams, models, actors, and contexts are not tracked.
     */
    private _startFileWatcher() {
        if (this._fileWatcher) {
            this._fileWatcher.dispose();
        }

        const pattern = new vscode.RelativePattern(
            path.join(this._projectUri.fsPath, 'ai'),
            '**/*.feature.md'
        );

        this._fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

        this._fileWatcher.onDidChange(uri => this._onFileChanged(uri));
        this._fileWatcher.onDidCreate(uri => this._onFileCreated(uri));

        this._disposables.push(this._fileWatcher);
        
        // Initialize baselines for existing feature files
        this._initializeFileBaselines().catch(err => {
            console.error('Failed to initialize file baselines:', err);
        });
    }
    
    /**
     * Initialize file baselines for existing feature files
     */
    private async _initializeFileBaselines(): Promise<void> {
        const featuresDir = vscode.Uri.joinPath(this._projectUri, 'ai', 'features');
        try {
            const files = await this._listFilesRecursive(featuresDir, '.feature.md');
            for (const file of files) {
                try {
                    const content = await FileParser.readFile(file.fsPath);
                    const relativePath = path.relative(this._projectUri.fsPath, file.fsPath);
                    this._fileBaselines.set(relativePath, content);
                } catch {
                    // File might not exist or be readable, skip
                }
            }
        } catch {
            // Features directory doesn't exist yet
        }
    }

    private _startStructureWatcher() {
        if (this._structureWatcher) {
            this._structureWatcher.dispose();
            // Remove from disposables if it was there
            const index = this._disposables.indexOf(this._structureWatcher);
            if (index > -1) {
                this._disposables.splice(index, 1);
            }
        }

        // Watch the entire ai directory for any file or directory changes
        const aiPath = vscode.Uri.joinPath(this._projectUri, 'ai');
        const pattern = new vscode.RelativePattern(aiPath, '**/*');

        console.log(`[Forge] Setting up structure watcher for: ${aiPath.fsPath}`);
        
        this._structureWatcher = vscode.workspace.createFileSystemWatcher(pattern);

        // Handle file/directory creation
        this._structureWatcher.onDidCreate(uri => {
            console.log(`[Forge] File/folder created: ${uri.fsPath}`);
            this._onStructureChanged();
        });

        // Handle file/directory deletion
        this._structureWatcher.onDidDelete(uri => {
            console.log(`[Forge] File/folder deleted: ${uri.fsPath}`);
            this._onStructureChanged();
        });

        // Handle file changes (for counts)
        this._structureWatcher.onDidChange(uri => {
            // Only refresh if it's a Forge file
            if (this._isForgeFile(uri.fsPath)) {
                console.log(`[Forge] Forge file changed: ${uri.fsPath}`);
                this._onStructureChanged();
            }
        });

        this._disposables.push(this._structureWatcher);
    }

    private _isForgeFile(filePath: string): boolean {
        return filePath.endsWith('.session.md') ||
               filePath.endsWith('.feature.md') ||
               filePath.endsWith('.spec.md') ||
               filePath.endsWith('.model.md') ||
               filePath.endsWith('.context.md') ||
               filePath.endsWith('.story.md') ||
               filePath.endsWith('.task.md');
    }

    /**
     * Check if a file or category is a foundational type (Actor, Context, Spec, or Diagram)
     * that doesn't require an active session to create/edit
     */
    private _isFoundationalFile(filePathOrCategory: string): boolean {
        return filePathOrCategory.includes('/actors/') || 
               filePathOrCategory.includes('\\actors\\') ||
               filePathOrCategory.includes('/specs/') || 
               filePathOrCategory.includes('\\specs\\') ||
               filePathOrCategory.includes('/diagrams/') || 
               filePathOrCategory.includes('\\diagrams\\') ||
               filePathOrCategory.endsWith('.actor.md') ||
               filePathOrCategory.endsWith('.spec.md') ||
               filePathOrCategory.endsWith('.diagram.md') ||
               filePathOrCategory === 'actors' ||
               filePathOrCategory === 'specs' ||
               filePathOrCategory === 'diagrams';
    }

    private async _onStructureChanged() {
        // Debounce rapid changes
        if (this._refreshTimeout) {
            clearTimeout(this._refreshTimeout);
        }

        this._refreshTimeout = setTimeout(async () => {
            console.log('[Forge] Structure changed - refreshing UI');
            // Refresh counts
            const counts = await this._getCounts();
            this._panel.webview.postMessage({ type: 'counts', data: counts });

            // Notify webview that structure changed so it can refresh trees
            this._panel.webview.postMessage({ type: 'structureChanged' });
        }, 300);
    }

    private _refreshTimeout: NodeJS.Timeout | undefined;

    private async _onFileCreated(uri: vscode.Uri) {
        if (!this._activeSession) {
            return;
        }

        const relativePath = path.relative(this._projectUri.fsPath, uri.fsPath);
        
        // Exclude session files from tracking
        if (relativePath.includes('.session.md')) {
            return;
        }
        
        // Only track feature files
        if (!relativePath.endsWith('.feature.md')) {
            return;
        }
        
        try {
            // Read the new file content
            const newContent = await FileParser.readFile(uri.fsPath);
            this._fileBaselines.set(relativePath, newContent);
            
            // Extract Gherkin from code blocks
            const gherkinBlocks = GherkinParser.extractFromCodeBlocks(newContent);
            const allGherkin = gherkinBlocks.join('\n\n');
            
            // Extract scenario names
            const scenarios = GherkinParser.extractScenarios(allGherkin);
            
            // Create change entry for new file
            const changeEntry: FeatureChangeEntry = {
                path: relativePath,
                change_type: 'added',
                scenarios_added: scenarios.length > 0 ? scenarios : undefined
            };
            
            // Check if file already tracked
            const existingIndex = this._activeSession.changedFiles.findIndex(
                entry => entry.path === relativePath
            );
            
            if (existingIndex >= 0) {
                // Merge with existing entry
                this._activeSession.changedFiles[existingIndex] = this._mergeChangeEntries(
                    this._activeSession.changedFiles[existingIndex],
                    changeEntry
                );
            } else {
                // Add new entry
                this._activeSession.changedFiles.push(changeEntry);
            }
            
            // Update the session file
            await this._updateSessionFile();

            // Notify webview
            this._panel.webview.postMessage({ type: 'activeSession', data: this._activeSession });
        } catch (error) {
            console.error('Failed to track file creation:', error);
        }
    }

    private async _onFileChanged(uri: vscode.Uri) {
        if (!this._activeSession) {
            return;
        }

        const relativePath = path.relative(this._projectUri.fsPath, uri.fsPath);
        
        // Exclude session files from tracking
        if (relativePath.includes('.session.md')) {
            return;
        }
        
        // Only track feature files
        if (!relativePath.endsWith('.feature.md')) {
            return;
        }
        
        try {
            // Read the new file content
            const newContent = await FileParser.readFile(uri.fsPath);
            const oldContent = this._fileBaselines.get(relativePath) || '';
            
            // Update baseline
            this._fileBaselines.set(relativePath, newContent);
            
            // Extract Gherkin from code blocks for both old and new content
            const oldGherkinBlocks = GherkinParser.extractFromCodeBlocks(oldContent);
            const newGherkinBlocks = GherkinParser.extractFromCodeBlocks(newContent);
            const oldGherkin = oldGherkinBlocks.join('\n\n');
            const newGherkin = newGherkinBlocks.join('\n\n');
            
            // Detect scenario changes
            const scenarioChanges = GherkinParser.detectScenarioChanges(oldGherkin, newGherkin);
            
            // Determine change type
            const isNewFile = oldContent === '';
            const changeType: 'added' | 'modified' = isNewFile ? 'added' : 'modified';
            
            // Create change entry
            const changeEntry: FeatureChangeEntry = {
                path: relativePath,
                change_type: changeType,
                scenarios_added: scenarioChanges.added.length > 0 ? scenarioChanges.added : undefined,
                scenarios_modified: scenarioChanges.modified.length > 0 ? scenarioChanges.modified : undefined,
                scenarios_removed: scenarioChanges.removed.length > 0 ? scenarioChanges.removed : undefined
            };
            
            // Check if file already tracked
            const existingIndex = this._activeSession.changedFiles.findIndex(
                entry => entry.path === relativePath
            );
            
            if (existingIndex >= 0) {
                // Merge with existing entry
                this._activeSession.changedFiles[existingIndex] = this._mergeChangeEntries(
                    this._activeSession.changedFiles[existingIndex],
                    changeEntry
                );
            } else {
                // Add new entry
                this._activeSession.changedFiles.push(changeEntry);
            }
            
            // Update the session file
            await this._updateSessionFile();

            // Notify webview
            this._panel.webview.postMessage({ type: 'activeSession', data: this._activeSession });
        } catch (error) {
            console.error('Failed to track file change:', error);
        }
    }
    
    /**
     * Merge two change entries, combining scenario arrays without duplicates
     */
    private _mergeChangeEntries(existing: FeatureChangeEntry, newEntry: FeatureChangeEntry): FeatureChangeEntry {
        // Union arrays without duplicates
        const mergeArrays = (arr1?: string[], arr2?: string[]): string[] | undefined => {
            const combined = [...(arr1 || []), ...(arr2 || [])];
            const unique = Array.from(new Set(combined));
            return unique.length > 0 ? unique : undefined;
        };
        
        // Determine final change type (if either is 'added', result is 'added', otherwise 'modified')
        const changeType: 'added' | 'modified' = 
            existing.change_type === 'added' || newEntry.change_type === 'added' ? 'added' : 'modified';
        
        return {
            path: existing.path,
            change_type: changeType,
            scenarios_added: mergeArrays(existing.scenarios_added, newEntry.scenarios_added),
            scenarios_modified: mergeArrays(existing.scenarios_modified, newEntry.scenarios_modified),
            scenarios_removed: mergeArrays(existing.scenarios_removed, newEntry.scenarios_removed)
        };
    }
    
    /**
     * Convert old format (string[]) to new format (FeatureChangeEntry[])
     * Initializes scenario arrays as empty arrays for migrated entries
     * @returns Object with migrated entries and flag indicating if migration occurred
     */
    private _migrateChangedFiles(changedFiles: any): { entries: FeatureChangeEntry[]; wasMigrated: boolean } {
        if (!Array.isArray(changedFiles)) {
            return { entries: [], wasMigrated: false };
        }
        
        // If it's already the new format, return as-is (but ensure scenario arrays exist)
        if (changedFiles.length > 0 && typeof changedFiles[0] === 'object' && changedFiles[0].path) {
            const normalized = (changedFiles as FeatureChangeEntry[]).map((entry: FeatureChangeEntry) => ({
                path: entry.path,
                change_type: entry.change_type,
                scenarios_added: entry.scenarios_added || [],
                scenarios_modified: entry.scenarios_modified || [],
                scenarios_removed: entry.scenarios_removed || []
            }));
            return { entries: normalized, wasMigrated: false };
        }
        
        // Convert old format (string[]) to new format
        const migrated = changedFiles
            .filter((item: any) => typeof item === 'string')
            .map((path: string): FeatureChangeEntry => ({
                path,
                change_type: 'modified',
                scenarios_added: [],
                scenarios_modified: [],
                scenarios_removed: []
            }));
        
        if (migrated.length > 0) {
            console.log('Migrated session from old format');
        }
        
        return { entries: migrated, wasMigrated: migrated.length > 0 };
    }

    private async _updateSessionFile() {
        if (!this._activeSession) {
            return;
        }

        const sessionFile = vscode.Uri.joinPath(
            this._projectUri, 
            'ai', 
            'sessions',
            this._activeSession.sessionId,
            `${this._activeSession.sessionId}.session.md`
        );

        try {
            const content = await FileParser.readFile(sessionFile.fsPath);
            const parsed = FileParser.parseFrontmatter(content);
            
            // Ensure changed_files is always an array
            parsed.frontmatter.changed_files = this._activeSession.changedFiles || [];
            
            const text = FileParser.stringifyFrontmatter(parsed.frontmatter, parsed.content);
            await vscode.workspace.fs.writeFile(sessionFile, Buffer.from(text, 'utf-8'));
        } catch (error) {
            console.error('Failed to update session file:', error);
        }
    }

    private async _updateSession(frontmatter: any, content: string) {
        if (!this._activeSession) {
            return;
        }

        const sessionFile = vscode.Uri.joinPath(
            this._projectUri,
            'ai',
            'sessions',
            this._activeSession.sessionId,
            `${this._activeSession.sessionId}.session.md`
        );

        try {
            // Update the frontmatter with editable fields
            const updatedFrontmatter = {
                ...frontmatter,
                // Preserve system-managed fields from active session
                session_id: this._activeSession.sessionId,
                start_time: this._activeSession.startTime,
                changed_files: this._activeSession.changedFiles || [],
                status: 'design'
            };

            const text = FileParser.stringifyFrontmatter(updatedFrontmatter, content);
            await vscode.workspace.fs.writeFile(sessionFile, Buffer.from(text, 'utf-8'));

            // Update in-memory session state with new problem statement if changed
            if (frontmatter.problem_statement !== this._activeSession.problemStatement) {
                this._activeSession.problemStatement = frontmatter.problem_statement;
            }

            // Notify webview of successful save
            this._panel.webview.postMessage({ 
                type: 'sessionUpdated', 
                data: { success: true, session: this._activeSession }
            });

            vscode.window.showInformationMessage('Session saved successfully');
        } catch (error) {
            console.error('Failed to update session:', error);
            this._panel.webview.postMessage({ 
                type: 'sessionUpdated', 
                data: { success: false, error: String(error) }
            });
            vscode.window.showErrorMessage(`Failed to save session: ${error}`);
        }
    }

    private async _stopSessionWithConfirmation() {
        if (!this._activeSession) {
            return;
        }

        // Show native VSCode confirmation dialog
        const confirmed = await vscode.window.showWarningMessage(
            `Are you sure you want to end the design session "${this._activeSession.sessionId}"?`,
            { modal: true },
            'End Session',
            'Cancel'
        );

        if (confirmed === 'End Session') {
            await this._stopSession();
        }
    }

    private async _stopSession() {
        if (!this._activeSession) {
            return;
        }

        const sessionId = this._activeSession.sessionId;
        const endTime = new Date().toISOString();

        // Update session file
        const sessionFile = vscode.Uri.joinPath(
            this._projectUri, 
            'ai', 
            'sessions',
            sessionId,
            `${sessionId}.session.md`
        );

        try {
            const content = await FileParser.readFile(sessionFile.fsPath);
            const parsed = FileParser.parseFrontmatter(content);
            
            parsed.frontmatter.end_time = endTime;
            parsed.frontmatter.status = 'scribe';
            // Ensure changed_files is always an array
            parsed.frontmatter.changed_files = this._activeSession.changedFiles || [];
            
            const text = FileParser.stringifyFrontmatter(parsed.frontmatter, parsed.content);
            await vscode.workspace.fs.writeFile(sessionFile, Buffer.from(text, 'utf-8'));

            // Stop file watcher
            if (this._fileWatcher) {
                this._fileWatcher.dispose();
                this._fileWatcher = undefined;
            }

            // Clear active session
            this._activeSession = null;

            // Notify webview
            this._panel.webview.postMessage({ type: 'sessionStopped' });

            vscode.window.showInformationMessage(`Design session "${sessionId}" ended. Status changed to 'scribe'. You can now run @forge-scribe to distill stories.`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to end session: ${error}`);
        }
    }

    private async _endSession(sessionId: string): Promise<void> {
        const sessionFile = vscode.Uri.joinPath(
            this._projectUri,
            'ai',
            'sessions',
            sessionId,
            `${sessionId}.session.md`
        );

        try {
            // Load session content
            const content = await FileParser.readFile(sessionFile.fsPath);
            const parsed = FileParser.parseFrontmatter(content);

            // Validate current status is 'design'
            if (parsed.frontmatter.status !== 'design') {
                vscode.window.showErrorMessage(
                    `Cannot end session. Current status is '${parsed.frontmatter.status}'. Session must be in 'design' status.`
                );
                return;
            }

            // Confirm with user
            const confirm = await vscode.window.showWarningMessage(
                `End design session "${sessionId}"? This will transition the session to 'scribe' status.`,
                { modal: true },
                'End Session'
            );

            if (confirm !== 'End Session') {
                return;
            }

            // Update session status to 'scribe' and set end_time
            parsed.frontmatter.status = 'scribe';
            parsed.frontmatter.end_time = new Date().toISOString();

            const text = FileParser.stringifyFrontmatter(parsed.frontmatter, parsed.content);
            await vscode.workspace.fs.writeFile(sessionFile, Buffer.from(text, 'utf-8'));

            // Clear active session if this was the active one
            if (this._activeSession?.sessionId === sessionId) {
                this._activeSession = null;
                if (this._fileWatcher) {
                    this._fileWatcher.dispose();
                    this._fileWatcher = undefined;
                }
            }

            // Notify webview
            this._panel.webview.postMessage({ 
                type: 'sessionStatusChanged',
                sessionId,
                oldStatus: 'design',
                newStatus: 'scribe'
            });

            // Refresh sessions list
            const sessions = await this._listSessions();
            this._panel.webview.postMessage({ type: 'sessions', data: sessions });

            vscode.window.showInformationMessage(
                `Session "${sessionId}" ended. Status changed to 'scribe'. You can now run forge-scribe to distill stories.`
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to end session: ${error}`);
        }
    }

    private async _markSessionComplete(sessionId: string): Promise<void> {
        const sessionFile = vscode.Uri.joinPath(
            this._projectUri,
            'ai',
            'sessions',
            sessionId,
            `${sessionId}.session.md`
        );

        try {
            // Load session content
            const content = await FileParser.readFile(sessionFile.fsPath);
            const parsed = FileParser.parseFrontmatter(content);

            // Validate current status is 'development'
            if (parsed.frontmatter.status !== 'development') {
                vscode.window.showErrorMessage(
                    `Cannot mark session as complete. Current status is '${parsed.frontmatter.status}'. Session must be in 'development' status.`
                );
                return;
            }

            // Validate all tickets are completed
            const ticketsPath = path.join(
                this._projectUri.fsPath,
                'ai',
                'sessions',
                sessionId,
                'tickets'
            );

            let hasIncompleteTickets = false;
            const incompleteTickets: string[] = [];

            try {
                const ticketPattern = new vscode.RelativePattern(ticketsPath, '**/*.{story,task}.md');
                const ticketUris = await vscode.workspace.findFiles(ticketPattern);

                if (ticketUris.length === 0) {
                    vscode.window.showErrorMessage('No ticket files found in session. Run forge-scribe first.');
                    return;
                }

                for (const uri of ticketUris) {
                    try {
                        const ticketContent = await FileParser.readFile(uri.fsPath);
                        const ticketData = FileParser.parseFrontmatter(ticketContent);

                        if (ticketData.frontmatter.status !== 'completed') {
                            hasIncompleteTickets = true;
                            const filename = path.basename(uri.fsPath);
                            incompleteTickets.push(`${filename} (status: ${ticketData.frontmatter.status || 'unknown'})`);
                        }
                    } catch (error) {
                        const filename = path.basename(uri.fsPath);
                        incompleteTickets.push(`${filename} (error reading file)`);
                        hasIncompleteTickets = true;
                    }
                }
            } catch (error) {
                vscode.window.showErrorMessage('No tickets folder found. Run forge-scribe first to create tickets.');
                return;
            }

            if (hasIncompleteTickets) {
                const incompleteList = incompleteTickets.map(t => `  • ${t}`).join('\n');
                vscode.window.showErrorMessage(
                    `Cannot mark session as complete. The following tickets are not completed:\n\n${incompleteList}\n\nPlease complete all tickets before marking the session as complete.`,
                    { modal: true }
                );
                return;
            }

            // Confirm with user
            const confirm = await vscode.window.showInformationMessage(
                `Mark session "${sessionId}" as complete? All tickets have been validated as complete.`,
                { modal: true },
                'Mark Complete'
            );

            if (confirm !== 'Mark Complete') {
                return;
            }

            // Update session status to 'completed'
            parsed.frontmatter.status = 'completed';

            const text = FileParser.stringifyFrontmatter(parsed.frontmatter, parsed.content);
            await vscode.workspace.fs.writeFile(sessionFile, Buffer.from(text, 'utf-8'));

            // Notify webview
            this._panel.webview.postMessage({ 
                type: 'sessionStatusChanged',
                sessionId,
                oldStatus: 'development',
                newStatus: 'completed'
            });

            // Refresh sessions list
            const sessions = await this._listSessions();
            this._panel.webview.postMessage({ type: 'sessions', data: sessions });

            vscode.window.showInformationMessage(`Session "${sessionId}" marked as complete! 🎉`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to mark session as complete: ${error}`);
        }
    }

    private _generateId(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50);
    }

    private async _getFolderTree(category: string): Promise<any> {
        const basePath = this._getCategoryPath(category);
        const fileExtension = this._getCategoryExtension(category);
        return await this._buildFolderTree(basePath, fileExtension);
    }

    private async _buildFolderTree(dirUri: vscode.Uri, fileExtension: string): Promise<any> {
        try {
            const entries = await vscode.workspace.fs.readDirectory(dirUri);
            const folders: any[] = [];

            for (const [name, type] of entries) {
                if (type === vscode.FileType.Directory && name !== 'node_modules' && !name.startsWith('.')) {
                    const childUri = vscode.Uri.joinPath(dirUri, name);
                    const children = await this._buildFolderTree(childUri, fileExtension);
                    folders.push({
                        name,
                        path: childUri.fsPath,
                        children
                    });
                }
            }

            return folders;
        } catch {
            return [];
        }
    }

    private async _getFolderContents(folderPath: string, category: string): Promise<any[]> {
        const fileExtension = this._getCategoryExtension(category);
        const folderUri = vscode.Uri.file(folderPath);
        
        try {
            const entries = await vscode.workspace.fs.readDirectory(folderUri);
            const items: any[] = [];

            for (const [name, type] of entries) {
                if (type === vscode.FileType.Directory && !name.startsWith('.') && name !== 'node_modules') {
                    // Add subfolder
                    const subfolderUri = vscode.Uri.joinPath(folderUri, name);
                    const stats = await vscode.workspace.fs.stat(subfolderUri);
                    
                    items.push({
                        name,
                        path: subfolderUri.fsPath,
                        type: 'folder',
                        modified: new Date(stats.mtime).toISOString()
                    });
                } else if (type === vscode.FileType.File && name.endsWith(fileExtension) && name !== 'index.md') {
                    // Add file
                    const fileUri = vscode.Uri.joinPath(folderUri, name);
                    const stats = await vscode.workspace.fs.stat(fileUri);
                    
                    // Try to read frontmatter for metadata
                    let frontmatter: any = {};
                    let objectId: string | undefined;
                    try {
                        const content = await FileParser.readFile(fileUri.fsPath);
                        const parsed = FileParser.parseFrontmatter(content);
                        frontmatter = parsed.frontmatter;
                        
                        // Extract object ID based on category
                        objectId = this._extractObjectId(category, frontmatter);
                    } catch {
                        // Ignore parse errors
                    }

                    items.push({
                        name,
                        path: fileUri.fsPath,
                        type: 'file',
                        modified: new Date(stats.mtime).toISOString(),
                        frontmatter,
                        objectId: objectId || name  // Fallback to filename if no ID found
                    });
                }
            }

            // Sort folders first, then files, both alphabetically
            items.sort((a, b) => {
                if (a.type === b.type) {
                    return a.name.localeCompare(b.name);
                }
                return a.type === 'folder' ? -1 : 1;
            });
            
            return items;
        } catch {
            return [];
        }
    }

    private _extractObjectId(category: string, frontmatter: any): string | undefined {
        // Map category to the appropriate ID field
        const idFieldMap: { [key: string]: string } = {
            'features': 'feature_id',
            'specs': 'spec_id',
            'actors': 'actor_id',
            'sessions': 'session_id'
        };
        
        const idField = idFieldMap[category];
        return idField ? frontmatter[idField] : undefined;
    }

    private async _getFileContent(filePath: string): Promise<any> {
        try {
            // Resolve to absolute path if relative
            const absolutePath = path.isAbsolute(filePath) 
                ? filePath 
                : vscode.Uri.joinPath(this._projectUri, filePath).fsPath;
            
            const content = await FileParser.readFile(absolutePath);
            const parsed = FileParser.parseFrontmatter(content);
            
            // If this is a session file, migrate changed_files from old format if needed
            let frontmatter = parsed.frontmatter;
            if (filePath.endsWith('.session.md') && frontmatter.changed_files) {
                const migrationResult = this._migrateChangedFiles(frontmatter.changed_files);
                frontmatter = {
                    ...frontmatter,
                    changed_files: migrationResult.entries
                };
                
                // If migration occurred, optionally save the migrated session back to disk
                if (migrationResult.wasMigrated) {
                    try {
                        const updatedFrontmatter = {
                            ...frontmatter,
                            _migrated: true
                        };
                        const text = FileParser.stringifyFrontmatter(updatedFrontmatter, parsed.content);
                        await vscode.workspace.fs.writeFile(vscode.Uri.file(absolutePath), Buffer.from(text, 'utf-8'));
                    } catch (error) {
                        console.error('Failed to save migrated session:', error);
                    }
                }
            }
            
            return {
                path: filePath,
                frontmatter: frontmatter,
                content: parsed.content
            };
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to read file: ${error}`);
            return null;
        }
    }

    private async _saveFileContent(filePath: string, frontmatter: any, content: string): Promise<void> {
        // Check if session is active (not required for foundational files like actors and contexts)
        const isFoundational = this._isFoundationalFile(filePath);
        if (!this._activeSession && !isFoundational) {
            vscode.window.showErrorMessage('Cannot save file: No active design session. Start a session first.');
            return;
        }

        try {
            const text = FileParser.stringifyFrontmatter(frontmatter, content);
            const fileUri = vscode.Uri.file(filePath);
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(text, 'utf-8'));
            
            this._panel.webview.postMessage({ 
                type: 'fileSaved', 
                data: { path: filePath, success: true } 
            });
            
            vscode.window.showInformationMessage('File saved successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save file: ${error}`);
            this._panel.webview.postMessage({ 
                type: 'fileSaved', 
                data: { path: filePath, success: false, error: String(error) } 
            });
        }
    }

    private async _promptCreateFolder(folderPath: string, category: string): Promise<void> {
        // Check if session is active (not required for foundational categories like actors and contexts)
        const isFoundational = this._isFoundationalFile(category);
        if (!this._activeSession && !isFoundational) {
            vscode.window.showErrorMessage('Cannot create folder: No active design session. Start a session first.');
            return;
        }

        // If folderPath is empty, use the base category path
        const basePath = folderPath || this._getCategoryPath(category).fsPath;

        const folderName = await vscode.window.showInputBox({
            prompt: 'Enter subfolder name',
            placeHolder: 'my-subfolder',
            validateInput: (value) => {
                if (!value || !value.trim()) {
                    return 'Folder name cannot be empty';
                }
                return null;
            }
        });

        if (folderName) {
            const kebabName = this._toKebabCase(folderName);
            const newFolderPath = path.join(basePath, kebabName);
            await this._createFolder(newFolderPath);
        }
    }

    private async _promptCreateFile(folderPath: string, category: string): Promise<void> {
        // Check if session is active (not required for foundational categories like actors and contexts)
        const isFoundational = this._isFoundationalFile(category);
        if (!this._activeSession && !isFoundational) {
            vscode.window.showErrorMessage('Cannot create file: No active design session. Start a session first.');
            return;
        }

        // If folderPath is empty, use the base category path
        const basePath = folderPath || this._getCategoryPath(category).fsPath;

        const categoryLabel = category.charAt(0).toUpperCase() + category.slice(0, -1);
        const title = await vscode.window.showInputBox({
            prompt: `Enter ${categoryLabel} title`,
            placeHolder: 'My New Item',
            validateInput: (value) => {
                if (!value || !value.trim()) {
                    return 'Title cannot be empty';
                }
                return null;
            }
        });

        if (title && title.trim()) {
            await this._createFile(basePath, category, title.trim());
        }
    }

    private async _createFolder(folderPath: string): Promise<void> {
        // Check if session is active (not required for foundational folders like actors and contexts)
        const isFoundational = this._isFoundationalFile(folderPath);
        if (!this._activeSession && !isFoundational) {
            vscode.window.showErrorMessage('Cannot create folder: No active design session. Start a session first.');
            return;
        }

        try {
            const folderUri = vscode.Uri.file(folderPath);
            await vscode.workspace.fs.createDirectory(folderUri);
            
            this._panel.webview.postMessage({ 
                type: 'folderCreated', 
                data: { path: folderPath, success: true } 
            });
            
            vscode.window.showInformationMessage('Folder created successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create folder: ${error}`);
            this._panel.webview.postMessage({ 
                type: 'folderCreated', 
                data: { path: folderPath, success: false, error: String(error) } 
            });
        }
    }

    private async _createFile(folderPath: string, category: string, title: string): Promise<void> {
        // Check if session is active (not required for foundational categories like actors and contexts)
        const isFoundational = this._isFoundationalFile(category);
        if (!this._activeSession && !isFoundational) {
            vscode.window.showErrorMessage('Cannot create file: No active design session. Start a session first.');
            return;
        }

        try {
            // Generate kebab-case filename
            const filename = this._toKebabCase(title);
            const fileExtension = this._getCategoryExtension(category);
            const filePath = path.join(folderPath, `${filename}${fileExtension}`);
            const fileUri = vscode.Uri.file(filePath);

            // Check if file already exists
            try {
                await vscode.workspace.fs.stat(fileUri);
                vscode.window.showErrorMessage(`File already exists: ${filename}${fileExtension}`);
                this._panel.webview.postMessage({ 
                    type: 'fileCreated', 
                    data: { path: filePath, success: false, error: 'File already exists' } 
                });
                return;
            } catch {
                // File doesn't exist, continue
            }

            // Generate frontmatter template
            const frontmatter = this._getFrontmatterTemplate(category, filename);
            
            // Generate minimal content template
            const content = this._getContentTemplate(category, title);

            // Create file
            const text = FileParser.stringifyFrontmatter(frontmatter, content);
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(text, 'utf-8'));
            
            this._panel.webview.postMessage({ 
                type: 'fileCreated', 
                data: { path: filePath, success: true } 
            });
            
            vscode.window.showInformationMessage(`File created: ${filename}${fileExtension}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create file: ${error}`);
            this._panel.webview.postMessage({ 
                type: 'fileCreated', 
                data: { path: folderPath, success: false, error: String(error) } 
            });
        }
    }

    private _toKebabCase(str: string): string {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50);
    }

    private _getFrontmatterTemplate(category: string, id: string): any {
        switch (category) {
            case 'features':
                return {
                    feature_id: id,
                    spec_id: []
                };
            case 'diagrams':
                return {
                    diagram_id: id,
                    name: '',
                    description: '',
                    diagram_type: 'flow',
                    feature_id: [],
                    spec_id: [],
                    actor_id: []
                };
            case 'specs':
                return {
                    spec_id: id,
                    feature_id: [],
                    diagram_id: [],
                    context_id: []
                };
            case 'actors':
                return {
                    actor_id: id,
                    type: 'user'
                };
            default:
                return {};
        }
    }

    private _getContentTemplate(category: string, title: string): string {
        switch (category) {
            case 'features':
                return `## Overview

(Describe what this feature does)

## Behavior

\`\`\`gherkin
Feature: ${title}

Scenario: (Describe a scenario)
  Given (initial context)
  When (action taken)
  Then (expected outcome)
\`\`\`

## Notes

(Additional context or considerations)
`;
            case 'diagrams':
                return `# ${title}

\`\`\`json
{
  "nodes": [
    { "id": "component-a", "type": "default", "position": { "x": 0, "y": 0 }, "data": { "label": "Component A" } },
    { "id": "component-b", "type": "default", "position": { "x": 200, "y": 0 }, "data": { "label": "Component B" } }
  ],
  "edges": [
    { "id": "e1", "source": "component-a", "target": "component-b" }
  ]
}
\`\`\`

## Notes

(Optional: Brief description of diagram notation or key elements)
`;
            case 'specs':
                return `## Overview

(Describe what technical contracts this spec defines)

## API Contracts

(Define endpoints, methods, parameters, responses)

## Data Structures

(Define interfaces, types, schemas - link to models for details)

## Validation Rules

(Define constraints, business rules, data validation)

## Integration Points

(Define how this integrates with external systems)

## Notes

(Additional context or considerations)
`;
            case 'actors':
                return `## Overview

(Describe this actor and their role)

## Responsibilities

- (List key responsibilities)

## Interactions

(Describe how this actor interacts with the system)

## Notes

(Additional context or considerations)
`;
            default:
                return '(Add your content here)\n';
        }
    }

    private _getCategoryPath(category: string): vscode.Uri {
        return vscode.Uri.joinPath(this._projectUri, 'ai', category);
    }

    private _getCategoryExtension(category: string): string {
        const extensions: { [key: string]: string } = {
            'features': '.feature.md',
            'diagrams': '.diagram.md',
            'specs': '.spec.md',
            'actors': '.actor.md'
        };
        return extensions[category] || '.md';
    }

    private async _openFile(filePath: string): Promise<void> {
        try {
            // Resolve to absolute path if relative
            const absolutePath = path.isAbsolute(filePath) 
                ? filePath 
                : vscode.Uri.joinPath(this._projectUri, filePath).fsPath;
            
            const fileUri = vscode.Uri.file(absolutePath);
            
            // Open the file in the editor
            const document = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open file: ${error}`);
        }
    }

    private async _checkFileExists(filePath: string): Promise<boolean> {
        try {
            // Resolve to absolute path if relative
            const absolutePath = path.isAbsolute(filePath) 
                ? filePath 
                : vscode.Uri.joinPath(this._projectUri, filePath).fsPath;
            
            const fileUri = vscode.Uri.file(absolutePath);
            
            // Try to stat the file
            await vscode.workspace.fs.stat(fileUri);
            return true;
        } catch {
            return false;
        }
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
