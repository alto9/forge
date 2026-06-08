import fs from 'fs';
import path from 'path';
import type { ManagedLocalSupervisorConfig } from './types';

export const MANAGED_LOCAL_DEV_SERVER_ENTRY = path.join(
    'resources',
    'workflow',
    'temporal',
    'start-dev-server.js'
);

export function resolveManagedLocalDevServerEntry(extensionPath: string): string {
    return path.join(extensionPath, MANAGED_LOCAL_DEV_SERVER_ENTRY);
}

export function assertManagedLocalDevServerEntryExists(extensionPath: string): void {
    const entryPath = resolveManagedLocalDevServerEntry(extensionPath);
    if (!fs.existsSync(entryPath)) {
        throw new Error(`managed-local Temporal dev server entry not found at ${entryPath}`);
    }
}

export function buildManagedLocalDevServerSpawnArgs(
    config: Pick<
        ManagedLocalSupervisorConfig,
        'grpcPort' | 'uiPort' | 'persistencePath' | 'namespace'
    >
): string[] {
    return [
        '--grpc-port',
        String(config.grpcPort),
        '--ui-port',
        String(config.uiPort),
        '--db-filename',
        path.join(config.persistencePath, 'dev-server.db'),
        '--namespace',
        config.namespace,
    ];
}

export function buildManagedLocalGrpcAddress(grpcPort: number): string {
    return `127.0.0.1:${grpcPort}`;
}
