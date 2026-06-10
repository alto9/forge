import path from 'path';
import * as vscode from 'vscode';
import { formatCancelConfirmMessage } from '../temporal/temporalPresentation';
import { refreshIndexedRunFromTemporal } from '../temporal/temporalRecoveryScan';
import {
    cancelWorkflowRun,
    evaluateWorkflowRunAction,
    readProjectionForEntry,
} from '../temporal/workflowRunActions';
import {
    createRunIndexEntryKey,
    type WorkflowRunIndexEntry,
} from '../temporal/workflowRunIndex';
import {
    getWorkflowRunRecoveryContext,
    notifyWorkflowRunIndexChanged,
    onWorkflowRunIndexChanged,
} from '../temporal/workflowRunRecoveryService';
import { buildRunInspectorDetail } from '../workflows/buildRunInspectorDetail';
import { buildWorkflowGraphModel } from '../workflows/buildWorkflowGraphModel';
import { buildWorkflowCatalog } from '../workflows/buildWorkflowCatalog';
import { loadWorkflowDefinition } from '../workflows/loadWorkflowDefinition';
import type { RunInspectorRecoveryActionId } from '../workflows/types';
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
import { QuestionPanelCommand } from './QuestionPanelCommand';
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
        buildInspectorDetail: (selectedNodeId: string | null) => Promise<ReturnType<typeof buildRunInspectorDetail>>;
        handleRecoveryAction: (
            actionId: RunInspectorRecoveryActionId,
            selectedNodeId: string | null
        ) => Promise<void>;
        onDispose: () => void;
    } {
        return {
            refreshModel: (options) => this.refreshModel(context, options),
            shouldPoll: () => this.shouldPoll(),
            buildInspectorDetail: (selectedNodeId) => this.buildInspectorDetail(selectedNodeId),
            handleRecoveryAction: (actionId, selectedNodeId) =>
                this.handleRecoveryAction(context, actionId, selectedNodeId),
            onDispose: () => {
                if (WorkflowGraphPanel.currentPanel === undefined) {
                    this.sessionState = undefined;
                }
            },
        };
    }

    private static async buildInspectorDetail(selectedNodeId: string | null) {
        const state = this.sessionState;
        if (!state) {
            return buildRunInspectorDetail(
                {
                    schema_version: '1',
                    workflow_id: 'unknown',
                    name: 'Unknown',
                    version: '0',
                    entry_node_id: 'start',
                    nodes: [],
                },
                undefined,
                selectedNodeId,
                ''
            );
        }

        const definition = loadWorkflowDefinition(state.repositoryRoot, state.workflowId);
        if (!definition) {
            return buildRunInspectorDetail(
                {
                    schema_version: '1',
                    workflow_id: state.workflowId,
                    name: state.workflowId,
                    version: '0',
                    entry_node_id: 'start',
                    nodes: [],
                },
                undefined,
                selectedNodeId,
                state.repositoryRoot
            );
        }

        const projection = await this.loadProjection(state, false);
        return buildRunInspectorDetail(
            definition,
            projection,
            selectedNodeId,
            state.repositoryRoot
        );
    }

    private static async handleRecoveryAction(
        context: vscode.ExtensionContext,
        actionId: RunInspectorRecoveryActionId,
        selectedNodeId: string | null
    ): Promise<void> {
        const state = this.sessionState;
        if (!state) {
            return;
        }

        switch (actionId) {
            case 'refresh':
                await this.refreshGraph(context);
                return;
            case 'cancel_run':
                await this.cancelCurrentRun();
                return;
            case 'open_question_panel':
                if (state.runIndexKey) {
                    await QuestionPanelCommand.openForRun(context, state.runIndexKey);
                }
                return;
            case 'open_in_editor':
            case 'copy_path':
            case 'copy_diagnostic':
            case 'copy_cursor_run_id':
                await this.handleInspectorClipboardAction(
                    actionId,
                    selectedNodeId,
                    state.repositoryRoot,
                    state.workflowId
                );
                return;
            default:
                return;
        }
    }

    private static async cancelCurrentRun(): Promise<void> {
        const state = this.sessionState;
        const recovery = getWorkflowRunRecoveryContext();
        if (!state?.runIndexKey || !recovery) {
            return;
        }

        const entry = recovery.indexStore.getEntry(state.runIndexKey);
        if (!entry) {
            return;
        }

        const projection = readProjectionForEntry(
            entry,
            recovery.globalStoragePath,
            recovery.windowId
        );
        const guard = evaluateWorkflowRunAction(entry, 'cancel', projection);
        if (!guard.allowed) {
            void vscode.window.showWarningMessage(guard.reason ?? 'Run actions are blocked.');
            return;
        }

        const confirmed = await vscode.window.showWarningMessage(
            formatCancelConfirmMessage(entry.workflowId, entry.runId),
            { modal: true },
            'Cancel run'
        );
        if (confirmed !== 'Cancel run') {
            return;
        }

        const client = await recovery.createRecoveryClient();
        try {
            await cancelWorkflowRun(entry, {
                indexStore: recovery.indexStore,
                globalStoragePath: recovery.globalStoragePath,
                windowId: recovery.windowId,
                client,
            });
            notifyWorkflowRunIndexChanged();
        } finally {
            await client.close();
        }
    }

    private static async handleInspectorClipboardAction(
        actionId: RunInspectorRecoveryActionId,
        selectedNodeId: string | null,
        repositoryRoot: string,
        workflowId: string
    ): Promise<void> {
        const definition = loadWorkflowDefinition(repositoryRoot, workflowId);
        if (!definition) {
            return;
        }

        const state = this.sessionState;
        const projection = state ? await this.loadProjection(state, false) : undefined;
        const detail = buildRunInspectorDetail(
            definition,
            projection,
            selectedNodeId,
            repositoryRoot
        );

        if (actionId === 'open_in_editor') {
            const artifactPath = detail.artifacts?.[0]?.path;
            if (!artifactPath) {
                return;
            }
            const absolutePath = path.join(repositoryRoot, artifactPath);
            const uri = vscode.Uri.file(absolutePath);
            await vscode.commands.executeCommand('vscode.open', uri);
            return;
        }

        if (actionId === 'copy_path') {
            const artifactPath = detail.artifacts?.[0]?.path;
            if (!artifactPath) {
                return;
            }
            await vscode.env.clipboard.writeText(artifactPath);
            return;
        }

        if (actionId === 'copy_diagnostic') {
            const diagnostic =
                detail.activity?.diagnostics?.[0] ?? detail.validation?.diagnostics?.[0];
            if (!diagnostic) {
                return;
            }
            await vscode.env.clipboard.writeText(`${diagnostic.code}: ${diagnostic.message}`);
            return;
        }

        if (actionId === 'copy_cursor_run_id') {
            const runId = detail.activity?.cursor_run_id;
            if (!runId) {
                return;
            }
            await vscode.env.clipboard.writeText(runId);
        }
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