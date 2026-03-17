import * as vscode from 'vscode';
import { InitializeAgentsCommand } from './commands/InitializeAgentsCommand';
import { ForgeChatParticipant } from './chatParticipant';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    console.log('Forge extension is now active');

    // Create output channel for displaying prompts
    outputChannel = vscode.window.createOutputChannel('Forge');
    context.subscriptions.push(outputChannel);

    // Register Forge Chat Participants for VSCode Chat (mirror Cursor agents)
    ForgeChatParticipant.registerAll(context);

    // Register Initialize Agents command (user-level + project-level setup)
    const initializeAgentsCommand = vscode.commands.registerCommand(
        'forge.initializeAgents',
        async () => {
            await InitializeAgentsCommand.execute(context, outputChannel);
        }
    );
    context.subscriptions.push(initializeAgentsCommand);
}

export function deactivate() {}

export function getOutputChannel(): vscode.OutputChannel {
    return outputChannel;
}
