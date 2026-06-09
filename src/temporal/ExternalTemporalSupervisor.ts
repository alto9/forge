import { EventEmitter } from 'events';
import { classifyExternalConnectFailure } from './externalConnectFailure';
import { probeExternalTemporalHealth, probeExternalTemporalPreflight } from './healthProbe';
import { formatSafeForLog } from './secretRedaction';
import type {
    ExternalConnectError,
    ExternalPreflightProber,
    ExternalHealthProber,
    ExternalTemporalHealthState,
    ExternalTemporalSupervisorConfig,
} from './types';

export class ExternalReadinessBlockedError extends Error {
    readonly remediation: ExternalConnectError['remediation'];
    readonly healthState: ExternalTemporalHealthState;

    constructor(connectError: ExternalConnectError, healthState: ExternalTemporalHealthState) {
        super(connectError.message);
        this.name = 'ExternalReadinessBlockedError';
        this.remediation = connectError.remediation;
        this.healthState = healthState;
    }
}

const HEALTH_PROBE_INTERVAL_MS = 500;
const UNHEALTHY_PROBE_THRESHOLD = 3;

export interface ExternalTemporalSupervisorOptions {
    preflight?: ExternalPreflightProber;
    probeHealth?: ExternalHealthProber;
    log?: (line: string) => void;
}

export class ExternalTemporalSupervisor {
    private readonly emitter = new EventEmitter();
    private readonly preflight: ExternalPreflightProber;
    private readonly probeHealth: ExternalHealthProber;
    private readonly log: (line: string) => void;

    private state: ExternalTemporalHealthState = 'idle';
    private connectError: ExternalConnectError | undefined;
    private preflightPromise: Promise<void> | undefined;
    private consecutiveProbeFailures = 0;
    private healthMonitorTimer: NodeJS.Timeout | undefined;
    private insecureWarningLogged = false;

    constructor(
        private readonly config: ExternalTemporalSupervisorConfig,
        options: ExternalTemporalSupervisorOptions = {}
    ) {
        this.preflight = options.preflight ?? probeExternalTemporalPreflight;
        this.probeHealth = options.probeHealth ?? probeExternalTemporalHealth;
        this.log = options.log ?? (() => undefined);
    }

    getHealthState(): ExternalTemporalHealthState {
        return this.state;
    }

    getConnectError(): ExternalConnectError | undefined {
        return this.connectError;
    }

    onStateChange(listener: (state: ExternalTemporalHealthState) => void): () => void {
        this.emitter.on('state', listener);
        return () => {
            this.emitter.off('state', listener);
        };
    }

    async ensureReady(): Promise<void> {
        if (this.state === 'ready') {
            return;
        }

        if (this.state === 'connect_failed') {
            throw new ExternalReadinessBlockedError(
                this.connectError ?? {
                    remediation: 'config',
                    message: 'External Temporal connection failed.',
                },
                this.state
            );
        }

        if (!this.preflightPromise) {
            this.preflightPromise = this.runPreflight();
        }

        try {
            await this.preflightPromise;
        } catch (error) {
            if (error instanceof ExternalReadinessBlockedError) {
                throw error;
            }
            throw error;
        }
    }

    async stop(): Promise<void> {
        this.clearHealthMonitor();
        this.preflightPromise = undefined;
        this.consecutiveProbeFailures = 0;
        this.insecureWarningLogged = false;

        if (this.state !== 'connect_failed') {
            this.transitionTo('idle');
        }
    }

    private async runPreflight(): Promise<void> {
        this.connectError = undefined;
        this.consecutiveProbeFailures = 0;
        this.transitionTo('connecting');

        const settings = this.config.resolveSettings();
        const apiKey = await this.config.resolveApiKey();

        this.logExternalState('connecting', settings, apiKey);

        if (settings.authMode === 'insecure' && !this.insecureWarningLogged) {
            this.insecureWarningLogged = true;
            this.log(
                `[forge.temporal.external] insecure_mode address=${settings.address ?? 'unknown'} authMode=${settings.authMode}`
            );
        }

        try {
            await this.preflight({ settings, apiKey });
            this.transitionTo('ready');
            this.logExternalState('ready', settings, apiKey);
            this.startHealthMonitor(settings, apiKey);
        } catch (error) {
            this.failConnect(error, settings, apiKey);
            throw new ExternalReadinessBlockedError(this.connectError!, this.state);
        }
    }

    private startHealthMonitor(
        settings: ReturnType<ExternalTemporalSupervisorConfig['resolveSettings']>,
        apiKey: string | undefined
    ): void {
        this.clearHealthMonitor();
        this.healthMonitorTimer = setInterval(() => {
            void this.runHealthMonitorTick(settings, apiKey);
        }, HEALTH_PROBE_INTERVAL_MS);
    }

    private async runHealthMonitorTick(
        settings: ReturnType<ExternalTemporalSupervisorConfig['resolveSettings']>,
        apiKey: string | undefined
    ): Promise<void> {
        if (this.state !== 'ready' && this.state !== 'unhealthy' && this.state !== 'disconnected') {
            return;
        }

        const healthy = await this.probeHealth({ settings, apiKey });

        if (healthy) {
            this.consecutiveProbeFailures = 0;
            if (this.state === 'unhealthy' || this.state === 'disconnected') {
                this.transitionTo('ready');
                this.logExternalState('ready', settings, apiKey);
            }
            return;
        }

        this.consecutiveProbeFailures += 1;
        if (this.consecutiveProbeFailures >= UNHEALTHY_PROBE_THRESHOLD) {
            const nextState: ExternalTemporalHealthState =
                this.state === 'ready' ? 'unhealthy' : 'disconnected';
            if (this.state !== nextState) {
                this.transitionTo(nextState);
                this.logExternalState(nextState, settings, apiKey);
            }
        }
    }

    private failConnect(
        error: unknown,
        settings: ReturnType<ExternalTemporalSupervisorConfig['resolveSettings']>,
        apiKey: string | undefined
    ): void {
        const normalized = error instanceof Error ? error : new Error(String(error));
        const classified = classifyExternalConnectFailure(normalized);
        this.connectError = {
            remediation: classified.remediation,
            message: classified.message,
            probeErrorCode: classified.probeErrorCode,
        };
        this.clearHealthMonitor();
        this.transitionTo('connect_failed');
        this.log(
            formatSafeForLog(
                `[forge.temporal.external] connect_failed windowId=${this.config.windowId} address=${settings.address ?? 'unknown'} namespace=${settings.namespace ?? 'unknown'} authMode=${settings.authMode} tlsEnabled=${settings.tlsEnabled} remediation=${classified.remediation} probeErrorCode=${classified.probeErrorCode ?? 'none'} message=${normalized.message}`,
                { knownSecrets: apiKey ? [apiKey] : [] }
            )
        );
    }

    private logExternalState(
        state: ExternalTemporalHealthState,
        settings: ReturnType<ExternalTemporalSupervisorConfig['resolveSettings']>,
        apiKey: string | undefined
    ): void {
        this.log(
            `[forge.temporal.external] state=${state} windowId=${this.config.windowId} address=${settings.address ?? 'unknown'} namespace=${settings.namespace ?? 'unknown'} authMode=${settings.authMode} tlsEnabled=${settings.tlsEnabled}`
        );
    }

    private clearHealthMonitor(): void {
        if (this.healthMonitorTimer) {
            clearInterval(this.healthMonitorTimer);
            this.healthMonitorTimer = undefined;
        }
    }

    private transitionTo(next: ExternalTemporalHealthState): void {
        if (this.state === next) {
            return;
        }
        this.state = next;
        this.emitter.emit('state', next);
    }
}
