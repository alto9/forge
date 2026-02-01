import * as vscode from 'vscode';
import { GitHubService } from '../services/GitHubService';
import { RefinementPanel } from '../panels/RefinementPanel';

export class RefineIssueCommand {
    static async execute(outputChannel?: vscode.OutputChannel) {
        try {
            // Get workspace folder
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            // Get GitHub repo info
            const repoInfo = await GitHubService.getRepoInfo(workspaceFolder.uri.fsPath);
            if (!repoInfo) {
                vscode.window.showErrorMessage('Could not detect GitHub repository. Please ensure you have a GitHub remote configured.');
                return;
            }

            // Prompt for GitHub issue link
            const issueIdentifier = await vscode.window.showInputBox({
                prompt: 'Enter GitHub issue URL or number',
                placeHolder: 'https://github.com/owner/repo/issues/123 or 123',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Issue identifier cannot be empty';
                    }
                    return undefined;
                }
            });

            if (!issueIdentifier) {
                return; // User cancelled
            }

            // Parse issue identifier
            let owner: string;
            let repo: string;
            let issueNumber: number;

            try {
                const parsed = GitHubService.parseIssueIdentifier(issueIdentifier.trim(), repoInfo);
                owner = parsed.owner;
                repo = parsed.repo;
                issueNumber = parsed.issueNumber;
            } catch (error: any) {
                vscode.window.showErrorMessage(`Invalid issue format: ${error.message}`);
                return;
            }

            // Fetch issue with progress indicator
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Fetching GitHub issue...',
                cancellable: false
            }, async () => {
                try {
                    const issue = await GitHubService.getIssue(owner, repo, issueNumber);
                    
                    // Open Refinement mode webview
                    const extensionUri = vscode.extensions.getExtension('alto9.forge-studio')?.extensionUri;
                    if (!extensionUri) {
                        vscode.window.showErrorMessage('Could not get extension URI');
                        return;
                    }

                    RefinementPanel.render(extensionUri, {
                        owner,
                        repo,
                        issueNumber,
                        issue
                    });
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Failed to fetch issue: ${error.message}`);
                }
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    }
}
