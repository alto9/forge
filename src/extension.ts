import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Octokit } from '@octokit/rest';
import { DistillSessionCommand } from './commands/DistillSessionCommand';
import { BuildStoryCommand } from './commands/BuildStoryCommand';
import { WelcomePanel } from './panels/WelcomePanel';
import { DiagramViewerPanel } from './panels/DiagramViewerPanel';
import { FeatureViewerPanel } from './panels/FeatureViewerPanel';
import { SessionViewerPanel } from './panels/SessionViewerPanel';
import { ProjectPicker } from './utils/ProjectPicker';
import { checkProjectReadiness } from './utils/projectReadiness';
import { ForgeStudioTreeProvider, ForgeTreeItem } from './providers/ForgeStudioTreeProvider';
import { ForgeChatParticipant } from './chatParticipant';
import { GitUtils } from './utils/GitUtils';
import {
    generateDiagramTemplate,
    generateSpecTemplate,
    generateActorTemplate,
    generateSessionTemplate
} from './utils/FileTemplates';

let outputChannel: vscode.OutputChannel;
let treeProvider: ForgeStudioTreeProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Forge extension is now active');

    // Create output channel for displaying prompts
    outputChannel = vscode.window.createOutputChannel('Forge');
    context.subscriptions.push(outputChannel);

    // Register Forge Chat Participants for VSCode Chat
    ForgeChatParticipant.registerAll(context);

    // Register TreeView provider
    treeProvider = new ForgeStudioTreeProvider(context);
    const treeView = vscode.window.createTreeView('forgeStudioExplorer', {
        treeDataProvider: treeProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(treeView);

    // Track if we've done the initial readiness check
    let hasCheckedReadiness = false;

    // Check project readiness when TreeView becomes visible for the first time
    treeView.onDidChangeVisibility(async (e) => {
        if (e.visible && !hasCheckedReadiness && treeProvider) {
            hasCheckedReadiness = true;
            
            // Get the current project URI
            const projectUri = treeProvider.getProjectUri();
            if (!projectUri) {
                // No project set, nothing to check
                return;
            }

            // Check if project is Forge-ready
            const isReady = await checkProjectReadiness(projectUri);
            
            if (!isReady) {
                // Project is not ready, show Welcome screen
                WelcomePanel.render(context.extensionUri, projectUri, outputChannel);
            }
        }
    });

    // Initialize with workspace folder if available
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        treeProvider.setProjectUri(vscode.workspace.workspaceFolders[0].uri);
    }

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

    // Register Forge Studio command - now focuses TreeView instead of opening webview
    const openStudioCommand = vscode.commands.registerCommand('forge.openStudio', async () => {
        // If no workspace folder, prompt for project
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            const project = await ProjectPicker.pickProject();
            if (!project) {
                return;
            }
            
            // Check if project is Forge-ready
            const isReady = await checkProjectReadiness(project);
            
            if (!isReady) {
                // Project is not ready, show Welcome screen
                WelcomePanel.render(context.extensionUri, project, outputChannel);
                return;
            }

            // Set project on tree provider
            if (treeProvider) {
                treeProvider.setProjectUri(project);
            }
        } else if (treeProvider) {
            // Ensure project URI is set (in case it wasn't initialized)
            const currentProject = vscode.workspace.workspaceFolders[0].uri;
            treeProvider.setProjectUri(currentProject);
        }

        // Try to focus the TreeView
        try {
            console.log('Attempting to focus forgeStudioExplorer');
            await vscode.commands.executeCommand('forgeStudioExplorer.focus');
            console.log('forgeStudioExplorer.focus command executed');
        } catch (error) {
            console.error('Error focusing TreeView:', error);
            vscode.window.showErrorMessage(`Failed to focus Forge Studio TreeView: ${error}`);
        }
    });
    context.subscriptions.push(openStudioCommand);

    // Register TreeView command handlers
    const openDashboardCommand = vscode.commands.registerCommand('forgeStudio.openDashboard', () => {
        vscode.window.showInformationMessage('Dashboard - Coming soon! Forge Studio navigation is now in the sidebar.');
    });
    context.subscriptions.push(openDashboardCommand);

    const openFileCommand = vscode.commands.registerCommand('forgeStudio.openFile', async (filePath: string) => {
        if (filePath) {
            try {
                const fileUri = vscode.Uri.file(filePath);
                
                // Check if this is a diagram file - open in custom diagram viewer
                if (filePath.endsWith('.diagram.md')) {
                    DiagramViewerPanel.render(context.extensionUri, fileUri);
                } 
                // Check if this is a feature file - open in custom feature viewer
                else if (filePath.endsWith('.feature.md')) {
                    FeatureViewerPanel.render(context.extensionUri, fileUri);
                } 
                // Check if this is a session file - open in custom session viewer
                else if (filePath.endsWith('.session.md')) {
                    SessionViewerPanel.render(context.extensionUri, fileUri);
                }
                else {
                    // Open normally for other files
                    const document = await vscode.workspace.openTextDocument(fileUri);
                    await vscode.window.showTextDocument(document);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open file: ${error}`);
            }
        }
    });
    context.subscriptions.push(openFileCommand);

    const refreshCommand = vscode.commands.registerCommand('forgeStudio.refresh', () => {
        if (treeProvider) {
            treeProvider.refresh();
        }
    });
    context.subscriptions.push(refreshCommand);

    // Register new folder command
    const newFolderCommand = vscode.commands.registerCommand('forgeStudio.newFolder', async (item: ForgeTreeItem) => {
        try {
            const folderName = await vscode.window.showInputBox({
                prompt: 'Enter folder name',
                placeHolder: 'my-folder',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Folder name cannot be empty';
                    }
                    if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
                        return 'Folder name can only contain letters, numbers, hyphens, and underscores';
                    }
                    return undefined;
                }
            });

            if (!folderName) {
                return;
            }

            // Determine parent path
            let parentPath: string;
            if (item.itemType === 'category' && item.category) {
                parentPath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, 'ai', item.category);
            } else if (item.itemType === 'folder' && item.filePath) {
                parentPath = item.filePath;
            } else {
                vscode.window.showErrorMessage('Cannot determine parent folder');
                return;
            }

            const newFolderPath = path.join(parentPath, folderName);

            // Check if folder already exists
            if (fs.existsSync(newFolderPath)) {
                vscode.window.showErrorMessage('Folder already exists');
                return;
            }

            // Create folder
            fs.mkdirSync(newFolderPath, { recursive: true });

            // Refresh tree
            if (treeProvider) {
                treeProvider.refresh();
            }

            vscode.window.showInformationMessage(`Created folder: ${folderName}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create folder: ${error}`);
        }
    });
    context.subscriptions.push(newFolderCommand);

    // Register new diagram command
    const newDiagramCommand = vscode.commands.registerCommand('forgeStudio.newDiagram', async (item: ForgeTreeItem) => {
        try {
            const fileName = await vscode.window.showInputBox({
                prompt: 'Enter diagram name',
                placeHolder: 'my-diagram',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Diagram name cannot be empty';
                    }
                    return undefined;
                }
            });

            if (!fileName) {
                return;
            }

            await createFile(context, item, fileName, 'diagram', generateDiagramTemplate(fileName));
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create diagram: ${error}`);
        }
    });
    context.subscriptions.push(newDiagramCommand);

    // Register new spec command
    const newSpecCommand = vscode.commands.registerCommand('forgeStudio.newSpec', async (item: ForgeTreeItem) => {
        try {
            const fileName = await vscode.window.showInputBox({
                prompt: 'Enter specification name',
                placeHolder: 'my-specification',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Specification name cannot be empty';
                    }
                    return undefined;
                }
            });

            if (!fileName) {
                return;
            }

            await createFile(context, item, fileName, 'spec', generateSpecTemplate(fileName));
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create specification: ${error}`);
        }
    });
    context.subscriptions.push(newSpecCommand);

    // Register new actor command
    const newActorCommand = vscode.commands.registerCommand('forgeStudio.newActor', async (item: ForgeTreeItem) => {
        try {
            const fileName = await vscode.window.showInputBox({
                prompt: 'Enter actor name',
                placeHolder: 'my-actor',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Actor name cannot be empty';
                    }
                    return undefined;
                }
            });

            if (!fileName) {
                return;
            }

            const actorType = await vscode.window.showQuickPick(
                ['human', 'system', 'external'],
                { placeHolder: 'Select actor type' }
            );

            if (!actorType) {
                return;
            }

            await createFile(context, item, fileName, 'actor', generateActorTemplate(fileName, actorType as 'human' | 'system' | 'external'));
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create actor: ${error}`);
        }
    });
    context.subscriptions.push(newActorCommand);

    // Register new session command
    const newSessionCommand = vscode.commands.registerCommand('forgeStudio.newSession', async (item: ForgeTreeItem) => {
        try {
            const sessionName = await vscode.window.showInputBox({
                prompt: 'Enter session name',
                placeHolder: 'my-session',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Session name cannot be empty';
                    }
                    return undefined;
                }
            });

            if (!sessionName) {
                return;
            }

            const githubIssueUrl = await vscode.window.showInputBox({
                prompt: 'Enter GitHub issue URL (optional)',
                placeHolder: 'https://github.com/owner/repo/issues/123',
                validateInput: (value) => {
                    if (value && value.trim().length > 0) {
                        // Accept full URLs or owner/repo#number format
                        const urlPattern = /github\.com\/[\w-]+\/[\w-]+\/issues\/\d+/;
                        const shortPattern = /^[\w-]+\/[\w-]+#\d+$/;
                        if (!urlPattern.test(value.trim()) && !shortPattern.test(value.trim())) {
                            return 'Invalid format. Use full URL or owner/repo#123';
                        }
                    }
                    return undefined;
                }
            });

            let issueData: any = null;
            let issueRef: string | undefined;

            if (githubIssueUrl && githubIssueUrl.trim().length > 0) {
                // Fetch issue data from GitHub
                try {
                    await vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: 'Fetching GitHub issue...',
                        cancellable: false
                    }, async () => {
                        issueData = await fetchGitHubIssue(githubIssueUrl.trim());
                        // Format as owner/repo#number
                        issueRef = issueData.issueRef;
                    });
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Failed to fetch GitHub issue: ${error.message}`);
                    return;
                }
            }

            await createFile(
                context,
                item,
                sessionName,
                'session',
                generateSessionTemplate(
                    sessionName,
                    issueData?.body || '',
                    issueRef,
                    issueData?.title || ''
                )
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create session: ${error}`);
        }
    });
    context.subscriptions.push(newSessionCommand);

    // Cleanup on deactivate
    context.subscriptions.push({
        dispose: () => {
            if (treeProvider) {
                treeProvider.dispose();
            }
        }
    });
}

/**
 * Helper function to fetch GitHub issue data
 */
async function fetchGitHubIssue(issueIdentifier: string): Promise<{ title: string; body: string; issueRef: string; number: number; owner: string; repo: string }> {
    // Parse the issue identifier
    let owner: string;
    let repo: string;
    let issueNumber: number;

    // Try to parse as URL first
    const urlMatch = issueIdentifier.match(/github\.com\/([\w-]+)\/([\w-]+)\/issues\/(\d+)/);
    if (urlMatch) {
        owner = urlMatch[1];
        repo = urlMatch[2];
        issueNumber = parseInt(urlMatch[3], 10);
    } else {
        // Try to parse as owner/repo#number
        const shortMatch = issueIdentifier.match(/^([\w-]+)\/([\w-]+)#(\d+)$/);
        if (shortMatch) {
            owner = shortMatch[1];
            repo = shortMatch[2];
            issueNumber = parseInt(shortMatch[3], 10);
        } else {
            throw new Error('Invalid GitHub issue format');
        }
    }

    // Get GitHub authentication
    let auth: string | undefined;
    try {
        const session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: true });
        if (session) {
            auth = session.accessToken;
        }
    } catch (error) {
        throw new Error('GitHub authentication required. Please sign in to GitHub in VSCode (Cmd/Ctrl+Shift+P → "GitHub: Sign In")');
    }

    if (!auth) {
        throw new Error('GitHub authentication required. Please sign in to GitHub in VSCode (Cmd/Ctrl+Shift+P → "GitHub: Sign In")');
    }

    // Fetch issue from GitHub API
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
        title: data.title,
        body: data.body || '',
        issueRef: `${owner}/${repo}#${issueNumber}`,
        number: issueNumber,
        owner,
        repo
    };
}

/**
 * Helper function to create a new file with template content
 */
async function createFile(context: vscode.ExtensionContext, item: ForgeTreeItem, fileName: string, fileType: 'diagram' | 'spec' | 'actor' | 'session', content: string) {
    // Determine parent path
    let parentPath: string;
    if (item.itemType === 'category' && item.category) {
        parentPath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, 'ai', item.category);
    } else if (item.itemType === 'folder' && item.filePath) {
        parentPath = item.filePath;
    } else {
        vscode.window.showErrorMessage('Cannot determine parent folder');
        return;
    }

    // Determine file extension
    const extension = fileType === 'diagram' ? '.diagram.md' :
                     fileType === 'spec' ? '.spec.md' :
                     fileType === 'actor' ? '.actor.md' :
                     '.session.md';

    const filePath = path.join(parentPath, fileName + extension);

    // Check if file already exists
    if (fs.existsSync(filePath)) {
        vscode.window.showErrorMessage('File already exists');
        return;
    }

    // Create file
    fs.writeFileSync(filePath, content, 'utf-8');

    // Refresh tree
    if (treeProvider) {
        treeProvider.refresh();
    }

    // Open file in appropriate viewer
    const fileUri = vscode.Uri.file(filePath);
    
    if (fileType === 'session') {
        // Open session in custom viewer
        SessionViewerPanel.render(context.extensionUri, fileUri);
    } else if (fileType === 'diagram') {
        // Open diagram in custom viewer
        DiagramViewerPanel.render(context.extensionUri, fileUri);
    } else if (fileType === 'spec' || fileType === 'actor') {
        // Open in text editor
        const document = await vscode.workspace.openTextDocument(fileUri);
        await vscode.window.showTextDocument(document);
    }

    vscode.window.showInformationMessage(`Created ${fileType}: ${fileName}${extension}`);
}

export function deactivate() {}

export function getOutputChannel(): vscode.OutputChannel {
    return outputChannel;
}

