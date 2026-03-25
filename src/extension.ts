import * as vscode from 'vscode';
import { InitializeAgentsCommand } from './commands/InitializeAgentsCommand';
import { InitializeProjectCommand } from './commands/InitializeProjectCommand';
import { ForgeChatParticipant } from './chatParticipant';

let outputChannel: vscode.OutputChannel;

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
