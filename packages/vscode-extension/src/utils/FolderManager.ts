import * as vscode from 'vscode';
import * as path from 'path';
import { FileParser } from './FileParser';

export interface FolderNode {
    name: string;
    path: string;
    isLeaf: boolean;
    children: FolderNode[];
    files: FileInfo[];
    indexContent?: IndexFile;
}

export interface FileInfo {
    name: string;
    path: string;
    type: 'feature' | 'spec' | 'model' | 'context' | 'session' | 'story' | 'task';
    friendlyName: string;
}

export interface IndexFile {
    frontmatter: any;
    content: string;
}

export class FolderManager {
    /**
     * Build a tree structure for a given root folder
     */
    static async buildFolderTree(rootPath: string, fileType: 'feature' | 'spec' | 'model' | 'context' | 'session' | 'ticket'): Promise<FolderNode> {
        const uri = vscode.Uri.file(rootPath);
        const stat = await vscode.workspace.fs.stat(uri);
        
        if (stat.type !== vscode.FileType.Directory) {
            throw new Error(`${rootPath} is not a directory`);
        }

        return this.buildNode(rootPath, path.basename(rootPath), fileType);
    }

    /**
     * Recursively build a folder node
     */
    private static async buildNode(folderPath: string, folderName: string, fileType: string): Promise<FolderNode> {
        const uri = vscode.Uri.file(folderPath);
        const entries = await vscode.workspace.fs.readDirectory(uri);
        
        const children: FolderNode[] = [];
        const files: FileInfo[] = [];
        let indexContent: IndexFile | undefined;

        for (const [name, type] of entries) {
            const fullPath = path.join(folderPath, name);

            // Skip index.md for now (we'll load it separately)
            if (name === 'index.md') {
                continue;
            }

            if (type === vscode.FileType.Directory) {
                const childNode = await this.buildNode(fullPath, name, fileType);
                children.push(childNode);
            } else if (type === vscode.FileType.File) {
                const fileInfo = this.parseFileInfo(name, fullPath);
                if (fileInfo) {
                    files.push(fileInfo);
                }
            }
        }

        // Load index.md if it exists (for features folders)
        if (fileType === 'feature') {
            const indexPath = path.join(folderPath, 'index.md');
            try {
                const indexUri = vscode.Uri.file(indexPath);
                const content = await FileParser.readFile(indexPath);
                const parsed = FileParser.parseFrontmatter(content);
                indexContent = {
                    frontmatter: parsed.frontmatter,
                    content: parsed.content
                };
            } catch (error) {
                // index.md doesn't exist, that's ok
            }
        }

        // A folder is a leaf if it has no subfolders
        const isLeaf = children.length === 0;

        return {
            name: folderName,
            path: folderPath,
            isLeaf,
            children,
            files,
            indexContent
        };
    }

    /**
     * Parse file information from filename
     */
    private static parseFileInfo(filename: string, fullPath: string): FileInfo | null {
        const extensionMap: Record<string, 'feature' | 'spec' | 'model' | 'context' | 'session' | 'story' | 'task'> = {
            '.feature.md': 'feature',
            '.spec.md': 'spec',
            '.model.md': 'model',
            '.context.md': 'context',
            '.session.md': 'session',
            '.story.md': 'story',
            '.task.md': 'task'
        };

        for (const [ext, type] of Object.entries(extensionMap)) {
            if (filename.endsWith(ext)) {
                const id = filename.slice(0, -ext.length);
                const friendlyName = id
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                
                return {
                    name: filename,
                    path: fullPath,
                    type,
                    friendlyName
                };
            }
        }

        return null;
    }

    /**
     * Get all files recursively from a folder tree
     */
    static getAllFiles(node: FolderNode): FileInfo[] {
        const files: FileInfo[] = [...node.files];
        
        for (const child of node.children) {
            files.push(...this.getAllFiles(child));
        }
        
        return files;
    }

    /**
     * Find a specific file by path in the tree
     */
    static findFile(node: FolderNode, filePath: string): FileInfo | null {
        for (const file of node.files) {
            if (file.path === filePath) {
                return file;
            }
        }
        
        for (const child of node.children) {
            const found = this.findFile(child, filePath);
            if (found) {
                return found;
            }
        }
        
        return null;
    }

    /**
     * Find a folder by path in the tree
     */
    static findFolder(node: FolderNode, folderPath: string): FolderNode | null {
        if (node.path === folderPath) {
            return node;
        }
        
        for (const child of node.children) {
            const found = this.findFolder(child, folderPath);
            if (found) {
                return found;
            }
        }
        
        return null;
    }
}

