import * as vscode from 'vscode';
import { InstallGlobalCommand } from './InstallGlobalCommand';
import { SetupCursorCommand } from './SetupCursorCommand';

export type IdeKind = 'cursor' | 'vscode';

/**
 * Detect IDE from vscode.env.appName. Returns null if unclear.
 */
function detectIde(): IdeKind | null {
    const appName = (vscode.env.appName || '').toLowerCase();
    if (appName.includes('cursor')) return 'cursor';
    if (appName.includes('visual studio code') || appName.includes('vscode')) return 'vscode';
    return null;
}

/**
 * Ask user to choose IDE when detection is unclear.
 */
async function askUserForIde(): Promise<IdeKind | null> {
    const choice = await vscode.window.showQuickPick(
        [
            { label: 'Cursor', value: 'cursor' as IdeKind },
            { label: 'VSCode', value: 'vscode' as IdeKind }
        ],
        {
            placeHolder: 'Which IDE are you using?',
            title: 'Forge: Initialize Agents'
        }
    );
    return choice?.value ?? null;
}

/**
 * Initialize Forge agents: install to ~/.cursor/ (user-level) and set up .forge/ in the project.
 * Detects Cursor vs VSCode from appName; asks user if unable to tell.
 */
export class InitializeAgentsCommand {
    static async execute(
        context: vscode.ExtensionContext,
        outputChannel?: vscode.OutputChannel
    ) {
        let ide: IdeKind | null = detectIde();
        if (ide === null) {
            ide = await askUserForIde();
            if (ide === null) {
                vscode.window.showInformationMessage('Forge: Initialize Agents cancelled.');
                return;
            }
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage(
                'Open a project folder first. Forge: Initialize Agents requires a workspace.'
            );
            return;
        }

        try {
            await InstallGlobalCommand.execute(context, outputChannel, { silent: true });
            await SetupCursorCommand.execute(context, outputChannel, {
                title: `Setting up project for ${ide === 'cursor' ? 'Cursor' : 'VSCode'}`,
                forgeOnly: true
            });
            vscode.window.showInformationMessage(
                'Forge agents initialized. User-level ~/.cursor/ and project .forge/ are ready.'
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            outputChannel?.appendLine(`Initialize failed: ${msg}`);
            vscode.window.showErrorMessage(`Initialize failed: ${msg}`);
        }
    }
}
