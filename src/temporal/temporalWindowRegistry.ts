import * as vscode from 'vscode';
import { TemporalLocalSupervisor } from './TemporalLocalSupervisor';
import {
    ensurePersistenceDirectory,
    resolveManagedLocalSettings,
} from './managedLocalSettings';
import {
    createTemporalOutputChannel,
    registerManagedLocalTemporalHealthSurfaces,
} from './temporalHealthSurfaces';
import { formatPersistencePathForDisplay } from './temporalPresentation';
import type { ManagedLocalSupervisorConfig } from './types';

let supervisor: TemporalLocalSupervisor | undefined;

export function getTemporalLocalSupervisor(): TemporalLocalSupervisor | undefined {
    return supervisor;
}

export function registerTemporalLocalSupervisor(
    context: vscode.ExtensionContext
): TemporalLocalSupervisor {
    const windowId = vscode.env.sessionId;
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

    const outputChannel = createTemporalOutputChannel(context);

    supervisor = new TemporalLocalSupervisor(config, {
        log: (line) => {
            outputChannel.appendLine(line);
        },
    });

    registerManagedLocalTemporalHealthSurfaces(
        context,
        supervisor,
        config,
        persistencePathDisplay,
        outputChannel
    );

    context.subscriptions.push({
        dispose: () => {
            void supervisor?.stop();
            supervisor = undefined;
        },
    });

    return supervisor;
}

export async function shutdownTemporalLocalSupervisor(): Promise<void> {
    await supervisor?.stop();
    supervisor = undefined;
}
