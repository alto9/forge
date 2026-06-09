import { EventEmitter } from 'events';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { classifyWorkerStartFailure } from './workerFailureClassification';
import {
    TemporalWorkerSupervisor,
    WorkerReadinessBlockedError,
} from './TemporalWorkerSupervisor';
import type { SpawnedChildProcess } from './types';

class FakeChild extends EventEmitter {
    pid = 5151;

    kill(): void {
        // no-op for tests
    }
}

function createSupervisor(options: {
    probeResults: boolean[];
    spawnChild?: () => SpawnedChildProcess;
    startupTimeoutMs?: number;
    extensionPath?: string;
    extensionVersion?: string;
    isTemporalConnectionReady?: () => boolean;
    emitReadyOnSpawn?: boolean;
}) {
    let probeIndex = 0;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-worker-'));
    const extensionPath =
        options.extensionPath ??
        (() => {
            const root = path.join(tempDir, 'extension');
            const entryDir = path.join(root, 'resources', 'workflow', 'worker');
            fs.mkdirSync(entryDir, { recursive: true });
            fs.writeFileSync(path.join(entryDir, 'start-worker.js'), 'module.exports = {};\n');
            return root;
        })();

    const child = new FakeChild();
    const supervisor = new TemporalWorkerSupervisor(
        {
            windowId: 'window-test',
            extensionPath,
            extensionVersion: options.extensionVersion ?? '3.26.0',
            globalStoragePath: path.join(tempDir, 'storage'),
            mode: 'managedLocal',
            namespace: 'forge-local',
            taskQueue: 'forge-workflows',
            grpcPort: 7233,
            isTemporalConnectionReady:
                options.isTemporalConnectionReady ?? (() => true),
        },
        {
            spawnChild:
                options.spawnChild ??
                (() => {
                    if (options.emitReadyOnSpawn !== false) {
                        setImmediate(() => {
                            child.emit(
                                'stdout',
                                Buffer.from('FORGE_WORKER_READY:taskQueue=forge-workflows\n')
                            );
                        });
                    }
                    return child;
                }),
            probeTaskQueue: async () => {
                const result = options.probeResults[probeIndex] ?? false;
                probeIndex += 1;
                return result;
            },
            startupTimeoutMs: options.startupTimeoutMs ?? 2_000,
        }
    );

    return { supervisor, child, tempDir, extensionPath };
}

describe('classifyWorkerStartFailure', () => {
    it('classifies repeated crash failures', () => {
        expect(
            classifyWorkerStartFailure({
                repeatedCrash: true,
            }).remediation
        ).toBe('crash');
    });
});

describe('TemporalWorkerSupervisor', () => {
    const tempDirs: string[] = [];

    afterEach(() => {
        for (const dir of tempDirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('starts in idle and transitions to ready after ready signal and probe', async () => {
        const { supervisor, tempDir } = createSupervisor({
            probeResults: [true],
        });
        tempDirs.push(tempDir);

        expect(supervisor.getHealthState()).toBe('idle');
        await supervisor.ensureReady();
        expect(supervisor.getHealthState()).toBe('ready');
    });

    it('reports idle when Temporal connection is not ready', async () => {
        const { supervisor, tempDir } = createSupervisor({
            probeResults: [],
            isTemporalConnectionReady: () => false,
        });
        tempDirs.push(tempDir);

        await expect(supervisor.ensureReady()).rejects.toBeInstanceOf(
            WorkerReadinessBlockedError
        );
        expect(supervisor.getHealthState()).toBe('idle');
    });

    it('restarts worker when extension version changes', async () => {
        const { supervisor, tempDir, extensionPath } = createSupervisor({
            probeResults: [true, true],
            extensionVersion: '3.27.0',
        });
        tempDirs.push(tempDir);

        const manifestPath = path.join(
            tempDir,
            'storage',
            'temporal',
            'window-test',
            'worker-manifest.json'
        );
        fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
        fs.writeFileSync(
            manifestPath,
            `${JSON.stringify({
                extensionVersion: '3.26.0',
                workerEntryPath: path.join(extensionPath, 'resources/workflow/worker/start-worker.js'),
                pid: 111,
            })}\n`
        );

        await supervisor.ensureReady();

        expect(supervisor.getHealthState()).toBe('ready');
        expect(JSON.parse(fs.readFileSync(manifestPath, 'utf8')).extensionVersion).toBe(
            '3.27.0'
        );
    });

    it('transitions to start_failed when the child exits during startup', async () => {
        const child = new FakeChild();
        const { supervisor, tempDir } = createSupervisor({
            probeResults: [false, false, false],
            spawnChild: () => child,
            startupTimeoutMs: 1_500,
        });
        tempDirs.push(tempDir);

        const readyPromise = supervisor.ensureReady();
        child.emit('exit', 1, null);

        await expect(readyPromise).rejects.toBeInstanceOf(WorkerReadinessBlockedError);
        expect(supervisor.getHealthState()).toBe('start_failed');
    });

    it('stops gracefully', async () => {
        const { supervisor, tempDir } = createSupervisor({
            probeResults: [true],
        });
        tempDirs.push(tempDir);

        await supervisor.ensureReady();
        await supervisor.stop();
        expect(supervisor.getHealthState()).toBe('stopped');
    });
});
