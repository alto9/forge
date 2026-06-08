import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';

export interface ResolvedManagedLocalSettings {
    grpcPort: number;
    uiPort: number;
    persistencePath: string;
    namespace: string;
    taskQueue: string;
}

const DEFAULT_GRPC_PORT = 7233;
const DEFAULT_UI_PORT = 8233;
const DEFAULT_NAMESPACE = 'forge-local';
const DEFAULT_TASK_QUEUE = 'forge-workflows';

function readPositiveInt(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
        return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number.parseInt(value, 10);
        if (Number.isInteger(parsed) && parsed > 0) {
            return parsed;
        }
    }
    return fallback;
}

function readEnvPositiveInt(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw || raw.trim() === '') {
        return fallback;
    }
    return readPositiveInt(raw, fallback);
}

function readEnvString(name: string): string | undefined {
    const raw = process.env[name];
    return raw && raw.trim() !== '' ? raw.trim() : undefined;
}

export function computeDefaultPersistencePath(
    globalStoragePath: string,
    windowId: string
): string {
    return path.join(globalStoragePath, 'temporal', windowId);
}

export function resolveManagedLocalSettings(input: {
    globalStoragePath: string;
    windowId: string;
}): ResolvedManagedLocalSettings {
    const config = vscode.workspace.getConfiguration('forge.temporal.managedLocal');

    const grpcPort = readEnvPositiveInt(
        'FORGE_TEMPORAL_MANAGED_LOCAL_GRPC_PORT',
        readPositiveInt(config.get('grpcPort'), DEFAULT_GRPC_PORT)
    );
    const uiPort = readEnvPositiveInt(
        'FORGE_TEMPORAL_MANAGED_LOCAL_UI_PORT',
        readPositiveInt(config.get('uiPort'), DEFAULT_UI_PORT)
    );
    const namespace =
        readEnvString('FORGE_TEMPORAL_MANAGED_LOCAL_NAMESPACE') ??
        (config.get<string>('namespace')?.trim() || DEFAULT_NAMESPACE);
    const taskQueue =
        readEnvString('FORGE_TEMPORAL_MANAGED_LOCAL_TASK_QUEUE') ??
        (config.get<string>('taskQueue')?.trim() || DEFAULT_TASK_QUEUE);

    const configuredPersistencePath =
        readEnvString('FORGE_TEMPORAL_MANAGED_LOCAL_PERSISTENCE_PATH') ??
        config.get<string>('persistencePath')?.trim();
    const persistencePath =
        configuredPersistencePath && configuredPersistencePath.length > 0
            ? configuredPersistencePath
            : computeDefaultPersistencePath(input.globalStoragePath, input.windowId);

    return {
        grpcPort,
        uiPort,
        persistencePath,
        namespace,
        taskQueue,
    };
}

export function ensurePersistenceDirectory(persistencePath: string): void {
    fs.mkdirSync(persistencePath, { recursive: true });
}
