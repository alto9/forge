import * as path from 'path';
import * as vscode from 'vscode';
import { copyPromptDialog } from '../actions/copyPromptDialog';
import {
    buildActionPrompt,
    getActionTitle,
} from '../actions/prompts/productOwner';
import {
    readForgeJson,
    readProductName,
    readProductOwnerDocs,
} from '../memory/MemoryReader';
import {
    isMemoryRepoConfigured,
    resolvePaths,
    type ResolvePathsOk,
} from '../paths/resolvePaths';
import { loadForgeRoles } from '../roles/loadForgeRoles';
import {
    SELECTED_ROLE_KEY,
    SELECTED_SUBMODULE_KEY,
} from '../stateKeys';
import { readMediaHtml } from '../webview/html';
import {
    PRODUCT_OWNER_LABEL,
    PRODUCT_OWNER_ROLE_ID,
    PRODUCT_OWNER_TABS,
} from './roleConfigs/productOwner';

export class DashboardPanel {
    public static readonly viewType = 'forge.dashboard';
    private static current: DashboardPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly disposables: vscode.Disposable[] = [];
    private roleId: string;
    private watcher?: vscode.FileSystemWatcher;

    private constructor(
        panel: vscode.WebviewPanel,
        private readonly context: vscode.ExtensionContext,
        private readonly output: vscode.OutputChannel,
        roleId: string
    ) {
        this.panel = panel;
        this.roleId = roleId;

        this.panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'media', 'dashboard'),
            ],
        };
        this.panel.webview.html = readMediaHtml(
            this.context.extensionUri,
            'dashboard',
            this.panel.webview
        );

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.onDidReceiveMessage(
            (msg) => void this.handleMessage(msg),
            null,
            this.disposables
        );
    }

    public static async show(
        context: vscode.ExtensionContext,
        output: vscode.OutputChannel,
        roleId?: string
    ): Promise<void> {
        const role =
            roleId ??
            context.workspaceState.get<string>(SELECTED_ROLE_KEY) ??
            PRODUCT_OWNER_ROLE_ID;

        if (DashboardPanel.current) {
            DashboardPanel.current.roleId = role;
            DashboardPanel.current.panel.reveal(vscode.ViewColumn.One);
            await DashboardPanel.current.pushData();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            DashboardPanel.viewType,
            'Forge Dashboard',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'media', 'dashboard'),
                ],
            }
        );

        DashboardPanel.current = new DashboardPanel(panel, context, output, role);
        await DashboardPanel.current.pushData();
        DashboardPanel.current.setupWatchers();
    }

    public static refreshIfOpen(): void {
        void DashboardPanel.current?.pushData();
    }

    private async handleMessage(msg: {
        type?: string;
        actionId?: string;
    }): Promise<void> {
        switch (msg.type) {
            case 'ready':
                await this.pushData();
                break;
            case 'action':
                if (msg.actionId) {
                    await this.runAction(msg.actionId);
                }
                break;
            default:
                break;
        }
    }

    private async runAction(actionId: string): Promise<void> {
        const resolved = this.resolveCurrent();
        if (!resolved || !resolved.ok) {
            void vscode.window.showErrorMessage(
                'Cannot run action: Forge memory repo is not configured.'
            );
            return;
        }
        const prompt = buildActionPrompt(actionId, {
            submodulePath: resolved.submodulePath,
            memoryRoot: resolved.memoryRoot,
        });
        if (!prompt) {
            void vscode.window.showErrorMessage(`Unknown action: ${actionId}`);
            return;
        }
        await copyPromptDialog(getActionTitle(actionId), prompt);
    }

    private resolveCurrent(): ReturnType<typeof resolvePaths> {
        const folders = vscode.workspace.workspaceFolders;
        const cwd = folders?.[0]?.uri.fsPath ?? process.cwd();
        const submodule = this.context.workspaceState.get<string>(SELECTED_SUBMODULE_KEY);
        return resolvePaths({
            cwd,
            submodule: submodule || undefined,
            preferDefaultSubmodule: true,
        });
    }

    private async pushData(): Promise<void> {
        const roles = loadForgeRoles();
        const roleMeta = roles.find((r) => r.id === this.roleId);
        const roleLabel = roleMeta?.label ?? this.roleId;

        if (this.roleId !== PRODUCT_OWNER_ROLE_ID) {
            await this.panel.webview.postMessage({
                type: 'dashboardData',
                kind: 'placeholder',
                title: `${roleLabel} dashboard`,
                message: `Dashboard for ${roleLabel} is coming soon. Switch to Product Owner to view memory docs.`,
            });
            this.panel.title = `Forge — ${roleLabel}`;
            return;
        }

        const result = this.resolveCurrent();
        if (!isMemoryRepoConfigured(result) || !result.ok) {
            await this.panel.webview.postMessage({
                type: 'dashboardData',
                kind: 'error',
                message:
                    (result.ok === false ? result.error : undefined) ||
                    'This workspace does not have a Forge memory repo. Initialize the project first.',
            });
            this.panel.title = 'Forge Dashboard';
            return;
        }

        await this.postProductOwnerData(result);
    }

    private async postProductOwnerData(result: ResolvePathsOk): Promise<void> {
        const docs = readProductOwnerDocs(result.memoryRoot);
        const forgeJson = readForgeJson(result.memoryRoot);
        const productName = readProductName(result.memoryRoot) || result.submodulePath;
        const dashboardTitle = `${productName} ${PRODUCT_OWNER_LABEL}`;
        const host = forgeJson?.host;
        const hostConnected = host === 'github' || host === 'gitlab';
        const hostLabel =
            host === 'github'
                ? 'GitHub connected'
                : host === 'gitlab'
                  ? 'GitLab connected'
                  : 'Host not configured';

        const memoryPathDisplay = path.posix.join(
            '.ai/memory',
            result.submodulePath.replace(/\\/g, '/')
        ) + '/';

        const serializableDocs: Record<string, { frontmatter: Record<string, unknown>; exists: boolean }> =
            {};
        for (const [key, doc] of Object.entries(docs)) {
            serializableDocs[key] = {
                frontmatter: doc.frontmatter,
                exists: doc.exists,
            };
        }

        this.panel.title = `Forge — ${dashboardTitle}`;
        await this.panel.webview.postMessage({
            type: 'dashboardData',
            kind: 'productOwner',
            roleId: PRODUCT_OWNER_ROLE_ID,
            roleLabel: PRODUCT_OWNER_LABEL,
            productName,
            dashboardTitle,
            submodulePath: result.submodulePath,
            memoryRoot: result.memoryRoot,
            memoryPathDisplay,
            hostConnected,
            hostLabel,
            tabs: PRODUCT_OWNER_TABS,
            docs: serializableDocs,
        });
    }

    private setupWatchers(): void {
        this.watcher?.dispose();
        this.watcher = undefined;
        const result = this.resolveCurrent();
        if (!result.ok) {
            return;
        }
        const pattern = new vscode.RelativePattern(result.memoryRoot, '**/*');
        this.watcher = vscode.workspace.createFileSystemWatcher(pattern);
        const refresh = () => {
            void this.pushData();
        };
        this.watcher.onDidChange(refresh, null, this.disposables);
        this.watcher.onDidCreate(refresh, null, this.disposables);
        this.watcher.onDidDelete(refresh, null, this.disposables);
    }

    private dispose(): void {
        DashboardPanel.current = undefined;
        this.watcher?.dispose();
        while (this.disposables.length) {
            this.disposables.pop()?.dispose();
        }
    }
}
