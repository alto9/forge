import * as vscode from 'vscode';
import type { WorkflowGraphWebviewModel } from './graphPresentation';

const POLL_INTERVAL_MS = 2000;

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export type WorkflowGraphPanelSession = {
    refreshModel: (options?: { fromTemporal?: boolean }) => Promise<WorkflowGraphWebviewModel>;
    shouldPoll: () => boolean;
    onDispose?: () => void;
};

export class WorkflowGraphPanel {
    public static currentPanel: WorkflowGraphPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private session: WorkflowGraphPanelSession;
    private pollTimer: ReturnType<typeof setInterval> | undefined;
    private visible = true;
    private selectedNodeId: string | undefined;
    private refreshing = false;

    private constructor(
        panel: vscode.WebviewPanel,
        context: vscode.ExtensionContext,
        session: WorkflowGraphPanelSession
    ) {
        this.panel = panel;
        this.session = session;

        const nonce = getNonce();
        const scriptUri = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'media', 'workflows', 'graph', 'main.js')
        );

        const csp = [
            `default-src 'none'`,
            `style-src ${panel.webview.cspSource} 'unsafe-inline'`,
            `font-src ${panel.webview.cspSource}`,
            `img-src ${panel.webview.cspSource} https: data:`,
            `script-src 'nonce-${nonce}'`,
        ].join('; ');

        panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Workflow Graph</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;

        panel.webview.onDidReceiveMessage((message: { type?: string }) => {
            if (message.type === 'ready') {
                void this.pushModel();
            }
        });

        panel.onDidChangeViewState((event) => {
            this.visible = event.webviewPanel.visible;
            this.syncPollTimer();
        });

        panel.onDidDispose(() => {
            if (WorkflowGraphPanel.currentPanel === this) {
                WorkflowGraphPanel.currentPanel = undefined;
            }
            this.stopPoll();
            this.session.onDispose?.();
        });
    }

    static async show(
        context: vscode.ExtensionContext,
        model: WorkflowGraphWebviewModel,
        session: WorkflowGraphPanelSession
    ): Promise<WorkflowGraphPanel> {
        const column = vscode.ViewColumn.Active;
        const title = model.graph
            ? `Workflow Graph: ${model.graph.workflow_name}`
            : 'Workflow Graph';

        if (WorkflowGraphPanel.currentPanel) {
            WorkflowGraphPanel.currentPanel.panel.reveal(column);
            WorkflowGraphPanel.currentPanel.session = session;
            WorkflowGraphPanel.currentPanel.selectedNodeId = model.selectedNodeId;
            WorkflowGraphPanel.currentPanel.panel.title = title;
            WorkflowGraphPanel.currentPanel.update(model);
            WorkflowGraphPanel.currentPanel.syncPollTimer();
            return WorkflowGraphPanel.currentPanel;
        }

        const panel = vscode.window.createWebviewPanel(
            'forge.workflowGraph',
            title,
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'media', 'workflows', 'graph'),
                ],
            }
        );

        const graphPanel = new WorkflowGraphPanel(panel, context, session);
        graphPanel.selectedNodeId = model.selectedNodeId;
        WorkflowGraphPanel.currentPanel = graphPanel;
        graphPanel.update(model);
        graphPanel.syncPollTimer();
        return graphPanel;
    }

    update(model: WorkflowGraphWebviewModel): void {
        if (model.selectedNodeId) {
            this.selectedNodeId = model.selectedNodeId;
        }
        this.panel.webview.postMessage({
            type: 'init',
            payload: {
                ...model,
                selectedNodeId: model.selectedNodeId ?? this.selectedNodeId,
            },
        });
    }

    async refreshFromHost(): Promise<void> {
        await this.pushModel(true);
    }

    private async pushModel(fromTemporal = false): Promise<void> {
        if (this.refreshing) {
            return;
        }

        this.refreshing = true;
        try {
            const model = await this.session.refreshModel({ fromTemporal });
            this.update(model);
            this.syncPollTimer();
        } finally {
            this.refreshing = false;
        }
    }

    private syncPollTimer(): void {
        this.stopPoll();
        if (!this.visible || !this.session.shouldPoll()) {
            return;
        }

        this.pollTimer = setInterval(() => {
            void this.pushModel(true);
        }, POLL_INTERVAL_MS);
    }

    private stopPoll(): void {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = undefined;
        }
    }

    /** @internal test hook */
    get isPolling(): boolean {
        return this.pollTimer !== undefined;
    }
}
