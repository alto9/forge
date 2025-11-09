import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

export interface ForgeFile {
  id: string;
  path: string;
  type: 'decision' | 'feature' | 'spec' | 'context' | 'task';
  frontmatter: Record<string, any>;
  content: string;
}

export class ForgeFileManager {
  private workspaceRoot: string;
  private aiFolder: string;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = workspaceRoot || process.cwd();
    this.aiFolder = path.join(this.workspaceRoot, 'ai');
  }

  async listAllResources() {
    const resources: Array<{ uri: string; name: string; description?: string; mimeType: string }> = [];

    try {
      const [decisions, features, specs, contexts, tasks] = await Promise.all([
        this.listDecisions(),
        this.listFeatures(),
        this.listSpecs(),
        this.listContexts(),
        this.listTasks(),
      ]);

      for (const decision of decisions) {
        resources.push({
          uri: `forge://decision/${decision.id}`,
          name: decision.id,
          description: `Decision: ${decision.id}`,
          mimeType: 'text/markdown',
        });
      }

      for (const feature of features) {
        resources.push({
          uri: `forge://feature/${feature.id}`,
          name: feature.id,
          description: `Feature: ${feature.id}`,
          mimeType: 'text/markdown',
        });
      }

      for (const spec of specs) {
        resources.push({
          uri: `forge://spec/${spec.id}`,
          name: spec.id,
          description: `Spec: ${spec.id}`,
          mimeType: 'text/markdown',
        });
      }

      for (const context of contexts) {
        resources.push({
          uri: `forge://context/${context.id}`,
          name: context.id,
          description: `Context: ${context.id}`,
          mimeType: 'text/markdown',
        });
      }

      for (const task of tasks) {
        resources.push({
          uri: `forge://task/${task.id}`,
          name: task.id,
          description: `Task: ${task.id}`,
          mimeType: 'text/markdown',
        });
      }
    } catch (error) {
      console.error('Error listing resources:', error);
    }

    return resources;
  }

  async readResource(uri: string): Promise<string> {
    const match = uri.match(/^forge:\/\/(decision|feature|spec|context|task)\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid URI format: ${uri}`);
    }

    const [, type, id] = match;
    const filePath = this.getFilePath(type as any, id);

    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read resource: ${uri}`);
    }
  }

  async listDecisions(): Promise<ForgeFile[]> {
    return this.listFiles('decisions', 'decision.md', 'decision');
  }

  async listFeatures(): Promise<ForgeFile[]> {
    return this.listFiles('features', 'feature.md', 'feature');
  }

  async listSpecs(): Promise<ForgeFile[]> {
    return this.listFiles('specs', 'spec.md', 'spec');
  }

  async listContexts(): Promise<ForgeFile[]> {
    return this.listFiles('contexts', 'context.md', 'context');
  }

  async listTasks(): Promise<ForgeFile[]> {
    return this.listFiles('tasks', 'task.md', 'task');
  }

  async readFile(filePath: string): Promise<ForgeFile | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      const basename = path.basename(filePath);
      const type = this.getFileType(basename);
      const id = basename.replace(new RegExp(`\\.${type}\\.md$`), '');

      return {
        id,
        path: filePath,
        type: type as any,
        frontmatter: parsed.data,
        content: parsed.content,
      };
    } catch (error) {
      return null;
    }
  }

  private async listFiles(
    folder: string,
    extension: string,
    type: ForgeFile['type']
  ): Promise<ForgeFile[]> {
    const folderPath = path.join(this.aiFolder, folder);
    const files: ForgeFile[] = [];

    try {
      const entries = await fs.readdir(folderPath);

      for (const entry of entries) {
        if (entry.endsWith(extension)) {
          const filePath = path.join(folderPath, entry);
          const file = await this.readFile(filePath);
          if (file) {
            files.push(file);
          }
        }
      }
    } catch (error) {
      // Folder doesn't exist or can't be read
    }

    return files;
  }

  private getFilePath(type: ForgeFile['type'], id: string): string {
    const folderMap = {
      decision: 'decisions',
      feature: 'features',
      spec: 'specs',
      context: 'contexts',
      task: 'tasks',
    };

    const folder = folderMap[type];
    return path.join(this.aiFolder, folder, `${id}.${type}.md`);
  }

  private getFileType(filename: string): string {
    const match = filename.match(/\.(decision|feature|spec|context|task)\.md$/);
    return match ? match[1] : 'unknown';
  }
}
