import * as vscode from 'vscode';
import { GitHubService, GitHubIssue } from '../services/GitHubService';

export interface ScribePanelData {
    owner: string;
    repo: string;
    issueNumber: number;
    issue: GitHubIssue;
}

/**
 * Scribe Panel - Opens GitHub issue in Scribe mode
 * Provides sub-issue creation and management interface
 */
export class ScribePanel {
    private static panels: Map<string, ScribePanel> = new Map();
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _data: ScribePanelData;
    private _pollInterval: NodeJS.Timeout | undefined;

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        data: ScribePanelData
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
                    case 'closeSession':
                        await this._closeSession();
                        break;
                    case 'refreshSubIssues':
                        await this._refreshSubIssues();
                        break;
                }
            },
            null,
            this._disposables
        );

        // Start polling for sub-issue updates (every 5 seconds)
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

    public static render(extensionUri: vscode.Uri, data: ScribePanelData, reusePanel?: vscode.WebviewPanel) {
        const panelKey = `${data.owner}/${data.repo}#${data.issueNumber}`;
        
        // If we already have a panel for this issue, reveal it and refresh data
        const existingPanel = ScribePanel.panels.get(panelKey);
        if (existingPanel) {
            existingPanel._data = data;
            existingPanel._panel.title = `Scribe: #${data.issueNumber} - ${data.issue.title}`;
            existingPanel._panel.reveal();
            // Refresh immediately when revealed
            existingPanel._refreshSubIssues();
            return;
        }

        // Reuse existing panel if provided (e.g., when transitioning from RefinementPanel)
        const panel = reusePanel || vscode.window.createWebviewPanel(
            'forgeScribe',
            `Scribe: #${data.issueNumber} - ${data.issue.title}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                ],
            }
        );

        const newPanel = new ScribePanel(panel, extensionUri, data);
        ScribePanel.panels.set(panelKey, newPanel);
    }

    public dispose() {
        // Remove this panel from the map
        const panelKey = `${this._data.owner}/${this._data.repo}#${this._data.issueNumber}`;
        ScribePanel.panels.delete(panelKey);

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
        try {
            const subIssues = await GitHubService.getSubIssues(this._data.owner, this._data.repo, this._data.issueNumber);
            console.log(`ScribePanel: Loaded ${subIssues.length} sub-issues for issue #${this._data.issueNumber}`);
            this._panel.webview.postMessage({
                type: 'initialData',
                data: {
                    owner: this._data.owner,
                    repo: this._data.repo,
                    issueNumber: this._data.issueNumber,
                    issue: this._data.issue,
                    subIssues
                }
            });
        } catch (error: any) {
            console.error('ScribePanel: Failed to load sub-issues:', error);
            this._panel.webview.postMessage({
                type: 'error',
                message: `Failed to load sub-issues: ${error.message}`
            });
        }
    }

    private async _refreshSubIssues() {
        try {
            const subIssues = await GitHubService.getSubIssues(this._data.owner, this._data.repo, this._data.issueNumber);
            console.log(`ScribePanel: Refreshed ${subIssues.length} sub-issues for issue #${this._data.issueNumber}`);
            this._panel.webview.postMessage({
                type: 'subIssuesUpdated',
                subIssues
            });
        } catch (error: any) {
            console.error('ScribePanel: Failed to refresh sub-issues:', error);
            this._panel.webview.postMessage({
                type: 'error',
                message: `Failed to refresh sub-issues: ${error.message}`
            });
        }
    }

    private async _closeSession() {
        try {
            // Update parent issue status to 'Ready' (this would typically be done via project board, but we can add a label or comment)
            // For now, we'll just show a message
            vscode.window.showInformationMessage('Session closed. Please move the issue to "Ready" status on the project board.');
            this._panel.dispose();
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to close session: ${error.message}`);
        }
    }

    private _startPolling() {
        this._stopPolling(); // Clear any existing interval
        this._pollInterval = setInterval(() => {
            this._refreshSubIssues();
        }, 5000); // Poll every 5 seconds
    }

    private _stopPolling() {
        if (this._pollInterval) {
            clearInterval(this._pollInterval);
            this._pollInterval = undefined;
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'scribe', 'main.js')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Scribe Mode</title>
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
