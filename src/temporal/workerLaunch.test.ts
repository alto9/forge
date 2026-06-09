import { describe, expect, it } from 'vitest';
import {
    buildWorkerSpawnEnv,
    resolveExternalWorkerConnection,
    resolveManagedLocalWorkerConnection,
} from './workerLaunch';
import type { TemporalWorkerSupervisorConfig } from './types';

const baseConfig: TemporalWorkerSupervisorConfig = {
    windowId: 'window-test',
    extensionPath: '/extension',
    extensionVersion: '3.26.3',
    globalStoragePath: '/storage',
    mode: 'managedLocal',
    namespace: 'forge-local',
    taskQueue: 'forge-workflows',
    grpcPort: 7233,
    isTemporalConnectionReady: () => true,
};

describe('buildWorkerSpawnEnv', () => {
    it('injects managed-local Temporal settings into worker env', () => {
        const connection = resolveManagedLocalWorkerConnection({
            grpcPort: 7233,
            namespace: 'forge-local',
            taskQueue: 'forge-workflows',
        });

        const env = buildWorkerSpawnEnv(baseConfig, connection);

        expect(env.FORGE_TEMPORAL_MODE).toBe('managedLocal');
        expect(env.FORGE_TEMPORAL_WINDOW_ID).toBe('window-test');
        expect(env.FORGE_TEMPORAL_ADDRESS).toBe('127.0.0.1:7233');
        expect(env.FORGE_TEMPORAL_MANAGED_LOCAL_NAMESPACE).toBe('forge-local');
        expect(env.FORGE_TEMPORAL_MANAGED_LOCAL_TASK_QUEUE).toBe('forge-workflows');
        expect(env.FORGE_TEMPORAL_MANAGED_LOCAL_GRPC_PORT).toBe('7233');
        expect(env.FORGE_TEMPORAL_EXTERNAL_API_KEY).toBeUndefined();
    });

    it('injects external Temporal settings and API key at spawn only', () => {
        const externalSettings = {
            address: 'temporal.example.com:7233',
            namespace: 'forge-external',
            taskQueue: 'forge-workflows',
            authMode: 'apiKey' as const,
            tlsEnabled: true,
            tlsServerName: 'temporal.example.com',
        };
        const connection = resolveExternalWorkerConnection(
            externalSettings,
            'super-secret-api-key'
        );

        const env = buildWorkerSpawnEnv(
            { ...baseConfig, mode: 'external' },
            connection
        );

        expect(env.FORGE_TEMPORAL_MODE).toBe('external');
        expect(env.FORGE_TEMPORAL_EXTERNAL_ADDRESS).toBe('temporal.example.com:7233');
        expect(env.FORGE_TEMPORAL_EXTERNAL_NAMESPACE).toBe('forge-external');
        expect(env.FORGE_TEMPORAL_EXTERNAL_TASK_QUEUE).toBe('forge-workflows');
        expect(env.FORGE_TEMPORAL_EXTERNAL_AUTH_MODE).toBe('apiKey');
        expect(env.FORGE_TEMPORAL_EXTERNAL_TLS_ENABLED).toBe('true');
        expect(env.FORGE_TEMPORAL_EXTERNAL_TLS_SERVER_NAME).toBe('temporal.example.com');
        expect(env.FORGE_TEMPORAL_EXTERNAL_API_KEY).toBe('super-secret-api-key');
        expect(env.FORGE_TEMPORAL_MANAGED_LOCAL_NAMESPACE).toBeUndefined();
    });

    it('omits external API key from env when credential is unavailable', () => {
        const externalSettings = {
            address: 'temporal.example.com:7233',
            namespace: 'forge-external',
            taskQueue: 'forge-workflows',
            authMode: 'tlsServer' as const,
            tlsEnabled: true,
            tlsServerName: '',
        };
        const connection = resolveExternalWorkerConnection(externalSettings, undefined);

        const env = buildWorkerSpawnEnv(
            { ...baseConfig, mode: 'external' },
            connection
        );

        expect(env.FORGE_TEMPORAL_EXTERNAL_API_KEY).toBeUndefined();
    });
});
