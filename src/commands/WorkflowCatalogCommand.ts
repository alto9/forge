import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { startWorkflowRun } from '../temporal/startWorkflowRun';
import { getWorkflowRunRecoveryContext } from '../temporal/workflowRunRecoveryService';
import { buildWorkflowCatalog } from '../workflows/buildWorkflowCatalog';
import type { WorkflowCatalogEmptyState } from '../workflows/types';
import { WorkflowCatalogPanel } from '../webview/workflows/WorkflowCatalogPanel';
import type { WorkflowCatalogWebviewModel } from '../webview/workflows/catalogPresentation';

export const WORKFLOW_CATALOG_REPOSITORY_ROOT_KEY = 'forge.workflow.catalog.repositoryRoot';
export const WORKFLOW_CATALOG_SELECTED_WORKFLOW_ID_KEY = 'forge.workflow.catalog.selectedWorkflowId';

const WORKFLOWS_RELATIVE_DIR = '.ai/workflows';

function findWorkspaceFolderByRoot(
    folders: readonly vscode.WorkspaceFolder[],
    repositoryRoot: string
): vscode.WorkspaceFolder | undefined {
    const normalized = path.resolve(repositoryRoot);
    return folders.find((folder) => path.resolve(folder.uri.fsPath) === normalized);
}

async function pickFolder(
    context: vscode.ExtensionContext,
    forcePrompt = false
): Promise<vscode.WorkspaceFolder | undefined> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders?.length) {
        return undefined;
    }

    if (!forcePrompt) {
        const savedRoot = context.workspaceState.get<string>(WORKFLOW_CATALOG_REPOSITORY_ROOT_KEY);
        if (savedRoot) {
            const savedFolder = findWorkspaceFolderByRoot(folders, savedRoot);
            if (savedFolder) {
                return savedFolder;
            }
        }
    }

    if (folders.length === 1) {
        return folders[0];
    }

    return vscode.window.showWorkspaceFolderPick({
        placeHolder: 'Select the repository folder for workflow definitions',
    });
}

function buildModel(
    folder: vscode.WorkspaceFolder,
    context: vscode.ExtensionContext
): WorkflowCatalogWebviewModel {
    const catalog = buildWorkflowCatalog(folder.uri.fsPath);
    const selectedWorkflowId = context.workspaceState.get<string>(
        WORKFLOW_CATALOG_SELECTED_WORKFLOW_ID_KEY
    );

    return {
        repositoryRoot: catalog.repositoryRoot,
        repositoryName: folder.name,
        entries: catalog.entries,
        emptyState: catalog.emptyState,
        selectedWorkflowId,
    };
}

function createWorkflowWatcher(
    folder: vscode.WorkspaceFolder,
    onChange: () => void
): vscode.FileSystemWatcher {
    const pattern = new vscode.RelativePattern(folder, `${WORKFLOWS_RELATIVE_DIR}/**/*.json`);
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);
    watcher.onDidCreate(onChange);
    watcher.onDidChange(onChange);
    watcher.onDidDelete(onChange);
    return watcher;
}

export class WorkflowCatalogCommand {
    private static watcher: vscode.FileSystemWatcher | undefined;
    private static watchedFolderUri: string | undefined;

    private static disposeWatcher(): void {
        this.watcher?.dispose();
        this.watcher = undefined;
        this.watchedFolderUri = undefined;
    }

    private static ensureWatcher(folder: vscode.WorkspaceFolder, refresh: () => void): void {
        const folderUri = folder.uri.toString();
        if (this.watchedFolderUri === folderUri && this.watcher) {
            return;
        }

        this.disposeWatcher();
        this.watcher = createWorkflowWatcher(folder, refresh);
        this.watchedFolderUri = folderUri;
    }

    static async resolveRepositoryFolder(
        context: vscode.ExtensionContext,
        options?: { forcePrompt?: boolean }
    ): Promise<vscode.WorkspaceFolder | undefined> {
        const folder = await pickFolder(context, options?.forcePrompt === true);
        if (!folder) {
            return undefined;
        }

        await context.workspaceState.update(
            WORKFLOW_CATALOG_REPOSITORY_ROOT_KEY,
            path.resolve(folder.uri.fsPath)
        );
        return folder;
    }

    static async openCatalog(context: vscode.ExtensionContext): Promise<void> {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders?.length) {
            await WorkflowCatalogPanel.show(
                context,
                {
                    repositoryRoot: '',
                    repositoryName: '',
                    entries: [],
                    emptyState: 'no_workspace',
                },
                {}
            );
            return;
        }

        const folder = await this.resolveRepositoryFolder(context);
        if (!folder) {
            return;
        }

        await this.refreshCatalog(context, folder);
    }

    static async refreshCatalog(
        context: vscode.ExtensionContext,
        folder?: vscode.WorkspaceFolder
    ): Promise<void> {
        const targetFolder =
            folder ??
            (await this.resolveRepositoryFolder(context)) ??
            undefined;

        if (!targetFolder) {
            if (!vscode.workspace.workspaceFolders?.length) {
                await WorkflowCatalogPanel.show(
                    context,
                    {
                        repositoryRoot: '',
                        repositoryName: '',
                        entries: [],
                        emptyState: 'no_workspace',
                    },
                    {}
                );
            }
            return;
        }

        const model = buildModel(targetFolder, context);
        const refresh = () => {
            void this.refreshCatalog(context, targetFolder);
        };

        this.ensureWatcher(targetFolder, refresh);

        await WorkflowCatalogPanel.show(context, model, {
            onSelectWorkflow: async (workflowId) => {
                await context.workspaceState.update(
                    WORKFLOW_CATALOG_SELECTED_WORKFLOW_ID_KEY,
                    workflowId
                );
            },
            onStartRun: async ({ workflowId, runInputs }) => {
                const recoveryContext = getWorkflowRunRecoveryContext();
                if (!recoveryContext) {
                    return {
                        ok: false,
                        message: 'Workflow run recovery is not initialized.',
                    };
                }

                const outcome = await startWorkflowRun({
                    repositoryRoot: targetFolder.uri.fsPath,
                    workflowId,
                    submittedRunInputs: runInputs,
                    globalStoragePath: recoveryContext.globalStoragePath,
                    windowId: recoveryContext.windowId,
                });

                if (!outcome.ok) {
                    const firstDiagnostic = outcome.diagnostics[0];
                    return {
                        ok: false,
                        message: outcome.inFlight
                            ? 'Starting workflow run…'
                            : firstDiagnostic?.message,
                    };
                }

                return { ok: true };
            },
            onDispose: () => {
                this.disposeWatcher();
            },
        });
    }

    static async selectRepositoryFolder(context: vscode.ExtensionContext): Promise<void> {
        const folder = await this.resolveRepositoryFolder(context, { forcePrompt: true });
        if (!folder) {
            return;
        }

        await context.workspaceState.update(WORKFLOW_CATALOG_SELECTED_WORKFLOW_ID_KEY, undefined);
        await this.refreshCatalog(context, folder);
    }

    static hasWorkflowsDirectory(repositoryRoot: string): boolean {
        const workflowsDir = path.join(repositoryRoot, WORKFLOWS_RELATIVE_DIR);
        return fs.existsSync(workflowsDir) && fs.statSync(workflowsDir).isDirectory();
    }

    static detectEmptyState(repositoryRoot: string): WorkflowCatalogEmptyState | undefined {
        const catalog = buildWorkflowCatalog(repositoryRoot);
        return catalog.emptyState;
    }
}
