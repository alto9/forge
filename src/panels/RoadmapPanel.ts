import * as vscode from 'vscode';
import { GitHubService, GitHubRepoInfo } from '../services/GitHubService';
import { GitUtils } from '../utils/GitUtils';

export interface MilestoneData {
    number: number;
    title: string;
    description: string | null;
    state: string;
    open_issues: number;
    closed_issues: number;
    due_on: string | null;
    created_at: string;
    updated_at: string;
    issues: Array<{
        number: number;
        title: string;
        state: string;
        html_url: string;
    }>;
}

export interface SprintData {
    title: string;
    issues: Array<{
        number: number;
        title: string;
        state: string;
        html_url: string;
    }>;
}

export interface RoadmapData {
    milestones: MilestoneData[];
    sprints: SprintData[];
    unassociatedIssues: Array<{
        number: number;
        title: string;
        state: string;
        html_url: string;
    }>;
}

export class RoadmapPanel {
    public static currentPanel: RoadmapPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _output: vscode.OutputChannel;
    private readonly _context: vscode.ExtensionContext;
    private _disposables: vscode.Disposable[] = [];
    private _repoInfo: GitHubRepoInfo | null = null;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, output: vscode.OutputChannel, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._output = output;
        this._context = context;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'loadRoadmap': {
                    await this._loadRoadmap();
                    break;
                }
                case 'changeProject': {
                    await this._changeProject();
                    break;
                }
                default:
                    break;
            }
        }, null, this._disposables);

        // Load roadmap data immediately
        this._loadRoadmap();
    }

    public static async render(extensionUri: vscode.Uri, output: vscode.OutputChannel, context: vscode.ExtensionContext) {
        if (RoadmapPanel.currentPanel) {
            RoadmapPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'forgeRoadmap',
            'Forge: Roadmap',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                ],
            }
        );

        RoadmapPanel.currentPanel = new RoadmapPanel(panel, extensionUri, output, context);
    }

    public dispose() {
        RoadmapPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _changeProject(): Promise<void> {
        if (!this._repoInfo) {
            vscode.window.showErrorMessage('Repository information not available');
            return;
        }

        // Show loading state
        this._panel.webview.postMessage({
            type: 'loading',
            message: 'Loading projects...'
        });

        try {
            // Fetch available projects
            const projects = await GitHubService.getProjects(this._repoInfo.owner, this._repoInfo.repo);

            if (projects.length === 0) {
                vscode.window.showInformationMessage('No GitHub Projects found in this repository.');
                await this._loadRoadmap(); // Reload to show current state
                return;
            }

            if (projects.length === 1) {
                // Only one project, use it automatically
                await this._context.workspaceState.update('forge.roadmap.selectedProjectId', projects[0].id);
                vscode.window.showInformationMessage(`Using project "${projects[0].title}"`);
                await this._loadRoadmap();
                return;
            }

            // Show picker to select project
            const projectItems = projects.map(project => ({
                label: project.title,
                description: `Project #${project.number} (${project.scope === 'organization' ? 'org' : project.scope === 'repository' ? 'repo' : 'user'})`,
                project: project
            }));

            const pick = await vscode.window.showQuickPick(projectItems, {
                placeHolder: 'Select a GitHub Project to load sprints from',
                matchOnDescription: true
            });

            if (pick) {
                // Save the selection
                await this._context.workspaceState.update('forge.roadmap.selectedProjectId', pick.project.id);
                vscode.window.showInformationMessage(`Switched to project "${pick.project.title}"`);
                // Reload roadmap with new project
                await this._loadRoadmap();
            } else {
                // User cancelled, just reload current state
                await this._loadRoadmap();
            }
        } catch (error: any) {
            const errorMsg = `Failed to change project: ${error.message}`;
            this._output.appendLine(errorMsg);
            vscode.window.showErrorMessage(errorMsg);
            await this._loadRoadmap(); // Reload to show current state
        }
    }

    private async _loadRoadmap(): Promise<void> {
        try {
            // Get workspace folder
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                this._panel.webview.postMessage({
                    type: 'error',
                    message: 'No workspace folder found'
                });
                return;
            }

            const workspacePath = workspaceFolders[0].uri.fsPath;

            // Get repository info
            this._repoInfo = await GitHubService.getRepoInfo(workspacePath);
            if (!this._repoInfo) {
                this._panel.webview.postMessage({
                    type: 'error',
                    message: 'Could not determine GitHub repository. Make sure the workspace is a git repository with a GitHub remote.'
                });
                return;
            }

            // Show loading state
            this._panel.webview.postMessage({
                type: 'loading',
                message: 'Loading roadmap data...'
            });

            // Fetch milestones, issues, and projects
            const [milestones, allIssues, projects] = await Promise.all([
                GitHubService.getMilestones(this._repoInfo.owner, this._repoInfo.repo, 'all'),
                GitHubService.getIssues(this._repoInfo.owner, this._repoInfo.repo, { state: 'all', per_page: 100 }),
                GitHubService.getProjects(this._repoInfo.owner, this._repoInfo.repo)
            ]);

            // Select project for iterations (sprints)
            let selectedProject: { id: string; number: number; title: string; scope: 'repository' | 'organization' | 'user' } | null = null;
            
            if (projects.length === 0) {
                this._output.appendLine('No GitHub Projects found. Sprints will not be available.');
            } else if (projects.length === 1) {
                // Only one project, use it automatically
                selectedProject = projects[0];
                this._output.appendLine(`Using project "${selectedProject.title}" for sprints`);
            } else {
                // Multiple projects - check if we have a saved preference
                const savedProjectId = this._context.workspaceState.get<string>('forge.roadmap.selectedProjectId');
                const savedProject = projects.find(p => p.id === savedProjectId);
                
                if (savedProject) {
                    selectedProject = savedProject;
                    this._output.appendLine(`Using saved project "${selectedProject.title}" for sprints`);
                } else {
            // Show picker to select project
            const projectItems = projects.map(project => ({
                label: project.title,
                description: `Project #${project.number} (${project.scope === 'organization' ? 'org' : project.scope === 'repository' ? 'repo' : 'user'})`,
                project: project
            }));

                    const pick = await vscode.window.showQuickPick(projectItems, {
                        placeHolder: 'Select a GitHub Project to load sprints from',
                        matchOnDescription: true
                    });

                    if (!pick) {
                        // User cancelled, continue without sprints
                        this._output.appendLine('No project selected. Sprints will not be available.');
                    } else {
                        selectedProject = pick.project;
                        // Save the selection for next time
                        await this._context.workspaceState.update('forge.roadmap.selectedProjectId', selectedProject.id);
                        this._output.appendLine(`Selected project "${selectedProject.title}" for sprints`);
                    }
                }
            }

            // Filter out closed milestones
            const openMilestones = milestones.filter(m => m.state === 'open');

            // Organize issues by milestone
            const milestoneMap = new Map<number, MilestoneData>();
            const unassociatedIssues: Array<{ number: number; title: string; state: string; html_url: string }> = [];

            // Initialize milestone map (only for open milestones)
            for (const milestone of openMilestones) {
                milestoneMap.set(milestone.number, {
                    ...milestone,
                    issues: []
                });
            }

            // Assign issues to milestones
            for (const issue of allIssues) {
                if (issue.milestone) {
                    const milestone = milestoneMap.get(issue.milestone.number);
                    if (milestone) {
                        milestone.issues.push({
                            number: issue.number,
                            title: issue.title,
                            state: issue.state,
                            html_url: issue.html_url
                        });
                    }
                } else {
                    unassociatedIssues.push({
                        number: issue.number,
                        title: issue.title,
                        state: issue.state,
                        html_url: issue.html_url
                    });
                }
            }

            // Sort milestones by due date (if available) or creation date
            const sortedMilestones = Array.from(milestoneMap.values()).sort((a, b) => {
                if (a.due_on && b.due_on) {
                    return new Date(a.due_on).getTime() - new Date(b.due_on).getTime();
                }
                if (a.due_on) return -1;
                if (b.due_on) return 1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            // Fetch iterations (sprints) from selected GitHub Project
            const sprints: SprintData[] = [];
            
            if (selectedProject) {
                try {
                    const iterations = await GitHubService.getIterations(selectedProject.id);
                    this._output.appendLine(`Found ${iterations.length} iterations in project "${selectedProject.title}"`);
                    
                    if (iterations.length === 0) {
                        this._output.appendLine(`No iterations found in project "${selectedProject.title}" - make sure the project has an Iteration field configured`);
                    } else {
                        for (const iteration of iterations) {
                            try {
                                // Fetch issues for this iteration, filtered to current repository
                                const iterationIssues = await GitHubService.getIssuesForIteration(
                                    selectedProject.id,
                                    iteration.id,
                                    this._repoInfo.owner,
                                    this._repoInfo.repo
                                );

                                this._output.appendLine(`Iteration "${iteration.title}": ${iterationIssues.length} issues`);

                                // Include all iterations (not just those with issues or current/upcoming)
                                // This allows viewing past sprints as well
                                sprints.push({
                                    title: iteration.title,
                                    issues: iterationIssues.map(issue => ({
                                        number: issue.number,
                                        title: issue.title,
                                        state: issue.state,
                                        html_url: issue.html_url
                                    }))
                                });
                            } catch (issueError: any) {
                                this._output.appendLine(`Error fetching issues for iteration "${iteration.title}": ${issueError.message}`);
                                // Still add the iteration even if we can't fetch issues
                                sprints.push({
                                    title: iteration.title,
                                    issues: []
                                });
                            }
                        }
                    }
                } catch (error: any) {
                    const errorMsg = `Failed to fetch iterations for project "${selectedProject.title}": ${error.message}`;
                    this._output.appendLine(errorMsg);
                    console.log(errorMsg);
                }
            }
            
            this._output.appendLine(`Total sprints found: ${sprints.length}`);

            // Sort sprints by start date if available, otherwise by title
            sprints.sort((a, b) => {
                // Try to extract dates from titles for sorting
                const dateA = extractDateFromTitle(a.title);
                const dateB = extractDateFromTitle(b.title);
                
                if (dateA && dateB) {
                    return dateA.getTime() - dateB.getTime();
                }
                if (dateA) return -1;
                if (dateB) return 1;
                return a.title.localeCompare(b.title);
            });

            const roadmapData: RoadmapData = {
                milestones: sortedMilestones,
                sprints,
                unassociatedIssues
            };

            // Send data to webview
            this._panel.webview.postMessage({
                type: 'roadmapData',
                data: roadmapData,
                repoInfo: this._repoInfo
            });

        } catch (error: any) {
            const errorMessage = error.message || 'Failed to load roadmap data';
            this._output.appendLine(`Roadmap error: ${errorMessage}`);
            this._panel.webview.postMessage({
                type: 'error',
                message: errorMessage
            });
        }
    }

    private _update() {
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'roadmap', 'main.js'));
        const nonce = getNonce();
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob: data:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline' ${webview.cspSource}; font-src ${webview.cspSource};" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Forge: Roadmap</title>
  <style>
    /* Base styles */
    html, body, #root { height: 100%; margin: 0; padding: 0; }
    body { 
      font-family: var(--vscode-font-family); 
      color: var(--vscode-editor-foreground); 
      background: var(--vscode-editor-background);
      font-size: 13px;
      line-height: 1.5;
    }
    
    /* Layout */
    .container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .header-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
    }
    
    .view-toggle {
      display: flex;
      gap: 8px;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      padding: 4px;
    }
    
    .toggle-button {
      padding: 6px 12px;
      border: none;
      background: transparent;
      color: var(--vscode-foreground);
      cursor: pointer;
      border-radius: 3px;
      font-size: 13px;
      transition: background 0.1s;
    }
    
    .toggle-button:hover {
      background: var(--vscode-list-hoverBackground);
    }
    
    .toggle-button.active {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    
    /* Loading and Error */
    .loading, .error {
      padding: 40px;
      text-align: center;
      color: var(--vscode-descriptionForeground);
    }
    
    .error {
      color: var(--vscode-errorForeground);
    }
    
    /* Milestone/Sprint List */
    .milestone-list, .sprint-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .milestone-item, .sprint-item {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 16px;
      background: var(--vscode-editor-background);
    }
    
    .milestone-header, .sprint-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    
    .milestone-title, .sprint-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }
    
    .milestone-description {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
    }
    
    .milestone-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    
    .milestone-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }
    
    .milestone-status.open {
      background: var(--vscode-testing-iconQueued);
      color: var(--vscode-editor-foreground);
    }
    
    .milestone-status.closed {
      background: var(--vscode-testing-iconPassed);
      color: var(--vscode-editor-foreground);
    }
    
    .issues-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--vscode-panel-border);
    }
    
    .issues-title {
      font-size: 13px;
      font-weight: 600;
      margin: 0 0 12px 0;
    }
    
    .issues-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .issue-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      text-decoration: none;
      color: var(--vscode-textLink-foreground);
      transition: background 0.1s;
    }
    
    .issue-item:hover {
      background: var(--vscode-list-hoverBackground);
    }
    
    .issue-number {
      font-weight: 600;
      color: var(--vscode-descriptionForeground);
    }
    
    .issue-title {
      flex: 1;
    }
    
    .issue-state {
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 500;
    }
    
    .issue-state.open {
      background: var(--vscode-testing-iconQueued);
      color: var(--vscode-editor-foreground);
    }
    
    .issue-state.closed {
      background: var(--vscode-testing-iconPassed);
      color: var(--vscode-editor-foreground);
    }
    
    .unassociated-section {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 2px solid var(--vscode-panel-border);
    }
    
    .unassociated-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 16px 0;
    }
    
    .empty-state {
      padding: 40px;
      text-align: center;
      color: var(--vscode-descriptionForeground);
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

function extractDateFromTitle(title: string): Date | null {
    // Try to extract date from common patterns like "Sprint 2024-01-15" or "2024-01-15"
    const datePatterns = [
        /(\d{4}-\d{2}-\d{2})/,  // YYYY-MM-DD
        /(\d{2}\/\d{2}\/\d{4})/, // MM/DD/YYYY
        /(\d{4}\/\d{2}\/\d{2})/  // YYYY/MM/DD
    ];

    for (const pattern of datePatterns) {
        const match = title.match(pattern);
        if (match) {
            const date = new Date(match[1]);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    }

    return null;
}
