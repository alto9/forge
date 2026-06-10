import fs from 'fs';
import path from 'path';
import type { TemporalMode } from './temporalSettings';

export type RecoveryState =
    | 'synced'
    | 'recovery_pending'
    | 'refresh_failed'
    | 'orphaned'
    | 'unreachable';

export interface WorkflowRunIndexEntry {
    namespace: string;
    workflowId: string;
    runId: string;
    taskQueue: string;
    workflow_id: string;
    repositoryRoot: string;
    mode: TemporalMode;
    startedAt: string;
    completedAt?: string;
    lastSyncedAt?: string;
    recoveryState: RecoveryState;
    terminal: boolean;
}

export interface WorkflowRunIndexFile {
    version: 1;
    entries: Record<string, WorkflowRunIndexEntry>;
}

export const RUN_INDEX_RETENTION_DAYS = 30;
export const RUN_INDEX_MAX_COMPLETED_ENTRIES = 100;

const RUN_INDEX_RETENTION_MS = RUN_INDEX_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export class RunIndexDuplicateKeyError extends Error {
    readonly key: string;

    constructor(key: string) {
        super(`Workflow run index already contains entry for key: ${key}`);
        this.name = 'RunIndexDuplicateKeyError';
        this.key = key;
    }
}

export function resolveRunIndexPath(globalStoragePath: string, windowId: string): string {
    return path.join(globalStoragePath, 'temporal', windowId, 'run-index.json');
}

export function buildRunIndexKey(namespace: string, workflowId: string, runId: string): string {
    return `${namespace}:${workflowId}:${runId}`;
}

export function createRunIndexEntryKey(entry: Pick<WorkflowRunIndexEntry, 'namespace' | 'workflowId' | 'runId'>): string {
    return buildRunIndexKey(entry.namespace, entry.workflowId, entry.runId);
}

function parseRunIndexFile(raw: string): WorkflowRunIndexFile {
    const parsed = JSON.parse(raw) as WorkflowRunIndexFile;
    if (parsed.version !== 1 || typeof parsed.entries !== 'object' || parsed.entries === null) {
        throw new Error('Invalid workflow run index file');
    }
    return parsed;
}

function emptyRunIndexFile(): WorkflowRunIndexFile {
    return { version: 1, entries: {} };
}

function atomicWriteFile(filePath: string, content: string): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, content, 'utf8');
    fs.renameSync(tempPath, filePath);
}

function completedAtMillis(entry: WorkflowRunIndexEntry): number {
    if (!entry.completedAt) {
        return 0;
    }
    return new Date(entry.completedAt).getTime();
}

export function purgeCompletedRunIndexEntries(
    entries: Record<string, WorkflowRunIndexEntry>,
    now: Date = new Date()
): Record<string, WorkflowRunIndexEntry> {
    const cutoff = now.getTime() - RUN_INDEX_RETENTION_MS;
    const retained: Record<string, WorkflowRunIndexEntry> = {};
    const completedWithinRetention: Array<[string, WorkflowRunIndexEntry]> = [];

    for (const [key, entry] of Object.entries(entries)) {
        if (!entry.terminal) {
            retained[key] = entry;
            continue;
        }

        const completedAt = completedAtMillis(entry);
        if (completedAt >= cutoff) {
            completedWithinRetention.push([key, entry]);
        }
    }

    completedWithinRetention.sort((left, right) => completedAtMillis(left[1]) - completedAtMillis(right[1]));

    const overflow = completedWithinRetention.length - RUN_INDEX_MAX_COMPLETED_ENTRIES;
    const keptCompleted =
        overflow > 0
            ? completedWithinRetention.slice(overflow)
            : completedWithinRetention;

    for (const [key, entry] of keptCompleted) {
        retained[key] = entry;
    }

    return retained;
}

export function readWorkflowRunIndexFile(indexPath: string): WorkflowRunIndexFile {
    if (!fs.existsSync(indexPath)) {
        return emptyRunIndexFile();
    }

    try {
        return parseRunIndexFile(fs.readFileSync(indexPath, 'utf8'));
    } catch {
        return emptyRunIndexFile();
    }
}

export function writeWorkflowRunIndexFile(indexPath: string, index: WorkflowRunIndexFile): void {
    atomicWriteFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);
}

export interface AppendWorkflowRunIndexEntryInput {
    namespace: string;
    workflowId: string;
    runId: string;
    taskQueue: string;
    workflow_id: string;
    repositoryRoot: string;
    mode: TemporalMode;
    startedAt?: string;
}

export interface MarkWorkflowRunIndexTerminalInput {
    completedAt?: string;
    lastSyncedAt?: string;
    recoveryState?: RecoveryState;
}

export class WorkflowRunIndexStore {
    private readonly indexPath: string;
    private index: WorkflowRunIndexFile;

    constructor(globalStoragePath: string, windowId: string) {
        this.indexPath = resolveRunIndexPath(globalStoragePath, windowId);
        this.index = readWorkflowRunIndexFile(this.indexPath);
        this.applyRetentionPurge();
    }

    get path(): string {
        return this.indexPath;
    }

    listEntries(): WorkflowRunIndexEntry[] {
        return Object.values(this.index.entries);
    }

    getEntry(key: string): WorkflowRunIndexEntry | undefined {
        return this.index.entries[key];
    }

    appendRunStartEntry(input: AppendWorkflowRunIndexEntryInput): WorkflowRunIndexEntry {
        const key = buildRunIndexKey(input.namespace, input.workflowId, input.runId);
        if (this.index.entries[key]) {
            throw new RunIndexDuplicateKeyError(key);
        }

        const entry: WorkflowRunIndexEntry = {
            namespace: input.namespace,
            workflowId: input.workflowId,
            runId: input.runId,
            taskQueue: input.taskQueue,
            workflow_id: input.workflow_id,
            repositoryRoot: input.repositoryRoot,
            mode: input.mode,
            startedAt: input.startedAt ?? new Date().toISOString(),
            recoveryState: 'recovery_pending',
            terminal: false,
        };

        this.index.entries[key] = entry;
        this.persist();
        return entry;
    }

    markTerminal(
        key: string,
        update: MarkWorkflowRunIndexTerminalInput = {}
    ): WorkflowRunIndexEntry {
        const entry = this.index.entries[key];
        if (!entry) {
            throw new Error(`Workflow run index entry not found for key: ${key}`);
        }

        const updated: WorkflowRunIndexEntry = {
            ...entry,
            terminal: true,
            completedAt: update.completedAt ?? new Date().toISOString(),
            ...(update.lastSyncedAt !== undefined ? { lastSyncedAt: update.lastSyncedAt } : {}),
            ...(update.recoveryState !== undefined ? { recoveryState: update.recoveryState } : {}),
        };

        this.index.entries[key] = updated;
        this.persist();
        return updated;
    }

    updateEntry(
        key: string,
        update: Partial<
            Pick<WorkflowRunIndexEntry, 'lastSyncedAt' | 'recoveryState' | 'completedAt' | 'terminal'>
        >
    ): WorkflowRunIndexEntry {
        const entry = this.index.entries[key];
        if (!entry) {
            throw new Error(`Workflow run index entry not found for key: ${key}`);
        }

        const updated: WorkflowRunIndexEntry = {
            ...entry,
            ...update,
        };

        this.index.entries[key] = updated;
        this.persist();
        return updated;
    }

    removeEntry(key: string): boolean {
        if (!this.index.entries[key]) {
            return false;
        }

        delete this.index.entries[key];
        this.persist();
        return true;
    }

    reload(): void {
        this.index = readWorkflowRunIndexFile(this.indexPath);
        this.applyRetentionPurge();
    }

    private applyRetentionPurge(now: Date = new Date()): void {
        const purged = purgeCompletedRunIndexEntries(this.index.entries, now);
        if (Object.keys(purged).length === Object.keys(this.index.entries).length) {
            return;
        }

        this.index = { version: 1, entries: purged };
        this.persist();
    }

    private persist(): void {
        writeWorkflowRunIndexFile(this.indexPath, this.index);
    }
}
