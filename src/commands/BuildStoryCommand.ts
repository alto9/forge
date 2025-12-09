import * as vscode from 'vscode';
import * as path from 'path';
import { PromptGenerator } from '../utils/PromptGenerator';

export class BuildStoryCommand {
    static async execute(uri?: vscode.Uri, outputChannel?: vscode.OutputChannel) {
        let storyUri = uri;

        // If not called from context menu, show quick pick
        if (!storyUri) {
            storyUri = await this.selectStoryFile();
            if (!storyUri) {
                return; // User cancelled
            }
        }

        // Validate it's a story file
        if (!storyUri.fsPath.endsWith('.story.md')) {
            vscode.window.showErrorMessage('Please select a valid story file (.story.md)');
            return;
        }

        try {
            const prompt = await PromptGenerator.generateBuildStoryPrompt(storyUri);

            if (outputChannel) {
                outputChannel.clear();
                outputChannel.appendLine('='.repeat(80));
                outputChannel.appendLine('GLAM: Build Story Implementation');
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
                'Build story prompt generated! Check the Forge output panel.'
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating prompt: ${error}`);
        }
    }

    private static async selectStoryFile(): Promise<vscode.Uri | undefined> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return undefined;
        }

        const ticketsFolder = path.join(workspaceFolders[0].uri.fsPath, 'ai', 'tickets');
        
        try {
            const files = await this.findStoryFilesRecursive(ticketsFolder);

            if (files.length === 0) {
                vscode.window.showWarningMessage('No story files found in ai/tickets/');
                return undefined;
            }

            // Create quick pick items with relative paths
            const items = files.map(filePath => {
                const relativePath = path.relative(ticketsFolder, filePath);
                return {
                    label: path.basename(filePath),
                    description: path.dirname(relativePath),
                    path: filePath
                };
            });

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a story to build'
            });

            if (selected) {
                return vscode.Uri.file(selected.path);
            }
        } catch (error) {
            vscode.window.showErrorMessage('Could not find ai/tickets folder');
        }

        return undefined;
    }

    /**
     * Recursively find all story files in a folder
     */
    private static async findStoryFilesRecursive(folderPath: string): Promise<string[]> {
        const files: string[] = [];
        
        try {
            const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(folderPath));
            
            for (const [name, type] of entries) {
                const fullPath = path.join(folderPath, name);
                
                if (type === vscode.FileType.Directory) {
                    // Recursively search subdirectories
                    const subFiles = await this.findStoryFilesRecursive(fullPath);
                    files.push(...subFiles);
                } else if (type === vscode.FileType.File && name.endsWith('.story.md')) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Folder doesn't exist or can't be read
        }
        
        return files;
    }
}

