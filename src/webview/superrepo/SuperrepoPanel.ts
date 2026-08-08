import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { readSubmodules } from '../../git/gitmodules';
import { detectProviderFromUrl } from '../../git/provider';
import { readManifest } from '../../harness/manifest';
import { runApplyPipeline } from '../../superrepo/applyPipeline';
import type { HostToWebview, SubmoduleRow, WebviewToHost } from './types';

function loadForgeVersion(extensionPath: string): string {
    try {
        const pkg = JSON.parse(
            fs.readFileSync(path.join(extensionPath, 'package.json'), 'utf8')
        ) as { version?: string };
        return pkg.version || '0.0.0';
    } catch {
        return '0.0.0';
    }
}

function toRows(repoRoot: string): SubmoduleRow[] {
    return readSubmodules(repoRoot).map((entry, index) => ({
        id: `existing-${index}-${entry.path}`,
        name: entry.name,
        path: entry.path,
        url: entry.url,
        branch: entry.branch,
        provider: entry.provider
    }));
}

function defaultWorktreesPath(repoRoot: string): string {
    const manifest = readManifest(repoRoot);
    if (manifest?.worktreesPath) {
        const abs = manifest.worktreesPath;
        const rel = path.relative(repoRoot, abs);
        if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
            return rel.replace(/\\/g, '/');
        }
        if (path.resolve(abs) === path.resolve(repoRoot, '.worktrees')) {
            return '.worktrees';
        }
        return abs;
    }
    return '.worktrees';
}

export class SuperrepoPanel {
    public static current: SuperrepoPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private readonly extensionPath: string;
    private readonly output: vscode.OutputChannel;
    private repoRoot: string;
    private disposables: vscode.Disposable[] = [];

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        extensionPath: string,
        repoRoot: string,
        output: vscode.OutputChannel
    ) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.extensionPath = extensionPath;
        this.repoRoot = repoRoot;
        this.output = output;

        this.panel.webview.html = this.getHtml(this.panel.webview);
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.onDidReceiveMessage(
            (message: WebviewToHost) => this.onMessage(message),
            null,
            this.disposables
        );
    }

    public static async show(
        context: vscode.ExtensionContext,
        output: vscode.OutputChannel,
        options?: { repoRoot?: string }
    ): Promise<void> {
        let repoRoot = options?.repoRoot;
        if (!repoRoot) {
            const folder = vscode.workspace.workspaceFolders?.[0];
            if (!folder) {
                const picked = await vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    openLabel: 'Select superrepo root'
                });
                if (!picked?.[0]) {
                    return;
                }
                repoRoot = picked[0].fsPath;
            } else {
                repoRoot = folder.uri.fsPath;
            }
        }

        const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

        if (SuperrepoPanel.current) {
            SuperrepoPanel.current.repoRoot = repoRoot;
            SuperrepoPanel.current.panel.reveal(column);
            SuperrepoPanel.current.postInit();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'forge.superrepo',
            'Forge: Initialize Superrepo',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'media', 'superrepo')
                ]
            }
        );

        SuperrepoPanel.current = new SuperrepoPanel(
            panel,
            context.extensionUri,
            context.extensionPath,
            repoRoot,
            output
        );
    }

    private post(message: HostToWebview): void {
        void this.panel.webview.postMessage(message);
    }

    private postInit(): void {
        const rows = toRows(this.repoRoot).map((row) => ({
            ...row,
            provider: detectProviderFromUrl(row.url)
        }));
        this.post({
            type: 'init',
            repoRoot: this.repoRoot,
            worktreesPath: defaultWorktreesPath(this.repoRoot),
            submodules: rows
        });
    }

    private async onMessage(message: WebviewToHost): Promise<void> {
        switch (message.type) {
            case 'ready':
                this.postInit();
                break;
            case 'cancel':
                this.panel.dispose();
                break;
            case 'pickFolder': {
                const picked = await vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    openLabel: 'Select superrepo root',
                    defaultUri: vscode.Uri.file(this.repoRoot)
                });
                if (picked?.[0]) {
                    this.repoRoot = picked[0].fsPath;
                    this.postInit();
                }
                break;
            }
            case 'apply': {
                const forgeVersion = loadForgeVersion(this.extensionPath);
                this.output.appendLine(`Forge init starting at ${this.repoRoot}`);
                const result = await runApplyPipeline({
                    repoRoot: this.repoRoot,
                    extensionPath: this.extensionPath,
                    forgeVersion,
                    submodules: message.submodules,
                    worktreesPath: message.worktreesPath,
                    onProgress: (event) => {
                        this.post({ type: 'progress', event });
                        this.output.appendLine(`[${event.stage}] ${event.status}: ${event.message}`);
                    }
                });
                this.post({
                    type: 'applyResult',
                    ok: result.ok,
                    error: result.error,
                    completedStages: result.completedStages
                });
                if (result.ok) {
                    void vscode.window.showInformationMessage(
                        'Forge superrepo initialized. Harness installed under .cursor/.'
                    );
                } else {
                    void vscode.window.showErrorMessage(
                        `Forge init failed at ${result.failedStage}: ${result.error}`
                    );
                }
                break;
            }
            default:
                break;
        }
    }

    private getHtml(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'superrepo', 'main.js')
        );
        const nonce = String(Date.now());
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Forge Superrepo</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private dispose(): void {
        SuperrepoPanel.current = undefined;
        while (this.disposables.length) {
            const d = this.disposables.pop();
            d?.dispose();
        }
    }
}
