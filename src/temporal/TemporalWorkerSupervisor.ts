import { EventEmitter } from 'events';
import { classifyWorkerStartFailure } from './workerFailureClassification';
import { probeWorkerTaskQueuePoll } from './healthProbe';
import { formatWorkerUpgradeRestartLogLine } from './temporalPresentation';
import {
    assertWorkerEntryExists,
    buildWorkerSpawnEnv,
    resolveExternalWorkerConnection,
    resolveManagedLocalWorkerConnection,
    resolveWorkerEntry,
    resolveWorkerManifestPath,
} from './workerLaunch';
import {
    readWorkerManifest,
    workerManifestVersionMismatch,
    writeWorkerManifest,
} from './workerManifest';
import type {
    ChildProcessSpawner,
    SpawnedChildProcess,
    TemporalWorkerSupervisorConfig,
    WorkerHealthState,
    WorkerStartError,
} from './types';

export class WorkerReadinessBlockedError extends Error {
    readonly remediation: WorkerStartError['remediation'];
    readonly healthState: WorkerHealthState;

    constructor(startError: WorkerStartError, healthState: WorkerHealthState) {
        super(startError.message);
        this.name = 'WorkerReadinessBlockedError';
        this.remediation = startError.remediation;
        this.healthState = healthState;
    }
}

const STARTUP_TIMEOUT_MS = 60_000;
const HEALTH_PROBE_INTERVAL_MS = 500;
const UNHEALTHY_PROBE_THRESHOLD = 3;
const MAX_RESTART_BACKOFF_MS = 30_000;
const MAX_CONSECUTIVE_START_FAILURES = 5;
const WORKER_READY_PREFIX = 'FORGE_WORKER_READY:';

export interface TemporalWorkerSupervisorOptions {
    spawnChild?: ChildProcessSpawner;
    probeTaskQueue?: typeof probeWorkerTaskQueuePoll;
    log?: (line: string) => void;
    startupTimeoutMs?: number;
}

export class TemporalWorkerSupervisor {
    private readonly emitter = new EventEmitter();
    private readonly spawnChild: ChildProcessSpawner;
    private readonly probeTaskQueue: typeof probeWorkerTaskQueuePoll;
    private readonly log: (line: string) => void;
    private readonly startupTimeoutMs: number;
    private readonly manifestPath: string;

    private state: WorkerHealthState = 'idle';
    private startError: WorkerStartError | undefined;
    private child: SpawnedChildProcess | undefined;
    private startPromise: Promise<void> | undefined;
    private consecutiveProbeFailures = 0;
    private consecutiveStartFailures = 0;
    private restartAttempt = 0;
    private restartTimer: NodeJS.Timeout | undefined;
    private healthMonitorTimer: NodeJS.Timeout | undefined;
    private stderrBuffer = '';
    private stdoutBuffer = '';
    private readySignalReceived = false;
    private upgradeRestartPending = false;

    constructor(
        private readonly config: TemporalWorkerSupervisorConfig,
        options: TemporalWorkerSupervisorOptions = {}
    ) {
        this.spawnChild = options.spawnChild ?? defaultSpawnChild;
        this.probeTaskQueue = options.probeTaskQueue ?? probeWorkerTaskQueuePoll;
        this.log = options.log ?? (() => undefined);
        this.startupTimeoutMs = options.startupTimeoutMs ?? STARTUP_TIMEOUT_MS;
        this.manifestPath = resolveWorkerManifestPath(
            config.globalStoragePath,
            config.windowId
        );
    }

    getHealthState(): WorkerHealthState {
        if (!this.config.isTemporalConnectionReady()) {
            return 'idle';
        }
        return this.state;
    }

    getStartError(): WorkerStartError | undefined {
        return this.startError;
    }

    getWorkerPid(): number | undefined {
        return this.child?.pid;
    }

    onStateChange(listener: (state: WorkerHealthState) => void): () => void {
        this.emitter.on('state', listener);
        return () => {
            this.emitter.off('state', listener);
        };
    }

    async ensureReady(): Promise<void> {
        if (!this.config.isTemporalConnectionReady()) {
            this.transitionTo('idle');
            throw new WorkerReadinessBlockedError(
                {
                    remediation: 'asset',
                    message: 'Forge workflow worker cannot start until Temporal is ready.',
                },
                'idle'
            );
        }

        const manifest = readWorkerManifest(this.manifestPath);
        if (workerManifestVersionMismatch(manifest, this.config.extensionVersion)) {
            this.upgradeRestartPending = true;
            await this.stopWorkerProcess();
            this.log(
                `[forge.temporal.worker] extensionVersionChanged windowId=${this.config.windowId} previous=${manifest?.extensionVersion} current=${this.config.extensionVersion}`
            );
        }

        if (this.state === 'ready') {
            return;
        }

        if (this.state === 'start_failed') {
            throw new WorkerReadinessBlockedError(
                this.startError ?? {
                    remediation: 'asset',
                    message: 'Forge workflow worker failed to start.',
                },
                this.state
            );
        }

        if (!this.startPromise) {
            this.startPromise = this.startWorker();
        }

        try {
            await this.startPromise;
        } catch (error) {
            if (error instanceof WorkerReadinessBlockedError) {
                throw error;
            }
            throw error;
        }

        const finalState = this.getHealthState();
        if (finalState !== 'ready') {
            throw new WorkerReadinessBlockedError(
                this.startError ?? {
                    remediation: 'asset',
                    message: 'Forge workflow worker is not ready.',
                },
                finalState
            );
        }
    }

    async stop(): Promise<void> {
        this.clearRestartTimer();
        this.clearHealthMonitor();
        await this.stopWorkerProcess();
        this.startPromise = undefined;
        this.consecutiveProbeFailures = 0;
        this.restartAttempt = 0;
        this.consecutiveStartFailures = 0;
        this.stderrBuffer = '';
        this.stdoutBuffer = '';
        this.readySignalReceived = false;
        this.upgradeRestartPending = false;

        if (this.state !== 'start_failed') {
            this.transitionTo('stopped');
        }
    }

    private async stopWorkerProcess(): Promise<void> {
        const child = this.child;
        this.child = undefined;
        if (child) {
            child.kill('SIGTERM');
        }
    }

    private async startWorker(): Promise<void> {
        this.startError = undefined;
        this.stderrBuffer = '';
        this.stdoutBuffer = '';
        this.readySignalReceived = false;
        this.consecutiveProbeFailures = 0;
        this.transitionTo(this.restartAttempt > 0 || this.upgradeRestartPending ? 'restarting' : 'starting');

        if (this.upgradeRestartPending) {
            this.log(
                formatWorkerUpgradeRestartLogLine({
                    windowId: this.config.windowId,
                    extensionVersion: this.config.extensionVersion,
                })
            );
            this.upgradeRestartPending = false;
        }

        try {
            assertWorkerEntryExists(this.config.extensionPath);
        } catch (error) {
            this.failStart({
                spawnError: error instanceof Error ? error : new Error(String(error)),
            });
            throw new WorkerReadinessBlockedError(this.startError!, this.state);
        }

        const connection = await this.resolveConnection();
        const entryPath = resolveWorkerEntry(this.config.extensionPath);
        const cursorApiKey = this.config.resolveCursorApiKey
            ? await this.config.resolveCursorApiKey()
            : undefined;
        const env = buildWorkerSpawnEnv(this.config, connection, { cursorApiKey });

        this.log(
            `[forge.temporal.worker] starting windowId=${this.config.windowId} mode=${this.config.mode} taskQueue=${connection.taskQueue} namespace=${connection.namespace} extensionVersion=${this.config.extensionVersion}`
        );

        const child = this.spawnChild({
            command: process.execPath,
            args: [entryPath],
            cwd: this.config.extensionPath,
            env,
        });
        this.child = child;

        child.on('stdout', (chunk) => {
            const text = chunk.toString();
            this.stdoutBuffer += text;
            if (text.includes(WORKER_READY_PREFIX)) {
                this.readySignalReceived = true;
            }
        });

        child.on('stderr', (chunk) => {
            this.stderrBuffer += chunk.toString();
        });

        child.on('error', (spawnError) => {
            this.failStart({ spawnError, stderr: this.stderrBuffer });
        });

        child.on('exit', (code) => {
            const wasReady = this.state === 'ready' || this.state === 'unhealthy';
            this.clearHealthMonitor();
            this.child = undefined;
            this.startPromise = undefined;

            this.log(
                `[forge.temporal.worker] process exited windowId=${this.config.windowId} exitCode=${code ?? 'null'} pid=${child.pid ?? 'null'}`
            );

            if (this.state === 'starting' || this.state === 'restarting') {
                this.failStart({ exitCode: code, stderr: this.stderrBuffer });
                return;
            }

            if (wasReady) {
                this.scheduleRestartAfterCrash(code);
            }
        });

        const deadline = Date.now() + this.startupTimeoutMs;

        while (Date.now() < deadline) {
            if (this.state === 'start_failed' || this.state === 'stopped') {
                throw new WorkerReadinessBlockedError(this.startError!, this.state);
            }

            if (this.readySignalReceived) {
                const polling = await this.probeTaskQueue({
                    mode: connection.mode,
                    address: connection.address,
                    namespace: connection.namespace,
                    taskQueue: connection.taskQueue,
                    externalSettings: connection.externalSettings,
                    apiKey: connection.apiKey,
                    connectionOptions: connection.connectionOptions,
                });

                if (polling) {
                    this.consecutiveStartFailures = 0;
                    this.restartAttempt = 0;
                    writeWorkerManifest(this.manifestPath, {
                        extensionVersion: this.config.extensionVersion,
                        workerEntryPath: entryPath,
                        pid: child.pid ?? 0,
                    });
                    this.transitionTo('ready');
                    this.log(
                        `[forge.temporal.worker] ready windowId=${this.config.windowId} taskQueue=${connection.taskQueue} namespace=${connection.namespace} mode=${this.config.mode} extensionVersion=${this.config.extensionVersion} pid=${child.pid ?? 'null'}`
                    );
                    this.startHealthMonitor(connection);
                    return;
                }
            }

            await delay(HEALTH_PROBE_INTERVAL_MS);
        }

        this.failStart({
            stderr: this.stderrBuffer,
            exitCode: null,
        });
        child.kill('SIGTERM');
        throw new WorkerReadinessBlockedError(this.startError!, this.state);
    }

    private async resolveConnection(): Promise<{
        mode: 'managedLocal' | 'external';
        address: string;
        namespace: string;
        taskQueue: string;
        externalSettings?: import('./externalSettings').ResolvedExternalSettings;
        apiKey?: string;
        connectionOptions?: import('@temporalio/client').ConnectionOptions;
    }> {
        if (this.config.mode === 'external') {
            const settings = this.config.resolveExternalSettings?.();
            if (!settings?.address || !settings.namespace) {
                throw new Error('External Temporal settings are incomplete for worker spawn.');
            }
            const apiKey = (await this.config.resolveApiKey?.()) ?? undefined;
            return resolveExternalWorkerConnection(settings, apiKey);
        }

        if (this.config.grpcPort === undefined) {
            throw new Error('Managed-local gRPC port is required for worker spawn.');
        }

        return resolveManagedLocalWorkerConnection({
            grpcPort: this.config.grpcPort,
            namespace: this.config.namespace,
            taskQueue: this.config.taskQueue,
        });
    }

    private scheduleRestartAfterCrash(exitCode: number | null): void {
        this.consecutiveStartFailures += 1;
        if (this.consecutiveStartFailures >= MAX_CONSECUTIVE_START_FAILURES) {
            this.failStart({
                exitCode,
                stderr: this.stderrBuffer,
                repeatedCrash: true,
            });
            return;
        }

        this.restartAttempt += 1;
        const backoffMs = Math.min(
            MAX_RESTART_BACKOFF_MS,
            HEALTH_PROBE_INTERVAL_MS * 2 ** this.restartAttempt
        );
        this.transitionTo('restarting');
        this.log(
            `[forge.temporal.worker] restarting windowId=${this.config.windowId} attempt=${this.restartAttempt} backoffMs=${backoffMs}`
        );

        this.clearRestartTimer();
        this.restartTimer = setTimeout(() => {
            this.startPromise = this.startWorker();
            void this.startPromise.catch(() => undefined);
        }, backoffMs);
    }

    private clearRestartTimer(): void {
        if (this.restartTimer) {
            clearTimeout(this.restartTimer);
            this.restartTimer = undefined;
        }
    }

    private startHealthMonitor(connection: {
        mode: 'managedLocal' | 'external';
        address: string;
        namespace: string;
        taskQueue: string;
        externalSettings?: import('./externalSettings').ResolvedExternalSettings;
        apiKey?: string;
        connectionOptions?: import('@temporalio/client').ConnectionOptions;
    }): void {
        this.clearHealthMonitor();
        this.healthMonitorTimer = setInterval(() => {
            void this.runHealthMonitorTick(connection);
        }, HEALTH_PROBE_INTERVAL_MS);
    }

    private async runHealthMonitorTick(connection: {
        mode: 'managedLocal' | 'external';
        address: string;
        namespace: string;
        taskQueue: string;
        externalSettings?: import('./externalSettings').ResolvedExternalSettings;
        apiKey?: string;
        connectionOptions?: import('@temporalio/client').ConnectionOptions;
    }): Promise<void> {
        if (this.state !== 'ready' && this.state !== 'unhealthy') {
            return;
        }

        const polling = await this.probeTaskQueue({
            mode: connection.mode,
            address: connection.address,
            namespace: connection.namespace,
            taskQueue: connection.taskQueue,
            externalSettings: connection.externalSettings,
            apiKey: connection.apiKey,
            connectionOptions: connection.connectionOptions,
        });

        if (polling) {
            this.consecutiveProbeFailures = 0;
            if (this.state === 'unhealthy') {
                this.transitionTo('ready');
            }
            return;
        }

        this.consecutiveProbeFailures += 1;
        if (
            this.consecutiveProbeFailures >= UNHEALTHY_PROBE_THRESHOLD &&
            this.state === 'ready'
        ) {
            this.transitionTo('unhealthy');
            this.log(
                `[forge.temporal.worker] unhealthy windowId=${this.config.windowId} taskQueue=${connection.taskQueue}`
            );
        }
    }

    private clearHealthMonitor(): void {
        if (this.healthMonitorTimer) {
            clearInterval(this.healthMonitorTimer);
            this.healthMonitorTimer = undefined;
        }
    }

    private failStart(input: {
        spawnError?: Error;
        exitCode?: number | null;
        stderr?: string;
        repeatedCrash?: boolean;
    }): void {
        const classified = classifyWorkerStartFailure(input);
        this.startError = {
            remediation: classified.remediation,
            message: classified.message,
            exitCode: input.exitCode ?? undefined,
        };
        this.clearHealthMonitor();
        this.clearRestartTimer();
        void this.stopWorkerProcess();
        this.startPromise = undefined;
        this.transitionTo('start_failed');
        this.log(
            `[forge.temporal.worker] start_failed windowId=${this.config.windowId} remediation=${classified.remediation} exitCode=${input.exitCode ?? 'null'}`
        );
    }

    private transitionTo(next: WorkerHealthState): void {
        if (this.state === next) {
            return;
        }
        this.state = next;
        this.emitter.emit('state', this.getHealthState());
    }
}

function defaultSpawnChild(options: {
    command: string;
    args: string[];
    cwd: string;
    env: NodeJS.ProcessEnv;
}): SpawnedChildProcess {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { spawn } = require('child_process') as typeof import('child_process');
    return spawn(options.command, options.args, {
        cwd: options.cwd,
        env: options.env,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
