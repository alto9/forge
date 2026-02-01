import * as vscode from 'vscode';
import { getManagedCommandPaths } from '../templates/cursorCommands';
import { validateCommandFileHash, generateCommandFile } from '../utils/commandValidation';

/**
 * Command to initialize Cursor command files in the active workspace
 */
export class InitializeCursorCommandsCommand {
    static async execute(outputChannel?: vscode.OutputChannel) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open. Please open a workspace folder first.');
            return;
        }

        // For multi-root workspaces, let user choose which project
        let projectUri: vscode.Uri;
        if (workspaceFolders.length > 1) {
            const selected = await vscode.window.showWorkspaceFolderPick({
                placeHolder: 'Select the project where you want to initialize Cursor commands'
            });
            if (!selected) {
                return;
            }
            projectUri = selected.uri;
        } else {
            projectUri = workspaceFolders[0].uri;
        }

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Initializing Cursor Commands',
                cancellable: false
            },
            async (progress) => {
                let created = 0;
                let updated = 0;
                let failed = 0;

                const commandPaths = getManagedCommandPaths();
                const total = commandPaths.length;

                for (let i = 0; i < commandPaths.length; i++) {
                    const commandPath = commandPaths[i];
                    progress.report({
                        increment: (100 / total),
                        message: `Creating ${commandPath}...`
                    });

                    try {
                        const commandUri = vscode.Uri.joinPath(projectUri, commandPath);
                        
                        // Check if file needs creation/updating
                        let needsUpdate = false;
                        let fileExists = false;
                        try {
                            const fileContent = await vscode.workspace.fs.readFile(commandUri);
                            const contentString = Buffer.from(fileContent).toString('utf8');
                            const isValid = validateCommandFileHash(contentString, commandPath);
                            fileExists = true;
                            needsUpdate = !isValid;
                        } catch {
                            // File doesn't exist
                            needsUpdate = true;
                        }
                        
                        if (needsUpdate) {
                            // Ensure .cursor/commands directory exists
                            const commandDir = vscode.Uri.joinPath(projectUri, '.cursor/commands');
                            try {
                                await vscode.workspace.fs.createDirectory(commandDir);
                            } catch {
                                // Directory might already exist, ignore
                            }
                            
                            // Generate file with hash
                            const content = generateCommandFile(commandPath);
                            const contentBuffer = Buffer.from(content, 'utf8');
                            
                            // Write file
                            await vscode.workspace.fs.writeFile(commandUri, contentBuffer);
                            
                            if (fileExists) {
                                updated++;
                            } else {
                                created++;
                            }
                        }
                    } catch (error: any) {
                        failed++;
                        const errorMessage = `Failed to create ${commandPath}: ${error.message || error}`;
                        outputChannel?.appendLine(errorMessage);
                        vscode.window.showErrorMessage(errorMessage);
                    }
                }

                // Show completion message
                const messages: string[] = [];
                if (created > 0) {
                    messages.push(`${created} created`);
                }
                if (updated > 0) {
                    messages.push(`${updated} updated`);
                }
                if (failed > 0) {
                    messages.push(`${failed} failed`);
                }

                if (failed === 0) {
                    vscode.window.showInformationMessage(
                        `Cursor commands initialized: ${messages.join(', ')}`
                    );
                } else {
                    vscode.window.showWarningMessage(
                        `Cursor commands initialized with errors: ${messages.join(', ')}`
                    );
                }
            }
        );
    }
}
