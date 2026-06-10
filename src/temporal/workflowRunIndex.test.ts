import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
    buildRunIndexKey,
    purgeCompletedRunIndexEntries,
    readWorkflowRunIndexFile,
    resolveRunIndexPath,
    RunIndexDuplicateKeyError,
    WorkflowRunIndexEntry,
    WorkflowRunIndexStore,
    writeWorkflowRunIndexFile,
} from './workflowRunIndex';

const tempDirs: string[] = [];

function createTempGlobalStorage(): { globalStoragePath: string; windowId: string } {
    const globalStoragePath = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-index-'));
    tempDirs.push(globalStoragePath);
    return { globalStoragePath, windowId: 'window-test-1' };
}

function makeEntry(overrides: Partial<WorkflowRunIndexEntry> = {}): WorkflowRunIndexEntry {
    return {
        namespace: 'forge-local',
        workflowId: 'wf-1',
        runId: 'run-1',
        taskQueue: 'forge-workflows',
        workflow_id: 'refine-issue',
        repositoryRoot: '/repo',
        mode: 'managedLocal',
        startedAt: '2026-01-01T00:00:00.000Z',
        recoveryState: 'recovery_pending',
        terminal: false,
        ...overrides,
    };
}

afterEach(() => {
    while (tempDirs.length > 0) {
        const tempDir = tempDirs.pop();
        if (tempDir) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
});

describe('workflowRunIndex', () => {
    it('resolves index path under global storage and window id', () => {
        expect(resolveRunIndexPath('/storage', 'window-abc')).toBe(
            path.join('/storage', 'temporal', 'window-abc', 'run-index.json')
        );
    });

    it('builds composite index keys', () => {
        expect(buildRunIndexKey('ns', 'workflow', 'run')).toBe('ns:workflow:run');
    });

    it('appends run start entries with recovery_pending and non-terminal defaults', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);

        const entry = store.appendRunStartEntry({
            namespace: 'forge-local',
            workflowId: 'wf-abc',
            runId: 'run-xyz',
            taskQueue: 'forge-workflows',
            workflow_id: 'refine-issue',
            repositoryRoot: '/workspace/repo',
            mode: 'managedLocal',
            startedAt: '2026-06-01T12:00:00.000Z',
        });

        expect(entry.recoveryState).toBe('recovery_pending');
        expect(entry.terminal).toBe(false);
        expect(entry.startedAt).toBe('2026-06-01T12:00:00.000Z');
        expect(fs.existsSync(store.path)).toBe(true);

        const reloaded = new WorkflowRunIndexStore(globalStoragePath, windowId);
        expect(reloaded.listEntries()).toHaveLength(1);
        expect(reloaded.listEntries()[0]?.repositoryRoot).toBe('/workspace/repo');
    });

    it('removes entries for orphaned dismissal', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        store.appendRunStartEntry({
            namespace: 'forge-local',
            workflowId: 'wf-remove',
            runId: 'run-remove',
            taskQueue: 'forge-workflows',
            workflow_id: 'refine-issue',
            repositoryRoot: '/repo',
            mode: 'managedLocal',
        });

        expect(store.removeEntry('forge-local:wf-remove:run-remove')).toBe(true);
        expect(store.listEntries()).toHaveLength(0);
        expect(store.removeEntry('forge-local:wf-remove:run-remove')).toBe(false);
    });

    it('rejects duplicate index keys on insert', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        const input = {
            namespace: 'forge-local',
            workflowId: 'wf-dup',
            runId: 'run-dup',
            taskQueue: 'forge-workflows',
            workflow_id: 'refine-issue',
            repositoryRoot: '/repo',
            mode: 'managedLocal' as const,
        };

        store.appendRunStartEntry(input);

        expect(() => store.appendRunStartEntry(input)).toThrow(RunIndexDuplicateKeyError);
    });

    it('marks entries terminal with completedAt and optional projection fields', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        const key = store.appendRunStartEntry({
            namespace: 'forge-local',
            workflowId: 'wf-term',
            runId: 'run-term',
            taskQueue: 'forge-workflows',
            workflow_id: 'refine-issue',
            repositoryRoot: '/repo',
            mode: 'external',
        });

        const indexKey = buildRunIndexKey('forge-local', 'wf-term', 'run-term');
        const updated = store.markTerminal(indexKey, {
            completedAt: '2026-06-02T00:00:00.000Z',
            lastSyncedAt: '2026-06-02T00:00:01.000Z',
            recoveryState: 'synced',
        });

        expect(updated.terminal).toBe(true);
        expect(updated.completedAt).toBe('2026-06-02T00:00:00.000Z');
        expect(updated.lastSyncedAt).toBe('2026-06-02T00:00:01.000Z');
        expect(updated.recoveryState).toBe('synced');
        expect(key.runId).toBe('run-term');
    });

    it('lists all window runs for recovery and run list consumers', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);

        store.appendRunStartEntry({
            namespace: 'forge-local',
            workflowId: 'wf-a',
            runId: 'run-a',
            taskQueue: 'forge-workflows',
            workflow_id: 'refine-issue',
            repositoryRoot: '/repo-a',
            mode: 'managedLocal',
        });
        store.appendRunStartEntry({
            namespace: 'forge-local',
            workflowId: 'wf-b',
            runId: 'run-b',
            taskQueue: 'forge-workflows',
            workflow_id: 'build-from-github',
            repositoryRoot: '/repo-b',
            mode: 'external',
        });

        const listed = store.listEntries();
        expect(listed).toHaveLength(2);
        expect(listed.map((entry) => entry.repositoryRoot).sort()).toEqual(['/repo-a', '/repo-b']);
    });

    it('purges completed entries older than 30 days on load', () => {
        const now = new Date('2026-06-10T00:00:00.000Z');
        const oldCompletedAt = '2026-04-01T00:00:00.000Z';
        const recentCompletedAt = '2026-06-01T00:00:00.000Z';

        const entries = {
            'ns:wf-old:run-old': makeEntry({
                workflowId: 'wf-old',
                runId: 'run-old',
                terminal: true,
                completedAt: oldCompletedAt,
            }),
            'ns:wf-new:run-new': makeEntry({
                workflowId: 'wf-new',
                runId: 'run-new',
                terminal: true,
                completedAt: recentCompletedAt,
            }),
            'ns:wf-active:run-active': makeEntry({
                workflowId: 'wf-active',
                runId: 'run-active',
                terminal: false,
            }),
        };

        const purged = purgeCompletedRunIndexEntries(entries, now);
        expect(Object.keys(purged).sort()).toEqual(['ns:wf-active:run-active', 'ns:wf-new:run-new']);
    });

    it('never auto-purges non-terminal entries', () => {
        const now = new Date('2026-06-10T00:00:00.000Z');
        const entries = {
            'ns:wf-active:run-active': makeEntry({
                workflowId: 'wf-active',
                runId: 'run-active',
                startedAt: '2020-01-01T00:00:00.000Z',
                terminal: false,
            }),
        };

        const purged = purgeCompletedRunIndexEntries(entries, now);
        expect(purged['ns:wf-active:run-active']).toBeDefined();
    });

    it('caps completed entries at 100 by oldest completedAt', () => {
        const now = new Date('2026-06-10T00:00:00.000Z');
        const entries: Record<string, WorkflowRunIndexEntry> = {};

        const retentionStart = Date.parse('2026-05-11T00:00:00.000Z');
        for (let index = 0; index < 101; index += 1) {
            const key = `ns:wf-${index}:run-${index}`;
            entries[key] = makeEntry({
                workflowId: `wf-${index}`,
                runId: `run-${index}`,
                terminal: true,
                completedAt: new Date(retentionStart + index * 60_000).toISOString(),
            });
        }

        const purged = purgeCompletedRunIndexEntries(entries, now);
        const completed = Object.values(purged).filter((entry) => entry.terminal);
        expect(completed).toHaveLength(100);
        expect(purged['ns:wf-0:run-0']).toBeUndefined();
        expect(purged['ns:wf-100:run-100']).toBeDefined();
    });

    it('persists retention purge on store load when file contains stale completed entries', () => {
        const { globalStoragePath, windowId } = createTempGlobalStorage();
        const indexPath = resolveRunIndexPath(globalStoragePath, windowId);

        writeWorkflowRunIndexFile(indexPath, {
            version: 1,
            entries: {
                'ns:wf-old:run-old': makeEntry({
                    workflowId: 'wf-old',
                    runId: 'run-old',
                    terminal: true,
                    completedAt: '2026-01-01T00:00:00.000Z',
                }),
                'ns:wf-active:run-active': makeEntry({
                    workflowId: 'wf-active',
                    runId: 'run-active',
                    terminal: false,
                }),
            },
        });

        const store = new WorkflowRunIndexStore(globalStoragePath, windowId);
        expect(store.listEntries()).toHaveLength(1);
        expect(store.listEntries()[0]?.workflowId).toBe('wf-active');

        const reloaded = readWorkflowRunIndexFile(indexPath);
        expect(Object.keys(reloaded.entries)).toEqual(['ns:wf-active:run-active']);
    });
});
