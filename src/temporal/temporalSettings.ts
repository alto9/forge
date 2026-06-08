import path from 'path';
import * as vscode from 'vscode';
import {
    resolveOptionalStringSetting,
    resolvePositiveIntSetting,
    resolveStringSetting,
} from './settingPrecedence';

export type TemporalMode = 'managedLocal' | 'external';

const DEFAULT_MODE: TemporalMode = 'managedLocal';
const DEFAULT_GRPC_PORT = 7233;
const DEFAULT_UI_PORT = 8233;
const DEFAULT_NAMESPACE = 'forge-local';
const DEFAULT_TASK_QUEUE = 'forge-workflows';

export function resolveTemporalMode(): TemporalMode {
    const config = vscode.workspace.getConfiguration('forge.temporal');
    const inspected = config.inspect<string>('mode');
    const raw = resolveStringSetting(inspected, 'FORGE_TEMPORAL_MODE', DEFAULT_MODE);
    return raw === 'external' ? 'external' : 'managedLocal';
}

export interface ResolvedManagedLocalSettings {
    grpcPort: number;
    uiPort: number;
    persistencePath: string;
    persistencePathUserConfigured: boolean;
    namespace: string;
    taskQueue: string;
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

    const grpcPort = resolvePositiveIntSetting(
        config.inspect<number>('grpcPort'),
        'FORGE_TEMPORAL_MANAGED_LOCAL_GRPC_PORT',
        DEFAULT_GRPC_PORT
    );
    const uiPort = resolvePositiveIntSetting(
        config.inspect<number>('uiPort'),
        'FORGE_TEMPORAL_MANAGED_LOCAL_UI_PORT',
        DEFAULT_UI_PORT
    );
    const namespace = resolveStringSetting(
        config.inspect<string>('namespace'),
        'FORGE_TEMPORAL_MANAGED_LOCAL_NAMESPACE',
        DEFAULT_NAMESPACE
    );
    const taskQueue = resolveStringSetting(
        config.inspect<string>('taskQueue'),
        'FORGE_TEMPORAL_MANAGED_LOCAL_TASK_QUEUE',
        DEFAULT_TASK_QUEUE
    );

    const configuredPersistencePath = resolveOptionalStringSetting(
        config.inspect<string>('persistencePath'),
        'FORGE_TEMPORAL_MANAGED_LOCAL_PERSISTENCE_PATH'
    );
    const persistencePathUserConfigured =
        configuredPersistencePath !== undefined && configuredPersistencePath.length > 0;
    const persistencePath = persistencePathUserConfigured
        ? configuredPersistencePath
        : computeDefaultPersistencePath(input.globalStoragePath, input.windowId);

    return {
        grpcPort,
        uiPort,
        persistencePath,
        persistencePathUserConfigured,
        namespace,
        taskQueue,
    };
}
