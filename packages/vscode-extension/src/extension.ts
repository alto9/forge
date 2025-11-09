import * as vscode from 'vscode';
import { DistillSessionCommand } from './commands/DistillSessionCommand';
import { BuildStoryCommand } from './commands/BuildStoryCommand';
import { ForgeStudioPanel } from './panels/ForgeStudioPanel';
import { WelcomePanel } from './panels/WelcomePanel';
import { ProjectPicker } from './utils/ProjectPicker';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    console.log('Forge extension is now active');

    // Create output channel for displaying prompts
    outputChannel = vscode.window.createOutputChannel('Forge');
    context.subscriptions.push(outputChannel);

    // Register the Distill Session command
    const distillSessionCommand = vscode.commands.registerCommand(
        'forge.distillSession',
        async (uri?: vscode.Uri) => {
            await DistillSessionCommand.execute(uri, outputChannel);
        }
    );

    // Register the Build Story command
    const buildStoryCommand = vscode.commands.registerCommand(
        'forge.buildStory',
        async (uri?: vscode.Uri) => {
            await BuildStoryCommand.execute(uri, outputChannel);
        }
    );

    context.subscriptions.push(distillSessionCommand);
    context.subscriptions.push(buildStoryCommand);

    // Register Forge Studio command
    const openStudioCommand = vscode.commands.registerCommand('forge.openStudio', async () => {
        const project = await ProjectPicker.pickProject();
        if (!project) {
            return;
        }
        
        // Check if project is Forge-ready
        const isReady = await checkProjectReadiness(project);
        
        if (isReady) {
            // Project is ready, open Studio directly
            ForgeStudioPanel.render(context.extensionUri, project, outputChannel);
        } else {
            // Project is not ready, show Welcome screen
            WelcomePanel.render(context.extensionUri, project, outputChannel);
        }
    });
    context.subscriptions.push(openStudioCommand);
}

export function deactivate() {}

export function getOutputChannel(): vscode.OutputChannel {
    return outputChannel;
}

/**
 * Check if a project has the required Forge folder structure and command files
 */
async function checkProjectReadiness(projectUri: vscode.Uri): Promise<boolean> {
    const requiredFolders = [
        'ai',
        'ai/actors',
        'ai/contexts',
        'ai/features',
        'ai/sessions',
        'ai/specs'
    ];
    
    // Check folders
    for (const folder of requiredFolders) {
        const folderUri = vscode.Uri.joinPath(projectUri, folder);
        try {
            await vscode.workspace.fs.stat(folderUri);
            // Folder exists, continue checking
        } catch {
            // Folder does not exist
            return false;
        }
    }
    
    // Check command files
    const { getManagedCommandPaths } = await import('./templates/cursorCommands');
    const { validateCommandFileHash } = await import('./utils/commandValidation');
    
    const commandPaths = getManagedCommandPaths();
    for (const commandPath of commandPaths) {
        const commandUri = vscode.Uri.joinPath(projectUri, commandPath);
        try {
            const fileContent = await vscode.workspace.fs.readFile(commandUri);
            const contentString = Buffer.from(fileContent).toString('utf8');
            const isValid = validateCommandFileHash(contentString, commandPath);
            if (!isValid) {
                // File exists but is invalid
                return false;
            }
        } catch {
            // File doesn't exist
            return false;
        }
    }
    
    // All folders and command files are valid
    return true;
}

