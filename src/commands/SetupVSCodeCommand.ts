import * as vscode from 'vscode';
import { SetupCursorCommand } from './SetupCursorCommand';

/**
 * Setup project for VSCode. Produces identical output to SetupCursor:
 * .forge folder, .cursor/commands, .cursor/agents, .cursor/skills, .cursor/hooks.
 */
export class SetupVSCodeCommand {
    static async execute(
        context: vscode.ExtensionContext,
        outputChannel?: vscode.OutputChannel
    ) {
        await SetupCursorCommand.execute(context, outputChannel, {
            title: 'Setting up project for VSCode'
        });
    }
}
