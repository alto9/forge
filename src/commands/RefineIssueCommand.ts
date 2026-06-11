import * as vscode from 'vscode';
import { inferRepositoryFromRoot } from '../github/inferRepositoryFromRoot';
import { parseRefineIssueRef } from '../github/parseRefineIssueRef';
import { persistAcceptedWorkflowRun } from '../temporal/persistAcceptedWorkflowRun';
import { startWorkflowRun } from '../temporal/startWorkflowRun';
import { presentWorkflowRunStartFailure } from '../temporal/workflowRunStartPresentation';
import { getWorkflowRunRecoveryContext } from '../temporal/workflowRunRecoveryService';
import { WorkflowCatalogCommand } from './WorkflowCatalogCommand';

export const REFINE_ISSUE_WORKFLOW_ID = 'refine-issue';

export class RefineIssueCommand {
    static async execute(
        context: vscode.ExtensionContext,
        issueInput?: string
    ): Promise<void> {
        const folder = await WorkflowCatalogCommand.resolveRepositoryFolder(context);
        if (!folder) {
            return;
        }

        let rawInput = issueInput?.trim();
        if (!rawInput) {
            rawInput = await vscode.window.showInputBox({
                prompt: 'GitHub issue reference for refine-issue',
                placeHolder: 'https://github.com/alto9/forge/issues/77 or alto9/forge#77',
            });
        }

        if (!rawInput?.trim()) {
            return;
        }

        const parsed = parseRefineIssueRef({
            rawInput,
            inferredRepository: inferRepositoryFromRoot(folder.uri.fsPath),
        });

        if (!parsed.ok) {
            const message =
                parsed.diagnostics[0]?.message ??
                'The refine-issue command could not parse the supplied issue reference.';
            void vscode.window.showErrorMessage(message);
            return;
        }

        const recoveryContext = getWorkflowRunRecoveryContext();
        if (!recoveryContext) {
            void vscode.window.showErrorMessage('Workflow run recovery is not initialized.');
            return;
        }

        const outcome = await startWorkflowRun({
            repositoryRoot: folder.uri.fsPath,
            workflowId: REFINE_ISSUE_WORKFLOW_ID,
            submittedRunInputs: {
                issue_ref: parsed.issueRef,
            },
            globalStoragePath: recoveryContext.globalStoragePath,
            windowId: recoveryContext.windowId,
            startedBy: 'refine-issue-command',
        });

        if (!outcome.ok) {
            presentWorkflowRunStartFailure({
                workflowId: REFINE_ISSUE_WORKFLOW_ID,
                outcome,
                log: recoveryContext.log,
            });
            return;
        }

        const persistOutcome = persistAcceptedWorkflowRun({
            workflow_id: REFINE_ISSUE_WORKFLOW_ID,
            startOutcome: outcome,
            indexStore: recoveryContext.indexStore,
            log: recoveryContext.log,
        });

        if (!persistOutcome.ok) {
            const message =
                persistOutcome.diagnostics[0]?.message ??
                'Workflow run started in Temporal, but Forge could not save the local run index.';
            void vscode.window.showErrorMessage(message);
        }
    }
}
