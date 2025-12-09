import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitUtils {
    /**
     * Check if a directory is a git repository
     */
    static async isGitRepository(workspacePath: string): Promise<boolean> {
        try {
            await execAsync('git rev-parse --git-dir', { cwd: workspacePath });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get the current git commit SHA
     */
    static async getCurrentCommit(workspacePath: string): Promise<string | null> {
        try {
            const { stdout } = await execAsync('git rev-parse HEAD', { cwd: workspacePath });
            return stdout.trim();
        } catch {
            return null;
        }
    }

    /**
     * Get the git diff for a specific file since a specific commit
     * If no commit is provided, shows uncommitted changes
     */
    static async getDiffForFile(
        workspacePath: string, 
        filePath: string, 
        sinceCommit?: string
    ): Promise<string | null> {
        try {
            // Make the file path relative to the workspace
            const relativePath = path.relative(workspacePath, filePath);
            
            let command: string;
            if (sinceCommit) {
                // Diff from specific commit to current state (including uncommitted changes)
                command = `git diff ${sinceCommit} HEAD -- "${relativePath}"`;
                
                // Also get uncommitted changes
                const { stdout: uncommitted } = await execAsync(
                    `git diff HEAD -- "${relativePath}"`, 
                    { cwd: workspacePath }
                );
                
                const { stdout: committed } = await execAsync(command, { cwd: workspacePath });
                
                // Combine both if there are uncommitted changes
                if (uncommitted.trim()) {
                    return committed + '\n' + uncommitted;
                }
                return committed.trim() || null;
            } else {
                // Show all uncommitted changes (staged + unstaged)
                const { stdout: unstaged } = await execAsync(
                    `git diff -- "${relativePath}"`, 
                    { cwd: workspacePath }
                );
                const { stdout: staged } = await execAsync(
                    `git diff --cached -- "${relativePath}"`, 
                    { cwd: workspacePath }
                );
                
                const combined = (staged + '\n' + unstaged).trim();
                return combined || null;
            }
        } catch (error) {
            console.error(`Failed to get git diff for ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Get the full content diff for a file (useful for new files)
     */
    static async getFileStatus(
        workspacePath: string,
        filePath: string
    ): Promise<'new' | 'modified' | 'deleted' | 'untracked' | 'unknown'> {
        try {
            const relativePath = path.relative(workspacePath, filePath);
            const { stdout } = await execAsync(
                `git status --porcelain -- "${relativePath}"`,
                { cwd: workspacePath }
            );
            
            const status = stdout.trim();
            if (!status) return 'unknown';
            
            const statusCode = status.substring(0, 2);
            if (statusCode.includes('A')) return 'new';
            if (statusCode.includes('D')) return 'deleted';
            if (statusCode.includes('M')) return 'modified';
            if (statusCode.includes('?')) return 'untracked';
            
            return 'unknown';
        } catch {
            return 'unknown';
        }
    }

    /**
     * Get a summary of changes for multiple files
     */
    static async getChangesSummary(
        workspacePath: string,
        filePaths: string[],
        sinceCommit?: string
    ): Promise<Map<string, { diff: string | null; status: string }>> {
        const results = new Map<string, { diff: string | null; status: string }>();
        
        for (const filePath of filePaths) {
            const diff = await this.getDiffForFile(workspacePath, filePath, sinceCommit);
            const status = await this.getFileStatus(workspacePath, filePath);
            results.set(filePath, { diff, status });
        }
        
        return results;
    }

    /**
     * Check if file is tracked by git
     */
    static async isFileTracked(workspacePath: string, filePath: string): Promise<boolean> {
        try {
            const relativePath = path.relative(workspacePath, filePath);
            await execAsync(
                `git ls-files --error-unmatch -- "${relativePath}"`,
                { cwd: workspacePath }
            );
            return true;
        } catch {
            return false;
        }
    }
}

