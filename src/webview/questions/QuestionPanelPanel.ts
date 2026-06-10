import * as vscode from 'vscode';
import type { QuestionPanelWebviewModel } from './questionsPresentation';

const POLL_INTERVAL_MS = 2000;

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export type QuestionPanelMessage =
    | { type: 'ready' }
    | { type: 'draftUpdate'; drafts: Record<string, string> }
    | { type: 'submit'; drafts: Record<string, string> }
    | { type: 'discardDraft' };

export type QuestionPanelPanelSession = {
    refreshModel: (options?: { fromTemporal?: boolean }) => Promise<QuestionPanelWebviewModel>;
    shouldPoll: () => boolean;
    onDraftUpdate: (drafts: Record<string, string>) => void;
    onSubmit: (drafts: Record<string, string>) => Promise<void>;
    onDiscardDraft: () => void;
    onDispose?: () => void;
    onTerminal?: () => void;
};

export class QuestionPanelPanel {
    public static currentPanel: QuestionPanelPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private session: QuestionPanelPanelSession;
    private pollTimer: ReturnType<typeof setInterval> | undefined;
    private visible = true;
    private refreshing = false;

    private constructor(
        panel: vscode.WebviewPanel,
        context: vscode.ExtensionContext,
        session: QuestionPanelPanelSession
    ) {
        this.panel = panel;
        this.session = session;

        const nonce = getNonce();
        const scriptUri = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'media', 'questions', 'main.js')
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
  <title>Question Panel</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;

        panel.webview.onDidReceiveMessage((message: QuestionPanelMessage) => {
            if (message.type === 'ready') {
                void this.pushModel();
                return;
            }
            if (message.type === 'draftUpdate') {
                this.session.onDraftUpdate(message.drafts);
                return;
            }
            if (message.type === 'discardDraft') {
                this.session.onDiscardDraft();
                void this.pushModel();
                return;
            }
            if (message.type === 'submit') {
                void this.handleSubmit(message.drafts);
            }
        });

        panel.onDidChangeViewState((event) => {
            this.visible = event.webviewPanel.visible;
            this.syncPollTimer();
        });

        panel.onDidDispose(() => {
            if (QuestionPanelPanel.currentPanel === this) {
                QuestionPanelPanel.currentPanel = undefined;
            }
            this.stopPoll();
            this.session.onDispose?.();
        });
    }

    static async show(
        context: vscode.ExtensionContext,
        model: QuestionPanelWebviewModel,
        session: QuestionPanelPanelSession
    ): Promise<QuestionPanelPanel> {
        const column = vscode.ViewColumn.Active;
        const title = model.pendingQuestion
            ? `Questions: ${model.workflowName}`
            : 'Question Panel';

        if (QuestionPanelPanel.currentPanel) {
            QuestionPanelPanel.currentPanel.panel.reveal(column);
            QuestionPanelPanel.currentPanel.session = session;
            QuestionPanelPanel.currentPanel.panel.title = title;
            QuestionPanelPanel.currentPanel.update(model);
            QuestionPanelPanel.currentPanel.syncPollTimer();
            return QuestionPanelPanel.currentPanel;
        }

        const panel = vscode.window.createWebviewPanel(
            'forge.questionPanel',
            title,
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'media', 'questions'),
                ],
            }
        );

        const questionPanel = new QuestionPanelPanel(panel, context, session);
        QuestionPanelPanel.currentPanel = questionPanel;
        questionPanel.update(model);
        questionPanel.syncPollTimer();
        return questionPanel;
    }

    update(model: QuestionPanelWebviewModel): void {
        this.panel.title = model.pendingQuestion
            ? `Questions: ${model.workflowName}`
            : 'Question Panel';
        this.panel.webview.postMessage({
            type: 'init',
            payload: model,
        });
    }

    close(): void {
        this.panel.dispose();
    }

    async refreshFromHost(): Promise<void> {
        await this.pushModel(true);
    }

    private async handleSubmit(drafts: Record<string, string>): Promise<void> {
        try {
            await this.session.onSubmit(drafts);
        } finally {
            await this.pushModel(true);
        }
    }

    private async pushModel(fromTemporal = false): Promise<void> {
        if (this.refreshing) {
            return;
        }

        this.refreshing = true;
        try {
            const model = await this.session.refreshModel({ fromTemporal });
            if (model.emptyState === 'terminal') {
                this.session.onTerminal?.();
                this.close();
                return;
            }
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
