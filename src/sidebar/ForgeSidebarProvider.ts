import * as path from 'path';
import * as vscode from 'vscode';
import { copyPromptDialog } from '../actions/copyPromptDialog';
import { buildActionPrompt, getActionTitle } from '../actions/prompts/productOwner';
import { DashboardPanel } from '../dashboard/DashboardPanel';
import { readProductName } from '../memory/MemoryReader';
import {
    isMemoryRepoConfigured,
    listCodeSubmodules,
    resolvePaths,
    type ResolvePathsOk,
    type ResolvePathsResult,
} from '../paths/resolvePaths';
import { loadForgeRoles } from '../roles/loadForgeRoles';
import {
    SELECTED_ROLE_KEY,
    SELECTED_SUBMODULE_KEY,
    SIDEBAR_VIEW_ID,
} from '../stateKeys';
import { readMediaHtml } from '../webview/html';

export { SIDEBAR_VIEW_ID, SELECTED_ROLE_KEY, SELECTED_SUBMODULE_KEY };

export class ForgeSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = SIDEBAR_VIEW_ID;

    private view?: vscode.WebviewView;
    private pathsResult: ResolvePathsResult | null = null;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly output: vscode.OutputChannel
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'media', 'sidebar'),
            ],
        };
        webviewView.webview.html = readMediaHtml(
            this.context.extensionUri,
            'sidebar',
            webviewView.webview
        );

        webviewView.webview.onDidReceiveMessage(async (msg) => {
            await this.handleMessage(msg);
        });

        this.refresh();
    }

    public refresh(): void {
        this.pathsResult = this.resolveFromWorkspace();
        if (!this.pathsResult.ok) {
            this.output.appendLine(`Forge sidebar blocked: ${this.pathsResult.error}`);
        } else {
            this.output.appendLine(
                `Forge sidebar active: ${this.pathsResult.superRepoRoot} → ${this.pathsResult.submodulePath}`
            );
        }
        this.postState();
    }

    public getPathsResult(): ResolvePathsResult | null {
        return this.pathsResult;
    }

    private resolveFromWorkspace(): ResolvePathsResult {
        const folders = vscode.workspace.workspaceFolders;
        const cwd = folders?.[0]?.uri.fsPath ?? process.cwd();
        const submodule = this.context.workspaceState.get<string>(SELECTED_SUBMODULE_KEY);
        return resolvePaths({
            cwd,
            submodule: submodule || undefined,
            // Super-repo root with multiple code submodules is expected; dashboard picks via dropdown.
            preferDefaultSubmodule: true,
        });
    }

    private listProducts(result: ResolvePathsOk): { submodulePath: string; label: string }[] {
        const submodules = listCodeSubmodules(result.superRepoRoot);
        const paths = submodules.length ? submodules : [result.submodulePath];
        return paths.map((submodulePath) => {
            const memoryRoot = path.join(result.memoryRepoRoot, submodulePath);
            const label = readProductName(memoryRoot) || submodulePath;
            return { submodulePath, label };
        });
    }

    private resolveSelectedSubmodule(
        result: ResolvePathsOk,
        products: { submodulePath: string }[]
    ): string {
        const stored = this.context.workspaceState.get<string>(SELECTED_SUBMODULE_KEY);
        const paths = products.map((p) => p.submodulePath);
        if (stored && paths.includes(stored)) {
            return stored;
        }
        if (paths.includes(result.submodulePath)) {
            return result.submodulePath;
        }
        return paths[0] ?? result.submodulePath;
    }

    private postState(): void {
        if (!this.view) {
            return;
        }
        const result = this.pathsResult ?? this.resolveFromWorkspace();
        this.pathsResult = result;
        const active = isMemoryRepoConfigured(result);
        const roles = loadForgeRoles();
        let selectedRole =
            this.context.workspaceState.get<string>(SELECTED_ROLE_KEY) ?? 'product-owner';
        if (!roles.some((r) => r.id === selectedRole)) {
            selectedRole = roles[0]?.id ?? 'product-owner';
        }

        const products = result.ok ? this.listProducts(result) : [];
        const selectedSubmodule =
            result.ok && products.length
                ? this.resolveSelectedSubmodule(result, products)
                : undefined;

        void this.view.webview.postMessage({
            type: 'state',
            mode: active ? 'active' : 'blocked',
            roles,
            selectedRole,
            products,
            selectedSubmodule,
            memorySynced: active,
            error: result.ok ? undefined : result.error,
        });
    }

    private async handleMessage(msg: {
        type?: string;
        roleId?: string;
        submodulePath?: string;
    }): Promise<void> {
        switch (msg.type) {
            case 'ready':
                this.postState();
                break;
            case 'setRole':
                if (msg.roleId) {
                    await this.context.workspaceState.update(SELECTED_ROLE_KEY, msg.roleId);
                    this.postState();
                }
                break;
            case 'setSubmodule':
                if (msg.submodulePath) {
                    await this.context.workspaceState.update(
                        SELECTED_SUBMODULE_KEY,
                        msg.submodulePath
                    );
                    this.refresh();
                    DashboardPanel.refreshIfOpen();
                }
                break;
            case 'openCourse':
                await vscode.commands.executeCommand('forge.openCourse');
                break;
            case 'openDashboard': {
                const role =
                    this.context.workspaceState.get<string>(SELECTED_ROLE_KEY) ?? 'product-owner';
                await DashboardPanel.show(this.context, this.output, role);
                break;
            }
            case 'initProject': {
                const result = this.pathsResult ?? this.resolveFromWorkspace();
                const submodulePath = result.ok ? result.submodulePath : '(resolve from workspace)';
                const memoryRoot = result.ok ? result.memoryRoot : '(after init)';
                const prompt = buildActionPrompt('sidebar.initProject', {
                    submodulePath,
                    memoryRoot,
                });
                if (prompt) {
                    await copyPromptDialog(getActionTitle('sidebar.initProject'), prompt);
                }
                break;
            }
            default:
                break;
        }
    }
}
