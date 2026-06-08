import * as vscode from 'vscode';
import { TemporalLocalSupervisor } from './TemporalLocalSupervisor';
import {
    ensurePersistenceDirectory,
    resolveManagedLocalSettings,
} from './managedLocalSettings';
import type { ManagedLocalSupervisorConfig } from './types';

let supervisor: TemporalLocalSupervisor | undefined;
let outputChannel: vscode.OutputChannel | undefined;

export function getTemporalLocalSupervisor(): TemporalLocalSupervisor | undefined {
    return supervisor;
}

export function registerTemporalLocalSupervisor(
    context: vscode.ExtensionContext,
    channel?: vscode.OutputChannel
): TemporalLocalSupervisor {
    outputChannel = channel;
    const windowId = vscode.env.sessionId;
    const settings = resolveManagedLocalSettings({
        globalStoragePath: context.globalStorageUri.fsPath,
        windowId,
    });
    ensurePersistenceDirectory(settings.persistencePath);

    const config: ManagedLocalSupervisorConfig = {
        windowId,
        extensionPath: context.extensionPath,
        globalStoragePath: context.globalStorageUri.fsPath,
        grpcPort: settings.grpcPort,
        uiPort: settings.uiPort,
        persistencePath: settings.persistencePath,
        namespace: settings.namespace,
    };

    supervisor = new TemporalLocalSupervisor(config, {
        log: (line) => {
            outputChannel?.appendLine(line);
        },
    });

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
