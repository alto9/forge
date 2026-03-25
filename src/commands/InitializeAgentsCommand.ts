import * as vscode from 'vscode';
import { InstallGlobalCommand } from './InstallGlobalCommand';

/**
 * Initialize Forge Cursor agents into ~/.cursor (user-level).
 */
export class InitializeAgentsCommand {
    static async execute(
        context: vscode.ExtensionContext,
        outputChannel?: vscode.OutputChannel,
        options?: { silent?: boolean; confirmBeforeUpdate?: boolean }
    ) {
        try {
            await InstallGlobalCommand.execute(context, outputChannel, {
                silent: options?.silent,
                confirmBeforeUpdate: options?.confirmBeforeUpdate
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            outputChannel?.appendLine(`Initialize failed: ${msg}`);
            vscode.window.showErrorMessage(`Initialize failed: ${msg}`);
        }
    }
}
