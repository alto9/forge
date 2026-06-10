import * as vscode from 'vscode';
import {
    formatCancelConfirmMessage,
    formatHumanInputBlockedMessage,
    formatRunActionsBlockedMessage,
} from '../temporal/temporalPresentation';
import {
    cancelWorkflowRun,
    dismissOrphanedWorkflowRun,
    evaluateHumanInputSubmit,
    evaluateWorkflowRunAction,
    readProjectionForEntry,
} from '../temporal/workflowRunActions';
import {
    getWorkflowRunRecoveryContext,
    notifyWorkflowRunIndexChanged,
    refreshWorkflowRunsManually,
} from '../temporal/workflowRunRecoveryService';
import {
    registerWorkflowRunListProvider,
    WORKFLOW_RUN_LIST_VIEW_ID,
    type WorkflowRunTreeItem,
} from '../temporal/WorkflowRunListProvider';
import type { WorkflowRunIndexEntry } from '../temporal/workflowRunIndex';

function resolveSelectedEntry(
    item?: WorkflowRunTreeItem
): { entry: WorkflowRunIndexEntry; indexKey: string } | undefined {
    const context = getWorkflowRunRecoveryContext();
    if (!context) {
        return undefined;
    }

    if (item?.entry) {
        return { entry: item.entry, indexKey: item.indexKey };
    }

    const entries = context.indexStore.listEntries();
    if (entries.length !== 1) {
        return undefined;
    }

    const entry = entries[0];
    return {
        entry,
        indexKey: `${entry.namespace}:${entry.workflowId}:${entry.runId}`,
    };
}

async function pickRunEntry(): Promise<
    { entry: WorkflowRunIndexEntry; indexKey: string } | undefined
> {
    const context = getWorkflowRunRecoveryContext();
    if (!context) {
        void vscode.window.showErrorMessage('Workflow run recovery is not initialized.');
        return undefined;
    }

    const entries = context.indexStore.listEntries();
    if (entries.length === 0) {
        void vscode.window.showInformationMessage('No workflow runs are indexed for this window.');
        return undefined;
    }

    if (entries.length === 1) {
        const entry = entries[0];
        return {
            entry,
            indexKey: `${entry.namespace}:${entry.workflowId}:${entry.runId}`,
        };
    }

    const picked = await vscode.window.showQuickPick(
        entries.map((entry) => ({
            label: `${entry.workflow_id} (${entry.workflowId}/${entry.runId})`,
            description: entry.recoveryState,
            entry,
            indexKey: `${entry.namespace}:${entry.workflowId}:${entry.runId}`,
        })),
        { placeHolder: 'Select a workflow run' }
    );

    if (!picked) {
        return undefined;
    }

    return { entry: picked.entry, indexKey: picked.indexKey };
}

export function registerWorkflowRunRecoveryCommands(context: vscode.ExtensionContext): void {
    registerWorkflowRunListProvider(context);

    context.subscriptions.push(
        vscode.commands.registerCommand('forge.refreshWorkflowRuns', async () => {
            try {
                await refreshWorkflowRunsManually();
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                void vscode.window.showErrorMessage(message);
            }
        }),
        vscode.commands.registerCommand('forge.openWorkflowRunList', async () => {
            await vscode.commands.executeCommand(`${WORKFLOW_RUN_LIST_VIEW_ID}.focus`);
        }),
        vscode.commands.registerCommand(
            'forge.cancelWorkflowRun',
            async (item?: WorkflowRunTreeItem) => {
                const context = getWorkflowRunRecoveryContext();
                if (!context) {
                    void vscode.window.showErrorMessage('Workflow run recovery is not initialized.');
                    return;
                }

                const selected = resolveSelectedEntry(item) ?? (await pickRunEntry());
                if (!selected) {
                    return;
                }

                const projection = readProjectionForEntry(
                    selected.entry,
                    context.globalStoragePath,
                    context.windowId
                );
                const guard = evaluateWorkflowRunAction(selected.entry, 'cancel', projection);
                if (!guard.allowed) {
                    void vscode.window.showWarningMessage(guard.reason ?? formatRunActionsBlockedMessage());
                    return;
                }

                const confirmed = await vscode.window.showWarningMessage(
                    formatCancelConfirmMessage(selected.entry.workflowId, selected.entry.runId),
                    { modal: true },
                    'Cancel run'
                );
                if (confirmed !== 'Cancel run') {
                    return;
                }

                const client = await context.createRecoveryClient();
                try {
                    await cancelWorkflowRun(selected.entry, {
                        indexStore: context.indexStore,
                        globalStoragePath: context.globalStoragePath,
                        windowId: context.windowId,
                        client,
                    });
                    notifyWorkflowRunIndexChanged();
                } finally {
                    await client.close();
                }
            }
        ),
        vscode.commands.registerCommand(
            'forge.dismissOrphanedWorkflowRun',
            async (item?: WorkflowRunTreeItem) => {
                const context = getWorkflowRunRecoveryContext();
                if (!context) {
                    void vscode.window.showErrorMessage('Workflow run recovery is not initialized.');
                    return;
                }

                const selected = resolveSelectedEntry(item) ?? (await pickRunEntry());
                if (!selected) {
                    return;
                }

                const guard = evaluateWorkflowRunAction(selected.entry, 'dismiss');
                if (!guard.allowed) {
                    void vscode.window.showWarningMessage(guard.reason ?? formatRunActionsBlockedMessage());
                    return;
                }

                dismissOrphanedWorkflowRun(selected.entry, {
                    indexStore: context.indexStore,
                    globalStoragePath: context.globalStoragePath,
                    windowId: context.windowId,
                });
                notifyWorkflowRunIndexChanged();
            }
        ),
        vscode.commands.registerCommand(
            'forge.openQuestionPanel',
            async (item?: WorkflowRunTreeItem) => {
                const context = getWorkflowRunRecoveryContext();
                if (!context) {
                    void vscode.window.showErrorMessage('Workflow run recovery is not initialized.');
                    return;
                }

                const selected = resolveSelectedEntry(item) ?? (await pickRunEntry());
                if (!selected) {
                    return;
                }

                const projection = readProjectionForEntry(
                    selected.entry,
                    context.globalStoragePath,
                    context.windowId
                );
                const guard = evaluateHumanInputSubmit(selected.entry, projection);
                if (!guard.allowed) {
                    void vscode.window.showWarningMessage(
                        guard.reason ?? formatHumanInputBlockedMessage()
                    );
                    return;
                }

                void vscode.commands.executeCommand('forge.openQuestionPanelForRun', selected.indexKey);
            }
        ),
        vscode.commands.registerCommand('forge.openQuestionPanelForRun', async (indexKey: string) => {
            void vscode.window.showInformationMessage(
                `Question panel for run ${indexKey} opens when Forge question panel (#27) is available.`
            );
        })
    );
}
