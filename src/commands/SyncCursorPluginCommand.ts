import * as vscode from 'vscode';
import { ensureLocalPlugin } from '../plugin/ensureLocalPlugin';
import { createGitRunner } from '../plugin/gitRunner';

function pluginSettings(): { repoUrl: string; autoUpdate: boolean } {
    const config = vscode.workspace.getConfiguration('forge.cursorPlugin');
    return {
        repoUrl: config.get<string>('repoUrl') || '',
        autoUpdate: config.get<boolean>('autoUpdate') !== false
    };
}

async function offerReload(message: string): Promise<void> {
    const choice = await vscode.window.showInformationMessage(message, 'Reload Window');
    if (choice === 'Reload Window') {
        await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
}

export async function syncCursorPlugin(
    output: vscode.OutputChannel,
    options: { quietWhenUnchanged?: boolean } = {}
): Promise<void> {
    const { repoUrl } = pluginSettings();
    try {
        const result = await ensureLocalPlugin({
            git: createGitRunner(),
            repoUrl: repoUrl || undefined
        });
        output.appendLine(
            `Cursor plugin ${result.action} at ${result.dest}`
        );
        if (result.action === 'cloned') {
            await offerReload(
                `Forge Cursor plugin installed at ${result.dest}. Reload to load agents, commands, and skills.`
            );
            return;
        }
        if (result.action === 'updated') {
            await offerReload(
                `Forge Cursor plugin updated at ${result.dest}. Reload to pick up the new files.`
            );
            return;
        }
        if (!options.quietWhenUnchanged) {
            void vscode.window.showInformationMessage(
                `Forge Cursor plugin is already current at ${result.dest}.`
            );
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        output.appendLine(`Cursor plugin sync failed: ${message}`);
        void vscode.window.showErrorMessage(`Forge Cursor plugin sync failed: ${message}`);
    }
}

export class SyncCursorPluginCommand {
    public static readonly commandId = 'forge.syncCursorPlugin';

    public static register(
        _context: vscode.ExtensionContext,
        output: vscode.OutputChannel
    ): vscode.Disposable {
        return vscode.commands.registerCommand(
            SyncCursorPluginCommand.commandId,
            () => syncCursorPlugin(output)
        );
    }
}

export function scheduleStartupSync(
    output: vscode.OutputChannel
): void {
    if (!pluginSettings().autoUpdate) {
        output.appendLine('Cursor plugin auto-update is off (forge.cursorPlugin.autoUpdate).');
        return;
    }
    void syncCursorPlugin(output, { quietWhenUnchanged: true });
}
