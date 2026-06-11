import * as vscode from 'vscode';
import { persistAcceptedWorkflowRun } from '../temporal/persistAcceptedWorkflowRun';
import { startWorkflowRun } from '../temporal/startWorkflowRun';
import { presentWorkflowRunStartFailure } from '../temporal/workflowRunStartPresentation';
import type { WorkflowRunRecoveryContext } from '../temporal/workflowRunRecoveryService';

export type CatalogStartRunInput = {
    repositoryRoot: string;
    workflowId: string;
    runInputs: Record<string, string>;
    recoveryContext: WorkflowRunRecoveryContext;
};

export type CatalogStartRunResult = {
    ok: boolean;
    message?: string;
    inFlight?: boolean;
};

export async function executeCatalogStartRun(
    input: CatalogStartRunInput
): Promise<CatalogStartRunResult> {
    const { repositoryRoot, workflowId, runInputs, recoveryContext } = input;

    const outcome = await startWorkflowRun({
        repositoryRoot,
        workflowId,
        submittedRunInputs: runInputs,
        globalStoragePath: recoveryContext.globalStoragePath,
        windowId: recoveryContext.windowId,
    });

    if (!outcome.ok) {
        const presentation = presentWorkflowRunStartFailure({
            workflowId,
            outcome,
            log: recoveryContext.log,
        });
        return {
            ok: false,
            message: presentation.catalogMessage,
            inFlight: presentation.inFlight,
        };
    }

    const persistOutcome = persistAcceptedWorkflowRun({
        workflow_id: workflowId,
        startOutcome: outcome,
        indexStore: recoveryContext.indexStore,
        log: recoveryContext.log,
    });

    if (!persistOutcome.ok) {
        const firstDiagnostic = persistOutcome.diagnostics[0];
        const message = firstDiagnostic?.message;
        if (message) {
            void vscode.window.showErrorMessage(message);
        }
        return {
            ok: false,
            message,
        };
    }

    return { ok: true };
}
