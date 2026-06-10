import * as vscode from 'vscode';
import {
    formatNeedsInputBadgeLabel,
    formatRecoveryBadgeLabel,
} from './temporalPresentation';
import {
    createRunIndexEntryKey,
    type WorkflowRunIndexEntry,
} from './workflowRunIndex';
import {
    isHumanInputRequired,
    readProjectionForEntry,
} from './workflowRunActions';
import {
    getWorkflowRunRecoveryContext,
    onWorkflowRunIndexChanged,
} from './workflowRunRecoveryService';

export const WORKFLOW_RUN_LIST_VIEW_ID = 'forge.workflowRunList';

function buildTreeItemContextValue(entry: WorkflowRunIndexEntry, needsInput: boolean): string {
    if (needsInput && entry.recoveryState === 'synced') {
        return 'needsInput';
    }

    switch (entry.recoveryState) {
        case 'synced':
            return entry.terminal ? 'syncedTerminal' : 'syncedActive';
        case 'orphaned':
            return 'orphaned';
        case 'recovery_pending':
            return 'recoveryPending';
        case 'refresh_failed':
            return 'refreshFailed';
        case 'unreachable':
            return 'unreachable';
    }
}

export class WorkflowRunListProvider implements vscode.TreeDataProvider<WorkflowRunTreeItem> {
    private readonly _onDidChangeTreeData = new vscode.EventEmitter<WorkflowRunTreeItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    private disposeListener: (() => void) | undefined;

    constructor() {
        this.disposeListener = onWorkflowRunIndexChanged(() => {
            this.refresh();
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    dispose(): void {
        this.disposeListener?.();
        this._onDidChangeTreeData.dispose();
    }

    getTreeItem(element: WorkflowRunTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(): WorkflowRunTreeItem[] {
        const context = getWorkflowRunRecoveryContext();
        if (!context) {
            return [];
        }

        return context.indexStore
            .listEntries()
            .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
            .map((entry) => {
                const key = createRunIndexEntryKey(entry);
                const projection = readProjectionForEntry(
                    entry,
                    context.globalStoragePath,
                    context.windowId
                );
                const needsInput = isHumanInputRequired(projection);
                const badge = formatRecoveryBadgeLabel(entry.recoveryState);
                const descriptionParts = [badge];
                if (needsInput && entry.recoveryState === 'synced') {
                    descriptionParts.push(formatNeedsInputBadgeLabel());
                }

                const item = new WorkflowRunTreeItem(
                    `${entry.workflow_id} (${entry.workflowId}/${entry.runId})`,
                    descriptionParts.join(' · '),
                    vscode.TreeItemCollapsibleState.None,
                    key
                );
                item.contextValue = buildTreeItemContextValue(entry, needsInput);
                item.tooltip = `${entry.repositoryRoot}\n${badge}`;
                item.entry = entry;
                return item;
            });
    }
}

export class WorkflowRunTreeItem extends vscode.TreeItem {
    entry?: WorkflowRunIndexEntry;

    constructor(
        label: string,
        description: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly indexKey: string
    ) {
        super(label, collapsibleState);
        this.description = description;
    }
}

export function registerWorkflowRunListProvider(
    context: vscode.ExtensionContext
): WorkflowRunListProvider {
    const provider = new WorkflowRunListProvider();
    const treeView = vscode.window.createTreeView(WORKFLOW_RUN_LIST_VIEW_ID, {
        treeDataProvider: provider,
        showCollapseAll: false,
    });
    context.subscriptions.push(treeView, { dispose: () => provider.dispose() });
    return provider;
}
