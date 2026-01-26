import * as vscode from 'vscode';

/**
 * Chat participant for Forge that enables direct interaction with Forge
 * through the VSCode Chat interface using @forge
 */
export class ForgeChatParticipant {
    static register(context: vscode.ExtensionContext): vscode.ChatParticipant {
        const participant = vscode.chat.createChatParticipant(
            'forge.participant',
            this.handleChatRequest
        );

        participant.iconPath = vscode.Uri.joinPath(
            context.extensionUri,
            'media',
            'forge-icon.svg'
        );

        context.subscriptions.push(participant);
        return participant;
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

    private static async handleChatRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        const prompt = request.prompt.toLowerCase();
        const projectUri = this.getProjectUri();

        if (!projectUri) {
            stream.markdown('❌ No workspace folder found. Please open a Forge project.');
            return;
        }

        // Hello world: respond to basic queries
        if (prompt.includes('hello') || prompt.includes('hi')) {
            stream.markdown(
                '👋 Hello! I\'m the **Forge Agent**. I help you work with Forge files and sessions.\n\n' +
                'Try asking me:\n' +
                '- "distill the active session"\n' +
                '- "build a story"\n' +
                '- "check session status"\n' +
                '- "help"\n'
            );
            return;
        }

        if (prompt.includes('help')) {
            stream.markdown(
                '# Forge Agent Help\n\n' +
                'I can help you manage Forge sessions and stories.\n\n' +
                '## Commands\n' +
                '- **distill** - Distill the active design session into stories and tasks\n' +
                '- **build** - Build a specific story file\n' +
                '- **status** - Check the current session status\n' +
                '- **help** - Show this help message\n\n' +
                '## Example\n' +
                'Try saying: "distill the active session"'
            );
            return;
        }

        if (prompt.includes('status')) {
            stream.markdown(
                '📊 **Session Status**\n\n' +
                `Working with: \`${vscode.workspace.getWorkspaceFolder(projectUri)?.name || 'default'}\`\n\n` +
                'To properly check session status, I need access to workspace files.\n\n' +
                'For now, you can:\n' +
                '1. Open Forge Studio to see active sessions\n' +
                '2. Check `ai/sessions/` folder directly\n\n' +
                '*Full session status integration coming soon!*'
            );
            return;
        }

        // Default: unknown command
        stream.markdown(
            'I didn\'t understand that command. Try:\n' +
            '- "hello" - Introduce myself\n' +
            '- "help" - Show available commands\n' +
            '- "status" - Check session status\n'
        );
    }
}
