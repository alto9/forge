import { status as grpcStatus } from '@grpc/grpc-js';
import { Client, Connection, isGrpcServiceError } from '@temporalio/client';
import { buildManagedLocalGrpcAddress } from './devServerLaunch';
import { buildExternalConnectionOptions } from './externalConnection';
import { formatSafeForLog } from './secretRedaction';
import type { TemporalMode } from './temporalSettings';
import {
    buildProjectionFromTemporalDescribe,
    resolveProjectionPath,
    writeWorkflowRunProjection,
} from './workflowRunProjection';
import { loadWorkflowDefinition } from '../workflows/loadWorkflowDefinition';
import { applyPendingHumanQuestionsToProjection } from '../workflows/resolvePendingHumanQuestions';
import {
    WorkflowRunIndexStore,
    buildRunIndexKey,
    createRunIndexEntryKey,
    type RecoveryState,
    type WorkflowRunIndexEntry,
} from './workflowRunIndex';

export const RECOVERY_LOG_PREFIX = '[forge.temporal.recovery]';

export interface TemporalRecoveryConnectionOptions {
    mode: TemporalMode;
    namespace: string;
    grpcPort?: number;
    externalAddress?: string;
    externalConnectionOptions?: import('@temporalio/client').ConnectionOptions;
}

export interface TemporalRecoveryClient {
    describeWorkflow(
        namespace: string,
        workflowId: string,
        runId: string
    ): Promise<import('@temporalio/client').WorkflowExecutionDescription>;
    fetchHistory(
        namespace: string,
        workflowId: string,
        runId: string
    ): Promise<unknown>;
    terminateWorkflow(
        namespace: string,
        workflowId: string,
        runId: string,
        reason?: string
    ): Promise<void>;
    executeWorkflowUpdate(
        namespace: string,
        workflowId: string,
        runId: string,
        updateName: string,
        payload: unknown
    ): Promise<void>;
    close(): Promise<void>;
}

export interface TemporalRecoveryScanOptions {
    windowId: string;
    globalStoragePath: string;
    indexStore: WorkflowRunIndexStore;
    log: (line: string) => void;
    now?: () => Date;
    createClient?: () => Promise<TemporalRecoveryClient>;
}

export interface TemporalRefreshOutcome {
    key: string;
    recoveryState: RecoveryState;
    terminal: boolean;
    errorCode?: string;
}

export function classifyTemporalRefreshError(error: unknown): {
    recoveryState: 'orphaned' | 'refresh_failed';
    errorCode: string;
} {
    const queue: unknown[] = [error];

    while (queue.length > 0) {
        const current = queue.shift();
        if (current === undefined || current === null) {
            continue;
        }

        if (isGrpcServiceError(current)) {
            if (current.code === grpcStatus.NOT_FOUND) {
                return { recoveryState: 'orphaned', errorCode: 'NOT_FOUND' };
            }
            return {
                recoveryState: 'refresh_failed',
                errorCode: grpcStatus[current.code] ?? `GRPC_${current.code}`,
            };
        }

        if (current instanceof Error) {
            if (current.cause !== undefined) {
                queue.push(current.cause);
            }
            const message = current.message.toLowerCase();
            if (message.includes('not found') || message.includes('workflow not found')) {
                return { recoveryState: 'orphaned', errorCode: 'NOT_FOUND' };
            }
        }
    }

    return { recoveryState: 'refresh_failed', errorCode: 'REFRESH_FAILED' };
}

export function formatRecoveryLogLine(input: {
    windowId: string;
    namespace: string;
    workflowId: string;
    runId: string;
    recoveryState: RecoveryState;
    errorCode?: string;
    message?: string;
}): string {
    const parts = [
        RECOVERY_LOG_PREFIX,
        `windowId=${input.windowId}`,
        `namespace=${input.namespace}`,
        `workflowId=${input.workflowId}`,
        `runId=${input.runId}`,
        `recoveryState=${input.recoveryState}`,
    ];

    if (input.errorCode) {
        parts.push(`errorCode=${input.errorCode}`);
    }

    if (input.message) {
        parts.push(`message=${input.message}`);
    }

    return formatSafeForLog(parts.join(' '));
}

export async function createTemporalRecoveryClient(
    options: TemporalRecoveryConnectionOptions
): Promise<TemporalRecoveryClient> {
    let connection: Connection | undefined;

    if (options.mode === 'external') {
        if (!options.externalConnectionOptions) {
            throw new Error('External Temporal connection options are required.');
        }
        connection = await Connection.connect(options.externalConnectionOptions);
    } else {
        if (options.grpcPort === undefined) {
            throw new Error('Managed-local gRPC port is required.');
        }
        connection = await Connection.connect({
            address: buildManagedLocalGrpcAddress(options.grpcPort),
        });
    }

    const client = new Client({
        connection,
        namespace: options.namespace,
    });

    return {
        async describeWorkflow(namespace, workflowId, runId) {
            const scopedClient =
                namespace === options.namespace
                    ? client
                    : new Client({ connection: connection!, namespace });
            const handle = scopedClient.workflow.getHandle(workflowId, runId);
            return handle.describe();
        },
        async fetchHistory(namespace, workflowId, runId) {
            const scopedClient =
                namespace === options.namespace
                    ? client
                    : new Client({ connection: connection!, namespace });
            const handle = scopedClient.workflow.getHandle(workflowId, runId);
            return handle.fetchHistory();
        },
        async terminateWorkflow(namespace, workflowId, runId, reason) {
            const scopedClient =
                namespace === options.namespace
                    ? client
                    : new Client({ connection: connection!, namespace });
            const handle = scopedClient.workflow.getHandle(workflowId, runId);
            await handle.terminate(reason);
        },
        async executeWorkflowUpdate(namespace, workflowId, runId, updateName, payload) {
            const scopedClient =
                namespace === options.namespace
                    ? client
                    : new Client({ connection: connection!, namespace });
            const handle = scopedClient.workflow.getHandle(workflowId, runId);
            await handle.executeUpdate(updateName, { args: [payload] });
        },
        async close() {
            await connection?.close().catch(() => undefined);
        },
    };
}

export function buildExternalRecoveryConnectionOptions(
    settings: import('./externalSettings').ResolvedExternalSettings,
    apiKey: string | undefined
): import('@temporalio/client').ConnectionOptions {
    return buildExternalConnectionOptions(settings, apiKey);
}

export async function refreshIndexedRunFromTemporal(
    entry: WorkflowRunIndexEntry,
    input: {
        indexStore: WorkflowRunIndexStore;
        globalStoragePath: string;
        windowId: string;
        client: TemporalRecoveryClient;
        log: (line: string) => void;
        now?: () => Date;
    }
): Promise<TemporalRefreshOutcome> {
    const key = createRunIndexEntryKey(entry);
    const syncedAt = (input.now ?? (() => new Date()))().toISOString();

    input.indexStore.updateEntry(key, { recoveryState: 'recovery_pending' });
    input.log(
        formatRecoveryLogLine({
            windowId: input.windowId,
            namespace: entry.namespace,
            workflowId: entry.workflowId,
            runId: entry.runId,
            recoveryState: 'recovery_pending',
        })
    );

    try {
        const description = await input.client.describeWorkflow(
            entry.namespace,
            entry.workflowId,
            entry.runId
        );
        await input.client.fetchHistory(entry.namespace, entry.workflowId, entry.runId);

        const projection = buildProjectionFromTemporalDescribe(entry, description, 'synced', syncedAt);
        const definition = loadWorkflowDefinition(entry.repositoryRoot, entry.workflow_id);
        const enrichedProjection = definition
            ? applyPendingHumanQuestionsToProjection(definition, projection, entry.repositoryRoot)
            : projection;
        const projectionPath = resolveProjectionPath(
            input.globalStoragePath,
            input.windowId,
            key
        );
        writeWorkflowRunProjection(projectionPath, enrichedProjection);

        if (enrichedProjection.terminal) {
            input.indexStore.markTerminal(key, {
                recoveryState: 'synced',
                lastSyncedAt: syncedAt,
                completedAt: description.closeTime?.toISOString() ?? syncedAt,
            });
        } else {
            input.indexStore.updateEntry(key, {
                recoveryState: 'synced',
                lastSyncedAt: syncedAt,
            });
        }

        input.log(
            formatRecoveryLogLine({
                windowId: input.windowId,
                namespace: entry.namespace,
                workflowId: entry.workflowId,
                runId: entry.runId,
                recoveryState: 'synced',
            })
        );

        return {
            key,
            recoveryState: 'synced',
            terminal: enrichedProjection.terminal,
        };
    } catch (error) {
        const classified = classifyTemporalRefreshError(error);
        input.indexStore.updateEntry(key, { recoveryState: classified.recoveryState });

        const message = error instanceof Error ? error.message : String(error);
        input.log(
            formatRecoveryLogLine({
                windowId: input.windowId,
                namespace: entry.namespace,
                workflowId: entry.workflowId,
                runId: entry.runId,
                recoveryState: classified.recoveryState,
                errorCode: classified.errorCode,
                message,
            })
        );

        return {
            key,
            recoveryState: classified.recoveryState,
            terminal: false,
            errorCode: classified.errorCode,
        };
    }
}

export function markNonTerminalIndexEntriesUnreachable(
    indexStore: WorkflowRunIndexStore,
    input: {
        windowId: string;
        log: (line: string) => void;
    }
): number {
    let updated = 0;

    for (const entry of indexStore.listEntries()) {
        if (entry.terminal || entry.recoveryState === 'orphaned' || entry.recoveryState === 'unreachable') {
            continue;
        }

        const key = buildRunIndexKey(entry.namespace, entry.workflowId, entry.runId);
        indexStore.updateEntry(key, { recoveryState: 'unreachable' });
        input.log(
            formatRecoveryLogLine({
                windowId: input.windowId,
                namespace: entry.namespace,
                workflowId: entry.workflowId,
                runId: entry.runId,
                recoveryState: 'unreachable',
            })
        );
        updated += 1;
    }

    return updated;
}

function summarizeRefreshOutcomes(outcomes: TemporalRefreshOutcome[]): Record<RecoveryState, number> {
    return outcomes.reduce(
        (counts, outcome) => {
            counts[outcome.recoveryState] += 1;
            return counts;
        },
        {
            synced: 0,
            orphaned: 0,
            refresh_failed: 0,
            recovery_pending: 0,
            unreachable: 0,
        } as Record<RecoveryState, number>
    );
}

function logRecoveryScanSummary(
    windowId: string,
    summary: Record<RecoveryState, number>,
    log: (line: string) => void,
    options?: { manualRefresh?: boolean }
): void {
    log(
        formatSafeForLog(
            `${RECOVERY_LOG_PREFIX} windowId=${windowId} message=Recovery scan complete synced=${summary.synced} orphaned=${summary.orphaned} refresh_failed=${summary.refresh_failed}`
        )
    );

    if (options?.manualRefresh && summary.synced > 0) {
        log(
            formatSafeForLog(
                `${RECOVERY_LOG_PREFIX} windowId=${windowId} message=Recovered ${summary.synced} workflow run(s).`
            )
        );
    }
}

async function refreshIndexedEntries(
    entries: WorkflowRunIndexEntry[],
    options: TemporalRecoveryScanOptions
): Promise<TemporalRefreshOutcome[]> {
    if (entries.length === 0) {
        return [];
    }

    const client = await (options.createClient?.() ??
        Promise.reject(new Error('Temporal recovery client factory is not configured.')));

    const outcomes: TemporalRefreshOutcome[] = [];
    try {
        for (const entry of entries) {
            outcomes.push(
                await refreshIndexedRunFromTemporal(entry, {
                    indexStore: options.indexStore,
                    globalStoragePath: options.globalStoragePath,
                    windowId: options.windowId,
                    client,
                    log: options.log,
                    now: options.now,
                })
            );
        }
    } finally {
        await client.close();
    }

    return outcomes;
}

export async function runRecoveryScan(
    options: TemporalRecoveryScanOptions
): Promise<TemporalRefreshOutcome[]> {
    const nonTerminalEntries = options.indexStore
        .listEntries()
        .filter((entry) => !entry.terminal);

    options.log(
        formatSafeForLog(
            `${RECOVERY_LOG_PREFIX} windowId=${options.windowId} message=Recovering workflow runs for this window… count=${nonTerminalEntries.length}`
        )
    );

    if (nonTerminalEntries.length === 0) {
        return [];
    }

    const outcomes = await refreshIndexedEntries(nonTerminalEntries, options);
    const summary = summarizeRefreshOutcomes(outcomes);
    logRecoveryScanSummary(options.windowId, summary, options.log);

    return outcomes;
}

export async function runManualRecoveryRefresh(
    options: TemporalRecoveryScanOptions
): Promise<TemporalRefreshOutcome[]> {
    const entries = options.indexStore.listEntries();

    options.log(
        formatSafeForLog(
            `${RECOVERY_LOG_PREFIX} windowId=${options.windowId} message=Manual refresh started count=${entries.length}`
        )
    );

    if (entries.length === 0) {
        options.log(
            formatSafeForLog(
                `${RECOVERY_LOG_PREFIX} windowId=${options.windowId} message=No indexed workflow runs to refresh.`
            )
        );
        return [];
    }

    const outcomes = await refreshIndexedEntries(entries, options);
    const summary = summarizeRefreshOutcomes(outcomes);
    logRecoveryScanSummary(options.windowId, summary, options.log, { manualRefresh: true });

    return outcomes;
}
