import * as vscode from 'vscode';
import * as path from 'path';
import { FileParser } from '../utils/FileParser';

interface FolderNode {
    name: string;
    path: string;
    children: FolderNode[];
}

interface FileItem {
    name: string;
    path: string;
    type: 'file' | 'folder';
    modified: string;
    frontmatter?: any;
    objectId?: string;
}

interface ActiveSession {
    sessionId: string;
    problemStatement: string;
    startTime: string;
    changedFiles: any[];
}

export class ForgeTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly itemType: 'header' | 'section' | 'category' | 'folder' | 'file' | 'dashboard',
        public readonly category?: string,
        public readonly filePath?: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        // Set unique ID for each item - required for proper TreeView rendering
        this.id = this.generateId();
        // Set resourceUri for files and folders - CRITICAL for proper indentation
        if (this.filePath) {
            this.resourceUri = vscode.Uri.file(this.filePath);
        }
        this.tooltip = this.getTooltip();
        this.contextValue = this.getContextValue();
        this.iconPath = this.getIconPath();
    }

    private generateId(): string {
        if (this.filePath) {
            return this.filePath;
        }
        if (this.category) {
            return `${this.itemType}-${this.category}`;
        }
        return `${this.itemType}-${this.label}`;
    }

    private getTooltip(): string {
        if (this.itemType === 'file' && this.filePath) {
            return this.filePath;
        }
        if (this.itemType === 'category') {
            const tooltips: { [key: string]: string } = {
                'actors': 'Define system actors and personas - Always accessible foundational reference',
                'diagrams': 'Visual architecture and system diagrams - Always accessible reference',
                'specs': 'Technical contracts and implementation details - Always accessible reference',
                'sessions': 'Manage design sessions and track changes - Always accessible workflow entry',
                'features': 'Define user-facing functionality and behavior - Requires active design session',
            };
            return tooltips[this.category || ''] || this.label;
        }
        return this.label;
    }

    private getContextValue(): string {
        if (this.itemType === 'file') {
            return 'forgeFile';
        }
        if (this.itemType === 'folder' && this.category) {
            return `forgeFolder-${this.category}`;
        }
        if (this.itemType === 'category') {
            return `forgeCategory-${this.category}`;
        }
        return '';
    }

    private getIconPath(): vscode.ThemeIcon | undefined {
        switch (this.itemType) {
            case 'header':
                return new vscode.ThemeIcon('repo');
            case 'section':
                return undefined;
            case 'dashboard':
                return new vscode.ThemeIcon('dashboard');
            case 'category':
                const categoryIcons: { [key: string]: string } = {
                    'actors': 'account',
                    'diagrams': 'graph',
                    'specs': 'file-code',
                    'sessions': 'history',
                    'features': 'symbol-event'
                };
                const icon = categoryIcons[this.category || ''];
                return icon ? new vscode.ThemeIcon(icon) : new vscode.ThemeIcon('folder');
            case 'folder':
                return new vscode.ThemeIcon('folder');
            case 'file':
                return new vscode.ThemeIcon('file');
            default:
                return undefined;
        }
    }
}

export class ForgeStudioTreeProvider implements vscode.TreeDataProvider<ForgeTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ForgeTreeItem | undefined | null | void> = new vscode.EventEmitter<ForgeTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ForgeTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private _projectUri: vscode.Uri | undefined;
    private _activeSession: ActiveSession | null = null;
    private _structureWatcher: vscode.FileSystemWatcher | undefined;
    private _sessionWatcher: vscode.FileSystemWatcher | undefined;
    private _folderCache: Map<string, { folders: FolderNode[]; files: FileItem[] }> = new Map();

    constructor(private context: vscode.ExtensionContext) {
        // Initialize with first workspace folder if available
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            this._projectUri = vscode.workspace.workspaceFolders[0].uri;
            this._loadActiveSession();
            this._startStructureWatcher();
        }
    }

    public setProjectUri(uri: vscode.Uri) {
        this._projectUri = uri;
        this._loadActiveSession();
        this._startStructureWatcher();
        this.refresh();
    }

    public refresh(): void {
        this._folderCache.clear();
        // Fire event with undefined to refresh entire tree
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: ForgeTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ForgeTreeItem): Promise<ForgeTreeItem[]> {
        try {
            // Always show root items even if no project URI is set
            if (!element) {
                return this._getRootItems();
            }

            if (!this._projectUri) {
                // Return empty array if no project set (but root items already shown)
                return [];
            }

            // Handle category, folder, and file children
            return this._getCategoryChildren(element);
        } catch (error) {
            console.error('Error in getChildren:', error);
            return [];
        }
    }

    private _getRootItems(): ForgeTreeItem[] {
        const items: ForgeTreeItem[] = [];

        // Header with session status
        const sessionStatus = this._activeSession ? '● Session Active' : '';
        const headerLabel = sessionStatus ? `Forge Studio (${sessionStatus})` : 'Forge Studio';
        const headerItem = new ForgeTreeItem(
            headerLabel,
            vscode.TreeItemCollapsibleState.None,
            'header'
        );
        // Add description for session status
        if (this._activeSession) {
            headerItem.description = 'Session Active';
        }
        items.push(headerItem);

        // Dashboard
        items.push(new ForgeTreeItem(
            'Dashboard',
            vscode.TreeItemCollapsibleState.None,
            'dashboard',
            undefined,
            undefined,
            {
                command: 'forgeStudio.openDashboard',
                title: 'Open Dashboard'
            }
        ));

        // INFORM categories (no section header)
        // Use Collapsed state so children can be expanded and properly indented
        items.push(new ForgeTreeItem(
            'Actors',
            vscode.TreeItemCollapsibleState.Collapsed,
            'category',
            'actors'
        ));

        items.push(new ForgeTreeItem(
            'Diagrams',
            vscode.TreeItemCollapsibleState.Collapsed,
            'category',
            'diagrams'
        ));

        items.push(new ForgeTreeItem(
            'Specifications',
            vscode.TreeItemCollapsibleState.Collapsed,
            'category',
            'specs'
        ));

        // DESIGN categories (no section header)
        items.push(new ForgeTreeItem(
            'Sessions',
            vscode.TreeItemCollapsibleState.Collapsed,
            'category',
            'sessions'
        ));

        // Features - disabled if no active session
        const featuresDisabled = !this._activeSession;
        items.push(new ForgeTreeItem(
            featuresDisabled ? 'Features 🔒' : 'Features',
            vscode.TreeItemCollapsibleState.Collapsed,
            'category',
            'features'
        ));

        return items;
    }

    private async _getCategoryChildren(element: ForgeTreeItem): Promise<ForgeTreeItem[]> {
        if (!this._projectUri) {
            return [];
        }

        // Category level - show folders and root-level files only
        if (element.itemType === 'category') {
            const category = element.category;
            if (!category) {
                return [];
            }

            const cacheKey = `${category}-root`;
            let cached = this._folderCache.get(cacheKey);

            if (!cached) {
                const folders = await this._getFolderTree(category);
                // Only get files from the root level of the category (not in any subfolder)
                const categoryRoot = this._getCategoryPath(category).fsPath;
                const files = await this._getCategoryFiles(category, categoryRoot);
                // Filter out files that are in subfolders - they should only appear when folders are expanded
                const rootFilesOnly = files.filter(file => {
                    const fileDir = path.dirname(file.path);
                    const normalizedFileDir = fileDir.replace(/\\/g, '/');
                    const normalizedCategoryRoot = categoryRoot.replace(/\\/g, '/');
                    return normalizedFileDir === normalizedCategoryRoot;
                });
                cached = { folders, files: rootFilesOnly };
                this._folderCache.set(cacheKey, cached);
            }

            const items: ForgeTreeItem[] = [];

            // Add folders first (they will contain their own files when expanded)
            for (const folder of cached.folders) {
                items.push(new ForgeTreeItem(
                    folder.name,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'folder',
                    category,
                    folder.path
                ));
            }

            // Add only root-level files (files not in any subfolder)
            // Files inside folders will appear when the folder is expanded
            // Note: cached.files already contains only root-level files due to filtering above
            for (const file of cached.files) {
                const displayName = this._stripFileExtension(file.name);
                items.push(new ForgeTreeItem(
                    displayName,
                    vscode.TreeItemCollapsibleState.None,
                    'file',
                    category,
                    file.path,
                    {
                        command: 'forgeStudio.openFile',
                        title: 'Open File',
                        arguments: [file.path]
                    }
                ));
            }

            return items;
        }

        // Folder level - show subfolders and files
        if (element.itemType === 'folder' && element.filePath && element.category) {
            const cacheKey = `${element.category}-${element.filePath}`;
            let cached = this._folderCache.get(cacheKey);

            if (!cached) {
                const folders = await this._getFolderTreeForPath(element.filePath);
                const files = await this._getCategoryFiles(element.category, element.filePath);
                cached = { folders, files };
                this._folderCache.set(cacheKey, cached);
            }

            const items: ForgeTreeItem[] = [];

            // Add subfolders
            for (const folder of cached.folders) {
                items.push(new ForgeTreeItem(
                    folder.name,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'folder',
                    element.category,
                    folder.path
                ));
            }

            // Add files
            for (const file of cached.files) {
                // Strip file extension from display name
                const displayName = this._stripFileExtension(file.name);
                items.push(new ForgeTreeItem(
                    displayName,
                    vscode.TreeItemCollapsibleState.None,
                    'file',
                    element.category,
                    file.path,
                    {
                        command: 'forgeStudio.openFile',
                        title: 'Open File',
                        arguments: [file.path]
                    }
                ));
            }

            return items;
        }

        return [];
    }

    private _stripFileExtension(filename: string): string {
        // Remove common Forge file extensions: .feature.md, .spec.md, .actor.md, .session.md, .diagram.md, etc.
        const forgeExtensions = [
            '.feature.md',
            '.spec.md',
            '.actor.md',
            '.session.md',
            '.diagram.md',
            '.story.md',
            '.task.md',
            '.context.md'
        ];
        
        for (const ext of forgeExtensions) {
            if (filename.endsWith(ext)) {
                return filename.slice(0, -ext.length);
            }
        }
        
        // Fallback: remove standard .md extension if no Forge extension matched
        if (filename.endsWith('.md')) {
            return filename.slice(0, -3);
        }
        
        return filename;
    }

    private async _getFolderTree(category: string): Promise<FolderNode[]> {
        const basePath = this._getCategoryPath(category);
        return await this._buildFolderTree(basePath, this._getCategoryExtension(category));
    }

    private async _getFolderTreeForPath(folderPath: string): Promise<FolderNode[]> {
        const folderUri = vscode.Uri.file(folderPath);
        // Determine category from path
        const category = this._getCategoryFromPath(folderPath);
        const extension = category ? this._getCategoryExtension(category) : '';
        return await this._buildFolderTree(folderUri, extension);
    }

    private async _buildFolderTree(dirUri: vscode.Uri, fileExtension: string): Promise<FolderNode[]> {
        try {
            const entries = await vscode.workspace.fs.readDirectory(dirUri);
            const folders: FolderNode[] = [];

            for (const [name, type] of entries) {
                if (type === vscode.FileType.Directory && name !== 'node_modules' && !name.startsWith('.')) {
                    const childUri = vscode.Uri.joinPath(dirUri, name);
                    const children = await this._buildFolderTree(childUri, fileExtension);
                    folders.push({
                        name,
                        path: childUri.fsPath,
                        children
                    });
                }
            }

            return folders;
        } catch {
            return [];
        }
    }

    private async _getCategoryFiles(category: string, folderPath: string): Promise<FileItem[]> {
        const fileExtension = this._getCategoryExtension(category);
        const folderUri = vscode.Uri.file(folderPath);

        try {
            const entries = await vscode.workspace.fs.readDirectory(folderUri);
            const items: FileItem[] = [];

            for (const [name, type] of entries) {
                if (type === vscode.FileType.Directory && !name.startsWith('.') && name !== 'node_modules') {
                    // Skip directories - they're handled separately
                    continue;
                } else if (type === vscode.FileType.File && name.endsWith(fileExtension) && name !== 'index.md') {
                    const fileUri = vscode.Uri.joinPath(folderUri, name);
                    const stats = await vscode.workspace.fs.stat(fileUri);

                    // Try to read frontmatter for metadata
                    let frontmatter: any = {};
                    let objectId: string | undefined;
                    try {
                        const content = await FileParser.readFile(fileUri.fsPath);
                        const parsed = FileParser.parseFrontmatter(content);
                        frontmatter = parsed.frontmatter;
                        objectId = this._extractObjectId(category, frontmatter);
                    } catch {
                        // Ignore parse errors
                    }

                    items.push({
                        name,
                        path: fileUri.fsPath,
                        type: 'file',
                        modified: new Date(stats.mtime).toISOString(),
                        frontmatter,
                        objectId: objectId || name
                    });
                }
            }

            // Sort files alphabetically
            items.sort((a, b) => a.name.localeCompare(b.name));

            return items;
        } catch {
            return [];
        }
    }

    private _extractObjectId(category: string, frontmatter: any): string | undefined {
        const idFieldMap: { [key: string]: string } = {
            'features': 'feature_id',
            'specs': 'spec_id',
            'actors': 'actor_id',
            'sessions': 'session_id'
        };
        const idField = idFieldMap[category];
        return idField ? frontmatter[idField] : undefined;
    }

    private _getCategoryPath(category: string): vscode.Uri {
        if (!this._projectUri) {
            throw new Error('Project URI not set');
        }
        return vscode.Uri.joinPath(this._projectUri, 'ai', category);
    }

    private _getCategoryFromPath(filePath: string): string | undefined {
        const match = filePath.match(/[\/\\]ai[\/\\]([^\/\\]+)[\/\\]/);
        return match ? match[1] : undefined;
    }

    private _getCategoryExtension(category: string): string {
        const extensions: { [key: string]: string } = {
            'features': '.feature.md',
            'diagrams': '.diagram.md',
            'specs': '.spec.md',
            'actors': '.actor.md',
            'sessions': '.session.md'
        };
        return extensions[category] || '.md';
    }

    private async _loadActiveSession(): Promise<void> {
        if (!this._projectUri) {
            return;
        }

        const sessionsDir = vscode.Uri.joinPath(this._projectUri, 'ai', 'sessions');

        try {
            const files = await this._listFilesRecursive(sessionsDir, '.session.md');

            for (const file of files) {
                const content = await FileParser.readFile(file.fsPath);
                const parsed = FileParser.parseFrontmatter(content);

                if (parsed.frontmatter.status === 'design') {
                    const sessionId = parsed.frontmatter.session_id || path.basename(file.fsPath, '.session.md');
                    this._activeSession = {
                        sessionId,
                        problemStatement: parsed.frontmatter.problem_statement || '',
                        startTime: parsed.frontmatter.start_time || new Date().toISOString(),
                        changedFiles: parsed.frontmatter.changed_files || []
                    };
                    this.refresh();
                    return;
                }
            }

            this._activeSession = null;
            this.refresh();
        } catch {
            this._activeSession = null;
            this.refresh();
        }
    }

    private async _listFilesRecursive(dir: vscode.Uri, extension: string): Promise<vscode.Uri[]> {
        const files: vscode.Uri[] = [];

        try {
            const entries = await vscode.workspace.fs.readDirectory(dir);

            for (const [name, type] of entries) {
                const fullPath = vscode.Uri.joinPath(dir, name);
                if (type === vscode.FileType.File && name.endsWith(extension)) {
                    files.push(fullPath);
                } else if (type === vscode.FileType.Directory) {
                    files.push(...await this._listFilesRecursive(fullPath, extension));
                }
            }
        } catch {
            // Directory doesn't exist
        }

        return files;
    }

    private _startStructureWatcher(): void {
        if (this._structureWatcher) {
            this._structureWatcher.dispose();
        }

        if (!this._projectUri) {
            return;
        }

        const aiPath = vscode.Uri.joinPath(this._projectUri, 'ai');
        const pattern = new vscode.RelativePattern(aiPath, '**/*');

        this._structureWatcher = vscode.workspace.createFileSystemWatcher(pattern);

        this._structureWatcher.onDidCreate(() => {
            this.refresh();
        });

        this._structureWatcher.onDidDelete(() => {
            this.refresh();
        });

        this._structureWatcher.onDidChange((uri) => {
            // Only refresh if it's a Forge file
            if (this._isForgeFile(uri.fsPath)) {
                this.refresh();
            }
        });

        // Watch for session file changes specifically
        const sessionPattern = new vscode.RelativePattern(aiPath, '**/*.session.md');
        this._sessionWatcher = vscode.workspace.createFileSystemWatcher(sessionPattern);

        this._sessionWatcher.onDidChange(() => {
            this._loadActiveSession();
        });

        this._sessionWatcher.onDidCreate(() => {
            this._loadActiveSession();
        });

        this._sessionWatcher.onDidDelete(() => {
            this._loadActiveSession();
        });
    }

    private _isForgeFile(filePath: string): boolean {
        return filePath.endsWith('.session.md') ||
               filePath.endsWith('.feature.md') ||
               filePath.endsWith('.spec.md') ||
               filePath.endsWith('.diagram.md') ||
               filePath.endsWith('.actor.md') ||
               filePath.endsWith('.story.md') ||
               filePath.endsWith('.task.md');
    }

    public dispose(): void {
        if (this._structureWatcher) {
            this._structureWatcher.dispose();
        }
        if (this._sessionWatcher) {
            this._sessionWatcher.dispose();
        }
    }
}
