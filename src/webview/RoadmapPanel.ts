import * as vscode from 'vscode';
import type { RoadmapIssueRow } from '../github/roadmapTypes';

export type RoadmapWebviewModel = {
    /** Forge project repo from .forge/project.json github_url (owner/repo) — default filter */
    primaryRepo: string;
    projectTitle: string;
    issues: RoadmapIssueRow[];
};

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export class RoadmapPanel {
    public static currentPanel: vscode.WebviewPanel | undefined;

    static async show(
        context: vscode.ExtensionContext,
        model: RoadmapWebviewModel
    ): Promise<void> {
        const column = vscode.ViewColumn.Active;

        if (RoadmapPanel.currentPanel) {
            RoadmapPanel.currentPanel.reveal(column);
            RoadmapPanel.currentPanel.webview.postMessage({
                type: 'init',
                payload: model
            });
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'forge.roadmap',
            `Roadmap: ${model.projectTitle}`,
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'media', 'roadmap')
                ]
            }
        );

        RoadmapPanel.currentPanel = panel;

        const nonce = getNonce();
        const scriptUri = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'media', 'roadmap', 'main.js')
        );

        const csp = [
            `default-src 'none'`,
            `style-src ${panel.webview.cspSource} 'unsafe-inline'`,
            `font-src ${panel.webview.cspSource}`,
            `img-src ${panel.webview.cspSource} https: data:`,
            `script-src 'nonce-${nonce}'`
        ].join('; ');

        panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Roadmap</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;

        panel.webview.postMessage({ type: 'init', payload: model });

        panel.onDidDispose(
            () => {
                RoadmapPanel.currentPanel = undefined;
            },
            null,
            context.subscriptions
        );
    }
}
