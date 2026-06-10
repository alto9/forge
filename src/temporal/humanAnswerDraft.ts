import type * as vscode from 'vscode';
import { createRunIndexEntryKey, type WorkflowRunIndexEntry } from './workflowRunIndex';

export function buildHumanAnswerDraftKey(
    entry: Pick<WorkflowRunIndexEntry, 'namespace' | 'workflowId' | 'runId'>,
    questionId: string
): string {
    const indexKey = createRunIndexEntryKey(entry);
    return `forge.workflow.humanAnswerDraft.${indexKey}.${questionId}`;
}

export type HumanAnswerDraftPayload = Record<string, string>;

export function readHumanAnswerDraft(
    workspaceState: vscode.Memento | undefined,
    entry: Pick<WorkflowRunIndexEntry, 'namespace' | 'workflowId' | 'runId'>,
    questionId: string
): HumanAnswerDraftPayload | undefined {
    if (!workspaceState) {
        return undefined;
    }

    const raw = workspaceState.get<string>(buildHumanAnswerDraftKey(entry, questionId));
    if (!raw) {
        return undefined;
    }

    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return undefined;
        }

        const drafts: HumanAnswerDraftPayload = {};
        for (const [fieldId, value] of Object.entries(parsed)) {
            if (typeof value === 'string') {
                drafts[fieldId] = value;
            }
        }
        return drafts;
    } catch {
        return undefined;
    }
}

export function saveHumanAnswerDraft(
    workspaceState: vscode.Memento | undefined,
    entry: Pick<WorkflowRunIndexEntry, 'namespace' | 'workflowId' | 'runId'>,
    questionId: string,
    drafts: HumanAnswerDraftPayload
): void {
    if (!workspaceState) {
        return;
    }

    void workspaceState.update(
        buildHumanAnswerDraftKey(entry, questionId),
        JSON.stringify(drafts)
    );
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
