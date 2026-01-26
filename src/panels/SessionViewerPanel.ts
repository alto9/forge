import * as vscode from 'vscode';
import * as path from 'path';
import { FileParser } from '../utils/FileParser';

/**
 * Session Viewer Panel - Opens session files in a custom webview panel
 * Provides session detail view with status tracking and changed files display
 */
export class SessionViewerPanel {
    private static panels: Map<string, SessionViewerPanel> = new Map();
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
                    case 'markComplete':
                        await this._markSessionComplete();
                        break;
                    case 'endSession':
                        await this._endSession();
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
        const existingPanel = SessionViewerPanel.panels.get(filePath);
        if (existingPanel) {
            existingPanel._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'forgeSessionViewer',
            `Session: ${fileName}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                ],
            }
        );

        const newPanel = new SessionViewerPanel(panel, extensionUri, documentUri);
        SessionViewerPanel.panels.set(filePath, newPanel);
    }

    public dispose() {
        // Remove this panel from the map
        SessionViewerPanel.panels.delete(this._documentUri.fsPath);

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
            vscode.window.showErrorMessage(`Failed to read session file: ${error}`);
        }
    }

    private async _saveDocument(frontmatter: any, content: string) {
        try {
            const text = FileParser.stringifyFrontmatter(frontmatter, content);
            await vscode.workspace.fs.writeFile(
                this._documentUri,
                Buffer.from(text, 'utf-8')
            );
            vscode.window.showInformationMessage('Session saved successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save session: ${error}`);
        }
    }

    private async _markSessionComplete() {
        try {
            const content = await FileParser.readFile(this._documentUri.fsPath);
            const parsed = FileParser.parseFrontmatter(content);
            
            // Update status to completed and add end time
            parsed.frontmatter.status = 'completed';
            if (!parsed.frontmatter.end_time) {
                parsed.frontmatter.end_time = new Date().toISOString();
            }
            
            const text = FileParser.stringifyFrontmatter(parsed.frontmatter, parsed.content);
            await vscode.workspace.fs.writeFile(
                this._documentUri,
                Buffer.from(text, 'utf-8')
            );
            
            vscode.window.showInformationMessage('Session marked as complete!');
            await this._sendDocumentData();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to mark session complete: ${error}`);
        }
    }

    private async _endSession() {
        try {
            const content = await FileParser.readFile(this._documentUri.fsPath);
            const parsed = FileParser.parseFrontmatter(content);
            
            // Transition from 'design' to 'scribe' status
            if (parsed.frontmatter.status === 'design') {
                parsed.frontmatter.status = 'scribe';
                parsed.frontmatter.design_end_time = new Date().toISOString();
                
                const text = FileParser.stringifyFrontmatter(parsed.frontmatter, parsed.content);
                await vscode.workspace.fs.writeFile(
                    this._documentUri,
                    Buffer.from(text, 'utf-8')
                );
                
                vscode.window.showInformationMessage('Session transitioned to scribe status!');
                await this._sendDocumentData();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to end session: ${error}`);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'session', 'main.js')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Session Viewer</title>
            <style>
                body {
                    padding: 0;
                    margin: 0;
                    color: var(--vscode-editor-foreground);
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    background: var(--vscode-editor-background);
                }
                #root {
                    width: 100%;
                    height: 100vh;
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
