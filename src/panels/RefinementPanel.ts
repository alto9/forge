import * as vscode from 'vscode';
import { GitHubService, GitHubIssue } from '../services/GitHubService';
import { ScribePanel, ScribePanelData } from './ScribePanel';

export interface RefinementPanelData {
    owner: string;
    repo: string;
    issueNumber: number;
    issue: GitHubIssue;
}

/**
 * Refinement Panel - Opens GitHub issue in Refinement mode
 * Provides issue refinement interface with real-time GitHub sync
 */
export class RefinementPanel {
    private static panels: Map<string, RefinementPanel> = new Map();
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _data: RefinementPanelData;
    private _pollInterval: NodeJS.Timeout | undefined;

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        data: RefinementPanelData
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._data = data;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from webview
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'getInitialData':
                        await this._sendInitialData();
                        break;
                    case 'refreshIssue':
                        await this._refreshIssue();
                        break;
                    case 'progressToScribe':
                        await this._progressToScribe();
                        break;
                }
            },
            null,
            this._disposables
        );

        // Start polling for issue updates (every 5 seconds)
        this._startPolling();

        // Stop polling when panel is hidden
        this._panel.onDidChangeViewState((e) => {
            if (e.webviewPanel.visible) {
                this._startPolling();
            } else {
                this._stopPolling();
            }
        });
    }

    public static render(extensionUri: vscode.Uri, data: RefinementPanelData) {
        const panelKey = `${data.owner}/${data.repo}#${data.issueNumber}`;
        
        // If we already have a panel for this issue, reveal it and refresh data
        const existingPanel = RefinementPanel.panels.get(panelKey);
        if (existingPanel) {
            existingPanel._data = data;
            existingPanel._panel.title = `Refine: #${data.issueNumber} - ${data.issue.title}`;
            existingPanel._panel.reveal();
            // Refresh immediately when revealed
            existingPanel._refreshIssue();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'forgeRefinement',
            `Refine: #${data.issueNumber} - ${data.issue.title}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                ],
            }
        );

        const newPanel = new RefinementPanel(panel, extensionUri, data);
        RefinementPanel.panels.set(panelKey, newPanel);
    }

    public dispose() {
        // Remove this panel from the map
        const panelKey = `${this._data.owner}/${this._data.repo}#${this._data.issueNumber}`;
        RefinementPanel.panels.delete(panelKey);

        this._stopPolling();
        this._panel.dispose();

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

    private async _sendInitialData() {
        this._panel.webview.postMessage({
            type: 'initialData',
            data: {
                owner: this._data.owner,
                repo: this._data.repo,
                issueNumber: this._data.issueNumber,
                issue: this._data.issue
            }
        });
    }

    private async _refreshIssue() {
        try {
            const issue = await GitHubService.getIssue(this._data.owner, this._data.repo, this._data.issueNumber);
            const issueChanged = this._data.issue.title !== issue.title || this._data.issue.body !== issue.body;
            this._data.issue = issue;
            
            // Update panel title if issue title changed
            if (issueChanged) {
                this._panel.title = `Refine: #${this._data.issueNumber} - ${issue.title}`;
            }
            
            this._panel.webview.postMessage({
                type: 'issueUpdated',
                issue
            });
        } catch (error: any) {
            console.error('Failed to refresh issue:', error);
            this._panel.webview.postMessage({
                type: 'error',
                message: `Failed to refresh issue: ${error.message}`
            });
        }
    }

    private _startPolling() {
        this._stopPolling(); // Clear any existing interval
        this._pollInterval = setInterval(() => {
            this._refreshIssue();
        }, 5000); // Poll every 5 seconds
    }

    private _stopPolling() {
        if (this._pollInterval) {
            clearInterval(this._pollInterval);
            this._pollInterval = undefined;
        }
    }

    private async _progressToScribe() {
        // Stop refinement polling
        this._stopPolling();
        
        // Remove this panel from RefinementPanel map
        const panelKey = `${this._data.owner}/${this._data.repo}#${this._data.issueNumber}`;
        RefinementPanel.panels.delete(panelKey);
        
        // Dispose all RefinementPanel disposables (message handlers, etc.)
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
        
        // Transform this panel into a ScribePanel by reusing the same webview
        const scribeData: ScribePanelData = {
            owner: this._data.owner,
            repo: this._data.repo,
            issueNumber: this._data.issueNumber,
            issue: this._data.issue
        };
        
        // Create ScribePanel instance reusing the same webview panel
        ScribePanel.render(this._extensionUri, scribeData, this._panel);
    }


    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'refinement', 'main.js')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Refinement Mode</title>
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
