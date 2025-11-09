import * as vscode from 'vscode';

interface FolderQuickPickItem extends vscode.QuickPickItem {
    uri: vscode.Uri;
}

export class ProjectPicker {
    /**
     * Pick a project from workspace folders.
     * Shows all folders with readiness indicator.
     * In single-workspace mode, returns automatically.
     * In multi-root mode, shows picker with all folders.
     */
    static async pickProject(): Promise<vscode.Uri | undefined> {
        const folders = vscode.workspace.workspaceFolders || [];
        if (folders.length === 0) {
            vscode.window.showErrorMessage('No workspace folders open.');
            return undefined;
        }

        // Single workspace: return automatically
        if (folders.length === 1) {
            return folders[0].uri;
        }

        // Multi-root workspace: show picker with ALL folders and readiness indicators
        const items = await Promise.all(
            folders.map(async (folder): Promise<FolderQuickPickItem> => {
                const isReady = await this.checkProjectReadiness(folder.uri);
                return {
                    label: folder.name,
                    description: isReady ? '$(check) Forge Ready' : '$(warning) Not Ready',
                    detail: folder.uri.fsPath,
                    uri: folder.uri
                };
            })
        );

        const pick = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a project to open in Forge Studio',
            matchOnDescription: true,
            matchOnDetail: true
        });

        return pick?.uri;
    }

    /**
     * Check if a project has the required Forge folder structure
     */
    private static async checkProjectReadiness(projectUri: vscode.Uri): Promise<boolean> {
        const requiredFolders = [
            'ai',
            'ai/actors',
            'ai/contexts',
            'ai/features',
            'ai/models',
            'ai/sessions',
            'ai/specs'
        ];

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

        // All folders exist
        return true;
    }
}



