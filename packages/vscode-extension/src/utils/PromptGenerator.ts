import * as vscode from 'vscode';
import * as path from 'path';
import { FileParser } from './FileParser';
import { GitUtils } from './GitUtils';
import { FeatureChangeEntry } from '../types/FeatureChangeEntry';

export class PromptGenerator {
    /**
     * Generates a prompt for starting a new design session
     */
    static generateStartSessionPrompt(problemStatement: string): string {
        const timestamp = new Date().toISOString();
        const sessionId = this.generateId(problemStatement);

        return `STEP 1: First, call the get_forge_about MCP tool to understand the Forge workflow.

STEP 2: Call the get_forge_schema MCP tool with schema_type "session" to retrieve the proper session file format.

STEP 3: Create a new session document in the ai/sessions folder with the following details:

**Session ID**: ${sessionId}
**Filename**: ai/sessions/${sessionId}.session.md
**Start Time**: ${timestamp}
**Problem Statement**: ${problemStatement}

The session document should:
- Follow the session schema from Step 2
- Have status: active
- Have an empty changed_files array (FeatureChangeEntry[]) initially (this will be tracked during the session)
- Include sections for Problem Statement, Goals, Approach, Key Decisions, and Notes
- Describe what you're trying to accomplish in this design session

Ensure the ai/sessions folder exists (create it if needed), use proper markdown formatting, and ensure the frontmatter is valid YAML.

Once created, this session will track only feature file changes (*.feature.md) with scenario-level detail during the design process. Specs, diagrams, actors, and contexts are NOT tracked in sessions.`;
    }

    /**
     * Convert old format (string[]) to new format (FeatureChangeEntry[])
     * Initializes scenario arrays as empty arrays for migrated entries
     */
    private static migrateChangedFiles(changedFiles: any): FeatureChangeEntry[] {
        if (!Array.isArray(changedFiles)) {
            return [];
        }
        
        // If it's already the new format, ensure scenario arrays exist
        if (changedFiles.length > 0 && typeof changedFiles[0] === 'object' && changedFiles[0].path) {
            return (changedFiles as FeatureChangeEntry[]).map((entry: FeatureChangeEntry) => ({
                path: entry.path,
                change_type: entry.change_type,
                scenarios_added: entry.scenarios_added || [],
                scenarios_modified: entry.scenarios_modified || [],
                scenarios_removed: entry.scenarios_removed || []
            }));
        }
        
        // Convert old format (string[]) to new format
        return changedFiles
            .filter((item: any) => typeof item === 'string')
            .map((path: string): FeatureChangeEntry => ({
                path,
                change_type: 'modified',
                scenarios_added: [],
                scenarios_modified: [],
                scenarios_removed: []
            }));
    }

    static async generateDistillSessionPrompt(sessionUri: vscode.Uri): Promise<string> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(sessionUri);
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        const sessionContent = await FileParser.readFile(sessionUri.fsPath);
        const sessionData = FileParser.parseFrontmatter(sessionContent);
        const sessionId = sessionData.frontmatter.session_id || path.basename(sessionUri.fsPath, '.session.md');
        
        // Handle both old format (string[]) and new format (FeatureChangeEntry[])
        // Migrate to new format with scenario arrays initialized
        const changedFilesRaw: any = sessionData.frontmatter.changed_files || [];
        const changedFilesEntries: FeatureChangeEntry[] = this.migrateChangedFiles(changedFilesRaw);
        const changedFiles: string[] = changedFilesEntries.map((entry: FeatureChangeEntry) => entry.path);
        
        const startCommit: string | undefined = sessionData.frontmatter.start_commit;

        // Check if workspace is a git repository
        const isGitRepo = await GitUtils.isGitRepository(workspaceFolder.uri.fsPath);

        let prompt = `STEP 1: Call the get_forge_about MCP tool to understand the Forge workflow and distillation principles.

STEP 2: Retrieve the required schemas:
- get_forge_schema with schema_type "story"
- get_forge_schema with schema_type "task"

STEP 3: Review the design session:

**Session File**: ${sessionUri.fsPath}
**Session ID**: ${sessionId}

**Session Content**:
\`\`\`markdown
${sessionContent}
\`\`\`

`;

        // Analyze changed files
        if (changedFiles.length > 0) {
            prompt += `**Changed Files During Session** (${changedFiles.length} files):

`;
            for (let i = 0; i < changedFiles.length; i++) {
                const changedFile = changedFiles[i];
                const changeEntry = changedFilesEntries.length > i ? changedFilesEntries[i] : null;
                const fullPath = path.join(workspaceFolder.uri.fsPath, changedFile);
                try {
                    const content = await FileParser.readFile(fullPath);
                    const parsed = FileParser.parseFrontmatter(content);
                    const fileType = this.getFileType(changedFile);
                    const fileId = parsed.frontmatter[`${fileType}_id`] || path.basename(changedFile);
                    
                    prompt += `### ${fileType.charAt(0).toUpperCase() + fileType.slice(1)}: ${fileId}
File: ${changedFile}
`;
                    
                    // Add scenario-level change details if available
                    if (changeEntry && changeEntry.change_type) {
                        prompt += `Change Type: ${changeEntry.change_type}
`;
                        if (changeEntry.scenarios_added && changeEntry.scenarios_added.length > 0) {
                            prompt += `Scenarios Added: ${changeEntry.scenarios_added.join(', ')}
`;
                        }
                        if (changeEntry.scenarios_modified && changeEntry.scenarios_modified.length > 0) {
                            prompt += `Scenarios Modified: ${changeEntry.scenarios_modified.join(', ')}
`;
                        }
                        if (changeEntry.scenarios_removed && changeEntry.scenarios_removed.length > 0) {
                            prompt += `Scenarios Removed: ${changeEntry.scenarios_removed.join(', ')}
`;
                        }
                    }
                    
                    prompt += `
`;
                    
                    // Add git diff if available
                    if (isGitRepo) {
                        const diff = await GitUtils.getDiffForFile(
                            workspaceFolder.uri.fsPath, 
                            fullPath, 
                            startCommit
                        );
                        const status = await GitUtils.getFileStatus(workspaceFolder.uri.fsPath, fullPath);
                        
                        if (status === 'new' || status === 'untracked') {
                            prompt += `**Git Status:** New file (not previously tracked)

`;
                        } else if (diff) {
                            prompt += `**Git Diff** (changes ${startCommit ? `since session start (${startCommit.substring(0, 7)})` : 'uncommitted'}):
\`\`\`diff
${diff}
\`\`\`

`;
                        } else {
                            prompt += `**Git Status:** No changes detected (file may have been reverted or changes are identical to ${startCommit ? 'session start' : 'HEAD'})

`;
                        }
                    } else {
                        prompt += `**Note:** Git repository not available. Read the file directly to see its current content.

`;
                    }
                } catch (error) {
                    prompt += `### ${path.basename(changedFile)}
File: ${changedFile}
(Could not read file: ${error})

`;
                }
            }
            
            // Add summary if git is available
            if (isGitRepo) {
                if (startCommit) {
                    prompt += `\n**Note:** Git diffs show changes from session start commit (${startCommit.substring(0, 7)}) to current state.\n\n`;
                } else {
                    prompt += `\n**Note:** Git diffs show uncommitted changes only. Session did not track start commit.\n\n`;
                }
            } else {
                prompt += `\n**Note:** This workspace is not a git repository. Read files directly to see their current content.\n\n`;
            }
        } else {
            prompt += `**No changed files tracked in this session.**

Please review the session content and manually identify which features, specs, models, or contexts were discussed or need to be modified.

`;
        }

        prompt += `STEP 5: Review changed files

For each changed file listed above:
1. Review the git diff (if available) to understand exactly what changed
2. If no git diff is available, read the file directly to understand its content

STEP 6: Analyze and break down into Stories and Tasks

Based on the session and the git diffs (or file contents) of changed files:

**IMPORTANT:** Use the git diffs shown above to understand EXACTLY what changed in each file. The diffs show:
- Lines that were added (prefixed with +)
- Lines that were removed (prefixed with -)
- Context around the changes
- Whether files are new, modified, or deleted

If git diffs are not available, read the files directly to understand their current state and determine what needs to be implemented.

This precise change information should guide your story creation - focus on implementing these specific changes.

**Create Stories** (*.story.md) in ai/tickets/${sessionId}/ for:
- Code changes and implementations
- New features or feature modifications
- Technical debt improvements
- Refactoring work

**Create Tasks** (*.task.md) in ai/tickets/${sessionId}/ for:
- Manual configuration in external systems
- Documentation updates outside code
- Third-party service setup
- Manual testing or verification steps

**Critical Requirements:**

1. **Keep Stories MINIMAL** - Each story should take < 30 minutes to implement
2. **Break Down Large Changes** - If a change is complex, create multiple small stories
3. **Use Proper Linkages** - Link stories/tasks to feature_id, spec_id, and model_id from changed files
4. **Link to Session** - ALL stories and tasks MUST include session_id: "${sessionId}" in their frontmatter
5. **Be Specific** - Include exact file paths, clear objectives, and acceptance criteria
6. **Add Context** - Each story should have enough information to be implemented independently
7. **Order Matters** - Set dependencies and order stories logically
8. **Follow Schemas** - All files must adhere to schemas from Step 2

STEP 7: Verify completeness and create files

Ensure that:
- Every changed file is accounted for in at least one story or task
- All stories have clear acceptance criteria
- Dependencies between stories are identified
- The collection of stories fully implements the session goals
- Stories are small enough to be completed quickly
- ALL stories and tasks link back to session_id: "${sessionId}"

Now create all the story and task files in ai/tickets/${sessionId}/ following the schemas and requirements above.`;

        return prompt;
    }

    /**
     * Generates a prompt for building a story implementation
     */
    static async generateBuildStoryPrompt(storyUri: vscode.Uri): Promise<string> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(storyUri);
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        const storyContent = await FileParser.readFile(storyUri.fsPath);
        const storyData = FileParser.parseFrontmatter(storyContent);
        const storyId = storyData.frontmatter.story_id || path.basename(storyUri.fsPath, '.story.md');
        
        // Get related IDs from frontmatter
        const featureIds = FileParser.extractIds(storyData.frontmatter, 'feature_id');
        const specIds = FileParser.extractIds(storyData.frontmatter, 'spec_id');
        const modelIds = FileParser.extractIds(storyData.frontmatter, 'model_id');

        let prompt = `STEP 1: Review the story to understand what needs to be implemented:

**Story File**: ${storyUri.fsPath}
**Story ID**: ${storyId}

**Story Content**:
\`\`\`markdown
${storyContent}
\`\`\`

`;

        // Include related features
        if (featureIds.length > 0) {
            prompt += `\n**Related Features**:\n`;
            for (const featureId of featureIds) {
                const featureFile = await this.findFileById(workspaceFolder.uri.fsPath, 'features', featureId, '.feature.md');
                if (featureFile) {
                    const relativePath = path.relative(workspaceFolder.uri.fsPath, featureFile);
                    prompt += `- ${featureId}: ${relativePath}\n`;
                } else {
                    prompt += `- ${featureId}: (file not found)\n`;
                }
            }
        }

        // Include related specs
        if (specIds.length > 0) {
            prompt += `\n**Related Specs**:\n`;
            for (const specId of specIds) {
                const specFile = await this.findFileById(workspaceFolder.uri.fsPath, 'specs', specId, '.spec.md');
                if (specFile) {
                    const relativePath = path.relative(workspaceFolder.uri.fsPath, specFile);
                    prompt += `- ${specId}: ${relativePath}\n`;
                } else {
                    prompt += `- ${specId}: (file not found)\n`;
                }
            }
        }

        // Include related models
        if (modelIds.length > 0) {
            prompt += `\n**Related Models**:\n`;
            for (const modelId of modelIds) {
                const modelFile = await this.findFileById(workspaceFolder.uri.fsPath, 'models', modelId, '.model.md');
                if (modelFile) {
                    const relativePath = path.relative(workspaceFolder.uri.fsPath, modelFile);
                    prompt += `- ${modelId}: ${relativePath}\n`;
                } else {
                    prompt += `- ${modelId}: (file not found)\n`;
                }
            }
        }

        prompt += `\n\nSTEP 2: Read all related files

Read each of the related files listed above to understand the full context:
- Read related features to understand the expected behavior
- Read related specs to understand the technical implementation details
- Read related models to understand the data structures
- Read related contexts (if any) and execute their Gherkin scenarios (GIVEN/WHEN/THEN)

STEP 3: Implement the story

Using the story content and all related files you've read:

1. **Review the objective** - Understand what needs to be accomplished
2. **Follow the implementation steps** - The story may include specific steps
3. **Modify the affected files** - Make the necessary code changes
4. **Test your implementation** - Ensure acceptance criteria are met
5. **Update the story status** - Mark as completed once done

**Implementation Guidelines:**
- Keep changes focused on the story's objective
- Follow patterns established in related specs
- Respect data structures defined in related models
- Adhere to features' behavior requirements (Gherkin scenarios)
- Write clean, maintainable code
- Add appropriate tests

**Acceptance Criteria:**
The story content includes specific acceptance criteria. Ensure ALL criteria are met before considering the story complete.

Begin implementation now.`;

        return prompt;
    }

    /**
     * Helper method to generate a kebab-case ID from a title
     */
    private static generateId(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50);
    }

    /**
     * Helper method to get file type from file path
     */
    private static getFileType(filePath: string): string {
        if (filePath.includes('.feature.md')) return 'feature';
        if (filePath.includes('.spec.md')) return 'spec';
        if (filePath.includes('.model.md')) return 'model';
        if (filePath.includes('.actor.md')) return 'actor';
        if (filePath.includes('.session.md')) return 'session';
        if (filePath.includes('.story.md')) return 'story';
        if (filePath.includes('.task.md')) return 'task';
        return 'unknown';
    }

    /**
     * Helper method to find a file by ID (supports nested folders)
     */
    private static async findFileById(
        workspacePath: string,
        folderType: string,
        fileId: string,
        extension: string
    ): Promise<string | null> {
        const basePath = path.join(workspacePath, 'ai', folderType);
        const fileName = `${fileId}${extension}`;
        
        try {
            return await this.searchForFile(basePath, fileName);
        } catch (error) {
            return null;
        }
    }

    /**
     * Recursively search for a file in a directory
     */
    private static async searchForFile(dirPath: string, fileName: string): Promise<string | null> {
        try {
            const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath));
            
            for (const [name, type] of entries) {
                const fullPath = path.join(dirPath, name);
                
                if (type === vscode.FileType.File && name === fileName) {
                    return fullPath;
                } else if (type === vscode.FileType.Directory) {
                    const found = await this.searchForFile(fullPath, fileName);
                    if (found) {
                        return found;
                    }
                }
            }
        } catch (error) {
            // Directory doesn't exist or can't be read
        }
        
        return null;
    }

}

