import * as vscode from 'vscode';
import { RefineIssueCommand } from './commands/RefineIssueCommand';
import { InitializeCursorCommandsCommand } from './commands/InitializeCursorCommandsCommand';
import { SetupCursorCommand } from './commands/SetupCursorCommand';
import { SetupVSCodeCommand } from './commands/SetupVSCodeCommand';
import { ForgeChatParticipant } from './chatParticipant';
import { RoadmapPanel } from './panels/RoadmapPanel';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    console.log('Forge extension is now active');

    // Create output channel for displaying prompts
    outputChannel = vscode.window.createOutputChannel('Forge');
    context.subscriptions.push(outputChannel);

    // Register Forge Chat Participants for VSCode Chat
    ForgeChatParticipant.registerAll(context);

    // Register the Refine Issue command
    const refineIssueCommand = vscode.commands.registerCommand(
        'forge.refineIssue',
        async () => {
            await RefineIssueCommand.execute(outputChannel);
        }
    );
    context.subscriptions.push(refineIssueCommand);

    // Register the Initialize Cursor Commands command (legacy - delegates to Setup Cursor)
    const initializeCursorCommandsCommand = vscode.commands.registerCommand(
        'forge.initializeCursorCommands',
        async () => {
            await SetupCursorCommand.execute(context, outputChannel);
        }
    );
    context.subscriptions.push(initializeCursorCommandsCommand);

    // Register Setup Cursor command
    const setupCursorCommand = vscode.commands.registerCommand(
        'forge.setupCursor',
        async () => {
            await SetupCursorCommand.execute(context, outputChannel);
        }
    );
    context.subscriptions.push(setupCursorCommand);

    // Register Setup VSCode command
    const setupVSCodeCommand = vscode.commands.registerCommand(
        'forge.setupVSCode',
        async () => {
            await SetupVSCodeCommand.execute(context, outputChannel);
        }
    );
    context.subscriptions.push(setupVSCodeCommand);

    // Register the Roadmap command
    const roadmapCommand = vscode.commands.registerCommand(
        'forge.roadmap',
        async () => {
            await RoadmapPanel.render(context.extensionUri, outputChannel, context);
        }
    );
    context.subscriptions.push(roadmapCommand);
}

export function deactivate() {}

export function getOutputChannel(): vscode.OutputChannel {
    return outputChannel;
}
