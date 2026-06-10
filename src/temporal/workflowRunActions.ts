import fs from 'fs';
import {
    buildProjectionFromTemporalDescribe,
    readWorkflowRunProjection,
    resolveProjectionPath,
    writeWorkflowRunProjection,
    type WorkflowRunProjection,
} from './workflowRunProjection';
import {
    createRunIndexEntryKey,
    type RecoveryState,
    type WorkflowRunIndexEntry,
    type WorkflowRunIndexStore,
} from './workflowRunIndex';
import {
    formatHumanInputBlockedMessage,
    formatOrphanedRunMessage,
    formatRunActionsBlockedMessage,
} from './temporalPresentation';
import type { TemporalRecoveryClient } from './temporalRecoveryScan';

export type WorkflowRunAction = 'cancel' | 'dismiss' | 'humanInput';

const BLOCKED_RECOVERY_STATES = new Set<RecoveryState>([
    'recovery_pending',
    'refresh_failed',
    'unreachable',
]);

export function isHumanInputRequired(projection: WorkflowRunProjection | undefined): boolean {
    return (projection?.pendingHumanQuestions.length ?? 0) > 0 && !projection?.terminal;
}

export function evaluateWorkflowRunAction(
    entry: WorkflowRunIndexEntry,
    action: WorkflowRunAction,
    projection?: WorkflowRunProjection
): { allowed: boolean; reason?: string } {
    if (action === 'dismiss') {
        if (entry.recoveryState !== 'orphaned') {
            return {
                allowed: false,
                reason: formatOrphanedRunMessage(),
            };
        }
        return { allowed: true };
    }

    if (BLOCKED_RECOVERY_STATES.has(entry.recoveryState)) {
        return {
            allowed: false,
            reason: formatRunActionsBlockedMessage(),
        };
    }

    if (entry.recoveryState !== 'synced') {
        return {
            allowed: false,
            reason: formatRunActionsBlockedMessage(),
        };
    }

    if (action === 'cancel') {
        if (entry.terminal) {
            return {
                allowed: false,
                reason: 'This run has already finished.',
            };
        }
        return { allowed: true };
    }

    if (action === 'humanInput') {
        if (!isHumanInputRequired(projection)) {
            return {
                allowed: false,
                reason: 'No questions are waiting for this run.',
            };
        }
        return { allowed: true };
    }

    return { allowed: false, reason: formatRunActionsBlockedMessage() };
}

export function evaluateHumanInputSubmit(
    entry: WorkflowRunIndexEntry,
    projection?: WorkflowRunProjection
): { allowed: boolean; reason?: string } {
    if (BLOCKED_RECOVERY_STATES.has(entry.recoveryState)) {
        return {
            allowed: false,
            reason: formatHumanInputBlockedMessage(),
        };
    }

    if (entry.recoveryState !== 'synced') {
        return {
            allowed: false,
            reason: formatHumanInputBlockedMessage(),
        };
    }

    if (!isHumanInputRequired(projection)) {
        return {
            allowed: false,
            reason: 'No questions are waiting for this run.',
        };
    }

    return { allowed: true };
}

export async function cancelWorkflowRun(
    entry: WorkflowRunIndexEntry,
    input: {
        indexStore: WorkflowRunIndexStore;
        globalStoragePath: string;
        windowId: string;
        client: TemporalRecoveryClient;
        now?: () => Date;
    }
): Promise<void> {
    const key = createRunIndexEntryKey(entry);
    const syncedAt = (input.now ?? (() => new Date()))().toISOString();

    await input.client.terminateWorkflow(
        entry.namespace,
        entry.workflowId,
        entry.runId,
        'Cancelled by Forge operator'
    );

    const description = await input.client.describeWorkflow(
        entry.namespace,
        entry.workflowId,
        entry.runId
    );
    const projection = buildProjectionFromTemporalDescribe(entry, description, 'synced', syncedAt);
    const projectionPath = resolveProjectionPath(input.globalStoragePath, input.windowId, key);
    writeWorkflowRunProjection(projectionPath, projection);

    input.indexStore.markTerminal(key, {
        recoveryState: 'synced',
        lastSyncedAt: syncedAt,
        completedAt: description.closeTime?.toISOString() ?? syncedAt,
    });
}

export function dismissOrphanedWorkflowRun(
    entry: WorkflowRunIndexEntry,
    input: {
        indexStore: WorkflowRunIndexStore;
        globalStoragePath: string;
        windowId: string;
    }
): boolean {
    const key = createRunIndexEntryKey(entry);
    const removed = input.indexStore.removeEntry(key);
    if (!removed) {
        return false;
    }

    const projectionPath = resolveProjectionPath(input.globalStoragePath, input.windowId, key);
    if (fs.existsSync(projectionPath)) {
        fs.rmSync(projectionPath, { force: true });
    }

    return true;
}

export function readProjectionForEntry(
    entry: WorkflowRunIndexEntry,
    globalStoragePath: string,
    windowId: string
): WorkflowRunProjection | undefined {
    const key = createRunIndexEntryKey(entry);
    return readWorkflowRunProjection(resolveProjectionPath(globalStoragePath, windowId, key));
}
