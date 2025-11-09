import * as vscode from 'vscode';
import { ForgeStudioPanel } from './ForgeStudioPanel';
import { getManagedCommandPaths } from '../templates/cursorCommands';
import { validateCommandFileHash, generateCommandFile } from '../utils/commandValidation';

interface FolderStatus {
    path: string;        // Relative path (e.g., "ai/actors")
    exists: boolean;     // Whether folder currently exists
    description: string; // Human-readable description
    type: 'folder';      // Discriminator for union type
}

interface CommandStatus {
    path: string;        // Relative path (e.g., ".cursor/commands/forge-design.md")
    exists: boolean;     // Whether command file exists
    valid: boolean;      // Whether command file has valid content (hash matches)
    description: string; // Human-readable description
    type: 'command';     // Discriminator for union type
}

type ProjectItemStatus = FolderStatus | CommandStatus;

const REQUIRED_FOLDERS: Omit<FolderStatus, 'exists'>[] = [
    { path: 'ai', description: 'Root directory for all Forge files', type: 'folder' },
    { path: 'ai/actors', description: 'Actor definitions and personas', type: 'folder' },
    { path: 'ai/contexts', description: 'Context guidance files', type: 'folder' },
    { path: 'ai/features', description: 'Feature definitions with Gherkin', type: 'folder' },
    { path: 'ai/sessions', description: 'Design session tracking', type: 'folder' },
    { path: 'ai/specs', description: 'Technical specifications', type: 'folder' }
];

const REQUIRED_COMMANDS: Omit<CommandStatus, 'exists' | 'valid'>[] = [
    { path: '.cursor/commands/forge-design.md', description: 'Cursor command for design session workflow', type: 'command' },
    { path: '.cursor/commands/forge-build.md', description: 'Cursor command for building from tickets', type: 'command' }
];

export class WelcomePanel {
    public static currentPanel: WelcomePanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _projectUri: vscode.Uri;
    private readonly _output: vscode.OutputChannel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, projectUri: vscode.Uri, output: vscode.OutputChannel) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._projectUri = projectUri;
        this._output = output;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Send initial project status automatically on panel creation
        this._sendProjectStatus();

        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'getProjectStatus': {
                    this._panel.webview.postMessage({ 
                        type: 'projectStatus', 
                        data: await this._getInitialState() 
                    });
                    break;
                }
                case 'initializeProject': {
                    await this._handleInitializeProject();
                    break;
                }
                case 'openForgeStudio': {
                    this._openForgeStudio();
                    break;
                }
                default:
                    break;
            }
        }, null, this._disposables);
    }

    private async _sendProjectStatus(): Promise<void> {
        const initialState = await this._getInitialState();
        this._panel.webview.postMessage({
            type: 'projectStatus',
            data: initialState
        });
    }

    public static render(extensionUri: vscode.Uri, projectUri: vscode.Uri, output: vscode.OutputChannel) {
        if (WelcomePanel.currentPanel) {
            WelcomePanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'forgeWelcome',
            'Welcome to Forge',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                ],
            }
        );

        // Hide the primary sidebar when Welcome panel opens
        vscode.commands.executeCommand('workbench.action.closeSidebar');

        WelcomePanel.currentPanel = new WelcomePanel(panel, extensionUri, projectUri, output);
    }

    public dispose() {
        WelcomePanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _checkProjectReadiness(): Promise<boolean> {
        // Check folders
        for (const folder of REQUIRED_FOLDERS) {
            const folderUri = vscode.Uri.joinPath(this._projectUri, folder.path);
            try {
                await vscode.workspace.fs.stat(folderUri);
                // Folder exists, continue checking
            } catch {
                // Folder does not exist
                return false;
            }
        }
        
        // Check command files
        for (const command of REQUIRED_COMMANDS) {
            const commandUri = vscode.Uri.joinPath(this._projectUri, command.path);
            try {
                const fileContent = await vscode.workspace.fs.readFile(commandUri);
                const contentString = Buffer.from(fileContent).toString('utf8');
                const isValid = validateCommandFileHash(contentString, command.path);
                if (!isValid) {
                    // File exists but is invalid
                    return false;
                }
            } catch {
                // File doesn't exist
                return false;
            }
        }
        
        // All folders and commands are valid
        return true;
    }

    private async _getFolderStatus(): Promise<FolderStatus[]> {
        return Promise.all(REQUIRED_FOLDERS.map(async (folder) => {
            const folderUri = vscode.Uri.joinPath(this._projectUri, folder.path);
            let exists = false;
            try {
                await vscode.workspace.fs.stat(folderUri);
                exists = true;
            } catch {
                exists = false;
            }
            return { ...folder, exists };
        }));
    }

    private async _getCommandStatus(): Promise<CommandStatus[]> {
        return Promise.all(REQUIRED_COMMANDS.map(async (command) => {
            const commandUri = vscode.Uri.joinPath(this._projectUri, command.path);
            let exists = false;
            let valid = false;
            
            try {
                const fileContent = await vscode.workspace.fs.readFile(commandUri);
                const contentString = Buffer.from(fileContent).toString('utf8');
                exists = true;
                valid = validateCommandFileHash(contentString, command.path);
            } catch {
                // File doesn't exist
                exists = false;
                valid = false;
            }
            
            return { ...command, exists, valid };
        }));
    }

    private async _getInitialState(): Promise<{ projectPath: string; isReady: boolean; folders: FolderStatus[]; commands: CommandStatus[] }> {
        const isReady = await this._checkProjectReadiness();
        const [folders, commands] = await Promise.all([
            this._getFolderStatus(),
            this._getCommandStatus()
        ]);
        return {
            projectPath: this._projectUri.fsPath,
            isReady,
            folders,
            commands
        };
    }

    private async _initializeCursorCommands(): Promise<{ created: number; failed: number }> {
        let created = 0;
        let failed = 0;
        
        const commandPaths = getManagedCommandPaths();
        
        for (const commandPath of commandPaths) {
            const commandUri = vscode.Uri.joinPath(this._projectUri, commandPath);
            
            try {
                // Check if file needs creation/updating
                let needsUpdate = false;
                let fileExists = false;
                try {
                    const fileContent = await vscode.workspace.fs.readFile(commandUri);
                    const contentString = Buffer.from(fileContent).toString('utf8');
                    const isValid = validateCommandFileHash(contentString, commandPath);
                    fileExists = true;
                    needsUpdate = !isValid;
                } catch {
                    // File doesn't exist
                    needsUpdate = true;
                }
                
                if (needsUpdate) {
                    const actionStatus = fileExists ? 'updated' : 'created';
                    
                    // Send progress update
                    this._panel.webview.postMessage({
                        type: 'initializationProgress',
                        item: commandPath,
                        itemType: 'file',
                        status: 'creating'
                    });
                    
                    // Ensure .cursor/commands directory exists
                    const commandDir = vscode.Uri.joinPath(this._projectUri, '.cursor/commands');
                    await vscode.workspace.fs.createDirectory(commandDir);
                    
                    // Generate file with hash
                    const content = generateCommandFile(commandPath);
                    const contentBuffer = Buffer.from(content, 'utf8');
                    
                    // Write file
                    await vscode.workspace.fs.writeFile(commandUri, contentBuffer);
                    
                    // Send created/updated status
                    this._panel.webview.postMessage({
                        type: 'initializationProgress',
                        item: commandPath,
                        itemType: 'file',
                        status: actionStatus
                    });
                    
                    created++;
                }
            } catch (error: any) {
                failed++;
                
                // Detect specific error types and provide user-friendly messages
                let userMessage = '';
                const errorCode = error.code || error.name || '';
                
                if (errorCode === 'EACCES' || errorCode === 'EPERM') {
                    userMessage = `Permission denied: Cannot create command file "${commandPath}". Please check folder permissions.`;
                } else if (errorCode === 'ENOSPC') {
                    userMessage = `Insufficient disk space: Cannot create command file "${commandPath}". Please free up disk space.`;
                } else if (errorCode === 'ENOENT' || errorCode === 'ENOTDIR') {
                    userMessage = `Invalid project path: Cannot create command file "${commandPath}". Please check the project location.`;
                } else if (errorCode === 'EROFS') {
                    userMessage = `Read-only filesystem: Cannot create command file "${commandPath}". The project is on a read-only volume.`;
                } else {
                    userMessage = `Failed to create command file "${commandPath}": ${error.message || error}`;
                }
                
                // Send error update with details
                this._panel.webview.postMessage({
                    type: 'initializationProgress',
                    item: commandPath,
                    itemType: 'file',
                    status: 'error',
                    error: userMessage
                });

                // Show error message in VSCode
                vscode.window.showErrorMessage(userMessage);
                
                // Send error to webview for display
                this._panel.webview.postMessage({
                    type: 'error',
                    message: userMessage
                });
            }
        }
        
        return { created, failed };
    }

    private _update() {
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'welcome', 'main.js'));
        const nonce = getNonce();
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob: data:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline' ${webview.cspSource}; font-src ${webview.cspSource};" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Forge</title>
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
    .container { 
      display: flex; 
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%; 
      padding: 24px;
    }
    
    .welcome-content {
      max-width: 600px;
      width: 100%;
    }
    
    /* Project Header */
    .project-header {
      text-align: center;
      margin-bottom: 32px;
    }
    
    .welcome-title {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 12px 0;
    }
    
    .project-path {
      font-size: 12px;
      opacity: 0.7;
      color: var(--vscode-descriptionForeground);
      word-break: break-all;
      margin-top: 8px;
    }
    
    /* Status Indicator */
    .status-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 32px;
      text-align: center;
    }
    
    .status-indicator.ready {
      background: var(--vscode-testing-iconPassed);
      color: var(--vscode-editor-foreground);
    }
    
    .status-indicator.not-ready {
      background: var(--vscode-inputValidation-warningBackground);
      color: var(--vscode-editor-foreground);
    }
    
    .status-icon {
      font-size: 32px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .status-text {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .status-subtitle {
      font-size: 12px;
      opacity: 0.9;
    }
    
    /* Folder Checklist */
    .folder-checklist {
      margin-bottom: 32px;
    }
    
    .checklist-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .checklist-items {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .checklist-item {
      display: flex;
      align-items: center;
      padding: 12px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      transition: all 0.1s;
    }
    
    .checklist-item.exists {
      opacity: 1;
    }
    
    .checklist-item.missing {
      opacity: 0.8;
    }
    
    .checklist-item.outdated {
      opacity: 0.9;
    }
    
    .checklist-icon {
      font-size: 18px;
      margin-right: 12px;
      width: 24px;
      text-align: center;
      font-weight: 600;
    }
    
    .checklist-item.exists .checklist-icon {
      color: var(--vscode-testing-iconPassed);
    }
    
    .checklist-item.missing .checklist-icon {
      color: var(--vscode-testing-iconFailed);
    }
    
    .checklist-item.outdated .checklist-icon {
      color: var(--vscode-editorWarning-foreground);
    }
    
    .checklist-content {
      flex: 1;
      min-width: 0;
    }
    
    .checklist-path {
      font-weight: 500;
      margin-bottom: 4px;
      word-break: break-all;
    }
    
    .checklist-description {
      font-size: 11px;
      opacity: 0.7;
      color: var(--vscode-descriptionForeground);
    }
    
    .checklist-status {
      font-size: 11px;
      opacity: 0.7;
      margin-left: 12px;
    }
    
    /* Error Message */
    .error-message {
      padding: 12px 16px;
      background: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      border-radius: 4px;
      color: var(--vscode-errorForeground);
      margin-bottom: 16px;
      font-size: 13px;
    }
    
    /* Action Buttons */
    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 12px;
    }
    
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 14px;
      font-family: var(--vscode-font-family);
      font-weight: 500;
      transition: opacity 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-width: 200px;
    }
    
    .btn:hover:not(:disabled) { 
      opacity: 0.9; 
    }
    
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
    
    /* Spinner */
    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid var(--vscode-button-foreground);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Dialog */
    .dialog-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 1000;
    }
    
    .dialog-container {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      z-index: 1001;
      min-width: 400px;
      max-width: 600px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
    }
    
    .dialog-header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .dialog-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--vscode-editor-foreground);
    }
    
    .dialog-content {
      padding: 20px 24px;
      overflow-y: auto;
      flex: 1;
    }
    
    .dialog-message {
      margin: 0 0 16px 0;
      color: var(--vscode-editor-foreground);
      font-size: 13px;
    }
    
    .dialog-info {
      margin: 8px 0;
      padding: 12px;
      background: var(--vscode-inputValidation-infoBackground);
      border: 1px solid var(--vscode-inputValidation-infoBorder);
      border-radius: 4px;
      color: var(--vscode-editor-foreground);
      font-size: 13px;
    }
    
    .dialog-folder-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .dialog-folder-item {
      display: flex;
      align-items: flex-start;
      padding: 12px;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
    }
    
    .dialog-folder-icon {
      font-size: 20px;
      margin-right: 12px;
      flex-shrink: 0;
    }
    
    .dialog-folder-info {
      flex: 1;
      min-width: 0;
    }
    
    .dialog-folder-path {
      font-weight: 500;
      margin-bottom: 4px;
      word-break: break-all;
      color: var(--vscode-editor-foreground);
      font-size: 13px;
    }
    
    .dialog-folder-description {
      font-size: 11px;
      opacity: 0.7;
      color: var(--vscode-descriptionForeground);
    }
    
    .dialog-actions {
      padding: 16px 24px 20px;
      border-top: 1px solid var(--vscode-panel-border);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    
    .dialog-actions .btn {
      min-width: 100px;
    }
    
    /* Progress Indicator */
    .progress-indicator {
      margin: 24px 0;
      padding: 20px;
      background: var(--vscode-editor-inactiveSelectionBackground);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
    }
    
    .progress-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .progress-spinner {
      width: 20px;
      height: 20px;
      border: 3px solid var(--vscode-button-background);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    .progress-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--vscode-editor-foreground);
    }
    
    .progress-details {
      margin-bottom: 16px;
    }
    
    .progress-current {
      font-size: 13px;
      color: var(--vscode-editor-foreground);
      margin-bottom: 8px;
    }
    
    .progress-current strong {
      color: var(--vscode-textLink-foreground);
      font-weight: 600;
    }
    
    .progress-count {
      font-size: 13px;
      color: var(--vscode-descriptionForeground);
    }
    
    .progress-bar {
      height: 6px;
      background: var(--vscode-input-background);
      border-radius: 3px;
      overflow: hidden;
    }
    
    .progress-bar-fill {
      height: 100%;
      background: var(--vscode-button-background);
      transition: width 0.3s ease;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private async _handleInitializeProject(): Promise<void> {
        try {
            const folderStatus = await this._getFolderStatus();
            const missingFolders = folderStatus.filter(f => !f.exists);

            let created = 0;
            let failed = 0;

            // Create folders in order
            for (const folder of missingFolders) {
                const folderUri = vscode.Uri.joinPath(this._projectUri, folder.path);
                
                try {
                    // Send progress update
                    this._panel.webview.postMessage({
                        type: 'initializationProgress',
                        item: folder.path,
                        itemType: 'folder',
                        status: 'creating'
                    });

                    await vscode.workspace.fs.createDirectory(folderUri);
                    
                    // Send created update
                    this._panel.webview.postMessage({
                        type: 'initializationProgress',
                        item: folder.path,
                        itemType: 'folder',
                        status: 'created'
                    });
                    
                    created++;
                } catch (error: any) {
                    failed++;
                    
                    // Detect specific error types and provide user-friendly messages
                    let userMessage = '';
                    const errorCode = error.code || error.name || '';
                    
                    if (errorCode === 'EACCES' || errorCode === 'EPERM') {
                        userMessage = `Permission denied: Cannot create folder "${folder.path}". Please check folder permissions.`;
                    } else if (errorCode === 'ENOSPC') {
                        userMessage = `Insufficient disk space: Cannot create folder "${folder.path}". Please free up disk space.`;
                    } else if (errorCode === 'ENOENT' || errorCode === 'ENOTDIR') {
                        userMessage = `Invalid project path: Cannot create folder "${folder.path}". Please check the project location.`;
                    } else if (errorCode === 'EROFS') {
                        userMessage = `Read-only filesystem: Cannot create folder "${folder.path}". The project is on a read-only volume.`;
                    } else {
                        userMessage = `Failed to create folder "${folder.path}": ${error.message || error}`;
                    }
                    
                    // Send error update with details
                    this._panel.webview.postMessage({
                        type: 'initializationProgress',
                        item: folder.path,
                        itemType: 'folder',
                        status: 'error',
                        error: userMessage
                    });

                    // Show error message in VSCode
                    vscode.window.showErrorMessage(userMessage);
                    
                    // Send error to webview for display
                    this._panel.webview.postMessage({
                        type: 'error',
                        message: userMessage
                    });
                }
            }

            // Create or update Cursor command files
            const commandResult = await this._initializeCursorCommands();
            created += commandResult.created;
            failed += commandResult.failed;

            // Send completion message
            this._panel.webview.postMessage({
                type: 'initializationComplete',
                success: failed === 0,
                created,
                failed
            });

            // If successful, transition to Studio
            if (failed === 0) {
                // Recheck readiness to ensure all folders and commands were created
                const isReady = await this._checkProjectReadiness();
                if (isReady) {
                    // Wait a brief moment for UI to update
                    await new Promise(resolve => setTimeout(resolve, 500));
                    this._openForgeStudio();
                } else {
                    // Refresh status
                    this._panel.webview.postMessage({
                        type: 'projectStatus',
                        data: await this._getInitialState()
                    });
                }
            } else {
                // Refresh status even if some failed
                this._panel.webview.postMessage({
                    type: 'projectStatus',
                    data: await this._getInitialState()
                });
            }
        } catch (error: any) {
            const errorMessage = `Initialization failed: ${error.message || error}`;
            vscode.window.showErrorMessage(errorMessage);
            
            this._panel.webview.postMessage({
                type: 'error',
                message: errorMessage
            });
        }
    }

    private _openForgeStudio(): void {
        // Close welcome panel
        this.dispose();
        
        // Open Forge Studio with same project
        ForgeStudioPanel.render(
            this._extensionUri,
            this._projectUri,
            this._output
        );
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

