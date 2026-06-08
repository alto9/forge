import { EventEmitter } from 'events';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { classifyStartFailure } from './failureClassification';
import {
    TemporalLocalSupervisor,
    TemporalReadinessBlockedError,
} from './TemporalLocalSupervisor';
import type { SpawnedChildProcess } from './types';

class FakeChild extends EventEmitter {
    pid = 4242;

    kill(): void {
        // no-op for tests
    }
}

function createSupervisor(options: {
    probeResults: boolean[];
    spawnChild?: () => SpawnedChildProcess;
    startupTimeoutMs?: number;
    extensionPath?: string;
}) {
    let probeIndex = 0;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-temporal-'));
    const extensionPath =
        options.extensionPath ??
        (() => {
            const root = path.join(tempDir, 'extension');
            const entryDir = path.join(root, 'resources', 'workflow', 'temporal');
            fs.mkdirSync(entryDir, { recursive: true });
            fs.writeFileSync(path.join(entryDir, 'start-dev-server.js'), 'module.exports = {};\n');
            return root;
        })();

    const child = new FakeChild();
    const supervisor = new TemporalLocalSupervisor(
        {
            windowId: 'window-test',
            extensionPath,
            globalStoragePath: path.join(tempDir, 'storage'),
            grpcPort: 7233,
            uiPort: 8233,
            persistencePath: path.join(tempDir, 'storage', 'temporal', 'window-test'),
            namespace: 'forge-local',
        },
        {
            spawnChild: options.spawnChild ?? (() => child),
            probeHealth: async () => {
                const result = options.probeResults[probeIndex] ?? false;
                probeIndex += 1;
                return result;
            },
            startupTimeoutMs: options.startupTimeoutMs ?? 2_000,
        }
    );

    return { supervisor, child, tempDir };
}

describe('classifyStartFailure', () => {
    it('classifies port conflicts', () => {
        expect(
            classifyStartFailure({
                stderr: 'listen EADDRINUSE: address already in use :::7233',
            }).remediation
        ).toBe('port');
    });

    it('classifies permission failures', () => {
        expect(
            classifyStartFailure({
                stderr: 'EACCES: permission denied, mkdir',
            }).remediation
        ).toBe('permission');
    });

    it('classifies missing assets', () => {
        expect(
            classifyStartFailure({
                spawnError: new Error('spawn ENOENT'),
            }).remediation
        ).toBe('asset');
    });
});

describe('TemporalLocalSupervisor', () => {
    const tempDirs: string[] = [];

    afterEach(() => {
        for (const dir of tempDirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('starts in idle and transitions to ready after health probe succeeds', async () => {
        const { supervisor, tempDir } = createSupervisor({ probeResults: [false, true] });
        tempDirs.push(tempDir);

        expect(supervisor.getHealthState()).toBe('idle');
        await supervisor.ensureReady();
        expect(supervisor.getHealthState()).toBe('ready');
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

        await expect(readyPromise).rejects.toBeInstanceOf(TemporalReadinessBlockedError);
        expect(supervisor.getHealthState()).toBe('start_failed');
        expect(supervisor.getStartError()?.remediation).toBeDefined();
    });

    it('blocks readiness when start_failed', async () => {
        const child = new FakeChild();
        const { supervisor, tempDir } = createSupervisor({
            probeResults: [false],
            spawnChild: () => child,
            startupTimeoutMs: 500,
        });
        tempDirs.push(tempDir);

        child.emit('exit', 1, null);
        await expect(supervisor.ensureReady()).rejects.toBeInstanceOf(TemporalReadinessBlockedError);
        await expect(supervisor.ensureReady()).rejects.toBeInstanceOf(TemporalReadinessBlockedError);
    });

    it('transitions to unhealthy when probes fail after ready', async () => {
        vi.useFakeTimers();
        const { supervisor, tempDir } = createSupervisor({
            probeResults: [true, false, false, false],
        });
        tempDirs.push(tempDir);

        await supervisor.ensureReady();
        expect(supervisor.getHealthState()).toBe('ready');

        await vi.advanceTimersByTimeAsync(1_600);
        expect(supervisor.getHealthState()).toBe('unhealthy');
        vi.useRealTimers();
    });

    it('transitions to stopped on graceful shutdown without deleting persistence', async () => {
        const { supervisor, tempDir } = createSupervisor({ probeResults: [true] });
        tempDirs.push(tempDir);

        await supervisor.ensureReady();
        const persistenceFile = path.join(
            tempDir,
            'storage',
            'temporal',
            'window-test',
            'marker.txt'
        );
        fs.mkdirSync(path.dirname(persistenceFile), { recursive: true });
        fs.writeFileSync(persistenceFile, 'persisted');

        await supervisor.stop();
        expect(supervisor.getHealthState()).toBe('stopped');
        expect(fs.existsSync(persistenceFile)).toBe(true);
    });

    it('fails with asset remediation when launch entry is missing', async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-temporal-'));
        tempDirs.push(tempDir);
        const supervisor = new TemporalLocalSupervisor(
            {
                windowId: 'window-test',
                extensionPath: path.join(tempDir, 'missing-extension'),
                globalStoragePath: path.join(tempDir, 'storage'),
                grpcPort: 7233,
                uiPort: 8233,
                persistencePath: path.join(tempDir, 'storage', 'temporal', 'window-test'),
                namespace: 'forge-local',
            },
            {
                startupTimeoutMs: 500,
            }
        );

        await expect(supervisor.ensureReady()).rejects.toBeInstanceOf(TemporalReadinessBlockedError);
        expect(supervisor.getHealthState()).toBe('start_failed');
        expect(supervisor.getStartError()?.remediation).toBe('asset');
    });
});
