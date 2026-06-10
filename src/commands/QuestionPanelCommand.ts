import * as vscode from 'vscode';
import {
    clearHumanAnswerDraft,
    readHumanAnswerDraft,
    saveHumanAnswerDraft,
} from '../temporal/humanAnswerDraft';
import { createHumanAnswerSubmitClient, HumanAnswerSubmitError } from '../temporal/humanAnswerSubmit';
import { orchestrateHumanAnswerSubmit } from '../temporal/humanAnswerOrchestration';
import { refreshIndexedRunFromTemporal } from '../temporal/temporalRecoveryScan';
import {
    formatHumanInputBlockedMessage,
} from '../temporal/temporalPresentation';
import {
    evaluateHumanInputSubmit,
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
import type { WorkflowRunTreeItem } from '../temporal/WorkflowRunListProvider';
import { loadWorkflowDefinition } from '../workflows/loadWorkflowDefinition';
import { countUnansweredMarkdownQuestions } from '../workflows/resolvePendingHumanQuestions';
import {
    buildQuestionPanelWebviewModel,
    QUESTION_PANEL_COPY,
    validateRequiredFields,
    type QuestionPanelWebviewModel,
} from '../webview/questions/questionsPresentation';
import { QuestionPanelPanel } from '../webview/questions/QuestionPanelPanel';

type QuestionPanelSessionState = {
    indexKey: string;
    trackedQuestionId?: string;
    trackedNodeId?: string;
    statusMessage?: string;
    validationError?: string;
    submitting?: boolean;
};

export class QuestionPanelCommand {
    private static sessionState: QuestionPanelSessionState | undefined;
    private static indexListener: (() => void) | undefined;

    static register(context: vscode.ExtensionContext): void {
        this.ensureIndexListener(context);

        context.subscriptions.push(
            vscode.commands.registerCommand(
                'forge.openQuestionPanel',
                async (item?: WorkflowRunTreeItem) => {
                    const recovery = getWorkflowRunRecoveryContext();
                    if (!recovery) {
                        void vscode.window.showErrorMessage(
                            'Workflow run recovery is not initialized.'
                        );
                        return;
                    }

                    const selected = await this.resolveRunSelection(item);
                    if (!selected) {
                        return;
                    }

                    const projection = readProjectionForEntry(
                        selected.entry,
                        recovery.globalStoragePath,
                        recovery.windowId
                    );
                    const guard = evaluateHumanInputSubmit(selected.entry, projection);
                    if (!guard.allowed) {
                        void vscode.window.showWarningMessage(
                            guard.reason ?? formatHumanInputBlockedMessage()
                        );
                        return;
                    }

                    await this.openForRun(context, selected.indexKey);
                }
            ),
            vscode.commands.registerCommand(
                'forge.openQuestionPanelForRun',
                async (indexKey: string) => {
                    await this.openForRun(context, indexKey);
                }
            )
        );
    }

    static async openForRun(
        context: vscode.ExtensionContext,
        indexKey: string
    ): Promise<void> {
        this.ensureIndexListener(context);

        const recovery = getWorkflowRunRecoveryContext();
        const entry = recovery?.indexStore.getEntry(indexKey);
        if (!entry) {
            void vscode.window.showWarningMessage('The selected workflow run is no longer indexed.');
            return;
        }

        this.sessionState = {
            indexKey,
            statusMessage: undefined,
            validationError: undefined,
            submitting: false,
        };

        const session = this.buildSession(context);
        const model = await session.refreshModel();
        await QuestionPanelPanel.show(context, model, session);
    }

    private static ensureIndexListener(context: vscode.ExtensionContext): void {
        if (this.indexListener) {
            return;
        }

        this.indexListener = onWorkflowRunIndexChanged(() => {
            void QuestionPanelPanel.currentPanel?.refreshFromHost();
        });
        context.subscriptions.push({ dispose: () => this.disposeIndexListener() });
    }

    private static disposeIndexListener(): void {
        this.indexListener?.();
        this.indexListener = undefined;
    }

    private static async resolveRunSelection(
        item?: WorkflowRunTreeItem
    ): Promise<{ entry: WorkflowRunIndexEntry; indexKey: string } | undefined> {
        const recovery = getWorkflowRunRecoveryContext();
        if (!recovery) {
            return undefined;
        }

        if (item?.entry) {
            return { entry: item.entry, indexKey: item.indexKey };
        }

        const entries = recovery.indexStore.listEntries();
        if (entries.length === 0) {
            void vscode.window.showInformationMessage('No workflow runs are indexed for this window.');
            return undefined;
        }

        if (entries.length === 1) {
            const entry = entries[0];
            return {
                entry,
                indexKey: createRunIndexEntryKey(entry),
            };
        }

        const picked = await vscode.window.showQuickPick(
            entries.map((entry) => ({
                label: `${entry.workflow_id} (${entry.workflowId}/${entry.runId})`,
                description: entry.recoveryState,
                entry,
                indexKey: createRunIndexEntryKey(entry),
            })),
            { placeHolder: 'Select a workflow run' }
        );

        if (!picked) {
            return undefined;
        }

        return { entry: picked.entry, indexKey: picked.indexKey };
    }

    private static buildSession(context: vscode.ExtensionContext): {
        refreshModel: (options?: { fromTemporal?: boolean }) => Promise<QuestionPanelWebviewModel>;
        shouldPoll: () => boolean;
        onDraftUpdate: (drafts: Record<string, string>) => void;
        onSubmit: (drafts: Record<string, string>) => Promise<void>;
        onDiscardDraft: () => void;
        onDispose: () => void;
        onTerminal: () => void;
    } {
        return {
            refreshModel: (options) => this.refreshModel(context, options),
            shouldPoll: () => this.shouldPoll(),
            onDraftUpdate: (drafts) => this.handleDraftUpdate(context, drafts),
            onSubmit: (drafts) => this.handleSubmit(context, drafts),
            onDiscardDraft: () => this.handleDiscardDraft(context),
            onDispose: () => {
                if (QuestionPanelPanel.currentPanel === undefined) {
                    this.sessionState = undefined;
                }
            },
            onTerminal: () => {
                void vscode.window.showInformationMessage(QUESTION_PANEL_COPY.runTerminal);
            },
        };
    }

    private static shouldPoll(): boolean {
        const state = this.sessionState;
        const recovery = getWorkflowRunRecoveryContext();
        if (!state?.indexKey || !recovery) {
            return false;
        }

        const entry = recovery.indexStore.getEntry(state.indexKey);
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

    private static handleDraftUpdate(
        context: vscode.ExtensionContext,
        drafts: Record<string, string>
    ): void {
        const state = this.sessionState;
        const recovery = getWorkflowRunRecoveryContext();
        if (!state?.trackedQuestionId || !recovery) {
            return;
        }

        const entry = recovery.indexStore.getEntry(state.indexKey);
        if (!entry) {
            return;
        }

        saveHumanAnswerDraft(
            context.workspaceState,
            entry,
            state.trackedQuestionId,
            drafts
        );
    }

    private static handleDiscardDraft(context: vscode.ExtensionContext): void {
        const state = this.sessionState;
        const recovery = getWorkflowRunRecoveryContext();
        if (!state?.trackedQuestionId || !recovery) {
            return;
        }

        const entry = recovery.indexStore.getEntry(state.indexKey);
        if (!entry) {
            return;
        }

        clearHumanAnswerDraft(context.workspaceState, entry, state.trackedQuestionId);
        this.sessionState = {
            ...state,
            validationError: undefined,
            statusMessage: undefined,
        };
    }

    private static async handleSubmit(
        context: vscode.ExtensionContext,
        drafts: Record<string, string>
    ): Promise<void> {
        const state = this.sessionState;
        const recovery = getWorkflowRunRecoveryContext();
        if (!state || !recovery) {
            return;
        }

        const entry = recovery.indexStore.getEntry(state.indexKey);
        if (!entry) {
            return;
        }

        let projection = readProjectionForEntry(
            entry,
            recovery.globalStoragePath,
            recovery.windowId
        );
        const pendingQuestion = projection?.pendingHumanQuestions[0];
        if (!projection || !pendingQuestion) {
            this.sessionState = {
                ...state,
                validationError: undefined,
                statusMessage: QUESTION_PANEL_COPY.noPending,
            };
            return;
        }

        const validationError = validateRequiredFields(pendingQuestion, drafts);
        if (validationError) {
            this.sessionState = {
                ...state,
                validationError,
                statusMessage: undefined,
                submitting: false,
            };
            return;
        }

        this.sessionState = {
            ...state,
            validationError: undefined,
            statusMessage: undefined,
            submitting: true,
        };

        const recoveryClient = await recovery.createRecoveryClient();
        try {
            await orchestrateHumanAnswerSubmit({
                entry,
                projection,
                pendingQuestion,
                answers: drafts,
                client: createHumanAnswerSubmitClient(recoveryClient),
                workspaceState: context.workspaceState,
            });

            if (recovery.isReady()) {
                await refreshIndexedRunFromTemporal(entry, {
                    indexStore: recovery.indexStore,
                    globalStoragePath: recovery.globalStoragePath,
                    windowId: recovery.windowId,
                    client: recoveryClient,
                    log: recovery.log,
                });
                notifyWorkflowRunIndexChanged();
            }

            this.sessionState = {
                ...state,
                validationError: undefined,
                statusMessage: QUESTION_PANEL_COPY.submitSuccess,
                submitting: false,
            };
        } catch (error) {
            const reason =
                error instanceof HumanAnswerSubmitError
                    ? error.panelReason
                    : error instanceof Error
                      ? error.message
                      : String(error);
            this.sessionState = {
                ...state,
                validationError: undefined,
                statusMessage: QUESTION_PANEL_COPY.submitRejected(reason),
                submitting: false,
            };
        } finally {
            await recoveryClient.close();
        }
    }

    private static async refreshModel(
        context: vscode.ExtensionContext,
        options?: { fromTemporal?: boolean }
    ): Promise<QuestionPanelWebviewModel> {
        const state = this.sessionState;
        const recovery = getWorkflowRunRecoveryContext();
        if (!state?.indexKey || !recovery) {
            return buildQuestionPanelWebviewModel({
                workflowName: 'Question Panel',
                drafts: {},
                entryRecoveryState: 'synced',
                emptyState: 'no_run',
            });
        }

        let entry = recovery.indexStore.getEntry(state.indexKey);
        if (!entry) {
            return buildQuestionPanelWebviewModel({
                workflowName: 'Question Panel',
                drafts: {},
                entryRecoveryState: 'synced',
                emptyState: 'no_run',
            });
        }

        if (entry.terminal) {
            return buildQuestionPanelWebviewModel({
                workflowName: entry.workflow_id,
                drafts: {},
                entryRecoveryState: entry.recoveryState,
                emptyState: 'terminal',
                statusMessage: QUESTION_PANEL_COPY.runTerminal,
            });
        }

        let projection = readProjectionForEntry(
            entry,
            recovery.globalStoragePath,
            recovery.windowId
        );

        if (
            options?.fromTemporal &&
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

                entry = recovery.indexStore.getEntry(state.indexKey) ?? entry;
                projection = readProjectionForEntry(
                    entry,
                    recovery.globalStoragePath,
                    recovery.windowId
                );
            } catch {
                projection = readProjectionForEntry(
                    recovery.indexStore.getEntry(state.indexKey) ?? entry,
                    recovery.globalStoragePath,
                    recovery.windowId
                );
            }
        }

        const pendingQuestion = projection?.pendingHumanQuestions[0];
        const workflowName = entry.workflow_id;

        if (!pendingQuestion) {
            return buildQuestionPanelWebviewModel({
                workflowName,
                projection,
                drafts: {},
                entryRecoveryState: entry.recoveryState,
                emptyState: 'no_pending',
                statusMessage: state.statusMessage ?? QUESTION_PANEL_COPY.noPending,
                validationError: state.validationError,
                submitting: state.submitting,
            });
        }

        let stale = false;
        if (
            state.trackedNodeId &&
            projection?.waitingNodeId &&
            state.trackedNodeId !== projection.waitingNodeId
        ) {
            stale = true;
            clearHumanAnswerDraft(context.workspaceState, entry, state.trackedQuestionId ?? pendingQuestion.question_id);
        }

        if (!state.trackedQuestionId || !stale) {
            this.sessionState = {
                ...state,
                trackedQuestionId: pendingQuestion.question_id,
                trackedNodeId: pendingQuestion.node_id,
            };
        }

        const questionId = pendingQuestion.question_id;
        const drafts = stale
            ? {}
            : (readHumanAnswerDraft(context.workspaceState, entry, questionId) ?? {});

        let batchTotal: number | undefined;
        if (pendingQuestion.input_mode === 'markdown_batch') {
            const definition = loadWorkflowDefinition(entry.repositoryRoot, entry.workflow_id);
            const node = definition?.nodes.find(
                (candidate) => candidate.node_id === pendingQuestion.node_id
            );
            if (definition && node) {
                batchTotal = countUnansweredMarkdownQuestions(
                    entry.repositoryRoot,
                    definition,
                    node
                );
            }
        }

        return buildQuestionPanelWebviewModel({
            workflowName,
            projection,
            pendingQuestion,
            drafts,
            entryRecoveryState: entry.recoveryState,
            stale,
            validationError: state.validationError,
            statusMessage: state.statusMessage,
            submitting: state.submitting,
            batchTotal,
        });
    }
}
