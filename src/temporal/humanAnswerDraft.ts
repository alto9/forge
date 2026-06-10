import type * as vscode from 'vscode';
import { createRunIndexEntryKey, type WorkflowRunIndexEntry } from './workflowRunIndex';

export function buildHumanAnswerDraftKey(
    entry: Pick<WorkflowRunIndexEntry, 'namespace' | 'workflowId' | 'runId'>,
    questionId: string
): string {
    const indexKey = createRunIndexEntryKey(entry);
    return `forge.workflow.humanAnswerDraft.${indexKey}.${questionId}`;
}

export function clearHumanAnswerDraft(
    workspaceState: vscode.Memento | undefined,
    entry: Pick<WorkflowRunIndexEntry, 'namespace' | 'workflowId' | 'runId'>,
    questionId: string
): void {
    if (!workspaceState) {
        return;
    }

    void workspaceState.update(buildHumanAnswerDraftKey(entry, questionId), undefined);
}
