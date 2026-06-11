import * as vscode from 'vscode';
import type { WorkflowCatalogWebviewModel } from './catalogPresentation';

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export type WorkflowCatalogPanelCallbacks = {
    onSelectWorkflow?: (workflowId: string) => void;
    onStartRun?: (input: {
        workflowId: string;
        runInputs: Record<string, string>;
    }) => Promise<{ ok: boolean; message?: string; inFlight?: boolean }>;
    onDispose?: () => void;
};

export class WorkflowCatalogPanel {
    public static currentPanel: WorkflowCatalogPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly callbacks: WorkflowCatalogPanelCallbacks;

    private constructor(
        panel: vscode.WebviewPanel,
        context: vscode.ExtensionContext,
        callbacks: WorkflowCatalogPanelCallbacks
    ) {
        this.panel = panel;
        this.callbacks = callbacks;

        const nonce = getNonce();
        const scriptUri = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'media', 'workflows', 'main.js')
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
  <title>Workflow Catalog</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;

        panel.webview.onDidReceiveMessage(
            async (message: {
                type?: string;
                workflowId?: string;
                runInputs?: Record<string, string>;
            }) => {
                if (message.type === 'selectWorkflow' && typeof message.workflowId === 'string') {
                    this.callbacks.onSelectWorkflow?.(message.workflowId);
                    return;
                }

                if (
                    message.type === 'startRun' &&
                    typeof message.workflowId === 'string' &&
                    this.callbacks.onStartRun
                ) {
                    const result = await this.callbacks.onStartRun({
                        workflowId: message.workflowId,
                        runInputs: message.runInputs ?? {},
                    });
                    this.panel.webview.postMessage({
                        type: 'startRunResult',
                        workflowId: message.workflowId,
                        ok: result.ok,
                        message: result.message,
                        inFlight: result.inFlight,
                    });
                }
            }
        );

        panel.onDidDispose(() => {
            if (WorkflowCatalogPanel.currentPanel === this) {
                WorkflowCatalogPanel.currentPanel = undefined;
            }
            this.callbacks.onDispose?.();
        });
    }

    static async show(
        context: vscode.ExtensionContext,
        model: WorkflowCatalogWebviewModel,
        callbacks: WorkflowCatalogPanelCallbacks = {}
    ): Promise<WorkflowCatalogPanel> {
        const column = vscode.ViewColumn.Active;

        if (WorkflowCatalogPanel.currentPanel) {
            WorkflowCatalogPanel.currentPanel.panel.reveal(column);
            WorkflowCatalogPanel.currentPanel.update(model);
            return WorkflowCatalogPanel.currentPanel;
        }

        const panel = vscode.window.createWebviewPanel(
            'forge.workflowCatalog',
            'Forge Workflow Catalog',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'media', 'workflows'),
                ],
            }
        );

        const catalogPanel = new WorkflowCatalogPanel(panel, context, callbacks);
        WorkflowCatalogPanel.currentPanel = catalogPanel;
        catalogPanel.update(model);
        return catalogPanel;
    }

    update(model: WorkflowCatalogWebviewModel): void {
        this.panel.webview.postMessage({ type: 'init', payload: model });
    }
}
