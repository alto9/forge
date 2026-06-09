import { EventEmitter } from 'events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import {
    registerManagedLocalTemporalHealthSurfaces,
    registerWorkerHealthSurfaces,
} from './temporalHealthSurfaces';
import type {
    ManagedLocalSupervisorConfig,
    TemporalWorkerSupervisorConfig,
    WorkerHealthState,
    WorkerStartError,
} from './types';

class MockWorkerSupervisor extends EventEmitter {
    private state: WorkerHealthState = 'idle';
    private startError: WorkerStartError | undefined;
    private pid: number | undefined;

    constructor(initialState: WorkerHealthState = 'idle') {
        super();
        this.state = initialState;
    }

    getHealthState(): WorkerHealthState {
        return this.state;
    }

    getStartError(): WorkerStartError | undefined {
        return this.startError;
    }

    getWorkerPid(): number | undefined {
        return this.pid;
    }

    onStateChange(listener: (state: WorkerHealthState) => void): () => void {
        this.on('state', listener);
        return () => {
            this.off('state', listener);
        };
    }

    emitState(state: WorkerHealthState, options?: { startError?: WorkerStartError; pid?: number }): void {
        this.state = state;
        this.startError = options?.startError;
        this.pid = options?.pid;
        this.emit('state', state);
    }
}

class MockLocalSupervisor extends EventEmitter {
    getHealthState() {
        return 'ready' as const;
    }

    getStartError() {
        return undefined;
    }

    onStateChange(listener: (state: 'ready') => void): () => void {
        this.on('state', listener);
        return () => {
            this.off('state', listener);
        };
    }
}

describe('temporalHealthSurfaces worker registration', () => {
    const subscriptions: Array<{ dispose: () => void }> = [];
    const context = {
        subscriptions,
        extensionPath: '/extension',
        globalStorageUri: { fsPath: '/storage' },
    } as unknown as import('vscode').ExtensionContext;

    const workerConfig: TemporalWorkerSupervisorConfig = {
        windowId: 'window-test',
        extensionPath: '/extension',
        extensionVersion: '3.26.0',
        globalStoragePath: '/storage',
        mode: 'managedLocal',
        namespace: 'forge-local',
        taskQueue: 'forge-workflows',
        grpcPort: 7233,
        isTemporalConnectionReady: () => true,
    };

    const managedLocalConfig: ManagedLocalSupervisorConfig = {
        windowId: 'window-test',
        extensionPath: '/extension',
        globalStoragePath: '/storage',
        grpcPort: 7233,
        uiPort: 8233,
        persistencePath: '/storage/temporal/window-test',
        persistencePathDisplay: '/storage/temporal/window-test',
        namespace: 'forge-local',
        taskQueue: 'forge-workflows',
    };

    let outputChannel: { appendLine: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        subscriptions.splice(0);
        vi.clearAllMocks();
        outputChannel = { appendLine: vi.fn() };
    });

    it('shows ready notification only once per session', () => {
        const supervisor = new MockWorkerSupervisor('starting');
        registerWorkerHealthSurfaces(context, supervisor as never, workerConfig, outputChannel as never);

        supervisor.emitState('ready', { pid: 5151 });
        supervisor.emitState('unhealthy');
        supervisor.emitState('ready', { pid: 5151 });

        expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(1);
        expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
            'Forge workflow worker is ready.'
        );
    });

    it('logs worker state transitions with contract prefix and fields', () => {
        const supervisor = new MockWorkerSupervisor('starting');
        registerWorkerHealthSurfaces(context, supervisor as never, workerConfig, outputChannel as never);

        supervisor.emitState('start_failed', {
            startError: {
                remediation: 'crash',
                message: 'worker crashed',
                exitCode: 1,
            },
        });

        expect(outputChannel.appendLine).toHaveBeenCalledWith(
            '[forge.temporal.worker] state=start_failed windowId=window-test taskQueue=forge-workflows namespace=forge-local mode=managedLocal extensionVersion=3.26.0 exitCode=1'
        );
    });

    it('shows error notification on worker start_failed', () => {
        const supervisor = new MockWorkerSupervisor('start_failed');
        registerWorkerHealthSurfaces(context, supervisor as never, workerConfig, outputChannel as never);

        supervisor.emitState('start_failed', {
            startError: {
                remediation: 'asset',
                message: 'missing worker assets',
            },
        });

        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
            'Forge could not start the workflow worker — worker assets are missing from the extension package. Reinstall Forge Studio.'
        );
    });

    it('updates status bar with compound Temporal and worker labels', () => {
        const localSupervisor = new MockLocalSupervisor();
        const workerSupervisor = new MockWorkerSupervisor('idle');
        const statusBarItem = {
            text: '',
            tooltip: '',
            show: vi.fn(),
            hide: vi.fn(),
            dispose: vi.fn(),
        };

        vi.mocked(vscode.window.createStatusBarItem).mockReturnValueOnce(statusBarItem as never);

        registerManagedLocalTemporalHealthSurfaces(
            context,
            localSupervisor as never,
            managedLocalConfig,
            managedLocalConfig.persistencePathDisplay,
            outputChannel as never
        );
        registerWorkerHealthSurfaces(context, workerSupervisor as never, workerConfig, outputChannel as never);

        workerSupervisor.emitState('ready', { pid: 5151 });

        expect(statusBarItem.text).toBe('$(pulse) Temporal: ready · Worker: ready');
    });
});
