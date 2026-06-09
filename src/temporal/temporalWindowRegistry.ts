import * as vscode from 'vscode';
import {
    ExternalTemporalSupervisor,
} from './ExternalTemporalSupervisor';
import { TemporalLocalSupervisor } from './TemporalLocalSupervisor';
import { getRegisteredStoredApiKeyReader } from './externalCredentials';
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
} from './temporalHealthSurfaces';
import { formatPersistencePathForDisplay } from './temporalPresentation';
import type { ExternalTemporalSupervisorConfig, ManagedLocalSupervisorConfig } from './types';

let localSupervisor: TemporalLocalSupervisor | undefined;
let externalSupervisor: ExternalTemporalSupervisor | undefined;

export function getTemporalLocalSupervisor(): TemporalLocalSupervisor | undefined {
    return localSupervisor;
}

export function getExternalTemporalSupervisor(): ExternalTemporalSupervisor | undefined {
    return externalSupervisor;
}

export function registerTemporalLocalSupervisor(
    context: vscode.ExtensionContext
): TemporalLocalSupervisor | ExternalTemporalSupervisor {
    const windowId = vscode.env.sessionId;
    const outputChannel = createTemporalOutputChannel(context);
    const mode = resolveTemporalMode();

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

    context.subscriptions.push({
        dispose: () => {
            void localSupervisor?.stop();
            localSupervisor = undefined;
        },
    });

    return localSupervisor;
}

export async function shutdownTemporalLocalSupervisor(): Promise<void> {
    await localSupervisor?.stop();
    localSupervisor = undefined;
    await externalSupervisor?.stop();
    externalSupervisor = undefined;
}
