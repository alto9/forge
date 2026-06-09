export type ManagedLocalHealthState =
    | 'idle'
    | 'starting'
    | 'ready'
    | 'unhealthy'
    | 'start_failed'
    | 'stopped';

export type WorkerHealthState =
    | 'idle'
    | 'starting'
    | 'ready'
    | 'unhealthy'
    | 'start_failed'
    | 'restarting'
    | 'stopped';

export type ExternalTemporalHealthState =
    | 'idle'
    | 'connecting'
    | 'ready'
    | 'unhealthy'
    | 'connect_failed'
    | 'disconnected';

export type ExternalConnectFailureRemediation = 'auth' | 'tls' | 'address' | 'config';

export interface ExternalConnectError {
    remediation: ExternalConnectFailureRemediation;
    message: string;
    probeErrorCode?: string;
}

export interface ExternalTemporalSupervisorConfig {
    windowId: string;
    resolveSettings: () => import('./externalSettings').ResolvedExternalSettings;
    resolveApiKey: () => Promise<string | undefined>;
}

export type StartFailureRemediation = 'port' | 'asset' | 'permission';

export interface ManagedLocalSupervisorConfig {
    windowId: string;
    extensionPath: string;
    globalStoragePath: string;
    grpcPort: number;
    uiPort: number;
    persistencePath: string;
    persistencePathDisplay: string;
    namespace: string;
    taskQueue: string;
}

export interface ManagedLocalStartError {
    remediation: StartFailureRemediation;
    message: string;
    exitCode?: number;
}

export type WorkerStartFailureRemediation = StartFailureRemediation | 'crash';

export interface WorkerStartError {
    remediation: WorkerStartFailureRemediation;
    message: string;
    exitCode?: number;
}

export interface TemporalWorkerSupervisorConfig {
    windowId: string;
    extensionPath: string;
    extensionVersion: string;
    globalStoragePath: string;
    mode: import('./temporalSettings').TemporalMode;
    namespace: string;
    taskQueue: string;
    grpcPort?: number;
    resolveExternalSettings?: () => import('./externalSettings').ResolvedExternalSettings;
    resolveApiKey?: () => Promise<string | undefined>;
    isTemporalConnectionReady: () => boolean;
}

export interface SpawnedChildProcess {
    pid?: number;
    on(event: 'exit', listener: (code: number | null, signal: NodeJS.Signals | null) => void): void;
    on(event: 'error', listener: (error: Error) => void): void;
    on(event: 'stdout' | 'stderr', listener: (chunk: Buffer) => void): void;
    kill(signal?: NodeJS.Signals): void;
}

export interface ChildProcessSpawnOptions {
    command: string;
    args: string[];
    cwd: string;
    env: NodeJS.ProcessEnv;
}

export type ChildProcessSpawner = (
    options: ChildProcessSpawnOptions
) => SpawnedChildProcess;

export type HealthProber = (options: {
    address: string;
    namespace: string;
}) => Promise<boolean>;

export type ExternalPreflightProber = (options: {
    settings: import('./externalSettings').ResolvedExternalSettings;
    apiKey: string | undefined;
}) => Promise<void>;

export type ExternalHealthProber = (options: {
    settings: import('./externalSettings').ResolvedExternalSettings;
    apiKey: string | undefined;
}) => Promise<boolean>;
