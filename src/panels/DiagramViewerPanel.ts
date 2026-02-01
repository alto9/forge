import * as vscode from 'vscode';
import * as path from 'path';
import { FileParser } from '../utils/FileParser';

/**
 * Diagram Viewer Panel - Opens diagram files in a custom webview panel
 * Only used when opening diagrams from Forge Studio sidebar
 */
export class DiagramViewerPanel {
    private static panels: Map<string, DiagramViewerPanel> = new Map();
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
                    case 'getSpecs':
                        const specs = await this._listSpecs();
                        this._panel.webview.postMessage({ type: 'specs', data: specs });
                        break;
                    case 'getActors':
                        const actors = await this._listActors();
                        this._panel.webview.postMessage({ type: 'actors', data: actors });
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
        const existingPanel = DiagramViewerPanel.panels.get(filePath);
        if (existingPanel) {
            existingPanel._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'forgeDiagramViewer',
            `Diagram: ${fileName}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                ],
            }
        );

        const newPanel = new DiagramViewerPanel(panel, extensionUri, documentUri);
        DiagramViewerPanel.panels.set(filePath, newPanel);
    }

    public dispose() {
        // Remove this panel from the map
        DiagramViewerPanel.panels.delete(this._documentUri.fsPath);

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
            vscode.window.showErrorMessage(`Failed to read diagram file: ${error}`);
        }
    }

    private async _saveDocument(frontmatter: any, content: string) {
        try {
            const text = FileParser.stringifyFrontmatter(frontmatter, content);
            await vscode.workspace.fs.writeFile(
                this._documentUri,
                Buffer.from(text, 'utf-8')
            );
            vscode.window.showInformationMessage('Diagram saved successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save diagram: ${error}`);
        }
    }

    private async _listSpecs(): Promise<Array<{ id: string; name: string }>> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(this._documentUri);
        if (!workspaceFolder) {
            return [];
        }

        const specsDir = vscode.Uri.joinPath(workspaceFolder.uri, 'ai', 'specs');
        const specs: Array<{ id: string; name: string }> = [];

        try {
            const files = await this._listFilesRecursive(specsDir, '.spec.md');

            for (const file of files) {
                const content = await FileParser.readFile(file.fsPath);
                const parsed = FileParser.parseFrontmatter(content);
                const specId = parsed.frontmatter.spec_id || path.basename(file.fsPath, '.spec.md');
                const name = parsed.frontmatter.name || specId;

                specs.push({ id: specId, name });
            }
        } catch {
            // Specs directory doesn't exist
        }

        specs.sort((a, b) => a.name.localeCompare(b.name));
        return specs;
    }

    private async _listActors(): Promise<Array<{ actor_id: string; name: string; type: string }>> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(this._documentUri);
        if (!workspaceFolder) {
            return [];
        }

        const actorsDir = vscode.Uri.joinPath(workspaceFolder.uri, 'ai', 'actors');
        const actors: Array<{ actor_id: string; name: string; type: string }> = [];

        try {
            const files = await this._listFilesRecursive(actorsDir, '.actor.md');

            for (const file of files) {
                const content = await FileParser.readFile(file.fsPath);
                const parsed = FileParser.parseFrontmatter(content);

                actors.push({
                    actor_id: parsed.frontmatter.actor_id || '',
                    name: parsed.frontmatter.name || parsed.frontmatter.actor_id || 'Unknown',
                    type: parsed.frontmatter.type || 'system'
                });
            }
        } catch {
            // Actors directory doesn't exist
        }

        actors.sort((a, b) => a.name.localeCompare(b.name));
        return actors;
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
            vscode.Uri.joinPath(this._extensionUri, 'media', 'diagram', 'main.js')
        );
        const reactFlowCssUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'diagram', 'reactflow.css')
        );
        const fileName = path.basename(this._documentUri.fsPath);
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob: data:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline' ${webview.cspSource}; font-src ${webview.cspSource};" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Diagram - ${fileName}</title>
  <link rel="stylesheet" href="${reactFlowCssUri}" />
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
