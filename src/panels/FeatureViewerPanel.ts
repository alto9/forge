import * as vscode from 'vscode';
import * as path from 'path';
import { FileParser } from '../utils/FileParser';

/**
 * Feature Viewer Panel - Opens feature files in a custom webview panel
 * Only used when opening features from Forge Studio sidebar
 * Provides visual Gherkin editing capabilities
 */
export class FeatureViewerPanel {
    private static panels: Map<string, FeatureViewerPanel> = new Map();
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _documentUri: vscode.Uri;
    private _fileWatcher: vscode.FileSystemWatcher | undefined;

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        documentUri: vscode.Uri
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._documentUri = documentUri;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Watch for file changes
        this._startFileWatcher();

        // Handle messages from webview
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'getInitialData':
                        await this._sendDocumentData();
                        break;
                    case 'save':
                        await this._saveDocument(message.frontmatter, message.content);
                        break;
                    case 'getActiveSession':
                        const activeSession = await this._getActiveSession();
                        this._panel.webview.postMessage({ type: 'activeSession', data: activeSession });
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public static render(extensionUri: vscode.Uri, documentUri: vscode.Uri) {
        const fileName = path.basename(documentUri.fsPath);
        const filePath = documentUri.fsPath;
        
        // If we already have a panel for this file, reveal it
        const existingPanel = FeatureViewerPanel.panels.get(filePath);
        if (existingPanel) {
            existingPanel._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'forgeFeatureViewer',
            `Feature: ${fileName}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                ],
            }
        );

        const newPanel = new FeatureViewerPanel(panel, extensionUri, documentUri);
        FeatureViewerPanel.panels.set(filePath, newPanel);
    }

    public dispose() {
        // Remove this panel from the map
        FeatureViewerPanel.panels.delete(this._documentUri.fsPath);

        this._panel.dispose();

        if (this._fileWatcher) {
            this._fileWatcher.dispose();
        }

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
    }

    private _startFileWatcher() {
        if (this._fileWatcher) {
            this._fileWatcher.dispose();
        }

        this._fileWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(this._documentUri, '**')
        );

        this._fileWatcher.onDidChange(() => {
            this._sendDocumentData();
        });

        this._disposables.push(this._fileWatcher);
    }

    private async _sendDocumentData() {
        try {
            const content = await FileParser.readFile(this._documentUri.fsPath);
            const parsed = FileParser.parseFrontmatter(content);

            this._panel.webview.postMessage({
                type: 'documentData',
                data: {
                    path: this._documentUri.fsPath,
                    frontmatter: parsed.frontmatter,
                    content: parsed.content
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to read feature file: ${error}`);
        }
    }

    private async _saveDocument(frontmatter: any, content: string) {
        try {
            const text = FileParser.stringifyFrontmatter(frontmatter, content);
            await vscode.workspace.fs.writeFile(
                this._documentUri,
                Buffer.from(text, 'utf-8')
            );
            vscode.window.showInformationMessage('Feature saved successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save feature: ${error}`);
        }
    }

    private async _getActiveSession(): Promise<any | null> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(this._documentUri);
        if (!workspaceFolder) {
            return null;
        }

        const sessionsDir = vscode.Uri.joinPath(workspaceFolder.uri, 'ai', 'sessions');

        try {
            const files = await this._listFilesRecursive(sessionsDir, '.session.md');

            for (const file of files) {
                const content = await FileParser.readFile(file.fsPath);
                const parsed = FileParser.parseFrontmatter(content);

                if (parsed.frontmatter.status === 'design') {
                    const sessionId = parsed.frontmatter.session_id || path.basename(file.fsPath, '.session.md');
                    return {
                        sessionId,
                        problemStatement: parsed.frontmatter.problem_statement || '',
                        startTime: parsed.frontmatter.start_time || new Date().toISOString(),
                        changedFiles: parsed.frontmatter.changed_files || []
                    };
                }
            }
        } catch {
            // Sessions directory doesn't exist
        }

        return null;
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

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'feature', 'main.js')
        );
        const fileName = path.basename(this._documentUri.fsPath);
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob: data:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline' ${webview.cspSource}; font-src ${webview.cspSource};" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Feature - ${fileName}</title>
  <style>
    html, body, #root { 
      height: 100%; 
      margin: 0; 
      padding: 0; 
      overflow: hidden;
    }
    body { 
      font-family: var(--vscode-font-family); 
      color: var(--vscode-editor-foreground); 
      background: var(--vscode-editor-background);
      font-size: 13px;
      line-height: 1.5;
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
    .form-input, .form-textarea {
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
    .form-input:focus, .form-textarea:focus {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: -1px;
    }
    .form-input:read-only, .form-textarea:read-only {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    /* Section styles */
    .content-section {
      padding: 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .content-section:last-child {
      border-bottom: none;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
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
