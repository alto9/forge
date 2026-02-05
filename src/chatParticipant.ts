import * as vscode from 'vscode';
import { FORGE_REFINE_INSTRUCTIONS } from './personas/forge-refine';
import { FORGE_SCRIBE_INSTRUCTIONS } from './personas/forge-scribe';
import { FORGE_BUILD_INSTRUCTIONS } from './personas/forge-build';
import { FORGE_COMMIT_INSTRUCTIONS } from './personas/forge-commit';
import { FORGE_PUSH_INSTRUCTIONS } from './personas/forge-push';
import { FORGE_PULLREQUEST_INSTRUCTIONS } from './personas/forge-pullrequest';

/**
 * Chat participants for Forge that enable direct interaction with Forge
 * through the VSCode Chat interface
 */
export class ForgeChatParticipant {
    /**
     * Register all Forge personas as chat participants
     */
    static registerAll(context: vscode.ExtensionContext): void {
        // @forge-refine participant (refine GitHub issues)
        const refineParticipant = vscode.chat.createChatParticipant(
            'forge-refine.participant',
            this.handleRefineRequest
        );
        refineParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'forge-icon.svg');
        context.subscriptions.push(refineParticipant);

        // @forge-scribe participant (create sub-issues)
        const scribeParticipant = vscode.chat.createChatParticipant(
            'forge-scribe.participant',
            this.handleScribeRequest
        );
        scribeParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'forge-icon.svg');
        context.subscriptions.push(scribeParticipant);

        // @forge-build participant (implement GitHub issues)
        const buildParticipant = vscode.chat.createChatParticipant(
            'forge-build.participant',
            this.handleBuildRequest
        );
        buildParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'forge-icon.svg');
        context.subscriptions.push(buildParticipant);

        // @forge-commit participant (commit changes with proper validation)
        const commitParticipant = vscode.chat.createChatParticipant(
            'forge-commit.participant',
            this.handleCommitRequest
        );
        commitParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'forge-icon.svg');
        context.subscriptions.push(commitParticipant);

        // @forge-push participant (push changes safely to remote)
        const pushParticipant = vscode.chat.createChatParticipant(
            'forge-push.participant',
            this.handlePushRequest
        );
        pushParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'forge-icon.svg');
        context.subscriptions.push(pushParticipant);

        // @forge-pullrequest participant (create pull request with conventional commit validation)
        const pullrequestParticipant = vscode.chat.createChatParticipant(
            'forge-pullrequest.participant',
            this.handlePullRequest
        );
        pullrequestParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'forge-icon.svg');
        context.subscriptions.push(pullrequestParticipant);
    }

    /**
     * Legacy method for backward compatibility
     */
    static register(context: vscode.ExtensionContext): void {
        this.registerAll(context);
    }

    /**
     * Get the project URI for the active context.
     * Prefers the folder containing the currently open file,
     * falls back to the first workspace folder.
     */
    private static getProjectUri(): vscode.Uri | undefined {
        // Prefer: folder containing currently open file
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            const folder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
            if (folder) {
                return folder.uri;
            }
        }

        // Fallback: first workspace folder
        return vscode.workspace.workspaceFolders?.[0]?.uri;
    }

    /**
     * Handle @forge-refine requests (refine GitHub issues)
     */
    private static async handleRefineRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        // Provide the refine instructions upfront
        stream.markdown(
            '# 📝 Forge Refine\n\n' +
            'I\'ll help you refine GitHub issues. Here are my instructions:\n\n'
        );
        
        stream.markdown(FORGE_REFINE_INSTRUCTIONS);
        
        stream.markdown('\n\n---\n\n**Please provide the GitHub issue link you\'d like me to help refine.**');
    }

    /**
     * Handle @forge-scribe requests (create sub-issues)
     */
    private static async handleScribeRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        // Provide the scribe instructions upfront
        stream.markdown(
            '# 📋 Forge Scribe\n\n' +
            'I\'ll help you create sub-issues from a refined parent issue. Here are my instructions:\n\n'
        );
        
        stream.markdown(FORGE_SCRIBE_INSTRUCTIONS);
        
        stream.markdown('\n\n---\n\n**Please provide the GitHub issue link for the parent issue you\'d like me to create sub-issues for.**');
    }

    /**
     * Handle @forge-build requests (implement GitHub issues)
     */
    private static async handleBuildRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        // Provide the build instructions upfront
        stream.markdown(
            '# 🛠️ Forge Build\n\n' +
            'I\'ll help you implement a GitHub issue. Here are my instructions:\n\n'
        );
        
        stream.markdown(FORGE_BUILD_INSTRUCTIONS);
        
        stream.markdown('\n\n---\n\n**Please provide the GitHub issue link you\'d like me to implement.**');
    }

    /**
     * Handle @forge-commit requests (commit changes with validation)
     */
    private static async handleCommitRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        // Provide the commit instructions upfront
        stream.markdown(
            '# 📝 Forge Commit\n\n' +
            'I\'ll help you commit your changes with proper validation and conventional commit messages. Here are my instructions:\n\n'
        );
        
        stream.markdown(FORGE_COMMIT_INSTRUCTIONS);
        
        stream.markdown('\n\n---\n\n**I\'m ready to help you commit your changes. What would you like to commit?**');
    }

    /**
     * Handle @forge-push requests (push changes safely)
     */
    private static async handlePushRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        // Provide the push instructions upfront
        stream.markdown(
            '# 🚀 Forge Push\n\n' +
            'I\'ll help you safely push your changes to the remote repository. Here are my instructions:\n\n'
        );
        
        stream.markdown(FORGE_PUSH_INSTRUCTIONS);
        
        stream.markdown('\n\n---\n\n**I\'m ready to help you push your changes. Should I proceed with checking the current branch and remote status?**');
    }

    /**
     * Handle @forge-pullrequest requests (create pull request with conventional commit validation)
     */
    private static async handlePullRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        // Provide the pull request instructions upfront
        stream.markdown(
            '# 🔀 Forge Pull Request\n\n' +
            'I\'ll help you create a pull request with conventional commit validation. Here are my instructions:\n\n'
        );
        
        stream.markdown(FORGE_PULLREQUEST_INSTRUCTIONS);
        
        stream.markdown('\n\n---\n\n**I\'m ready to help you create a pull request. Should I proceed with validating your commits and creating the PR?**');
    }
}
