import * as vscode from 'vscode';
import * as path from 'path';
import { PromptGenerator } from '../utils/PromptGenerator';

export class DistillSessionCommand {
    static async execute(uri?: vscode.Uri, outputChannel?: vscode.OutputChannel) {
        let sessionUri = uri;

        // If not called from context menu, show quick pick
        if (!sessionUri) {
            sessionUri = await this.selectSessionFile();
            if (!sessionUri) {
                return; // User cancelled
            }
        }

        // Validate it's a session file
        if (!sessionUri.fsPath.endsWith('.session.md')) {
            vscode.window.showErrorMessage('Please select a valid session file (.session.md)');
            return;
        }

        try {
            const prompt = await PromptGenerator.generateDistillSessionPrompt(sessionUri);

            if (outputChannel) {
                outputChannel.clear();
                outputChannel.appendLine('='.repeat(80));
                outputChannel.appendLine('GLAM: Distill Session into Stories and Tasks');
                outputChannel.appendLine('='.repeat(80));
                outputChannel.appendLine('');
                outputChannel.appendLine('Copy the prompt below and paste it into your Cursor Agent window:');
                outputChannel.appendLine('');
                outputChannel.appendLine('-'.repeat(80));
                outputChannel.appendLine(prompt);
                outputChannel.appendLine('-'.repeat(80));
                outputChannel.show(true);
            }

            vscode.window.showInformationMessage(
                'Distill session prompt generated! Check the Forge output panel.'
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating prompt: ${error}`);
        }
    }

    private static async selectSessionFile(): Promise<vscode.Uri | undefined> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return undefined;
        }

        const sessionsFolder = path.join(workspaceFolders[0].uri.fsPath, 'ai', 'sessions');
        
        try {
            const files = await this.findSessionFilesRecursive(sessionsFolder);

            if (files.length === 0) {
                vscode.window.showWarningMessage('No session files found in ai/sessions/');
                return undefined;
            }

            // Create quick pick items with relative paths
            const items = files.map(filePath => {
                const relativePath = path.relative(sessionsFolder, filePath);
                return {
                    label: path.basename(filePath),
                    description: path.dirname(relativePath),
                    path: filePath
                };
            });

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a session file to distill'
            });

            if (selected) {
                return vscode.Uri.file(selected.path);
            }
        } catch (error) {
            vscode.window.showErrorMessage('Could not find ai/sessions folder');
        }

        return undefined;
    }

    /**
     * Recursively find all session files in a folder
     */
    private static async findSessionFilesRecursive(folderPath: string): Promise<string[]> {
        const files: string[] = [];
        
        try {
            const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(folderPath));
            
            for (const [name, type] of entries) {
                const fullPath = path.join(folderPath, name);
                
                if (type === vscode.FileType.Directory) {
                    // Recursively search subdirectories
                    const subFiles = await this.findSessionFilesRecursive(fullPath);
                    files.push(...subFiles);
                } else if (type === vscode.FileType.File && name.endsWith('.session.md')) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Folder doesn't exist or can't be read
        }
        
        return files;
    }
}

