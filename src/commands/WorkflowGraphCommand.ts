import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import { readProjectionForEntry } from '../temporal/workflowRunActions';
import {
    createRunIndexEntryKey,
    type WorkflowRunIndexEntry,
} from '../temporal/workflowRunIndex';
import {
    getWorkflowRunRecoveryContext,
    onWorkflowRunIndexChanged,
} from '../temporal/workflowRunRecoveryService';
import { refreshIndexedRunFromTemporal } from '../temporal/temporalRecoveryScan';
import { buildWorkflowGraphModel } from '../workflows/buildWorkflowGraphModel';
import { buildWorkflowCatalog } from '../workflows/buildWorkflowCatalog';
import type { WorkflowDefinition } from '../workflows/types';
import {
    WorkflowCatalogCommand,
    WORKFLOW_CATALOG_SELECTED_WORKFLOW_ID_KEY,
} from './WorkflowCatalogCommand';
import type { WorkflowRunTreeItem } from '../temporal/WorkflowRunListProvider';
import {
    buildGraphWebviewModel,
    GRAPH_NO_SELECTION_MESSAGE,
    GRAPH_VALIDATION_BLOCKED_MESSAGE,
    type WorkflowGraphWebviewModel,
} from '../webview/workflows/graphPresentation';
import { WorkflowGraphPanel } from '../webview/workflows/WorkflowGraphPanel';

export type OpenWorkflowGraphOptions = {
    runIndexKey?: string;
};

type GraphSessionState = {
    repositoryRoot: string;
    workflowId: string;
    runIndexKey?: string;
};

export class WorkflowGraphCommand {
    private static sessionState: GraphSessionState | undefined;
    private static indexListener: (() => void) | undefined;

    private static disposeIndexListener(): void {
        this.indexListener?.();
        this.indexListener = undefined;
    }

    private static ensureIndexListener(context: vscode.ExtensionContext): void {
        if (this.indexListener) {
            return;
        }

        this.indexListener = onWorkflowRunIndexChanged(() => {
            void WorkflowGraphPanel.currentPanel?.refreshFromHost();
        });
        context.subscriptions.push({ dispose: () => this.disposeIndexListener() });
    }

    static async openGraph(
        context: vscode.ExtensionContext,
        options: OpenWorkflowGraphOptions = {}
    ): Promise<void> {
        this.ensureIndexListener(context);

        const folders = vscode.workspace.workspaceFolders;
        if (!folders?.length) {
            await WorkflowGraphPanel.show(
                context,
                { header: 'Workflow Graph', emptyState: 'no_workspace' },
                {
                    refreshModel: async () => ({
                        header: 'Workflow Graph',
                        emptyState: 'no_workspace',
                    }),
                    shouldPoll: () => false,
                }
            );
            return;
        }

        if (options.runIndexKey) {
            await this.openGraphForRun(context, options.runIndexKey);
            return;
        }

        const folder = await WorkflowCatalogCommand.resolveRepositoryFolder(context);
        if (!folder) {
            return;
        }

        const repositoryRoot = path.resolve(folder.uri.fsPath);
        const selectedWorkflowId = context.workspaceState.get<string>(
            WORKFLOW_CATALOG_SELECTED_WORKFLOW_ID_KEY
        );

        if (!selectedWorkflowId) {
            void vscode.window.showWarningMessage(GRAPH_NO_SELECTION_MESSAGE);
            await WorkflowGraphPanel.show(
                context,
                {
                    header: 'Workflow Graph',
                    emptyState: 'no_selection',
                },
                {
                    refreshModel: async () => ({
                        header: 'Workflow Graph',
                        emptyState: 'no_selection',
                    }),
                    shouldPoll: () => false,
                }
            );
            return;
        }

        const catalog = buildWorkflowCatalog(repositoryRoot);
        const catalogEntry = catalog.entries.find(
            (entry) => entry.workflow_id === selectedWorkflowId
        );
        if (!catalogEntry || catalogEntry.validation.errorCount > 0) {
            void vscode.window.showWarningMessage(GRAPH_VALIDATION_BLOCKED_MESSAGE);
            return;
        }

        const activeRun = this.findActiveRun(repositoryRoot, selectedWorkflowId);
        this.sessionState = {
            repositoryRoot,
            workflowId: selectedWorkflowId,
            runIndexKey: activeRun ? createRunIndexEntryKey(activeRun) : undefined,
        };

        const session = this.buildSession(context);
        const model = await session.refreshModel();
        await WorkflowGraphPanel.show(context, model, session);
    }

    static async openGraphFromRun(
        context: vscode.ExtensionContext,
        item?: WorkflowRunTreeItem
    ): Promise<void> {
        this.ensureIndexListener(context);

        const entry = item?.entry;
        if (!entry) {
            void vscode.window.showWarningMessage('Select a workflow run to view its graph.');
            return;
        }

        await this.openGraphForRun(context, createRunIndexEntryKey(entry));
    }

    static async refreshGraph(context: vscode.ExtensionContext): Promise<void> {
        if (!WorkflowGraphPanel.currentPanel || !this.sessionState) {
            await this.openGraph(context);
            return;
        }

        await WorkflowGraphPanel.currentPanel.refreshFromHost();
    }

    private static async openGraphForRun(
        context: vscode.ExtensionContext,
        runIndexKey: string
    ): Promise<void> {
        const recovery = getWorkflowRunRecoveryContext();
        const entry = recovery?.indexStore.getEntry(runIndexKey);
        if (!entry) {
            void vscode.window.showWarningMessage('The selected workflow run is no longer indexed.');
            return;
        }

        this.sessionState = {
            repositoryRoot: path.resolve(entry.repositoryRoot),
            workflowId: entry.workflow_id,
            runIndexKey,
        };

        const session = this.buildSession(context);
        const model = await session.refreshModel();
        await WorkflowGraphPanel.show(context, model, session);
    }

    private static buildSession(context: vscode.ExtensionContext): {
        refreshModel: (options?: { fromTemporal?: boolean }) => Promise<WorkflowGraphWebviewModel>;
        shouldPoll: () => boolean;
        onDispose: () => void;
    } {
        return {
            refreshModel: (options) => this.refreshModel(context, options),
            shouldPoll: () => this.shouldPoll(),
            onDispose: () => {
                if (WorkflowGraphPanel.currentPanel === undefined) {
                    this.sessionState = undefined;
                }
            },
        };
    }

    private static shouldPoll(): boolean {
        const state = this.sessionState;
        const recovery = getWorkflowRunRecoveryContext();
        if (!state?.runIndexKey || !recovery) {
            return false;
        }

        const entry = recovery.indexStore.getEntry(state.runIndexKey);
        if (!entry || entry.terminal) {
            return false;
        }

        const projection = readProjectionForEntry(
            entry,
            recovery.globalStoragePath,
            recovery.windowId
        );
        return projection?.recoveryState === 'synced';
    }

    private static async refreshModel(
        context: vscode.ExtensionContext,
        options?: { fromTemporal?: boolean }
    ): Promise<WorkflowGraphWebviewModel> {
        const state = this.sessionState;
        if (!state) {
            return { header: 'Workflow Graph', emptyState: 'no_selection' };
        }

        const definition = loadWorkflowDefinition(state.repositoryRoot, state.workflowId);
        if (!definition) {
            return { header: 'Workflow Graph', emptyState: 'no_selection' };
        }

        const projection = await this.loadProjection(state, options?.fromTemporal === true);

        if (projection && state.runIndexKey) {
            return buildGraphWebviewModel(
                buildWorkflowGraphModel(definition, projection),
                projection.activeNodeId
            );
        }

        return buildGraphWebviewModel(buildWorkflowGraphModel(definition));
    }

    private static async loadProjection(
        state: GraphSessionState,
        fromTemporal: boolean
    ) {
        if (!state.runIndexKey) {
            return undefined;
        }

        const recovery = getWorkflowRunRecoveryContext();
        if (!recovery) {
            return undefined;
        }

        const entry = recovery.indexStore.getEntry(state.runIndexKey);
        if (!entry) {
            return undefined;
        }

        let projection = readProjectionForEntry(
            entry,
            recovery.globalStoragePath,
            recovery.windowId
        );

        if (
            fromTemporal &&
            !entry.terminal &&
            recovery.isReady()
        ) {
            try {
                const client = await recovery.createRecoveryClient();
                try {
                    await refreshIndexedRunFromTemporal(entry, {
                        indexStore: recovery.indexStore,
                        globalStoragePath: recovery.globalStoragePath,
                        windowId: recovery.windowId,
                        client,
                        log: recovery.log,
                    });
                } finally {
                    await client.close();
                }

                const refreshedEntry = recovery.indexStore.getEntry(state.runIndexKey) ?? entry;
                projection = readProjectionForEntry(
                    refreshedEntry,
                    recovery.globalStoragePath,
                    recovery.windowId
                );
            } catch {
                projection = readProjectionForEntry(
                    recovery.indexStore.getEntry(state.runIndexKey) ?? entry,
                    recovery.globalStoragePath,
                    recovery.windowId
                );
            }
        }

        return projection;
    }

    private static findActiveRun(
        repositoryRoot: string,
        workflowId: string
    ): WorkflowRunIndexEntry | undefined {
        const recovery = getWorkflowRunRecoveryContext();
        if (!recovery) {
            return undefined;
        }

        const normalizedRoot = path.resolve(repositoryRoot);
        return recovery.indexStore
            .listEntries()
            .find(
                (entry) =>
                    !entry.terminal &&
                    entry.workflow_id === workflowId &&
                    path.resolve(entry.repositoryRoot) === normalizedRoot
            );
    }
}

function loadWorkflowDefinition(
    repositoryRoot: string,
    workflowId: string
): WorkflowDefinition | undefined {
    const catalog = buildWorkflowCatalog(repositoryRoot);
    const entry = catalog.entries.find((candidate) => candidate.workflow_id === workflowId);
    if (!entry) {
        return undefined;
    }

    const absolutePath = path.join(repositoryRoot, entry.path);
    try {
        return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as WorkflowDefinition;
    } catch {
        return undefined;
    }
}
