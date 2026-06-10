import * as vscode from 'vscode';
import {
    ExternalTemporalSupervisor,
} from './ExternalTemporalSupervisor';
import { TemporalLocalSupervisor } from './TemporalLocalSupervisor';
import { TemporalWorkerSupervisor } from './TemporalWorkerSupervisor';
import { getRegisteredStoredApiKeyReader } from './externalCredentials';
import {
    getRegisteredStoredCursorApiKeyReader,
    resolveCursorApiKeyForWorker,
} from './cursorCredentials';
import { resolveExternalApiKey, resolveExternalSettings } from './externalSettings';
import {
    ensurePersistenceDirectory,
    resolveManagedLocalSettings,
} from './managedLocalSettings';
import { resolveTemporalMode } from './temporalSettings';
import {
    createTemporalOutputChannel,
    registerExternalTemporalHealthSurfaces,
    registerManagedLocalTemporalHealthSurfaces,
    registerRecoveryReadinessListener,
    registerWorkerHealthSurfaces,
} from './temporalHealthSurfaces';
import { registerTemporalRecoveryCoordinator } from './temporalRecoveryCoordinator';
import { formatPersistencePathForDisplay } from './temporalPresentation';
import { isCombinedRecoveryReady } from './temporalHealthSurfaces';
import { WorkflowRunIndexStore } from './workflowRunIndex';
import {
    createWorkflowRunRecoveryContext,
    registerWorkflowRunRecoveryContext,
} from './workflowRunRecoveryService';
import type {
    ExternalTemporalSupervisorConfig,
    ManagedLocalSupervisorConfig,
    TemporalWorkerSupervisorConfig,
} from './types';
import { registerWorkflowRunRecoveryCommands } from '../commands/WorkflowRunRecoveryCommands';

let localSupervisor: TemporalLocalSupervisor | undefined;
let externalSupervisor: ExternalTemporalSupervisor | undefined;
let workerSupervisor: TemporalWorkerSupervisor | undefined;

export function getTemporalLocalSupervisor(): TemporalLocalSupervisor | undefined {
    return localSupervisor;
}

export function getExternalTemporalSupervisor(): ExternalTemporalSupervisor | undefined {
    return externalSupervisor;
}

export function getTemporalWorkerSupervisor(): TemporalWorkerSupervisor | undefined {
    return workerSupervisor;
}

function isTemporalConnectionReady(): boolean {
    if (resolveTemporalMode() === 'external') {
        const state = externalSupervisor?.getHealthState();
        return state === 'ready' || state === 'unhealthy';
    }
    return localSupervisor?.getHealthState() === 'ready';
}

function registerWorkerSupervisor(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel,
    input: {
        windowId: string;
        namespace: string;
        taskQueue: string;
        grpcPort?: number;
    }
): TemporalWorkerSupervisor {
    const mode = resolveTemporalMode();
    const workerConfig: TemporalWorkerSupervisorConfig = {
        windowId: input.windowId,
        extensionPath: context.extensionPath,
        extensionVersion: context.extension.packageJSON.version,
        globalStoragePath: context.globalStorageUri.fsPath,
        mode,
        namespace: input.namespace,
        taskQueue: input.taskQueue,
        grpcPort: input.grpcPort,
        resolveExternalSettings: mode === 'external' ? resolveExternalSettings : undefined,
        resolveApiKey:
            mode === 'external'
                ? () => resolveExternalApiKey(getRegisteredStoredApiKeyReader())
                : undefined,
        resolveCursorApiKey: () =>
            resolveCursorApiKeyForWorker(getRegisteredStoredCursorApiKeyReader()),
        isTemporalConnectionReady,
    };

    workerSupervisor = new TemporalWorkerSupervisor(workerConfig, {
        log: (line) => {
            outputChannel.appendLine(line);
        },
    });

    registerWorkerHealthSurfaces(context, workerSupervisor, workerConfig, outputChannel);

    context.subscriptions.push({
        dispose: () => {
            void workerSupervisor?.stop();
            workerSupervisor = undefined;
        },
    });

    return workerSupervisor;
}

export function registerTemporalLocalSupervisor(
    context: vscode.ExtensionContext
): TemporalLocalSupervisor | ExternalTemporalSupervisor {
    const windowId = vscode.env.sessionId;
    const outputChannel = createTemporalOutputChannel(context);
    const mode = resolveTemporalMode();

    const globalStoragePath = context.globalStorageUri.fsPath;
    const workflowRunIndexStore = new WorkflowRunIndexStore(globalStoragePath, windowId);

    const recoveryCoordinator = registerTemporalRecoveryCoordinator(context, {
        windowId,
        globalStoragePath,
        indexStore: workflowRunIndexStore,
        log: (line) => {
            outputChannel.appendLine(line);
        },
    });

    const disposeRecoveryListener = registerRecoveryReadinessListener((snapshot) => {
        recoveryCoordinator.onReadinessChanged(snapshot);
    });
    context.subscriptions.push({ dispose: disposeRecoveryListener });

    registerWorkflowRunRecoveryContext(
        createWorkflowRunRecoveryContext(context, {
            log: (line) => {
                outputChannel.appendLine(line);
            },
            isReady: isCombinedRecoveryReady,
            indexStore: workflowRunIndexStore,
        })
    );
    registerWorkflowRunRecoveryCommands(context);

    if (mode === 'external') {
        const externalConfig: ExternalTemporalSupervisorConfig = {
            windowId,
            resolveSettings: resolveExternalSettings,
            resolveApiKey: () =>
                resolveExternalApiKey(getRegisteredStoredApiKeyReader()),
        };

        externalSupervisor = new ExternalTemporalSupervisor(externalConfig, {
            log: (line) => {
                outputChannel.appendLine(line);
            },
        });

        registerExternalTemporalHealthSurfaces(
            context,
            externalSupervisor,
            externalConfig,
            resolveExternalSettings,
            outputChannel
        );

        const externalSettings = resolveExternalSettings();
        registerWorkerSupervisor(context, outputChannel, {
            windowId,
            namespace: externalSettings.namespace ?? 'unknown',
            taskQueue: externalSettings.taskQueue,
        });

        context.subscriptions.push({
            dispose: () => {
                void externalSupervisor?.stop();
                externalSupervisor = undefined;
            },
        });

        return externalSupervisor;
    }

    const settings = resolveManagedLocalSettings({
        globalStoragePath: context.globalStorageUri.fsPath,
        windowId,
    });
    ensurePersistenceDirectory(settings.persistencePath);

    const persistencePathDisplay = formatPersistencePathForDisplay(
        settings.persistencePath,
        settings.persistencePathUserConfigured
    );

    const config: ManagedLocalSupervisorConfig = {
        windowId,
        extensionPath: context.extensionPath,
        globalStoragePath: context.globalStorageUri.fsPath,
        grpcPort: settings.grpcPort,
        uiPort: settings.uiPort,
        persistencePath: settings.persistencePath,
        persistencePathDisplay,
        namespace: settings.namespace,
        taskQueue: settings.taskQueue,
    };

    localSupervisor = new TemporalLocalSupervisor(config, {
        log: (line) => {
            outputChannel.appendLine(line);
        },
    });

    registerManagedLocalTemporalHealthSurfaces(
        context,
        localSupervisor,
        config,
        persistencePathDisplay,
        outputChannel
    );

    registerWorkerSupervisor(context, outputChannel, {
        windowId,
        namespace: settings.namespace,
        taskQueue: settings.taskQueue,
        grpcPort: settings.grpcPort,
    });

    context.subscriptions.push({
        dispose: () => {
            void localSupervisor?.stop();
            localSupervisor = undefined;
        },
    });

    return localSupervisor;
}

export async function shutdownTemporalLocalSupervisor(): Promise<void> {
    await workerSupervisor?.stop();
    workerSupervisor = undefined;
    await localSupervisor?.stop();
    localSupervisor = undefined;
    await externalSupervisor?.stop();
    externalSupervisor = undefined;
}
