import * as vscode from 'vscode';
import { SetupCursorCommand } from './SetupCursorCommand';

/**
 * Initialize project-level Forge assets in .forge.
 */
export class InitializeProjectCommand {
    static async execute(
        context: vscode.ExtensionContext,
        outputChannel?: vscode.OutputChannel
    ) {
        await SetupCursorCommand.execute(context, outputChannel, {
            title: 'Forge: Initialize Project',
            forgeOnly: true
        });
    }
}
