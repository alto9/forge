import * as vscode from 'vscode';
import { InitializeSuperrepoCommand } from './commands/InitializeSuperrepoCommand';
import { OpenSuperrepoConfigCommand } from './commands/OpenSuperrepoConfigCommand';
import { UpdateHarnessCommand } from './commands/UpdateHarnessCommand';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
    outputChannel = vscode.window.createOutputChannel('Forge');
    context.subscriptions.push(outputChannel);
    outputChannel.appendLine('Forge v4 activated (superrepo harness).');

    context.subscriptions.push(InitializeSuperrepoCommand.register(context, outputChannel));
    context.subscriptions.push(UpdateHarnessCommand.register(context, outputChannel));
    context.subscriptions.push(OpenSuperrepoConfigCommand.register(context, outputChannel));
}

export function deactivate(): void {
    // no-op
}
