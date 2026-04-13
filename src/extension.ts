import * as vscode from 'vscode';
import { InitializeAgentsCommand } from './commands/InitializeAgentsCommand';
import { InitializeProjectCommand } from './commands/InitializeProjectCommand';
import { RoadmapCommand } from './commands/RoadmapCommand';
import { SetupCursorCommand, projectForgeAssetsNeedSync } from './commands/SetupCursorCommand';
import { ForgeChatParticipant } from './chatParticipant';

let outputChannel: vscode.OutputChannel;
const AUTO_PROJECT_SYNC_ENABLED_SETTING = 'autoProjectSync.enabled';

export function isAutoProjectSyncEnabled(): boolean {
    return vscode.workspace
        .getConfiguration('forge')
        .get<boolean>(AUTO_PROJECT_SYNC_ENABLED_SETTING, true);
}

function registerProjectSyncPrompt(
    context: vscode.ExtensionContext,
    channel: vscode.OutputChannel
): void {
    const checking = new Set<string>();
    const syncing = new Set<string>();
    let promptInFlight = false;

    const getOutdatedFolders = async (
        folders: readonly vscode.WorkspaceFolder[]
    ): Promise<vscode.WorkspaceFolder[]> => {
        const outdated: vscode.WorkspaceFolder[] = [];
        for (const folder of folders) {
            const folderKey = folder.uri.toString();
            if (checking.has(folderKey) || syncing.has(folderKey)) {
                continue;
            }
            checking.add(folderKey);
            try {
                const needsUpdate = projectForgeAssetsNeedSync(
                    folder.uri.fsPath,
                    context.extensionPath
                );
                if (needsUpdate) {
                    outdated.push(folder);
                }
            } finally {
                checking.delete(folderKey);
            }
        }
        return outdated;
    };

    const promptForUpdates = async (
        folders: vscode.WorkspaceFolder[],
        reason: 'startup' | 'workspace-change'
    ) => {
        if (promptInFlight || folders.length === 0) {
            return;
        }

        promptInFlight = true;
        const folderNames = folders.map((folder) => folder.name).join(', ');
        const message =
            folders.length === 1
                ? `Forge detected out-of-date .forge files in ${folders[0].name}. Update now?`
                : `Forge detected out-of-date .forge files in ${folders.length} workspace folders (${folderNames}). Update now?`;

        try {
            const action = await vscode.window.showInformationMessage(
                message,
                'Update .forge',
                'Not now'
            );
            if (action !== 'Update .forge') {
                channel.appendLine(`Skipped .forge update prompt (${reason}).`);
                return;
            }

            for (const folder of folders) {
                syncing.add(folder.uri.toString());
            }

            await Promise.all(
                folders.map(async (folder) => {
                    try {
                        const synced = await SetupCursorCommand.syncProjectFolder(
                            context,
                            folder.uri.fsPath,
                            channel,
                            { forgeOnly: true, silent: true }
                        );
                        if (synced) {
                            channel.appendLine(
                                `Updated .forge canonical assets for ${folder.name} (${reason}).`
                            );
                        }
                    } catch (error) {
                        const msg = error instanceof Error ? error.message : String(error);
                        channel.appendLine(`Project sync failed for ${folder.name}: ${msg}`);
                    } finally {
                        syncing.delete(folder.uri.toString());
                    }
                })
            );
        } finally {
            promptInFlight = false;
        }
    };

    const runForFolders = async (
        folders: readonly vscode.WorkspaceFolder[],
        reason: 'startup' | 'workspace-change'
    ) => {
        if (!isAutoProjectSyncEnabled()) {
            return;
        }
        if (folders.length === 0) {
            return;
        }
        const outdated = await getOutdatedFolders(folders);
        await promptForUpdates(outdated, reason);
    };

    const startupTimer = setTimeout(() => {
        const folders = vscode.workspace.workspaceFolders ?? [];
        void runForFolders(folders, 'startup');
    }, 1000);
    context.subscriptions.push({
        dispose: () => {
            clearTimeout(startupTimer);
        }
    });

    const workspaceFolderListener = vscode.workspace.onDidChangeWorkspaceFolders((event) => {
        void runForFolders(event.added, 'workspace-change');
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

    const roadmapCommand = vscode.commands.registerCommand('forge.showRoadmap', async () => {
        await RoadmapCommand.execute(context);
    });
    context.subscriptions.push(roadmapCommand);

    registerProjectSyncPrompt(context, outputChannel);

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
