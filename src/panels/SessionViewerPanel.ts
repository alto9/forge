import * as vscode from 'vscode';
import * as path from 'path';
import { FileParser } from '../utils/FileParser';
import { GitUtils } from '../utils/GitUtils';
import { Octokit } from '@octokit/rest';

/**
 * Session Viewer Panel - Opens session files in a custom webview panel
 * Provides session detail view with status tracking and changed files display
 */
export class SessionViewerPanel {
    private static panels: Map<string, SessionViewerPanel> = new Map();
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _documentUri: vscode.Uri;
    private _fileWatcher: vscode.FileSystemWatcher | undefined;

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        documentUri: vscode.Uri
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._documentUri = documentUri;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Watch for file changes
        this._startFileWatcher();

        // Handle messages from webview
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'getInitialData':
                        await this._sendDocumentData();
                        break;
                    case 'save':
                        await this._saveDocument(message.frontmatter, message.content);
                        break;
                    case 'markComplete':
                        await this._markSessionComplete();
                        break;
                    case 'endSession':
                        await this._endSession();
                        break;
                    case 'getGitHubRepoInfo':
                        await this._handleGetGitHubRepoInfo();
                        break;
                    case 'getGitHubIssues':
                        await this._handleGetGitHubIssues(message.perPage);
                        break;
                    case 'getGitHubIssue':
                        await this._handleGetGitHubIssue(message.issueIdentifier);
                        break;
                    case 'pushToGitHub':
                        await this._handlePushToGitHub(message.owner, message.repo, message.issueNumber, message.title, message.body, message.labels, message.milestone, message.assignees, message.state);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public static render(extensionUri: vscode.Uri, documentUri: vscode.Uri) {
        const fileName = path.basename(documentUri.fsPath);
        const filePath = documentUri.fsPath;
        
        // If we already have a panel for this file, reveal it
        const existingPanel = SessionViewerPanel.panels.get(filePath);
        if (existingPanel) {
            existingPanel._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'forgeSessionViewer',
            `Session: ${fileName}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                ],
            }
        );

        const newPanel = new SessionViewerPanel(panel, extensionUri, documentUri);
        SessionViewerPanel.panels.set(filePath, newPanel);
    }

    public dispose() {
        // Remove this panel from the map
        SessionViewerPanel.panels.delete(this._documentUri.fsPath);

        this._panel.dispose();

        if (this._fileWatcher) {
            this._fileWatcher.dispose();
        }

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
    }

    private _startFileWatcher() {
        if (this._fileWatcher) {
            this._fileWatcher.dispose();
        }

        this._fileWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(this._documentUri, '**')
        );

        this._fileWatcher.onDidChange(() => {
            this._sendDocumentData();
        });

        this._disposables.push(this._fileWatcher);
    }

    private async _sendDocumentData() {
        try {
            const content = await FileParser.readFile(this._documentUri.fsPath);
            const parsed = FileParser.parseFrontmatter(content);

            this._panel.webview.postMessage({
                type: 'documentData',
                data: {
                    path: this._documentUri.fsPath,
                    frontmatter: parsed.frontmatter,
                    content: parsed.content
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to read session file: ${error}`);
        }
    }

    private async _saveDocument(frontmatter: any, content: string) {
        try {
            const text = FileParser.stringifyFrontmatter(frontmatter, content);
            await vscode.workspace.fs.writeFile(
                this._documentUri,
                Buffer.from(text, 'utf-8')
            );
            vscode.window.showInformationMessage('Session saved successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save session: ${error}`);
        }
    }

    private async _markSessionComplete() {
        try {
            const content = await FileParser.readFile(this._documentUri.fsPath);
            const parsed = FileParser.parseFrontmatter(content);
            
            // Update status to completed and add end time
            parsed.frontmatter.status = 'completed';
            if (!parsed.frontmatter.end_time) {
                parsed.frontmatter.end_time = new Date().toISOString();
            }
            
            const text = FileParser.stringifyFrontmatter(parsed.frontmatter, parsed.content);
            await vscode.workspace.fs.writeFile(
                this._documentUri,
                Buffer.from(text, 'utf-8')
            );
            
            vscode.window.showInformationMessage('Session marked as complete!');
            await this._sendDocumentData();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to mark session complete: ${error}`);
        }
    }

    private async _endSession() {
        try {
            const content = await FileParser.readFile(this._documentUri.fsPath);
            const parsed = FileParser.parseFrontmatter(content);
            
            // Transition from 'design' to 'scribe' status
            if (parsed.frontmatter.status === 'design') {
                parsed.frontmatter.status = 'scribe';
                parsed.frontmatter.design_end_time = new Date().toISOString();
                
                const text = FileParser.stringifyFrontmatter(parsed.frontmatter, parsed.content);
                await vscode.workspace.fs.writeFile(
                    this._documentUri,
                    Buffer.from(text, 'utf-8')
                );
                
                vscode.window.showInformationMessage('Session transitioned to scribe status!');
                await this._sendDocumentData();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to end session: ${error}`);
        }
    }

    private async _handleGetGitHubRepoInfo() {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                this._panel.webview.postMessage({ 
                    type: 'githubRepoInfo', 
                    data: null 
                });
                return;
            }

            const repoInfo = await this._getGitHubRepoInfo(workspaceFolder.uri.fsPath);
            this._panel.webview.postMessage({ 
                type: 'githubRepoInfo', 
                data: repoInfo 
            });
        } catch (error) {
            this._panel.webview.postMessage({ 
                type: 'githubRepoInfo', 
                data: null 
            });
        }
    }

    private async _handleGetGitHubIssues(perPage: number = 20) {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            const repoInfo = await this._getGitHubRepoInfo(workspaceFolder.uri.fsPath);
            if (!repoInfo) {
                throw new Error('Could not detect GitHub repository');
            }

            const issues = await this._getGitHubIssues(repoInfo.owner, repoInfo.repo, perPage);
            this._panel.webview.postMessage({
                type: 'githubIssuesResponse',
                data: { issues }
            });
        } catch (error: any) {
            this._panel.webview.postMessage({
                type: 'githubIssuesError',
                error: error.message || 'Failed to fetch GitHub issues'
            });
        }
    }

    private async _handleGetGitHubIssue(issueIdentifier: string) {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            const repoInfo = await this._getGitHubRepoInfo(workspaceFolder.uri.fsPath);
            if (!repoInfo) {
                throw new Error('Could not detect GitHub repository');
            }

            const issueNumber = this._parseGitHubIssueUrl(issueIdentifier);
            if (!issueNumber) {
                throw new Error('Invalid GitHub issue URL or number');
            }

            const issue = await this._getGitHubIssue(repoInfo.owner, repoInfo.repo, issueNumber);
            this._panel.webview.postMessage({
                type: 'githubIssueResponse',
                data: issue
            });
        } catch (error: any) {
            this._panel.webview.postMessage({
                type: 'githubIssueError',
                error: error.message || 'Failed to fetch GitHub issue'
            });
        }
    }

    private async _getGitHubRepoInfo(workspacePath: string): Promise<{ owner: string; repo: string } | null> {
        try {
            const remoteUrl = await GitUtils.executeGitCommand(workspacePath, ['remote', 'get-url', 'origin']);
            return this._parseGitHubUrl(remoteUrl.trim());
        } catch (error) {
            console.error('Failed to get GitHub repo info:', error);
            return null;
        }
    }

    private _parseGitHubUrl(url: string): { owner: string; repo: string } | null {
        // Handle HTTPS URLs: https://github.com/owner/repo.git
        const httpsMatch = url.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
        if (httpsMatch) {
            return {
                owner: httpsMatch[1],
                repo: httpsMatch[2].replace(/\.git$/, '')
            };
        }

        // Handle SSH URLs: git@github.com:owner/repo.git
        const sshMatch = url.match(/git@github\.com:([^/]+)\/(.+?)(\.git)?$/);
        if (sshMatch) {
            return {
                owner: sshMatch[1],
                repo: sshMatch[2].replace(/\.git$/, '')
            };
        }

        return null;
    }

    private _parseGitHubIssueUrl(identifier: string): number | null {
        // If it's just a number, return it
        if (/^\d+$/.test(identifier)) {
            return parseInt(identifier, 10);
        }

        // Parse full GitHub issue URL
        const match = identifier.match(/github\.com\/[^/]+\/[^/]+\/issues\/(\d+)/);
        if (match) {
            return parseInt(match[1], 10);
        }

        return null;
    }

    private async _getGitHubIssues(owner: string, repo: string, perPage: number): Promise<any[]> {
        try {
            // Try to get GitHub authentication from VSCode
            let auth: string | undefined;
            try {
                const session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: true });
                if (session) {
                    auth = session.accessToken;
                }
            } catch (error) {
                console.log('GitHub authentication failed:', error);
                throw new Error('GitHub authentication required. Please sign in to GitHub in VSCode (Cmd/Ctrl+Shift+P → "GitHub: Sign In")');
            }

            if (!auth) {
                throw new Error('GitHub authentication required. Please sign in to GitHub in VSCode (Cmd/Ctrl+Shift+P → "GitHub: Sign In")');
            }

            console.log(`Fetching issues for ${owner}/${repo}`);

            const octokit = new Octokit({
                baseUrl: 'https://api.github.com',
                auth
            });
            
            const { data } = await octokit.rest.issues.listForRepo({
                owner,
                repo,
                state: 'open',
                sort: 'updated',
                direction: 'desc',
                per_page: perPage
            });

            return data.map((issue: any) => ({
                number: issue.number,
                title: issue.title,
                body: issue.body || '',
                html_url: issue.html_url,
                state: issue.state,
                labels: issue.labels.map((label: any) => ({
                    name: typeof label === 'string' ? label : label.name,
                    color: typeof label === 'object' && label.color ? label.color : '000000'
                }))
            }));
        } catch (error: any) {
            console.error('GitHub API call failed:', error);
            throw new Error(`Failed to fetch GitHub issues: ${error.message || error}`);
        }
    }

    private async _getGitHubIssue(owner: string, repo: string, issueNumber: number): Promise<any> {
        try {
            // Try to get GitHub authentication from VSCode
            let auth: string | undefined;
            try {
                const session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: true });
                if (session) {
                    auth = session.accessToken;
                }
            } catch (error) {
                console.log('GitHub authentication failed:', error);
                throw new Error('GitHub authentication required. Please sign in to GitHub in VSCode (Cmd/Ctrl+Shift+P → "GitHub: Sign In")');
            }

            if (!auth) {
                throw new Error('GitHub authentication required. Please sign in to GitHub in VSCode (Cmd/Ctrl+Shift+P → "GitHub: Sign In")');
            }

            console.log(`Fetching issue #${issueNumber} for ${owner}/${repo}`);

            const octokit = new Octokit({
                baseUrl: 'https://api.github.com',
                auth
            });
            
            const { data } = await octokit.rest.issues.get({
                owner,
                repo,
                issue_number: issueNumber
            });

            return {
                number: data.number,
                title: data.title,
                body: data.body || '',
                html_url: data.html_url,
                state: data.state,
                labels: data.labels.map((label: any) => ({
                    name: typeof label === 'string' ? label : label.name,
                    color: typeof label === 'object' && label.color ? label.color : '000000'
                })),
                milestone: data.milestone ? { title: data.milestone.title, number: data.milestone.number } : undefined,
                assignees: data.assignees?.map((a: any) => ({ login: a.login })) || []
            };
        } catch (error: any) {
            console.error('GitHub API call failed:', error);
            throw new Error(`Failed to fetch GitHub issue #${issueNumber}: ${error.message || error}`);
        }
    }

    private async _handlePushToGitHub(
        owner: string, 
        repo: string, 
        issueNumber: number, 
        title: string, 
        body: string,
        labels?: string[],
        milestone?: string,
        assignees?: string[],
        state?: string
    ) {
        try {
            // Try to get GitHub authentication from VSCode
            let auth: string | undefined;
            try {
                const session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: false });
                if (session) {
                    auth = session.accessToken;
                }
            } catch (error) {
                // No auth available
                console.log('No GitHub authentication available');
            }

            if (!auth) {
                this._panel.webview.postMessage({
                    type: 'pushIssueError',
                    error: 'GitHub authentication required. Please sign in to GitHub in VSCode.'
                });
                return;
            }

            const octokit = new Octokit({
                baseUrl: 'https://api.github.com',
                auth
            });
            
            // Build update payload
            const updatePayload: any = {
                owner,
                repo,
                issue_number: issueNumber,
                title,
                body
            };

            // Add labels if provided
            if (labels && labels.length > 0) {
                updatePayload.labels = labels;
            }

            // Add milestone if provided (need to look up milestone number by title)
            if (milestone && milestone.trim()) {
                try {
                    const { data: milestones } = await octokit.rest.issues.listMilestones({
                        owner,
                        repo,
                        state: 'all'
                    });
                    const matchingMilestone = milestones.find((m: any) => m.title === milestone);
                    if (matchingMilestone) {
                        updatePayload.milestone = matchingMilestone.number;
                    }
                } catch (error) {
                    console.log('Failed to set milestone:', error);
                }
            }

            // Add assignees if provided
            if (assignees && assignees.length > 0) {
                updatePayload.assignees = assignees;
            }

            // Add state if provided
            if (state) {
                updatePayload.state = state;
            }
            
            await octokit.rest.issues.update(updatePayload);

            this._panel.webview.postMessage({
                type: 'pushIssueSuccess'
            });
        } catch (error: any) {
            console.error('GitHub API push failed:', error);
            this._panel.webview.postMessage({
                type: 'pushIssueError',
                error: error.message || 'Failed to push to GitHub issue'
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'session', 'main.js')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Session Viewer</title>
            <style>
                body {
                    padding: 0;
                    margin: 0;
                    color: var(--vscode-editor-foreground);
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    background: var(--vscode-editor-background);
                }
                #root {
                    width: 100%;
                    height: 100vh;
                }
            </style>
        </head>
        <body>
            <div id="root"></div>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
