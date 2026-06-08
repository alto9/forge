export type ManagedLocalHealthState =
    | 'idle'
    | 'starting'
    | 'ready'
    | 'unhealthy'
    | 'start_failed'
    | 'stopped';

export type StartFailureRemediation = 'port' | 'asset' | 'permission';

export interface ManagedLocalSupervisorConfig {
    windowId: string;
    extensionPath: string;
    globalStoragePath: string;
    grpcPort: number;
    uiPort: number;
    persistencePath: string;
    namespace: string;
}

export interface ManagedLocalStartError {
    remediation: StartFailureRemediation;
    message: string;
    exitCode?: number;
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
