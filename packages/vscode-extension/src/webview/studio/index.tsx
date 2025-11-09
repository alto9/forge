import React from 'react';
import { createRoot } from 'react-dom/client';
import { NomnomlRenderer } from './components/NomnomlRenderer';

// Acquire VSCode API once at module level
const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : undefined;

interface ActiveSession {
  sessionId: string;
  problemStatement: string;
  startTime: string;
  changedFiles: string[];
}

interface Session {
  sessionId: string;
  filePath: string;
  frontmatter: any;
}

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

interface FileContent {
  path: string;
  frontmatter: any;
  content: string;
}

function App() {
  const [state, setState] = React.useState<any>({ projectPath: '' });
  const [counts, setCounts] = React.useState<{ sessions: number; features: number; specs: number; actors: number; contexts: number; stories: number; tasks: number } | null>(null);
  const [route, setRoute] = React.useState<{ page: 'dashboard' | 'features' | 'specs' | 'actors' | 'contexts' | 'sessions'; params?: any }>({ page: 'dashboard' });
  const [activeSession, setActiveSession] = React.useState<ActiveSession | null>(null);
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [showNewSessionForm, setShowNewSessionForm] = React.useState(false);
  const [sessionPanelMinimized, setSessionPanelMinimized] = React.useState(false);

  React.useEffect(() => {
    function onMessage(event: MessageEvent) {
      const msg = event.data;
      if (msg?.type === 'initialState') {
        setState(msg.data);
        vscode?.postMessage({ type: 'getCounts' });
        vscode?.postMessage({ type: 'getActiveSession' });
        vscode?.postMessage({ type: 'listSessions' });
      }
      if (msg?.type === 'counts') {
        setCounts(msg.data);
      }
      if (msg?.type === 'activeSession') {
        setActiveSession(msg.data);
      }
      if (msg?.type === 'sessions') {
        setSessions(msg.data || []);
      }
      if (msg?.type === 'sessionCreated') {
        setActiveSession(msg.data);
        setShowNewSessionForm(false);
        vscode?.postMessage({ type: 'getCounts' });
        vscode?.postMessage({ type: 'listSessions' });
      }
      if (msg?.type === 'sessionStopped') {
        setActiveSession(null);
        vscode?.postMessage({ type: 'getCounts' });
        vscode?.postMessage({ type: 'listSessions' });
      }
      if (msg?.type === 'sessionUpdated') {
        if (msg.data?.success) {
          // Session saved successfully - could show a brief indicator
        }
      }
    }
    window.addEventListener('message', onMessage);
    vscode?.postMessage({ type: 'getInitialState' });
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className="container">
      <div className="sidebar">
        <div style={{ padding: 12, fontWeight: 600, borderBottom: '1px solid var(--vscode-panel-border)' }}>
          Forge Studio
          {activeSession && (
            <div style={{ fontSize: 10, marginTop: 4, color: 'var(--vscode-charts-green)', fontWeight: 'normal' }}>
              ● Session Active
            </div>
          )}
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          <li style={{ padding: '8px 12px', cursor: 'pointer', background: route.page === 'dashboard' ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent' }} onClick={() => setRoute({ page: 'dashboard' })}>Dashboard</li>
          <li style={{ padding: '8px 12px', cursor: 'pointer', background: route.page === 'sessions' ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent' }} onClick={() => setRoute({ page: 'sessions' })}>Sessions</li>
          <li style={{ padding: '8px 12px', cursor: 'pointer', background: route.page === 'actors' ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent' }} onClick={() => setRoute({ page: 'actors' })}>Actors</li>
          <li style={{ padding: '8px 12px', cursor: 'pointer', background: route.page === 'features' ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent' }} onClick={() => setRoute({ page: 'features' })}>Features</li>
          <li style={{ padding: '8px 12px', cursor: 'pointer', background: route.page === 'specs' ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent' }} onClick={() => setRoute({ page: 'specs' })}>Specifications</li>
          <li style={{ padding: '8px 12px', cursor: 'pointer', background: route.page === 'contexts' ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent' }} onClick={() => setRoute({ page: 'contexts' })}>Contexts</li>
        </ul>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }} className="main-content">
        <div style={{ padding: 16, marginBottom: 8, opacity: 0.8, fontSize: 12, borderBottom: '1px solid var(--vscode-panel-border)' }}>Project: {state.projectPath}</div>
        
        {route.page === 'dashboard' && (
          <div style={{ padding: 16 }}>
            <DashboardPage counts={counts} activeSession={activeSession} />
          </div>
        )}

        {route.page === 'sessions' && (
          <div style={{ padding: 16 }}>
            <SessionsPage 
              sessions={sessions}
              activeSession={activeSession}
              showNewSessionForm={showNewSessionForm}
              onShowNewSessionForm={() => setShowNewSessionForm(true)}
              onHideNewSessionForm={() => setShowNewSessionForm(false)}
              onDistillSession={(sessionId) => {
                vscode?.postMessage({ type: 'distillSession', sessionId });
              }}
            />
          </div>
        )}

        {route.page === 'features' && (
          <BrowserPage category="features" title="Features" activeSession={activeSession} />
        )}

        {route.page === 'specs' && (
          <BrowserPage category="specs" title="Specifications" activeSession={activeSession} />
        )}

        {route.page === 'actors' && (
          <BrowserPage category="actors" title="Actors" activeSession={activeSession} />
        )}

        {route.page === 'contexts' && (
          <BrowserPage category="contexts" title="Contexts" activeSession={activeSession} />
        )}
      </div>
      {activeSession && (
        <SessionPanel 
          session={activeSession}
          minimized={sessionPanelMinimized}
          onToggleMinimize={() => setSessionPanelMinimized(!sessionPanelMinimized)}
        />
      )}
    </div>
  );
}

function BrowserPage({ category, title, activeSession }: { category: string; title: string; activeSession: ActiveSession | null }) {
  const [folderTree, setFolderTree] = React.useState<FolderNode[]>([]);
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null);
  const [folderContents, setFolderContents] = React.useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [fileContent, setFileContent] = React.useState<FileContent | null>(null);

  React.useEffect(() => {
    vscode?.postMessage({ type: 'getFolderTree', category });

    function onMessage(event: MessageEvent) {
      const msg = event.data;
      if (msg?.type === 'folderTree' && msg?.category === category) {
        setFolderTree(msg.data || []);
      }
      if (msg?.type === 'folderContents') {
        setFolderContents(msg.data || []);
      }
      if (msg?.type === 'fileContent') {
        setFileContent(msg.data);
      }
      if (msg?.type === 'fileSaved') {
        if (msg.data?.success) {
          // Refresh file content
          if (selectedFile) {
            vscode?.postMessage({ type: 'getFileContent', filePath: selectedFile });
          }
        }
      }
      if (msg?.type === 'folderCreated') {
        if (msg.data?.success) {
          // Refresh folder tree
          vscode?.postMessage({ type: 'getFolderTree', category });
        }
      }
      if (msg?.type === 'fileCreated') {
        if (msg.data?.success) {
          // Refresh folder contents
          if (selectedFolder) {
            vscode?.postMessage({ type: 'getFolderContents', folderPath: selectedFolder, category });
          }
        }
      }
      if (msg?.type === 'structureChanged') {
        // Refresh folder tree when structure changes
        vscode?.postMessage({ type: 'getFolderTree', category });
        // Refresh folder contents if a folder is selected
        if (selectedFolder) {
          vscode?.postMessage({ type: 'getFolderContents', folderPath: selectedFolder, category });
        }
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [category, selectedFolder, selectedFile]);

  const handleFolderClick = (folderPath: string) => {
    setSelectedFolder(folderPath);
    setSelectedFile(null);
    setFileContent(null);
    vscode?.postMessage({ type: 'getFolderContents', folderPath, category });
  };

  const handleItemClick = (itemPath: string, itemType: 'file' | 'folder') => {
    if (itemType === 'folder') {
      // Navigate into the folder
      setSelectedFolder(itemPath);
      setSelectedFile(null);
      setFileContent(null);
      vscode?.postMessage({ type: 'getFolderContents', folderPath: itemPath, category });
    } else {
      // Open the file
      setSelectedFile(itemPath);
      vscode?.postMessage({ type: 'getFileContent', filePath: itemPath });
    }
  };

  const handleBackToFolder = () => {
    setSelectedFile(null);
    setFileContent(null);
  };

  return (
    <div className="split-view">
      <div className="split-sidebar">
        <FolderTreeView 
          folders={folderTree} 
          selectedFolder={selectedFolder}
          onFolderClick={handleFolderClick}
          category={category}
          activeSession={activeSession}
        />
      </div>
      <div className="split-content">
        {!selectedFolder && !selectedFile && (
          <CategoryEmptyState 
            category={category}
            title={title}
            activeSession={activeSession}
          />
        )}
        {selectedFolder && !selectedFile && (
          <FolderProfile 
            files={folderContents}
            onFileClick={(path) => {
              const item = folderContents.find(f => f.path === path);
              if (item) {
                handleItemClick(path, item.type);
              }
            }}
            folderPath={selectedFolder}
            category={category}
            activeSession={activeSession}
          />
        )}
        {selectedFile && fileContent && (
          <ItemProfile 
            category={category}
            fileContent={fileContent}
            activeSession={activeSession}
            onBack={handleBackToFolder}
          />
        )}
      </div>
    </div>
  );
}

function CategoryEmptyState({ category, title, activeSession }: {
  category: string;
  title: string;
  activeSession: ActiveSession | null;
}) {
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1, -1);

  const handleCreateFile = () => {
    vscode?.postMessage({
      type: 'promptCreateFile',
      folderPath: '', // Backend will use base category path
      category
    });
  };

  const handleCreateFolder = () => {
    vscode?.postMessage({
      type: 'promptCreateFolder',
      folderPath: '', // Backend will use base category path
      category
    });
  };

  if (!activeSession) {
    return (
      <div className="p-16">
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <div style={{ marginBottom: 8 }}>No {title.toLowerCase()} yet</div>
          <div className="alert alert-info" style={{ marginTop: 16, textAlign: 'left' }}>
            Start a design session to create {title.toLowerCase()}.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-16">
      <div className="empty-state">
        <div className="empty-state-icon">📁</div>
        <div style={{ marginBottom: 16 }}>No {title.toLowerCase()} yet</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 24 }}>
          Get started by creating your first {categoryLabel.toLowerCase()} or organizing with folders.
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button 
            className="btn btn-primary"
            onClick={handleCreateFile}
          >
            + New {categoryLabel}
          </button>
          <button 
            className="btn btn-secondary"
            onClick={handleCreateFolder}
          >
            + New Folder
          </button>
        </div>
      </div>
    </div>
  );
}

function FolderTreeView({ folders, selectedFolder, onFolderClick, category, activeSession }: { 
  folders: FolderNode[]; 
  selectedFolder: string | null; 
  onFolderClick: (path: string) => void;
  category: string;
  activeSession: ActiveSession | null;
}) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expanded);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpanded(newExpanded);
  };

  const handleContextMenu = (e: React.MouseEvent, folderPath: string) => {
    if (!activeSession) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    vscode?.postMessage({ 
      type: 'promptCreateFolder', 
      folderPath,
      category
    });
  };

  const renderFolder = (folder: FolderNode, level: number = 0) => {
    const isExpanded = expanded.has(folder.path);
    const isSelected = selectedFolder === folder.path;
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <div key={folder.path}>
        <div 
          className={`tree-folder ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: level * 16 + 8 }}
          onClick={() => onFolderClick(folder.path)}
          onContextMenu={(e) => handleContextMenu(e, folder.path)}
        >
          {hasChildren && (
            <span 
              className={`tree-chevron ${isExpanded ? 'expanded' : ''}`}
              onClick={(e) => toggleExpand(folder.path, e)}
            >
              ▸
            </span>
          )}
          {!hasChildren && <span className="tree-chevron"></span>}
          <span className="tree-label">📁 {folder.name}</span>
        </div>
        {isExpanded && hasChildren && (
          <div className="tree-children">
            {folder.children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tree-view">
      <div className="toolbar">
        <span className="font-medium">{category}</span>
      </div>
      {folders.length === 0 && (
        <div style={{ padding: 16, textAlign: 'center', opacity: 0.7, fontSize: 12 }}>
          No folders yet
        </div>
      )}
      {folders.map(folder => renderFolder(folder))}
    </div>
  );
}

function FolderProfile({ files, onFileClick, folderPath, category, activeSession }: { 
  files: FileItem[]; 
  onFileClick: (path: string) => void;
  folderPath: string;
  category: string;
  activeSession: ActiveSession | null;
}) {
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1, -1);
  
  const handleCreateFile = () => {
    vscode?.postMessage({
      type: 'promptCreateFile',
      folderPath,
      category
    });
  };

  // Convert absolute path to relative path from project root (ai/ folder)
  const getRelativePath = (absolutePath: string): string => {
    const aiIndex = absolutePath.indexOf('/ai/');
    if (aiIndex !== -1) {
      // Return path starting from after '/ai/' (e.g., 'features/studio/actors')
      return absolutePath.substring(aiIndex + 4);
    }
    return absolutePath;
  };

  const relativeFolderPath = getRelativePath(folderPath);

  return (
    <div className="p-16">
      <div className="toolbar">
        <div>
          <h3 className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Folder Contents</h3>
          <div className="text-xs opacity-70">{relativeFolderPath}</div>
        </div>
        {activeSession && (
          <button 
            className="btn btn-primary"
            style={{ fontSize: 12, padding: '6px 12px' }}
            onClick={handleCreateFile}
          >
            + New {categoryLabel}
          </button>
        )}
      </div>
      
      {files.length === 0 && (
        <div className="empty-state">
          <div>No items in this folder</div>
        </div>
      )}
      
      {files.map(item => (
        <div 
          key={item.path} 
          className="file-list-item"
          onClick={() => onFileClick(item.path)}
        >
          <div className="file-name">
            {item.type === 'folder' ? '📁 ' : '📄 '}
            {item.type === 'file' && item.objectId ? item.objectId : item.name}
          </div>
          <div className="file-meta">
            {item.type === 'folder' ? 'Folder' : `Modified: ${new Date(item.modified).toLocaleDateString()}`}
          </div>
        </div>
      ))}
    </div>
  );
}

// Gherkin interfaces for structured editing
interface GherkinStep {
  keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
  text: string;
}

interface GherkinScenario {
  title: string;
  steps: GherkinStep[];
}

interface GherkinRule {
  title: string;
  examples: GherkinScenario[];
}

interface ParsedFeatureContent {
  background: GherkinStep[];
  rules: GherkinRule[];
  scenarios: GherkinScenario[];
  otherContent: string; // Non-Gherkin content
}

// Parse Gherkin from feature content
function parseFeatureContent(content: string): ParsedFeatureContent {
  const result: ParsedFeatureContent = {
    background: [],
    rules: [],
    scenarios: [],
    otherContent: ''
  };

  // Extract all Gherkin code blocks
  const gherkinBlockRegex = /```gherkin\s*\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  
  while ((match = gherkinBlockRegex.exec(content)) !== null) {
    blocks.push(match[1]);
  }

  // Parse each block
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    let i = 0;
    let currentScenario: GherkinScenario | null = null;
    let currentRule: GherkinRule | null = null;
    let inBackground = false;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('Feature:')) {
        i++;
        continue;
      }

      if (line.startsWith('Background:')) {
        inBackground = true;
        i++;
        continue;
      }

      if (line.startsWith('Rule:')) {
        if (currentScenario && !currentRule) {
          result.scenarios.push(currentScenario);
          currentScenario = null;
        }
        if (currentRule) {
          result.rules.push(currentRule);
        }
        currentRule = {
          title: line.substring(5).trim(),
          examples: []
        };
        inBackground = false;
        i++;
        continue;
      }

      if (line.startsWith('Scenario:') || line.startsWith('Example:')) {
        if (currentScenario) {
          if (currentRule) {
            currentRule.examples.push(currentScenario);
          } else {
            result.scenarios.push(currentScenario);
          }
        }
        const prefix = line.startsWith('Scenario:') ? 'Scenario:' : 'Example:';
        currentScenario = {
          title: line.substring(prefix.length).trim(),
          steps: []
        };
        inBackground = false;
        i++;
        continue;
      }

      // Parse steps
      const stepMatch = /^(Given|When|Then|And|But)\s+(.*)$/i.exec(line);
      if (stepMatch) {
        const step: GherkinStep = {
          keyword: stepMatch[1].charAt(0).toUpperCase() + stepMatch[1].slice(1).toLowerCase() as any,
          text: stepMatch[2]
        };

        if (inBackground) {
          result.background.push(step);
        } else if (currentScenario) {
          currentScenario.steps.push(step);
        }
      }

      i++;
    }

    // Finalize
    if (currentScenario) {
      if (currentRule) {
        currentRule.examples.push(currentScenario);
      } else {
        result.scenarios.push(currentScenario);
      }
    }
    if (currentRule) {
      result.rules.push(currentRule);
    }
  }

  // Extract non-Gherkin content
  const withoutGherkin = content.replace(/```gherkin\s*\n[\s\S]*?```/g, '').trim();
  result.otherContent = withoutGherkin;

  return result;
}

// Serialize back to Gherkin markdown
function serializeFeatureContent(parsed: ParsedFeatureContent): string {
  const gherkinBlocks: string[] = [];

  // Background
  if (parsed.background.length > 0) {
    let block = 'Background:\n';
    for (const step of parsed.background) {
      block += `  ${step.keyword} ${step.text}\n`;
    }
    gherkinBlocks.push('```gherkin\n' + block.trim() + '\n```');
  }

  // Rules
  for (const rule of parsed.rules) {
    let block = `Rule: ${rule.title}\n`;
    for (const example of rule.examples) {
      block += `  Example: ${example.title}\n`;
      for (const step of example.steps) {
        block += `    ${step.keyword} ${step.text}\n`;
      }
      block += '\n';
    }
    gherkinBlocks.push('```gherkin\n' + block.trim() + '\n```');
  }

  // Scenarios
  for (const scenario of parsed.scenarios) {
    let block = `Scenario: ${scenario.title}\n`;
    for (const step of scenario.steps) {
      block += `  ${step.keyword} ${step.text}\n`;
    }
    gherkinBlocks.push('```gherkin\n' + block.trim() + '\n```');
  }

  return gherkinBlocks.join('\n\n');
}

interface ParsedContextContent {
  instructions: string; // Markdown content outside gherkin blocks
  background: GherkinStep[];
  rules: GherkinRule[];
  scenarios: GherkinScenario[];
}

// Parse Context content (instructions + gherkin)
function parseContextContent(content: string): ParsedContextContent {
  const result: ParsedContextContent = {
    instructions: '',
    background: [],
    rules: [],
    scenarios: []
  };

  // Extract all Gherkin code blocks
  const gherkinBlockRegex = /```gherkin\s*\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  
  while ((match = gherkinBlockRegex.exec(content)) !== null) {
    blocks.push(match[1]);
  }

  // Extract instructions (everything outside gherkin blocks)
  const withoutGherkin = content.replace(/```gherkin\s*\n[\s\S]*?```/g, '').trim();
  result.instructions = withoutGherkin;

  // Parse each gherkin block
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    let i = 0;
    let currentScenario: GherkinScenario | null = null;
    let currentRule: GherkinRule | null = null;
    let inBackground = false;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('Feature:')) {
        i++;
        continue;
      }

      if (line.startsWith('Background:')) {
        inBackground = true;
        i++;
        continue;
      }

      if (line.startsWith('Rule:')) {
        if (currentScenario && !currentRule) {
          result.scenarios.push(currentScenario);
          currentScenario = null;
        }
        if (currentRule) {
          result.rules.push(currentRule);
        }
        currentRule = {
          title: line.substring(5).trim(),
          examples: []
        };
        inBackground = false;
        i++;
        continue;
      }

      if (line.startsWith('Scenario:') || line.startsWith('Example:')) {
        if (currentScenario) {
          if (currentRule) {
            currentRule.examples.push(currentScenario);
          } else {
            result.scenarios.push(currentScenario);
          }
        }
        const prefix = line.startsWith('Scenario:') ? 'Scenario:' : 'Example:';
        currentScenario = {
          title: line.substring(prefix.length).trim(),
          steps: []
        };
        inBackground = false;
        i++;
        continue;
      }

      // Parse steps
      const stepMatch = /^(Given|When|Then|And|But)\s+(.*)$/i.exec(line);
      if (stepMatch) {
        const step: GherkinStep = {
          keyword: stepMatch[1].charAt(0).toUpperCase() + stepMatch[1].slice(1).toLowerCase() as any,
          text: stepMatch[2]
        };

        if (inBackground) {
          result.background.push(step);
        } else if (currentScenario) {
          currentScenario.steps.push(step);
        }
      }

      i++;
    }

    // Finalize
    if (currentScenario) {
      if (currentRule) {
        currentRule.examples.push(currentScenario);
      } else {
        result.scenarios.push(currentScenario);
      }
    }
    if (currentRule) {
      result.rules.push(currentRule);
    }
  }

  return result;
}

// Serialize Context content back to markdown
function serializeContextContent(parsed: ParsedContextContent): string {
  const parts: string[] = [];

  // Add instructions section if present
  if (parsed.instructions.trim()) {
    parts.push(parsed.instructions.trim());
  }

  // Build gherkin blocks
  const gherkinBlocks: string[] = [];

  // Background
  if (parsed.background.length > 0) {
    let block = 'Background:\n';
    for (const step of parsed.background) {
      block += `  ${step.keyword} ${step.text}\n`;
    }
    gherkinBlocks.push('```gherkin\n' + block.trim() + '\n```');
  }

  // Rules
  for (const rule of parsed.rules) {
    let block = `Rule: ${rule.title}\n`;
    for (const example of rule.examples) {
      block += `  Example: ${example.title}\n`;
      for (const step of example.steps) {
        block += `    ${step.keyword} ${step.text}\n`;
      }
      block += '\n';
    }
    gherkinBlocks.push('```gherkin\n' + block.trim() + '\n```');
  }

  // Scenarios
  for (const scenario of parsed.scenarios) {
    let block = `Scenario: ${scenario.title}\n`;
    for (const step of scenario.steps) {
      block += `  ${step.keyword} ${step.text}\n`;
    }
    gherkinBlocks.push('```gherkin\n' + block.trim() + '\n```');
  }

  // Combine instructions and gherkin blocks
  if (gherkinBlocks.length > 0) {
    if (parts.length > 0) {
      parts.push(''); // Add spacing between instructions and gherkin
    }
    parts.push(...gherkinBlocks);
  }

  return parts.join('\n\n');
}

// GherkinStepRow Component
function GherkinStepRow({ 
  step, 
  index, 
  totalSteps,
  readOnly, 
  onUpdate, 
  onMoveUp, 
  onMoveDown, 
  onDelete 
}: {
  step: GherkinStep;
  index: number;
  totalSteps: number;
  readOnly: boolean;
  onUpdate: (keyword: string, text: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  if (readOnly) {
    return (
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        padding: '8px 12px', 
        background: 'var(--vscode-editor-background)',
        border: '1px solid var(--vscode-panel-border)',
        borderRadius: 4,
        marginBottom: 4,
        alignItems: 'center'
      }}>
        <span style={{ 
          fontWeight: 600, 
          color: 'var(--vscode-charts-blue)',
          minWidth: 60,
          fontSize: 12
        }}>
          {step.keyword}
        </span>
        <span style={{ flex: 1, fontSize: 13 }}>{step.text}</span>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      gap: 8, 
      marginBottom: 8,
      alignItems: 'center'
    }}>
      <select
        className="form-input"
        value={step.keyword}
        onChange={(e) => onUpdate(e.target.value, step.text)}
        style={{ width: 100, fontSize: 12 }}
      >
        <option value="Given">Given</option>
        <option value="When">When</option>
        <option value="Then">Then</option>
        <option value="And">And</option>
        <option value="But">But</option>
      </select>
      <input
        className="form-input"
        value={step.text}
        onChange={(e) => onUpdate(step.keyword, e.target.value)}
        style={{ flex: 1, fontSize: 13 }}
      />
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          className="btn btn-secondary"
          onClick={onMoveUp}
          disabled={index === 0}
          style={{ padding: '4px 8px', fontSize: 12 }}
          title="Move up"
        >
          ↑
        </button>
        <button
          className="btn btn-secondary"
          onClick={onMoveDown}
          disabled={index === totalSteps - 1}
          style={{ padding: '4px 8px', fontSize: 12 }}
          title="Move down"
        >
          ↓
        </button>
        <button
          className="btn btn-secondary"
          onClick={onDelete}
          style={{ padding: '4px 8px', fontSize: 12, color: 'var(--vscode-errorForeground)' }}
          title="Delete step"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// BackgroundSection Component
function BackgroundSection({ 
  steps, 
  readOnly, 
  onChange 
}: {
  steps: GherkinStep[];
  readOnly: boolean;
  onChange: (steps: GherkinStep[]) => void;
}) {
  const updateStep = (index: number, keyword: string, text: string) => {
    const newSteps = [...steps];
    newSteps[index] = { keyword: keyword as any, text };
    onChange(newSteps);
  };

  const moveStepUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    onChange(newSteps);
  };

  const moveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    onChange(newSteps);
  };

  const deleteStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    onChange(newSteps);
  };

  const addStep = () => {
    onChange([...steps, { keyword: 'Given', text: '' }]);
  };

  if (steps.length === 0 && readOnly) {
    return null;
  }

  return (
    <div className="content-section">
      <h3 className="section-title">Background</h3>
      {steps.length === 0 && !readOnly && (
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
          No background defined
        </div>
      )}
      {steps.map((step, index) => (
        <GherkinStepRow
          key={index}
          step={step}
          index={index}
          totalSteps={steps.length}
          readOnly={readOnly}
          onUpdate={(keyword, text) => updateStep(index, keyword, text)}
          onMoveUp={() => moveStepUp(index)}
          onMoveDown={() => moveStepDown(index)}
          onDelete={() => deleteStep(index)}
        />
      ))}
      {!readOnly && (
        <button 
          className="btn btn-secondary" 
          onClick={addStep}
          style={{ marginTop: 8, fontSize: 12 }}
        >
          + Add Background Step
        </button>
      )}
    </div>
  );
}

// ExampleScenario Component (used within Rules)
function ExampleScenario({ 
  example, 
  readOnly,
  onUpdate,
  onDelete
}: {
  example: GherkinScenario;
  readOnly: boolean;
  onUpdate: (example: GherkinScenario) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = React.useState(true);

  const updateStep = (index: number, keyword: string, text: string) => {
    const newSteps = [...example.steps];
    newSteps[index] = { keyword: keyword as any, text };
    onUpdate({ ...example, steps: newSteps });
  };

  const moveStepUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...example.steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    onUpdate({ ...example, steps: newSteps });
  };

  const moveStepDown = (index: number) => {
    if (index === example.steps.length - 1) return;
    const newSteps = [...example.steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    onUpdate({ ...example, steps: newSteps });
  };

  const deleteStep = (index: number) => {
    const newSteps = example.steps.filter((_, i) => i !== index);
    onUpdate({ ...example, steps: newSteps });
  };

  const addStep = () => {
    onUpdate({ ...example, steps: [...example.steps, { keyword: 'Given', text: '' }] });
  };

  const updateTitle = (title: string) => {
    onUpdate({ ...example, title });
  };

  return (
    <div style={{ 
      marginLeft: 20, 
      marginBottom: 16,
      border: '1px solid var(--vscode-panel-border)',
      borderRadius: 4,
      overflow: 'hidden'
    }}>
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          padding: '10px 12px',
          background: 'var(--vscode-editor-background)',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--vscode-panel-border)' : 'none'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ marginRight: 8, fontSize: 12 }}>
          {expanded ? '▼' : '▶'}
        </span>
        {readOnly ? (
          <span style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>Example: {example.title}</span>
        ) : (
          <input
            className="form-input"
            value={example.title}
            onChange={(e) => updateTitle(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Example title"
            style={{ flex: 1, fontSize: 13, background: 'transparent', border: 'none', padding: 0 }}
          />
        )}
        {!readOnly && (
          <button
            className="btn btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{ padding: '4px 8px', fontSize: 12, marginLeft: 8 }}
          >
            Delete Example
          </button>
        )}
      </div>
      {expanded && (
        <div style={{ padding: 12 }}>
          {example.steps.map((step, index) => (
            <GherkinStepRow
              key={index}
              step={step}
              index={index}
              totalSteps={example.steps.length}
              readOnly={readOnly}
              onUpdate={(keyword, text) => updateStep(index, keyword, text)}
              onMoveUp={() => moveStepUp(index)}
              onMoveDown={() => moveStepDown(index)}
              onDelete={() => deleteStep(index)}
            />
          ))}
          {!readOnly && (
            <button 
              className="btn btn-secondary" 
              onClick={addStep}
              style={{ marginTop: 8, fontSize: 12 }}
            >
              + Add Step
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// RulesSection Component
function RulesSection({ 
  rules, 
  readOnly, 
  onChange 
}: {
  rules: GherkinRule[];
  readOnly: boolean;
  onChange: (rules: GherkinRule[]) => void;
}) {
  const [expandedRules, setExpandedRules] = React.useState<Set<number>>(new Set([0]));

  const toggleRule = (index: number) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRules(newExpanded);
  };

  const updateRule = (index: number, rule: GherkinRule) => {
    const newRules = [...rules];
    newRules[index] = rule;
    onChange(newRules);
  };

  const updateRuleTitle = (index: number, title: string) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], title };
    onChange(newRules);
  };

  const deleteRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  const addRule = () => {
    onChange([...rules, { title: 'New Rule', examples: [] }]);
  };

  const addExampleToRule = (ruleIndex: number) => {
    const newRules = [...rules];
    newRules[ruleIndex].examples.push({ title: 'New Example', steps: [] });
    onChange(newRules);
  };

  const updateExample = (ruleIndex: number, exampleIndex: number, example: GherkinScenario) => {
    const newRules = [...rules];
    newRules[ruleIndex].examples[exampleIndex] = example;
    onChange(newRules);
  };

  const deleteExample = (ruleIndex: number, exampleIndex: number) => {
    const newRules = [...rules];
    newRules[ruleIndex].examples = newRules[ruleIndex].examples.filter((_, i) => i !== exampleIndex);
    onChange(newRules);
  };

  if (rules.length === 0 && readOnly) {
    return null;
  }

  return (
    <div className="content-section">
      <h3 className="section-title">Rules</h3>
      {rules.length === 0 && !readOnly && (
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
          No rules defined
        </div>
      )}
      {rules.map((rule, ruleIndex) => (
        <div 
          key={ruleIndex} 
          style={{ 
            marginBottom: 16,
            border: '1px solid var(--vscode-panel-border)',
            borderRadius: 4,
            overflow: 'hidden'
          }}
        >
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--vscode-sideBar-background)',
              cursor: 'pointer',
              borderBottom: expandedRules.has(ruleIndex) ? '1px solid var(--vscode-panel-border)' : 'none'
            }}
            onClick={() => toggleRule(ruleIndex)}
          >
            <span style={{ marginRight: 8 }}>
              {expandedRules.has(ruleIndex) ? '▼' : '▶'}
            </span>
            {readOnly ? (
              <span style={{ flex: 1, fontWeight: 600 }}>Rule: {rule.title}</span>
            ) : (
              <input
                className="form-input"
                value={rule.title}
                onChange={(e) => updateRuleTitle(ruleIndex, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Rule title"
                style={{ flex: 1, background: 'transparent', border: 'none', padding: 0, fontWeight: 600 }}
              />
            )}
            {!readOnly && (
              <button
                className="btn btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteRule(ruleIndex);
                }}
                style={{ padding: '4px 8px', fontSize: 12, marginLeft: 8 }}
              >
                Delete Rule
              </button>
            )}
          </div>
          {expandedRules.has(ruleIndex) && (
            <div style={{ padding: 16 }}>
              {rule.examples.length === 0 && (
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
                  No examples for this rule
                </div>
              )}
              {rule.examples.map((example, exampleIndex) => (
                <ExampleScenario
                  key={exampleIndex}
                  example={example}
                  readOnly={readOnly}
                  onUpdate={(ex) => updateExample(ruleIndex, exampleIndex, ex)}
                  onDelete={() => deleteExample(ruleIndex, exampleIndex)}
                />
              ))}
              {!readOnly && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => addExampleToRule(ruleIndex)}
                  style={{ marginTop: 8, fontSize: 12 }}
                >
                  + Add Example to Rule
                </button>
              )}
            </div>
          )}
        </div>
      ))}
      {!readOnly && (
        <button 
          className="btn btn-secondary" 
          onClick={addRule}
          style={{ marginTop: 8, fontSize: 12 }}
        >
          + Add Rule
        </button>
      )}
    </div>
  );
}

// ScenariosSection Component
function ScenariosSection({ 
  scenarios, 
  readOnly, 
  onChange 
}: {
  scenarios: GherkinScenario[];
  readOnly: boolean;
  onChange: (scenarios: GherkinScenario[]) => void;
}) {
  const [expandedScenarios, setExpandedScenarios] = React.useState<Set<number>>(new Set([0]));

  const toggleScenario = (index: number) => {
    const newExpanded = new Set(expandedScenarios);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedScenarios(newExpanded);
  };

  const updateScenario = (index: number, scenario: GherkinScenario) => {
    const newScenarios = [...scenarios];
    newScenarios[index] = scenario;
    onChange(newScenarios);
  };

  const updateScenarioTitle = (index: number, title: string) => {
    const newScenarios = [...scenarios];
    newScenarios[index] = { ...newScenarios[index], title };
    onChange(newScenarios);
  };

  const updateStep = (scenarioIndex: number, stepIndex: number, keyword: string, text: string) => {
    const newScenarios = [...scenarios];
    newScenarios[scenarioIndex].steps[stepIndex] = { keyword: keyword as any, text };
    onChange(newScenarios);
  };

  const moveStepUp = (scenarioIndex: number, stepIndex: number) => {
    if (stepIndex === 0) return;
    const newScenarios = [...scenarios];
    const steps = newScenarios[scenarioIndex].steps;
    [steps[stepIndex - 1], steps[stepIndex]] = [steps[stepIndex], steps[stepIndex - 1]];
    onChange(newScenarios);
  };

  const moveStepDown = (scenarioIndex: number, stepIndex: number) => {
    const newScenarios = [...scenarios];
    const steps = newScenarios[scenarioIndex].steps;
    if (stepIndex === steps.length - 1) return;
    [steps[stepIndex], steps[stepIndex + 1]] = [steps[stepIndex + 1], steps[stepIndex]];
    onChange(newScenarios);
  };

  const deleteStep = (scenarioIndex: number, stepIndex: number) => {
    const newScenarios = [...scenarios];
    newScenarios[scenarioIndex].steps = newScenarios[scenarioIndex].steps.filter((_, i) => i !== stepIndex);
    onChange(newScenarios);
  };

  const addStep = (scenarioIndex: number) => {
    const newScenarios = [...scenarios];
    newScenarios[scenarioIndex].steps.push({ keyword: 'Given', text: '' });
    onChange(newScenarios);
  };

  const deleteScenario = (index: number) => {
    onChange(scenarios.filter((_, i) => i !== index));
  };

  const addScenario = () => {
    onChange([...scenarios, { title: 'New Scenario', steps: [] }]);
  };

  if (scenarios.length === 0 && readOnly) {
    return null;
  }

  return (
    <div className="content-section">
      <h3 className="section-title">Scenarios</h3>
      {scenarios.length === 0 && !readOnly && (
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
          No scenarios defined
        </div>
      )}
      {scenarios.map((scenario, scenarioIndex) => (
        <div 
          key={scenarioIndex} 
          style={{ 
            marginBottom: 16,
            border: '1px solid var(--vscode-panel-border)',
            borderRadius: 4,
            overflow: 'hidden'
          }}
        >
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--vscode-sideBar-background)',
              cursor: 'pointer',
              borderBottom: expandedScenarios.has(scenarioIndex) ? '1px solid var(--vscode-panel-border)' : 'none'
            }}
            onClick={() => toggleScenario(scenarioIndex)}
          >
            <span style={{ marginRight: 8 }}>
              {expandedScenarios.has(scenarioIndex) ? '▼' : '▶'}
            </span>
            {readOnly ? (
              <span style={{ flex: 1, fontWeight: 600 }}>Scenario: {scenario.title}</span>
            ) : (
              <input
                className="form-input"
                value={scenario.title}
                onChange={(e) => updateScenarioTitle(scenarioIndex, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Scenario title"
                style={{ flex: 1, background: 'transparent', border: 'none', padding: 0, fontWeight: 600 }}
              />
            )}
            {!readOnly && (
              <button
                className="btn btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteScenario(scenarioIndex);
                }}
                style={{ padding: '4px 8px', fontSize: 12, marginLeft: 8 }}
              >
                Delete Scenario
              </button>
            )}
          </div>
          {expandedScenarios.has(scenarioIndex) && (
            <div style={{ padding: 16 }}>
              {scenario.steps.length === 0 && (
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
                  No steps in this scenario
                </div>
              )}
              {scenario.steps.map((step, stepIndex) => (
                <GherkinStepRow
                  key={stepIndex}
                  step={step}
                  index={stepIndex}
                  totalSteps={scenario.steps.length}
                  readOnly={readOnly}
                  onUpdate={(keyword, text) => updateStep(scenarioIndex, stepIndex, keyword, text)}
                  onMoveUp={() => moveStepUp(scenarioIndex, stepIndex)}
                  onMoveDown={() => moveStepDown(scenarioIndex, stepIndex)}
                  onDelete={() => deleteStep(scenarioIndex, stepIndex)}
                />
              ))}
              {!readOnly && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => addStep(scenarioIndex)}
                  style={{ marginTop: 8, fontSize: 12 }}
                >
                  + Add Step
                </button>
              )}
            </div>
          )}
        </div>
      ))}
      {!readOnly && (
        <button 
          className="btn btn-secondary" 
          onClick={addScenario}
          style={{ marginTop: 8, fontSize: 12 }}
        >
          + Add Scenario
        </button>
      )}
    </div>
  );
}

/**
 * Extract nomnoml code blocks from markdown content
 * Returns an array of sections alternating between text and nomnoml blocks
 */
function extractNomnomlBlocks(content: string): Array<{ type: 'text' | 'nomnoml'; content: string }> {
  const sections: Array<{ type: 'text' | 'nomnoml'; content: string }> = [];
  const nomnomlRegex = /```nomnoml\n([\s\S]*?)```/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = nomnomlRegex.exec(content)) !== null) {
    // Add text before this nomnoml block
    if (match.index > lastIndex) {
      const textContent = content.substring(lastIndex, match.index).trim();
      if (textContent) {
        sections.push({ type: 'text', content: textContent });
      }
    }
    
    // Add the nomnoml block
    sections.push({ type: 'nomnoml', content: match[1] });
    lastIndex = nomnomlRegex.lastIndex;
  }
  
  // Add remaining text after last nomnoml block
  if (lastIndex < content.length) {
    const textContent = content.substring(lastIndex).trim();
    if (textContent) {
      sections.push({ type: 'text', content: textContent });
    }
  }
  
  // If no nomnoml blocks found, return the entire content as text
  if (sections.length === 0) {
    sections.push({ type: 'text', content: content });
  }
  
  return sections;
}

function ItemProfile({ category, fileContent, activeSession, onBack }: {
  category: string;
  fileContent: FileContent;
  activeSession: ActiveSession | null;
  onBack: () => void;
}) {
  const [frontmatter, setFrontmatter] = React.useState(fileContent.frontmatter || {});
  const [content, setContent] = React.useState(fileContent.content || '');
  const [parsedFeature, setParsedFeature] = React.useState<ParsedFeatureContent | null>(null);
  const [parsedContext, setParsedContext] = React.useState<ParsedContextContent | null>(null);
  const [isDirty, setIsDirty] = React.useState(false);
  const [diagramViewMode, setDiagramViewMode] = React.useState<'source' | 'rendered'>('source');
  const isReadOnly = !activeSession;

  React.useEffect(() => {
    setFrontmatter(fileContent.frontmatter || {});
    setContent(fileContent.content || '');
    setIsDirty(false);
    setDiagramViewMode('source'); // Reset to source view when switching files

    // Parse feature content if this is a feature
    if (category === 'features') {
      setParsedFeature(parseFeatureContent(fileContent.content || ''));
      setParsedContext(null);
    } else if (category === 'contexts') {
      setParsedContext(parseContextContent(fileContent.content || ''));
      setParsedFeature(null);
    } else {
      setParsedFeature(null);
      setParsedContext(null);
    }
  }, [fileContent, category]);

  const handleSave = () => {
    let finalContent = content;
    
    // Serialize parsed feature back to content if this is a feature
    if (category === 'features' && parsedFeature) {
      finalContent = serializeFeatureContent(parsedFeature);
    } else if (category === 'contexts' && parsedContext) {
      finalContent = serializeContextContent(parsedContext);
    }

    vscode?.postMessage({
      type: 'saveFileContent',
      filePath: fileContent.path,
      frontmatter,
      content: finalContent
    });
    setIsDirty(false);
  };

  const handleCancel = () => {
    setFrontmatter(fileContent.frontmatter || {});
    setContent(fileContent.content || '');
    if (category === 'features') {
      setParsedFeature(parseFeatureContent(fileContent.content || ''));
      setParsedContext(null);
    } else if (category === 'contexts') {
      setParsedContext(parseContextContent(fileContent.content || ''));
      setParsedFeature(null);
    } else {
      setParsedFeature(null);
      setParsedContext(null);
    }
    setIsDirty(false);
  };

  const updateFrontmatter = (key: string, value: any) => {
    setFrontmatter({ ...frontmatter, [key]: value });
    setIsDirty(true);
  };

  const updateContent = (value: string) => {
    setContent(value);
    setIsDirty(true);
  };

  const updateParsedFeature = (updated: ParsedFeatureContent) => {
    setParsedFeature(updated);
    setIsDirty(true);
  };

  const updateParsedContext = (updated: ParsedContextContent) => {
    setParsedContext(updated);
    setIsDirty(true);
  };

  return (
    <div className="p-16">
      <div className="toolbar">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <span className="font-medium">{fileContent.path.split('/').pop()}</span>
      </div>

      {isReadOnly && (
        <div className="alert alert-info mt-16">
          Read-only mode. Start a design session to edit files.
        </div>
      )}

      <div className="content-section">
        <h3 className="section-title">Metadata</h3>
        {category === 'features' && (
          <FeatureFrontmatter 
            frontmatter={frontmatter} 
            onChange={updateFrontmatter}
            readOnly={isReadOnly}
          />
        )}
        {category === 'specs' && (
          <SpecFrontmatter 
            frontmatter={frontmatter} 
            onChange={updateFrontmatter}
            readOnly={isReadOnly}
          />
        )}
        {category === 'actors' && (
          <ActorFrontmatter 
            frontmatter={frontmatter} 
            onChange={updateFrontmatter}
            readOnly={isReadOnly}
          />
        )}
        {category === 'contexts' && (
          <ContextFrontmatter 
            frontmatter={frontmatter} 
            onChange={updateFrontmatter}
            readOnly={isReadOnly}
          />
        )}
      </div>

      {category === 'features' && parsedFeature ? (
        <>
          <BackgroundSection
            steps={parsedFeature.background}
            readOnly={isReadOnly}
            onChange={(steps) => updateParsedFeature({ ...parsedFeature, background: steps })}
          />
          
          <RulesSection
            rules={parsedFeature.rules}
            readOnly={isReadOnly}
            onChange={(rules) => updateParsedFeature({ ...parsedFeature, rules })}
          />
          
          <ScenariosSection
            scenarios={parsedFeature.scenarios}
            readOnly={isReadOnly}
            onChange={(scenarios) => updateParsedFeature({ ...parsedFeature, scenarios })}
          />
        </>
      ) : category === 'contexts' && parsedContext ? (
        <>
          <div className="content-section">
            <h3 className="section-title">Instructions</h3>
            <textarea
              className="form-textarea"
              value={parsedContext.instructions}
              onChange={(e) => updateParsedContext({ ...parsedContext, instructions: e.target.value })}
              readOnly={isReadOnly}
              placeholder="Enter markdown instructions providing context and guidance..."
              style={{ minHeight: 200, fontFamily: 'monospace' }}
            />
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>
              Markdown content that appears outside gherkin code blocks
            </div>
          </div>

          <BackgroundSection
            steps={parsedContext.background}
            readOnly={isReadOnly}
            onChange={(steps) => updateParsedContext({ ...parsedContext, background: steps })}
          />
          
          <RulesSection
            rules={parsedContext.rules}
            readOnly={isReadOnly}
            onChange={(rules) => updateParsedContext({ ...parsedContext, rules })}
          />
          
          <ScenariosSection
            scenarios={parsedContext.scenarios}
            readOnly={isReadOnly}
            onChange={(scenarios) => updateParsedContext({ ...parsedContext, scenarios })}
          />
        </>
      ) : category === 'specs' && isReadOnly ? (
        <div className="content-section">
          <h3 className="section-title">Content</h3>
          {extractNomnomlBlocks(content).map((section, idx) => (
            <div key={idx} style={{ marginBottom: 24 }}>
              {section.type === 'nomnoml' ? (
                <NomnomlRenderer source={section.content} />
              ) : (
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  fontFamily: 'var(--vscode-editor-font-family)',
                  fontSize: 'var(--vscode-editor-font-size)',
                  lineHeight: 1.6,
                  color: 'var(--vscode-editor-foreground)',
                  background: 'var(--vscode-editor-background)',
                  padding: '12px',
                  border: '1px solid var(--vscode-panel-border)',
                  borderRadius: '4px',
                  margin: 0
                }}>
                  {section.content}
                </pre>
              )}
            </div>
          ))}
        </div>
      ) : category === 'specs' && !isReadOnly ? (
        <div className="content-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="section-title" style={{ margin: 0 }}>Content</h3>
            <div style={{ 
              display: 'inline-flex', 
              background: 'var(--vscode-button-secondaryBackground)',
              border: '1px solid var(--vscode-button-border)',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <button
                onClick={() => setDiagramViewMode('source')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: diagramViewMode === 'source' ? 'var(--vscode-button-background)' : 'transparent',
                  color: diagramViewMode === 'source' ? 'var(--vscode-button-foreground)' : 'var(--vscode-button-secondaryForeground)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: diagramViewMode === 'source' ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                Source
              </button>
              <button
                onClick={() => setDiagramViewMode('rendered')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: diagramViewMode === 'rendered' ? 'var(--vscode-button-background)' : 'transparent',
                  color: diagramViewMode === 'rendered' ? 'var(--vscode-button-foreground)' : 'var(--vscode-button-secondaryForeground)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: diagramViewMode === 'rendered' ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                Render
              </button>
            </div>
          </div>
          {diagramViewMode === 'source' ? (
            <textarea
              className="form-textarea"
              value={content}
              onChange={(e) => updateContent(e.target.value)}
              readOnly={isReadOnly}
              style={{ minHeight: 400 }}
            />
          ) : (
            <>
              {extractNomnomlBlocks(content).map((section, idx) => (
                <div key={idx} style={{ marginBottom: 24 }}>
                  {section.type === 'nomnoml' ? (
                    <NomnomlRenderer source={section.content} />
                  ) : (
                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      fontFamily: 'var(--vscode-editor-font-family)',
                      fontSize: 'var(--vscode-editor-font-size)',
                      lineHeight: 1.6,
                      color: 'var(--vscode-editor-foreground)',
                      background: 'var(--vscode-editor-background)',
                      padding: '12px',
                      border: '1px solid var(--vscode-panel-border)',
                      borderRadius: '4px',
                      margin: 0
                    }}>
                      {section.content}
                    </pre>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="content-section">
          <h3 className="section-title">Content</h3>
          <textarea
            className="form-textarea"
            value={content}
            onChange={(e) => updateContent(e.target.value)}
            readOnly={isReadOnly}
            style={{ minHeight: 400 }}
          />
        </div>
      )}

      {!isReadOnly && (
        <div className="btn-group">
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={!isDirty}
          >
            Save Changes
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleCancel}
            disabled={!isDirty}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function FeatureFrontmatter({ frontmatter, onChange, readOnly }: { 
  frontmatter: any; 
  onChange: (key: string, value: any) => void;
  readOnly: boolean;
}) {
  return (
    <>
      <div className="form-group">
        <label className="form-label">Feature ID</label>
        <input 
          className="form-input"
          value={frontmatter.feature_id || ''}
          onChange={(e) => onChange('feature_id', e.target.value)}
          readOnly={readOnly}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Spec IDs (comma-separated)</label>
        <input 
          className="form-input"
          value={Array.isArray(frontmatter.spec_id) ? frontmatter.spec_id.join(', ') : frontmatter.spec_id || ''}
          onChange={(e) => onChange('spec_id', e.target.value.split(',').map((s: string) => s.trim()))}
          readOnly={readOnly}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Model IDs (comma-separated)</label>
        <input 
          className="form-input"
          value={Array.isArray(frontmatter.model_id) ? frontmatter.model_id.join(', ') : frontmatter.model_id || ''}
          onChange={(e) => onChange('model_id', e.target.value.split(',').map((s: string) => s.trim()))}
          readOnly={readOnly}
        />
      </div>
    </>
  );
}

function SpecFrontmatter({ frontmatter, onChange, readOnly }: { 
  frontmatter: any; 
  onChange: (key: string, value: any) => void;
  readOnly: boolean;
}) {
  return (
    <>
      <div className="form-group">
        <label className="form-label">Spec ID</label>
        <input 
          className="form-input"
          value={frontmatter.spec_id || ''}
          onChange={(e) => onChange('spec_id', e.target.value)}
          readOnly={readOnly}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Feature IDs (comma-separated)</label>
        <input 
          className="form-input"
          value={Array.isArray(frontmatter.feature_id) ? frontmatter.feature_id.join(', ') : frontmatter.feature_id || ''}
          onChange={(e) => onChange('feature_id', e.target.value.split(',').map((s: string) => s.trim()))}
          readOnly={readOnly}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Model IDs (comma-separated)</label>
        <input 
          className="form-input"
          value={Array.isArray(frontmatter.model_id) ? frontmatter.model_id.join(', ') : frontmatter.model_id || ''}
          onChange={(e) => onChange('model_id', e.target.value.split(',').map((s: string) => s.trim()))}
          readOnly={readOnly}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Context IDs (comma-separated)</label>
        <input 
          className="form-input"
          value={Array.isArray(frontmatter.context_id) ? frontmatter.context_id.join(', ') : frontmatter.context_id || ''}
          onChange={(e) => onChange('context_id', e.target.value.split(',').map((s: string) => s.trim()))}
          readOnly={readOnly}
        />
      </div>
    </>
  );
}

function ContextFrontmatter({ frontmatter, onChange, readOnly }: { 
  frontmatter: any; 
  onChange: (key: string, value: any) => void;
  readOnly: boolean;
}) {
  return (
    <>
      <div className="form-group">
        <label className="form-label">Context ID</label>
        <input 
          className="form-input"
          value={frontmatter.context_id || ''}
          onChange={(e) => onChange('context_id', e.target.value)}
          readOnly={readOnly}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Category</label>
        <input 
          className="form-input"
          value={frontmatter.category || ''}
          onChange={(e) => onChange('category', e.target.value)}
          readOnly={readOnly}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Name (optional)</label>
        <input 
          className="form-input"
          value={frontmatter.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          readOnly={readOnly}
          placeholder="Optional human-readable name"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Description (optional)</label>
        <textarea 
          className="form-textarea"
          value={frontmatter.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          readOnly={readOnly}
          placeholder="Optional brief description"
          style={{ minHeight: 60 }}
        />
      </div>
      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', cursor: readOnly ? 'default' : 'pointer', userSelect: 'none' }}>
          <input 
            type="checkbox"
            checked={frontmatter.global || false}
            onChange={(e) => onChange('global', e.target.checked)}
            disabled={readOnly}
            style={{ marginRight: 8, cursor: readOnly ? 'default' : 'pointer' }}
          />
          <span>Global Context</span>
        </label>
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, marginLeft: 24 }}>
          When checked, this context will be automatically included in all distillation prompts
        </div>
      </div>
    </>
  );
}

function ActorFrontmatter({ frontmatter, onChange, readOnly }: { 
  frontmatter: any; 
  onChange: (key: string, value: any) => void;
  readOnly: boolean;
}) {
  return (
    <>
      <div className="form-group">
        <label className="form-label">Actor ID</label>
        <input 
          className="form-input"
          value={frontmatter.actor_id || ''}
          onChange={(e) => onChange('actor_id', e.target.value)}
          readOnly={readOnly}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Type</label>
        <select
          className="form-input"
          value={frontmatter.type || 'user'}
          onChange={(e) => onChange('type', e.target.value)}
          disabled={readOnly}
        >
          <option value="user">User</option>
          <option value="system">System</option>
          <option value="external">External</option>
        </select>
      </div>
    </>
  );
}

function DashboardPage({ counts, activeSession }: { counts: any; activeSession: ActiveSession | null }) {
  return (
    <>
      <h2>Dashboard</h2>
      {activeSession && (
        <div className="card alert-info">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Active Session: {activeSession.sessionId}</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>{activeSession.problemStatement}</div>
          <div style={{ fontSize: 11, marginTop: 8, opacity: 0.7 }}>
            Started: {new Date(activeSession.startTime).toLocaleString()}
          </div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>
            Changed Files: {activeSession.changedFiles.length}
          </div>
          <button 
            className="btn btn-secondary"
            style={{ marginTop: 12 }}
            onClick={() => {
              vscode?.postMessage({ type: 'stopSession' });
            }}
          >
            Stop Session
          </button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <Card title="Sessions" value={counts?.sessions ?? 0} />
        <Card title="Features" value={counts?.features ?? 0} />
        <Card title="Specs" value={counts?.specs ?? 0} />
        <Card title="Actors" value={counts?.actors ?? 0} />
        <Card title="Contexts" value={counts?.contexts ?? 0} />
        <Card title="Stories" value={counts?.stories ?? 0} />
        <Card title="Tasks" value={counts?.tasks ?? 0} />
      </div>
      <div className="card">
        <h3>Quick Start</h3>
        <p>Welcome to Forge Studio - your session-driven design workspace.</p>
        <ol style={{ lineHeight: 1.8 }}>
          <li>Start a design session from the Sessions page</li>
          <li>Design your features and specs during the session</li>
          <li>Forge tracks all changes automatically</li>
          <li>Stop the session and distill it into actionable stories and tasks</li>
          <li>Build each story to implement your changes</li>
        </ol>
      </div>
    </>
  );
}

function SessionsPage({ sessions, activeSession, showNewSessionForm, onShowNewSessionForm, onHideNewSessionForm, onDistillSession }: any) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState('newest');
  const [selectedSession, setSelectedSession] = React.useState<Session | null>(null);
  const itemsPerPage = 10;

  // Sort sessions before pagination
  const sortedSessions = React.useMemo(() => {
    const sessionsCopy = [...sessions];
    
    switch (sortBy) {
      case 'newest':
        // Sort by start_time descending (newest first)
        return sessionsCopy.sort((a, b) => {
          const timeA = a.frontmatter?.start_time ? new Date(a.frontmatter.start_time).getTime() : 0;
          const timeB = b.frontmatter?.start_time ? new Date(b.frontmatter.start_time).getTime() : 0;
          return timeB - timeA;
        });
      
      case 'oldest':
        // Sort by start_time ascending (oldest first)
        return sessionsCopy.sort((a, b) => {
          const timeA = a.frontmatter?.start_time ? new Date(a.frontmatter.start_time).getTime() : 0;
          const timeB = b.frontmatter?.start_time ? new Date(b.frontmatter.start_time).getTime() : 0;
          return timeA - timeB;
        });
      
      case 'status':
        // Sort by status (active > completed > awaiting_implementation > others)
        const statusOrder: { [key: string]: number } = {
          'active': 0,
          'completed': 1,
          'awaiting_implementation': 2
        };
        return sessionsCopy.sort((a, b) => {
          const statusA = a.frontmatter?.status || 'unknown';
          const statusB = b.frontmatter?.status || 'unknown';
          const orderA = statusOrder[statusA] !== undefined ? statusOrder[statusA] : 999;
          const orderB = statusOrder[statusB] !== undefined ? statusOrder[statusB] : 999;
          return orderA - orderB;
        });
      
      case 'id':
        // Sort by session_id alphabetically
        return sessionsCopy.sort((a, b) => {
          const idA = a.sessionId || '';
          const idB = b.sessionId || '';
          return idA.localeCompare(idB);
        });
      
      default:
        return sessionsCopy;
    }
  }, [sessions, sortBy]);

  // Calculate pagination values
  const totalPages = Math.ceil(sortedSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = sortedSessions.slice(startIndex, endIndex);

  // Reset to page 1 when sessions list changes significantly or sort changes
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [sessions.length, currentPage, totalPages, sortBy]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  const handleSessionClick = (sessionId: string) => {
    const session = sessions.find((s: Session) => s.sessionId === sessionId);
    if (session) {
      setSelectedSession(session);
    }
  };

  const handleCloseDetail = () => {
    setSelectedSession(null);
  };

  // If a session is selected, show detail view
  if (selectedSession) {
    return (
      <SessionDetail
        session={selectedSession}
        onClose={handleCloseDetail}
        onDistillSession={onDistillSession}
      />
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Sessions</h2>
        {!activeSession && !showNewSessionForm && (
          <button 
            className="btn btn-primary"
            onClick={onShowNewSessionForm}
          >
            + New Session
          </button>
        )}
      </div>
      
      {!showNewSessionForm && sessions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SortDropdown
            sortBy={sortBy}
            onSortChange={handleSortChange}
          />
        </div>
      )}

      {activeSession && (
        <div className="card alert-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>● Active Session: {activeSession.sessionId}</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>{activeSession.problemStatement}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>
                Started: {new Date(activeSession.startTime).toLocaleString()}
              </div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                Changed Files: {activeSession.changedFiles.length}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  vscode?.postMessage({ type: 'stopSession' });
                }}
              >
                Stop Session
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewSessionForm && (
        <NewSessionForm onCancel={onHideNewSessionForm} />
      )}

      {!showNewSessionForm && (
        <div style={{ marginTop: 24 }}>
          <h3>Recent Sessions</h3>
          {sessions.length === 0 && (
            <div className="empty-state">
              No sessions yet. Create your first design session above.
            </div>
          )}
          {currentSessions.map((session: Session) => (
            <SessionCard
              key={session.sessionId}
              session={session}
              onClick={handleSessionClick}
            />
          ))}
          
          {sessions.length > 0 && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
              onPageClick={handlePageClick}
            />
          )}
        </div>
      )}
    </>
  );
}

function SessionDetail({
  session,
  onClose,
  onDistillSession
}: {
  session: Session;
  onClose: () => void;
  onDistillSession: (sessionId: string) => void;
}) {
  const [sessionContent, setSessionContent] = React.useState<{
    goals: string;
    approach: string;
    keyDecisions: string;
    notes: string;
  } | null>(null);

  // Load full session file content
  React.useEffect(() => {
    const sessionPath = `ai/sessions/${session.sessionId}.session.md`;
    vscode?.postMessage({ type: 'getFileContent', filePath: sessionPath });

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg?.type === 'fileContent' && msg.data?.path?.includes(session.sessionId)) {
        const content = msg.data.content || '';
        
        // Parse sections from markdown content
        const goalsMatch = content.match(/## Goals\s*\n([\s\S]*?)(?=\n## |\n---|\Z)/);
        const approachMatch = content.match(/## Approach\s*\n([\s\S]*?)(?=\n## |\n---|\Z)/);
        const decisionsMatch = content.match(/## Key Decisions\s*\n([\s\S]*?)(?=\n## |\n---|\Z)/);
        const notesMatch = content.match(/## Notes\s*\n([\s\S]*?)(?=\n## |\n---|\Z)/);
        
        setSessionContent({
          goals: goalsMatch ? goalsMatch[1].trim() : '',
          approach: approachMatch ? approachMatch[1].trim() : '',
          keyDecisions: decisionsMatch ? decisionsMatch[1].trim() : '',
          notes: notesMatch ? notesMatch[1].trim() : ''
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [session.sessionId]);

  const status = session.frontmatter?.status || 'unknown';
  const problemStatement = session.frontmatter?.problem_statement || 'No description';
  const startTime = session.frontmatter?.start_time;
  const endTime = session.frontmatter?.end_time;
  const changedFiles = session.frontmatter?.changed_files || [];
  const commandFile = session.frontmatter?.command_file;

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'var(--vscode-charts-green)', fg: 'var(--vscode-editor-background)' };
      case 'completed':
        return { bg: 'var(--vscode-charts-blue)', fg: 'var(--vscode-editor-background)' };
      case 'awaiting_implementation':
        return { bg: 'var(--vscode-charts-orange)', fg: 'var(--vscode-editor-background)' };
      default:
        return { bg: 'var(--vscode-badge-background)', fg: 'var(--vscode-badge-foreground)' };
    }
  };

  const statusColors = getStatusColor(status);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button 
          className="btn btn-secondary"
          onClick={onClose}
          style={{ marginBottom: 16 }}
        >
          ← Back to Sessions
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: 8 }}>{session.sessionId}</h2>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              background: statusColors.bg,
              color: statusColors.fg
            }}>
              {status}
            </div>
          </div>
          {status === 'completed' && !commandFile && (
            <button 
              className="btn btn-primary"
              onClick={() => onDistillSession(session.sessionId)}
            >
              Create Stories Command
            </button>
          )}
        </div>
      </div>

      {/* Problem Statement */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="section-title">Problem Statement</h3>
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          {problemStatement}
        </div>
      </div>

      {/* Timeline */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="section-title">Timeline</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px', fontSize: 13 }}>
          <div style={{ fontWeight: 600 }}>Started:</div>
          <div>{startTime ? new Date(startTime).toLocaleString() : 'Unknown'}</div>
          {endTime && (
            <>
              <div style={{ fontWeight: 600 }}>Ended:</div>
              <div>{new Date(endTime).toLocaleString()}</div>
            </>
          )}
          <div style={{ fontWeight: 600 }}>Changed Files:</div>
          <div>{changedFiles.length} file{changedFiles.length !== 1 ? 's' : ''}</div>
          {commandFile && (
            <>
              <div style={{ fontWeight: 600 }}>Command File:</div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--vscode-textLink-foreground)' }}>
                {commandFile}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Goals */}
      {sessionContent?.goals && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className="section-title">Goals</h3>
          <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {sessionContent.goals}
          </div>
        </div>
      )}

      {/* Approach */}
      {sessionContent?.approach && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className="section-title">Approach</h3>
          <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {sessionContent.approach}
          </div>
        </div>
      )}

      {/* Key Decisions */}
      {sessionContent?.keyDecisions && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className="section-title">Key Decisions</h3>
          <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {sessionContent.keyDecisions}
          </div>
        </div>
      )}

      {/* Notes */}
      {sessionContent?.notes && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className="section-title">Notes</h3>
          <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {sessionContent.notes}
          </div>
        </div>
      )}

      {/* Changed Files */}
      {changedFiles.length > 0 && (
        <ChangedFilesSection files={changedFiles} />
      )}
    </div>
  );
}

function ChangedFilesSection({ files }: { files: string[] }) {
  // Group files by type
  const groupedFiles = React.useMemo(() => {
    const groups: {
      features: string[];
      specs: string[];
      actors: string[];
      contexts: string[];
      sessions: string[];
      tickets: string[];
      other: string[];
    } = {
      features: [],
      specs: [],
      actors: [],
      contexts: [],
      sessions: [],
      tickets: [],
      other: []
    };

    files.forEach(file => {
      const normalizedPath = file.replace(/\\/g, '/');
      
      if (normalizedPath.includes('/features/')) {
        groups.features.push(file);
      } else if (normalizedPath.includes('/specs/')) {
        groups.specs.push(file);
      } else if (normalizedPath.includes('/actors/')) {
        groups.actors.push(file);
      } else if (normalizedPath.includes('/contexts/')) {
        groups.contexts.push(file);
      } else if (normalizedPath.includes('/sessions/')) {
        groups.sessions.push(file);
      } else if (normalizedPath.includes('/tickets/')) {
        groups.tickets.push(file);
      } else {
        groups.other.push(file);
      }
    });

    return groups;
  }, [files]);

  const handleFileClick = (filePath: string) => {
    vscode?.postMessage({ type: 'openFile', filePath });
  };

  const FileGroup = ({ 
    title, 
    files, 
    icon 
  }: { 
    title: string; 
    files: string[]; 
    icon: string;
  }) => {
    if (files.length === 0) return null;

    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ 
          fontSize: 12, 
          fontWeight: 600, 
          marginBottom: 8,
          color: 'var(--vscode-textLink-foreground)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span>{icon}</span>
          <span>{title}</span>
          <span style={{ 
            opacity: 0.7, 
            fontWeight: 400,
            fontSize: 11
          }}>
            ({files.length})
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {files.map((file, index) => (
            <FileItem key={index} filePath={file} onClick={() => handleFileClick(file)} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 className="section-title">Changed Files ({files.length})</h3>
      
      <FileGroup title="Features" files={groupedFiles.features} icon="✨" />
      <FileGroup title="Specifications" files={groupedFiles.specs} icon="📐" />
      <FileGroup title="Actors" files={groupedFiles.actors} icon="👤" />
      <FileGroup title="Contexts" files={groupedFiles.contexts} icon="🔧" />
      <FileGroup title="Sessions" files={groupedFiles.sessions} icon="📅" />
      <FileGroup title="Stories & Tasks" files={groupedFiles.tickets} icon="📋" />
      <FileGroup title="Other" files={groupedFiles.other} icon="📄" />
    </div>
  );
}

function FileItem({ 
  filePath, 
  onClick 
}: { 
  filePath: string; 
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [exists, setExists] = React.useState(true);

  // Check file existence
  React.useEffect(() => {
    // Request file existence check
    vscode?.postMessage({ type: 'checkFileExists', filePath });

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg?.type === 'fileExists' && msg.filePath === filePath) {
        setExists(msg.exists);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [filePath]);

  // Get relative path from project root (remove workspace path if present)
  const getDisplayPath = (path: string) => {
    // Normalize path separators
    const normalized = path.replace(/\\/g, '/');
    
    // If path starts with ai/, return as is
    if (normalized.startsWith('ai/')) {
      return normalized;
    }
    
    // If path contains /ai/, extract from there
    const aiIndex = normalized.indexOf('/ai/');
    if (aiIndex !== -1) {
      return normalized.substring(aiIndex + 1);
    }
    
    // Otherwise return the full path
    return normalized;
  };

  const displayPath = getDisplayPath(filePath);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '6px 10px',
        fontSize: 11,
        fontFamily: 'monospace',
        background: isHovered 
          ? 'var(--vscode-list-hoverBackground)' 
          : 'var(--vscode-editor-background)',
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'background 0.1s ease',
        color: exists 
          ? 'var(--vscode-textLink-foreground)' 
          : 'var(--vscode-disabledForeground)',
        textDecoration: exists ? 'none' : 'line-through',
        opacity: exists ? 1 : 0.6,
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}
      title={exists ? `Click to open: ${displayPath}` : `File no longer exists: ${displayPath}`}
    >
      <span style={{ opacity: 0.7 }}>
        {exists ? '📄' : '⚠️'}
      </span>
      <span>{displayPath}</span>
    </div>
  );
}

function SessionCard({
  session,
  onClick
}: {
  session: Session;
  onClick: (sessionId: string) => void;
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  
  // Truncate problem statement to 80 characters
  const problemStatement = session.frontmatter?.problem_statement || 'No description';
  const truncatedStatement = problemStatement.length > 80 
    ? problemStatement.substring(0, 80) + '...' 
    : problemStatement;
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return {
          background: 'var(--vscode-charts-green)',
          color: 'var(--vscode-editor-background)'
        };
      case 'completed':
        return {
          background: 'var(--vscode-charts-blue)',
          color: 'var(--vscode-editor-background)'
        };
      case 'awaiting_implementation':
        return {
          background: 'var(--vscode-charts-orange)',
          color: 'var(--vscode-editor-background)'
        };
      default:
        return {
          background: 'var(--vscode-badge-background)',
          color: 'var(--vscode-badge-foreground)'
        };
    }
  };
  
  const status = session.frontmatter?.status || 'unknown';
  const statusColors = getStatusColor(status);
  const fileCount = session.frontmatter?.changed_files?.length || 0;
  const hasCommand = !!session.frontmatter?.command_file;
  
  // Format start time
  const formatStartTime = (startTime: string) => {
    if (!startTime) return 'Unknown';
    const date = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const startTime = session.frontmatter?.start_time;
  const formattedTime = formatStartTime(startTime);
  
  return (
    <div
      onClick={() => onClick(session.sessionId)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: 12,
        marginBottom: 8,
        border: `1px solid ${isHovered ? 'var(--vscode-focusBorder)' : 'var(--vscode-panel-border)'}`,
        borderRadius: 4,
        background: 'var(--vscode-editor-background)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: isHovered ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none',
        transform: isHovered ? 'translateY(-1px)' : 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 600, 
            fontSize: 13, 
            marginBottom: 4,
            color: 'var(--vscode-textLink-foreground)'
          }}>
            {session.sessionId}
          </div>
          <div style={{ 
            fontSize: 12, 
            opacity: 0.85,
            lineHeight: 1.4
          }}>
            {truncatedStatement}
          </div>
        </div>
        <div style={{
          marginLeft: 12,
          padding: '2px 8px',
          borderRadius: 3,
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          background: statusColors.background,
          color: statusColors.color,
          whiteSpace: 'nowrap'
        }}>
          {status}
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        fontSize: 11, 
        opacity: 0.7,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>🕐</span>
          <span>{formattedTime}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>📁</span>
          <span>{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
        </div>
        {hasCommand && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4,
            color: 'var(--vscode-charts-green)',
            opacity: 1
          }}>
            <span>✓</span>
            <span>Command Created</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SortDropdown({
  sortBy,
  onSortChange
}: {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <label 
        htmlFor="sort-select" 
        style={{ 
          fontSize: 12, 
          opacity: 0.8,
          fontWeight: 500
        }}
      >
        Sort by:
      </label>
      <select
        id="sort-select"
        className="form-input"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        style={{
          fontSize: 12,
          padding: '6px 8px',
          maxWidth: 280
        }}
      >
        <option value="newest">Start Time (Newest First)</option>
        <option value="oldest">Start Time (Oldest First)</option>
        <option value="status">Status</option>
        <option value="id">Session ID</option>
      </select>
    </div>
  );
}

function Pagination({ 
  currentPage, 
  totalPages, 
  onPrevious, 
  onNext, 
  onPageClick 
}: {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  onPageClick: (page: number) => void;
}) {
  // Generate page numbers to display (show max 7 page buttons)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxButtons = 7;
    
    if (totalPages <= maxButtons) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show current page with context
      const leftSiblings = 2;
      const rightSiblings = 2;
      
      if (currentPage <= 3) {
        // Near start
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-2); // Ellipsis
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginTop: 24,
      paddingBottom: 16
    }}>
      <button
        className="btn btn-secondary"
        onClick={onPrevious}
        disabled={currentPage === 1}
        style={{
          fontSize: 12,
          padding: '6px 12px',
          opacity: currentPage === 1 ? 0.5 : 1,
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
        }}
      >
        Previous
      </button>
      
      <div style={{ display: 'flex', gap: 4 }}>
        {pageNumbers.map((page, index) => {
          if (page < 0) {
            // Ellipsis
            return (
              <span 
                key={`ellipsis-${index}`}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  opacity: 0.5
                }}
              >
                ...
              </span>
            );
          }
          
          return (
            <button
              key={page}
              className="btn btn-secondary"
              onClick={() => onPageClick(page)}
              style={{
                fontSize: 12,
                padding: '6px 12px',
                background: currentPage === page 
                  ? 'var(--vscode-button-background)' 
                  : 'var(--vscode-button-secondaryBackground)',
                color: currentPage === page 
                  ? 'var(--vscode-button-foreground)' 
                  : 'var(--vscode-button-secondaryForeground)',
                fontWeight: currentPage === page ? 600 : 400
              }}
            >
              {page}
            </button>
          );
        })}
      </div>
      
      <button
        className="btn btn-secondary"
        onClick={onNext}
        disabled={currentPage === totalPages}
        style={{
          fontSize: 12,
          padding: '6px 12px',
          opacity: currentPage === totalPages ? 0.5 : 1,
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
        }}
      >
        Next
      </button>
    </div>
  );
}

function NewSessionForm({ onCancel }: { onCancel: () => void }) {
  const [problemStatement, setProblemStatement] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problemStatement.trim()) {
      vscode?.postMessage({ 
        type: 'createSession', 
        problemStatement: problemStatement.trim() 
      });
    }
  };

  return (
    <div className="card">
      <h3>Start New Design Session</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            What problem are you trying to solve?
          </label>
          <textarea
            className="form-textarea"
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            placeholder="e.g., Implement user authentication with email verification"
            style={{ minHeight: 100 }}
            autoFocus
          />
        </div>
        <div className="btn-group">
          <button 
            type="submit"
            disabled={!problemStatement.trim()}
            className="btn btn-primary"
          >
            Start Session
          </button>
          <button 
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="card" style={{ minWidth: 140 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function SessionPanel({ session, minimized, onToggleMinimize }: { 
  session: ActiveSession; 
  minimized: boolean; 
  onToggleMinimize: () => void;
}) {
  const [problemStatement, setProblemStatement] = React.useState(session.problemStatement);
  const [goals, setGoals] = React.useState('');
  const [approach, setApproach] = React.useState('');
  const [keyDecisions, setKeyDecisions] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load session file content on mount
  React.useEffect(() => {
    const loadSessionContent = async () => {
      // Request the full session file content via getFileContent
      const sessionPath = `ai/sessions/${session.sessionId}.session.md`;
      vscode?.postMessage({ type: 'getFileContent', filePath: sessionPath });
    };
    
    if (!isLoaded) {
      loadSessionContent();
    }

    // Listen for file content response
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg?.type === 'fileContent' && msg.data?.path?.includes(session.sessionId)) {
        const content = msg.data.content || '';
        
        // Parse sections from markdown content
        const goalsMatch = content.match(/## Goals\s*\n([\s\S]*?)(?=\n## |\n---|\Z)/);
        const approachMatch = content.match(/## Approach\s*\n([\s\S]*?)(?=\n## |\n---|\Z)/);
        const decisionsMatch = content.match(/## Key Decisions\s*\n([\s\S]*?)(?=\n## |\n---|\Z)/);
        const notesMatch = content.match(/## Notes\s*\n([\s\S]*?)(?=\n## |\n---|\Z)/);
        
        setGoals(goalsMatch ? goalsMatch[1].trim() : '');
        setApproach(approachMatch ? approachMatch[1].trim() : '');
        setKeyDecisions(decisionsMatch ? decisionsMatch[1].trim() : '');
        setNotes(notesMatch ? notesMatch[1].trim() : '');
        setProblemStatement(msg.data.frontmatter?.problem_statement || session.problemStatement);
        setIsLoaded(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [session.sessionId, isLoaded]);

  // Debounced save function
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const handleSave = React.useCallback(() => {
    const content = `## Problem Statement

${problemStatement}

## Goals

${goals}

## Approach

${approach}

## Key Decisions

${keyDecisions}

## Notes

${notes}
`;

    const frontmatter = {
      session_id: session.sessionId,
      start_time: session.startTime,
      status: 'active',
      problem_statement: problemStatement,
      changed_files: session.changedFiles
    };

    vscode?.postMessage({ 
      type: 'updateSession', 
      frontmatter, 
      content 
    });
  }, [session, problemStatement, goals, approach, keyDecisions, notes]);

  const debouncedSave = React.useCallback((value: string, setter: (v: string) => void) => {
    setter(value);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 500);
  }, [handleSave]);

  const handleEndSession = () => {
    // Send message to extension to show native confirmation dialog
    vscode?.postMessage({ type: 'stopSession' });
  };

  if (minimized) {
    return (
      <div style={{
        width: 40,
        borderLeft: '1px solid var(--vscode-panel-border)',
        background: 'var(--vscode-sideBar-background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0'
      }}>
        <button
          onClick={onToggleMinimize}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--vscode-foreground)',
            cursor: 'pointer',
            fontSize: 16,
            padding: 8,
            transform: 'rotate(180deg)',
            writingMode: 'vertical-rl'
          }}
          title="Expand session panel"
        >
          ◀
        </button>
        <div style={{
          writingMode: 'vertical-rl',
          fontSize: 11,
          opacity: 0.7,
          marginTop: 16
        }}>
          Active Session
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: 300,
      borderLeft: '1px solid var(--vscode-panel-border)',
      background: 'var(--vscode-sideBar-background)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: 12,
        borderBottom: '1px solid var(--vscode-panel-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Active Session</div>
        <button
          onClick={onToggleMinimize}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--vscode-foreground)',
            cursor: 'pointer',
            fontSize: 16,
            padding: 4
          }}
          title="Minimize session panel"
        >
          ▶
        </button>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: 12
      }}>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Session ID</label>
          <div style={{ 
            fontSize: 11, 
            opacity: 0.7, 
            padding: '4px 8px', 
            background: 'var(--vscode-input-background)',
            borderRadius: 3 
          }}>
            {session.sessionId}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Started</label>
          <div style={{ 
            fontSize: 11, 
            opacity: 0.7,
            padding: '4px 8px',
            background: 'var(--vscode-input-background)',
            borderRadius: 3
          }}>
            {new Date(session.startTime).toLocaleString()}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Problem Statement</label>
          <textarea
            className="form-textarea"
            value={problemStatement}
            onChange={(e) => debouncedSave(e.target.value, setProblemStatement)}
            style={{ minHeight: 60, fontSize: 12 }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Goals</label>
          <textarea
            className="form-textarea"
            value={goals}
            onChange={(e) => debouncedSave(e.target.value, setGoals)}
            placeholder="What are you trying to accomplish?"
            style={{ minHeight: 80, fontSize: 12 }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Approach</label>
          <textarea
            className="form-textarea"
            value={approach}
            onChange={(e) => debouncedSave(e.target.value, setApproach)}
            placeholder="How will you approach this?"
            style={{ minHeight: 80, fontSize: 12 }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Key Decisions</label>
          <textarea
            className="form-textarea"
            value={keyDecisions}
            onChange={(e) => debouncedSave(e.target.value, setKeyDecisions)}
            placeholder="Track important decisions made"
            style={{ minHeight: 80, fontSize: 12 }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Notes</label>
          <textarea
            className="form-textarea"
            value={notes}
            onChange={(e) => debouncedSave(e.target.value, setNotes)}
            placeholder="Additional context or concerns"
            style={{ minHeight: 80, fontSize: 12 }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>
            Changed Files ({session.changedFiles.length})
          </label>
          <div style={{
            maxHeight: 120,
            overflow: 'auto',
            fontSize: 10,
            opacity: 0.7,
            background: 'var(--vscode-input-background)',
            borderRadius: 3,
            padding: 6
          }}>
            {session.changedFiles.length === 0 ? (
              <div style={{ fontStyle: 'italic' }}>No files changed yet</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {session.changedFiles.map((file, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>{file}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div style={{
        padding: 12,
        borderTop: '1px solid var(--vscode-panel-border)',
        display: 'flex',
        gap: 8
      }}>
        <button
          onClick={handleSave}
          className="btn btn-primary"
          style={{ flex: 1, fontSize: 12 }}
        >
          Save Session
        </button>
        <button
          onClick={handleEndSession}
          className="btn btn-secondary"
          style={{ flex: 1, fontSize: 12 }}
        >
          End Session
        </button>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
