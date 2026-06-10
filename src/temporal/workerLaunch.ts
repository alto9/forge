import fs from 'fs';
import path from 'path';
import { buildExternalConnectionOptions } from './externalConnection';
import type { ResolvedExternalSettings } from './externalSettings';
import { buildManagedLocalGrpcAddress } from './devServerLaunch';
import type { TemporalMode } from './temporalSettings';
import type { TemporalWorkerSupervisorConfig } from './types';

export const WORKER_ENTRY = path.join('resources', 'workflow', 'worker', 'start-worker.js');

export function resolveWorkerEntry(extensionPath: string): string {
    return path.join(extensionPath, WORKER_ENTRY);
}

export function assertWorkerEntryExists(extensionPath: string): void {
    const entryPath = resolveWorkerEntry(extensionPath);
    if (!fs.existsSync(entryPath)) {
        throw new Error(`Temporal worker entry not found at ${entryPath}`);
    }
}

export function resolveWorkerManifestPath(
    globalStoragePath: string,
    windowId: string
): string {
    return path.join(globalStoragePath, 'temporal', windowId, 'worker-manifest.json');
}

export function buildWorkerSpawnEnv(
    config: TemporalWorkerSupervisorConfig,
    connection: {
        mode: TemporalMode;
        address: string;
        namespace: string;
        taskQueue: string;
        externalSettings?: ResolvedExternalSettings;
        apiKey?: string;
    },
    options: { cursorApiKey?: string } = {}
): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = {
        ...process.env,
        FORGE_TEMPORAL_MODE: connection.mode,
        FORGE_TEMPORAL_WINDOW_ID: config.windowId,
        FORGE_TEMPORAL_ADDRESS: connection.address,
    };

    if (connection.mode === 'managedLocal') {
        env.FORGE_TEMPORAL_MANAGED_LOCAL_NAMESPACE = connection.namespace;
        env.FORGE_TEMPORAL_MANAGED_LOCAL_TASK_QUEUE = connection.taskQueue;
        const grpcPort = connection.address.split(':').pop();
        if (grpcPort) {
            env.FORGE_TEMPORAL_MANAGED_LOCAL_GRPC_PORT = grpcPort;
        }
    } else if (connection.externalSettings) {
        env.FORGE_TEMPORAL_EXTERNAL_ADDRESS = connection.externalSettings.address ?? '';
        env.FORGE_TEMPORAL_EXTERNAL_NAMESPACE = connection.namespace;
        env.FORGE_TEMPORAL_EXTERNAL_TASK_QUEUE = connection.taskQueue;
        env.FORGE_TEMPORAL_EXTERNAL_AUTH_MODE = connection.externalSettings.authMode;
        env.FORGE_TEMPORAL_EXTERNAL_TLS_ENABLED = String(connection.externalSettings.tlsEnabled);
        if (connection.externalSettings.tlsServerName) {
            env.FORGE_TEMPORAL_EXTERNAL_TLS_SERVER_NAME =
                connection.externalSettings.tlsServerName;
        }
        if (connection.apiKey) {
            env.FORGE_TEMPORAL_EXTERNAL_API_KEY = connection.apiKey;
        }
    }

    const cursorApiKey = options.cursorApiKey?.trim() || process.env.CURSOR_API_KEY?.trim();
    if (cursorApiKey) {
        env.CURSOR_API_KEY = cursorApiKey;
    }

    return env;
}

export function resolveManagedLocalWorkerConnection(input: {
    grpcPort: number;
    namespace: string;
    taskQueue: string;
}): {
    mode: TemporalMode;
    address: string;
    namespace: string;
    taskQueue: string;
} {
    return {
        mode: 'managedLocal',
        address: buildManagedLocalGrpcAddress(input.grpcPort),
        namespace: input.namespace,
        taskQueue: input.taskQueue,
    };
}

export function resolveExternalWorkerConnection(
    settings: ResolvedExternalSettings,
    apiKey: string | undefined
): {
    mode: TemporalMode;
    address: string;
    namespace: string;
    taskQueue: string;
    externalSettings: ResolvedExternalSettings;
    apiKey: string | undefined;
    connectionOptions: ReturnType<typeof buildExternalConnectionOptions>;
} {
    return {
        mode: 'external',
        address: settings.address ?? '',
        namespace: settings.namespace ?? '',
        taskQueue: settings.taskQueue,
        externalSettings: settings,
        apiKey,
        connectionOptions: buildExternalConnectionOptions(settings, apiKey),
    };
}
