import * as vscode from 'vscode';
import { InitializeAgentsCommand } from './commands/InitializeAgentsCommand';
import { InitializeProjectCommand } from './commands/InitializeProjectCommand';
import { SetupCursorCommand } from './commands/SetupCursorCommand';
import { ForgeChatParticipant } from './chatParticipant';

let outputChannel: vscode.OutputChannel;
const AUTO_PROJECT_SYNC_INTERVAL_MS = 60 * 60 * 1000;
const AUTO_PROJECT_SYNC_STATE_PREFIX = 'forge.autoProjectSync.lastSyncAt.';
const AUTO_PROJECT_SYNC_ENABLED_SETTING = 'autoProjectSync.enabled';

function getAutoProjectSyncStateKey(folderUriString: string): string {
    return `${AUTO_PROJECT_SYNC_STATE_PREFIX}${folderUriString}`;
}

export function shouldRunAutoProjectSync(
    lastSyncAt: number | undefined,
    now: number,
    minimumIntervalMs = AUTO_PROJECT_SYNC_INTERVAL_MS
): boolean {
    if (!lastSyncAt) return true;
    return now - lastSyncAt >= minimumIntervalMs;
}

export function isAutoProjectSyncEnabled(): boolean {
    return vscode.workspace
        .getConfiguration('forge')
        .get<boolean>(AUTO_PROJECT_SYNC_ENABLED_SETTING, true);
}

function registerAutomatedProjectSync(
    context: vscode.ExtensionContext,
    channel: vscode.OutputChannel
): void {
    const inFlight = new Set<string>();

    const runForFolder = async (
        folder: vscode.WorkspaceFolder,
        reason: 'startup' | 'workspace-change' | 'interval'
    ) => {
        const folderKey = folder.uri.toString();
        if (inFlight.has(folderKey)) {
            return;
        }
        if (!isAutoProjectSyncEnabled()) {
            return;
        }

        const stateKey = getAutoProjectSyncStateKey(folderKey);
        const now = Date.now();
        const lastSyncAt = context.workspaceState.get<number>(stateKey);
        if (!shouldRunAutoProjectSync(lastSyncAt, now)) {
            return;
        }

        inFlight.add(folderKey);
        try {
            const synced = await SetupCursorCommand.syncProjectFolder(
                context,
                folder.uri.fsPath,
                channel,
                { forgeOnly: true, silent: true }
            );
            if (synced) {
                await context.workspaceState.update(stateKey, now);
                channel.appendLine(
                    `Auto-synced .forge canonical assets for ${folder.name} (${reason}).`
                );
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            channel.appendLine(`Auto project sync failed for ${folder.name}: ${msg}`);
        } finally {
            inFlight.delete(folderKey);
        }
    };

    const runForCurrentWorkspace = async (reason: 'startup' | 'interval') => {
        if (!isAutoProjectSyncEnabled()) {
            return;
        }
        const folders = vscode.workspace.workspaceFolders ?? [];
        await Promise.all(folders.map((folder) => runForFolder(folder, reason)));
    };

    const startupTimer = setTimeout(() => {
        void runForCurrentWorkspace('startup');
    }, 1000);
    context.subscriptions.push({
        dispose: () => {
            clearTimeout(startupTimer);
        }
    });

    const interval = setInterval(() => {
        void runForCurrentWorkspace('interval');
    }, AUTO_PROJECT_SYNC_INTERVAL_MS);
    context.subscriptions.push({
        dispose: () => {
            clearInterval(interval);
        }
    });

    const workspaceFolderListener = vscode.workspace.onDidChangeWorkspaceFolders((event) => {
        void Promise.all(event.added.map((folder) => runForFolder(folder, 'workspace-change')));
    });
    context.subscriptions.push(workspaceFolderListener);
}

export function isCursorAppName(appName: string): boolean {
    return appName.toLowerCase().includes('cursor');
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Forge extension is now active');

    // Create output channel for displaying prompts
    outputChannel = vscode.window.createOutputChannel('Forge');
    context.subscriptions.push(outputChannel);

    // Register Forge Chat Participants for VSCode Chat (mirror Cursor agents)
    ForgeChatParticipant.registerAll(context);

    // Register Initialize Cursor Agents command (user-level setup)
    const initializeAgentsCommand = vscode.commands.registerCommand(
        'forge.initializeAgents',
        async () => {
            await InitializeAgentsCommand.execute(context, outputChannel);
        }
    );
    context.subscriptions.push(initializeAgentsCommand);

    // Register Initialize Project command (.forge setup only)
    const initializeProjectCommand = vscode.commands.registerCommand(
        'forge.initializeProject',
        async () => {
            await InitializeProjectCommand.execute(context, outputChannel);
        }
    );
    context.subscriptions.push(initializeProjectCommand);

    registerAutomatedProjectSync(context, outputChannel);

    // Auto-initialize Cursor agents on startup only when running in Cursor.
    if (isCursorAppName(vscode.env.appName || '')) {
        void InitializeAgentsCommand.execute(context, outputChannel, {
            silent: true,
            confirmBeforeUpdate: true
        });
    }
}

export function deactivate() {}

export function getOutputChannel(): vscode.OutputChannel {
    return outputChannel;
}
