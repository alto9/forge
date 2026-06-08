import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import {
    assertManagedLocalDevServerEntryExists,
    buildManagedLocalDevServerSpawnArgs,
    buildManagedLocalGrpcAddress,
    resolveManagedLocalDevServerEntry,
} from './devServerLaunch';
import { classifyStartFailure } from './failureClassification';
import { probeManagedLocalTemporalHealth } from './healthProbe';
import { ensurePersistenceDirectory } from './managedLocalSettings';
import type {
    ChildProcessSpawner,
    HealthProber,
    ManagedLocalHealthState,
    ManagedLocalStartError,
    ManagedLocalSupervisorConfig,
    SpawnedChildProcess,
} from './types';

export class TemporalReadinessBlockedError extends Error {
    readonly remediation: ManagedLocalStartError['remediation'];
    readonly healthState: ManagedLocalHealthState;

    constructor(startError: ManagedLocalStartError, healthState: ManagedLocalHealthState) {
        super(startError.message);
        this.name = 'TemporalReadinessBlockedError';
        this.remediation = startError.remediation;
        this.healthState = healthState;
    }
}

const STARTUP_TIMEOUT_MS = 60_000;
const HEALTH_PROBE_INTERVAL_MS = 500;
const UNHEALTHY_PROBE_THRESHOLD = 3;

export interface TemporalLocalSupervisorOptions {
    spawnChild?: ChildProcessSpawner;
    probeHealth?: HealthProber;
    log?: (line: string) => void;
    startupTimeoutMs?: number;
}

export class TemporalLocalSupervisor {
    private readonly emitter = new EventEmitter();
    private readonly spawnChild: ChildProcessSpawner;
    private readonly probeHealth: HealthProber;
    private readonly log: (line: string) => void;
    private readonly startupTimeoutMs: number;

    private state: ManagedLocalHealthState = 'idle';
    private startError: ManagedLocalStartError | undefined;
    private child: SpawnedChildProcess | undefined;
    private startPromise: Promise<void> | undefined;
    private consecutiveProbeFailures = 0;
    private healthMonitorTimer: NodeJS.Timeout | undefined;
    private stderrBuffer = '';

    constructor(
        private readonly config: ManagedLocalSupervisorConfig,
        options: TemporalLocalSupervisorOptions = {}
    ) {
        this.spawnChild = options.spawnChild ?? defaultSpawnChild;
        this.probeHealth = options.probeHealth ?? probeManagedLocalTemporalHealth;
        this.log = options.log ?? (() => undefined);
        this.startupTimeoutMs = options.startupTimeoutMs ?? STARTUP_TIMEOUT_MS;
    }

    getHealthState(): ManagedLocalHealthState {
        return this.state;
    }

    getStartError(): ManagedLocalStartError | undefined {
        return this.startError;
    }

    onStateChange(listener: (state: ManagedLocalHealthState) => void): () => void {
        this.emitter.on('state', listener);
        return () => {
            this.emitter.off('state', listener);
        };
    }

    async ensureReady(): Promise<void> {
        if (this.state === 'ready') {
            return;
        }

        if (this.state === 'start_failed') {
            throw new TemporalReadinessBlockedError(
                this.startError ?? {
                    remediation: 'asset',
                    message: 'Managed-local Temporal dev server failed to start.',
                },
                this.state
            );
        }

        if (!this.startPromise) {
            this.startPromise = this.startDevServer();
        }

        try {
            await this.startPromise;
        } catch (error) {
            if (error instanceof TemporalReadinessBlockedError) {
                throw error;
            }
            throw error;
        }

        const finalState = this.getHealthState();
        if (finalState !== 'ready') {
            throw new TemporalReadinessBlockedError(
                this.startError ?? {
                    remediation: 'asset',
                    message: 'Managed-local Temporal dev server is not ready.',
                },
                finalState
            );
        }
    }

    async stop(): Promise<void> {
        this.clearHealthMonitor();
        const child = this.child;
        this.child = undefined;
        this.startPromise = undefined;
        this.consecutiveProbeFailures = 0;
        this.stderrBuffer = '';

        if (child) {
            child.kill('SIGTERM');
        }

        if (this.state !== 'start_failed') {
            this.transitionTo('stopped');
        }
    }

    private async startDevServer(): Promise<void> {
        this.startError = undefined;
        this.stderrBuffer = '';
        this.consecutiveProbeFailures = 0;
        this.transitionTo('starting');

        try {
            assertManagedLocalDevServerEntryExists(this.config.extensionPath);
            ensurePersistenceDirectory(this.config.persistencePath);
        } catch (error) {
            this.failStart({
                spawnError: error instanceof Error ? error : new Error(String(error)),
            });
            throw new TemporalReadinessBlockedError(this.startError!, this.state);
        }

        const entryPath = resolveManagedLocalDevServerEntry(this.config.extensionPath);
        const args = buildManagedLocalDevServerSpawnArgs(this.config);
        const dbFilename = args[args.indexOf('--db-filename') + 1];
        if (dbFilename) {
            fs.mkdirSync(path.dirname(dbFilename), { recursive: true });
        }

        this.log(
            `[forge.temporal.local] starting windowId=${this.config.windowId} grpcPort=${this.config.grpcPort} persistencePath=${this.config.persistencePath}`
        );

        const child = this.spawnChild({
            command: process.execPath,
            args: [entryPath, ...args],
            cwd: this.config.extensionPath,
            env: {
                ...process.env,
                FORGE_TEMPORAL_WINDOW_ID: this.config.windowId,
            },
        });
        this.child = child;

        child.on('stderr', (chunk) => {
            this.stderrBuffer += chunk.toString();
        });

        child.on('error', (spawnError) => {
            this.failStart({ spawnError, stderr: this.stderrBuffer });
        });

        child.on('exit', (code) => {
            if (this.state === 'starting') {
                this.failStart({ exitCode: code, stderr: this.stderrBuffer });
                return;
            }

            this.clearHealthMonitor();
            this.child = undefined;
            if (this.state === 'ready' || this.state === 'unhealthy') {
                this.transitionTo('stopped');
            }
            this.log(
                `[forge.temporal.local] process exited windowId=${this.config.windowId} exitCode=${code ?? 'null'}`
            );
        });

        const address = buildManagedLocalGrpcAddress(this.config.grpcPort);
        const deadline = Date.now() + this.startupTimeoutMs;

        while (Date.now() < deadline) {
            if (this.state === 'start_failed' || this.state === 'stopped') {
                throw new TemporalReadinessBlockedError(this.startError!, this.state);
            }

            const healthy = await this.probeHealth({
                address,
                namespace: this.config.namespace,
            });

            if (healthy) {
                this.transitionTo('ready');
                this.log(
                    `[forge.temporal.local] ready windowId=${this.config.windowId} grpcPort=${this.config.grpcPort}`
                );
                this.startHealthMonitor(address);
                return;
            }

            await delay(HEALTH_PROBE_INTERVAL_MS);
        }

        this.failStart({
            stderr: this.stderrBuffer,
            exitCode: null,
        });
        child.kill('SIGTERM');
        throw new TemporalReadinessBlockedError(this.startError!, this.state);
    }

    private startHealthMonitor(address: string): void {
        this.clearHealthMonitor();
        this.healthMonitorTimer = setInterval(() => {
            void this.runHealthMonitorTick(address);
        }, HEALTH_PROBE_INTERVAL_MS);
    }

    private async runHealthMonitorTick(address: string): Promise<void> {
        if (this.state !== 'ready' && this.state !== 'unhealthy') {
            return;
        }

        const healthy = await this.probeHealth({
            address,
            namespace: this.config.namespace,
        });

        if (healthy) {
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
                `[forge.temporal.local] unhealthy windowId=${this.config.windowId} grpcPort=${this.config.grpcPort}`
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
    }): void {
        const classified = classifyStartFailure(input);
        this.startError = {
            remediation: classified.remediation,
            message: classified.message,
            exitCode: input.exitCode ?? undefined,
        };
        this.clearHealthMonitor();
        this.child = undefined;
        this.transitionTo('start_failed');
        this.log(
            `[forge.temporal.local] start_failed windowId=${this.config.windowId} remediation=${classified.remediation} exitCode=${input.exitCode ?? 'null'}`
        );
    }

    private transitionTo(next: ManagedLocalHealthState): void {
        if (this.state === next) {
            return;
        }
        this.state = next;
        this.emitter.emit('state', next);
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
