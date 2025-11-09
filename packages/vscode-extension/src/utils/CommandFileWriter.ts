import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Utility class for writing Cursor command files to .cursor/commands/ directory
 * Command files are markdown files that can be executed by Cursor's agent
 * Reference: https://cursor.com/docs/agent/chat/commands
 */
export class CommandFileWriter {
    /**
     * Writes a Cursor command file for a session's distillation prompt
     * 
     * @param workspacePath - Root path of the workspace
     * @param sessionId - ID of the session being distilled
     * @param prompt - The prompt content to write to the command file
     * @returns Relative path to the created command file
     */
    static async writeCommandFile(
        workspacePath: string,
        sessionId: string,
        prompt: string
    ): Promise<string> {
        // Ensure .cursor/commands directory exists
        const commandsDir = path.join(workspacePath, '.cursor', 'commands');
        const commandsDirUri = vscode.Uri.file(commandsDir);
        
        try {
            await vscode.workspace.fs.createDirectory(commandsDirUri);
        } catch (error) {
            // Directory might already exist, which is fine
            // Only throw if it's a different error
            try {
                await vscode.workspace.fs.stat(commandsDirUri);
            } catch {
                throw new Error(`Failed to create .cursor/commands directory: ${error}`);
            }
        }

        // Generate filename
        const filename = `create-stories-${sessionId}.md`;
        const filePath = path.join(commandsDir, filename);
        const fileUri = vscode.Uri.file(filePath);

        // Write the command file as markdown
        // Cursor commands are plain markdown files that can contain instructions
        const content = this.formatCommandContent(sessionId, prompt);
        
        try {
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content, 'utf-8'));
        } catch (error) {
            throw new Error(`Failed to write command file: ${error}`);
        }

        // Return relative path from workspace root
        const relativePath = path.relative(workspacePath, filePath);
        return relativePath;
    }

    /**
     * Formats the command file content
     * Adds a header and ensures proper markdown formatting
     */
    private static formatCommandContent(sessionId: string, prompt: string): string {
        return `# Create Stories and Tasks for Session: ${sessionId}

This command will analyze the design session and create Stories (for code changes) and Tasks (for non-code work) based on the session's changed files and goals.

---

${prompt}
`;
    }

    /**
     * Checks if a command file exists for a session
     * 
     * @param workspacePath - Root path of the workspace
     * @param sessionId - ID of the session
     * @returns true if command file exists, false otherwise
     */
    static async commandFileExists(workspacePath: string, sessionId: string): Promise<boolean> {
        const filename = `create-stories-${sessionId}.md`;
        const filePath = path.join(workspacePath, '.cursor', 'commands', filename);
        const fileUri = vscode.Uri.file(filePath);

        try {
            await vscode.workspace.fs.stat(fileUri);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Gets the relative path to a command file for a session
     * 
     * @param sessionId - ID of the session
     * @returns Relative path to the command file
     */
    static getCommandFilePath(sessionId: string): string {
        return path.join('.cursor', 'commands', `create-stories-${sessionId}.md`);
    }
}


