import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FORGE_DESIGN_INSTRUCTIONS } from './personas/forge-design';
import { FORGE_BUILD_INSTRUCTIONS } from './personas/forge-build';

/**
 * Chat participants for Forge that enable direct interaction with Forge
 * through the VSCode Chat interface
 */
export class ForgeChatParticipant {
    /**
     * Register all Forge personas as chat participants
     */
    static registerAll(context: vscode.ExtensionContext): void {
        // Main @forge participant (helper/guide)
        const forgeParticipant = vscode.chat.createChatParticipant(
            'forge.participant',
            this.handleForgeRequest
        );
        forgeParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'forge-icon.svg');
        context.subscriptions.push(forgeParticipant);

        // @forge-design participant (design sessions)
        const designParticipant = vscode.chat.createChatParticipant(
            'forge-design.participant',
            this.handleDesignRequest
        );
        designParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'forge-icon.svg');
        context.subscriptions.push(designParticipant);

        // @forge-build participant (implement stories)
        const buildParticipant = vscode.chat.createChatParticipant(
            'forge-build.participant',
            this.handleBuildRequest
        );
        buildParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'forge-icon.svg');
        context.subscriptions.push(buildParticipant);
    }

    /**
     * Legacy method for backward compatibility
     */
    static register(context: vscode.ExtensionContext): vscode.ChatParticipant {
        this.registerAll(context);
        // Return the main participant for backward compatibility
        return vscode.chat.createChatParticipant('forge.participant', this.handleForgeRequest);
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
     * Handle @forge requests (main helper)
     */
    private static async handleForgeRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        const prompt = request.prompt.toLowerCase();

        if (prompt.includes('hello') || prompt.includes('hi') || prompt.includes('help') || !prompt) {
            stream.markdown(
                '# 🔨 Forge - Session-Driven Context Engineering\n\n' +
                'I help you build Forge documentation and implement stories.\n\n' +
                '## Available Personas\n\n' +
                '### @forge-design 📐\n' +
                'Use when **designing** features, diagrams, specs, or actors during a design session.\n' +
                '- Creates/modifies AI documentation in `ai/` folder\n' +
                '- Tracks changes in active session\n' +
                '- Provides complete schema guidance\n\n' +
                '### @forge-build 🛠️\n' +
                'Use when **implementing** stories from `ai/tickets/`.\n' +
                '- Reads story files and linked documentation\n' +
                '- Implements code changes\n' +
                '- Writes tests\n' +
                '- Marks stories as completed\n\n' +
                '## Quick Start\n\n' +
                '**For Cursor Users**: Use custom commands like `/forge-design` or `/forge-build`\n\n' +
                '**For VSCode Users**: Use chat personas `@forge-design` or `@forge-build`\n\n' +
                '## Examples\n' +
                '- `@forge-design` "Create a user-login feature with Gherkin scenarios"\n' +
                '- `@forge-build` "Implement the authentication-api.story.md"\n\n' +
                '**Need more help?** Check the Forge documentation or ask me specific questions!'
            );
            return;
        }

        stream.markdown(
            'I\'m the main Forge helper. Use the specialized personas for specific tasks:\n\n' +
            '- **@forge-design** - Design features, diagrams, specs\n' +
            '- **@forge-build** - Implement stories and write code\n\n' +
            'Try `@forge help` to see more information.'
        );
    }

    /**
     * Handle @forge-design requests (design sessions)
     */
    private static async handleDesignRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        // Provide the design instructions upfront
        stream.markdown(
            '# 📐 Forge Design Session\n\n' +
            'I\'ll help you design Forge documentation. Here are my instructions:\n\n'
        );
        
        stream.markdown(FORGE_DESIGN_INSTRUCTIONS);
        
        stream.markdown('\n\n---\n\n**Now, what would you like me to help you design?**');
    }

    /**
     * Handle @forge-build requests (implement stories)
     */
    private static async handleBuildRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        // Provide the build instructions upfront
        stream.markdown(
            '# 🛠️ Forge Build Story\n\n' +
            'I\'ll help you implement a Forge story. Here are my instructions:\n\n'
        );
        
        stream.markdown(FORGE_BUILD_INSTRUCTIONS);
        
        stream.markdown('\n\n---\n\n**Please provide the story file you\'d like me to implement.**');
    }
}
