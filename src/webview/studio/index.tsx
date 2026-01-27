import React from 'react';
import { createRoot } from 'react-dom/client';
import { MarkdownEditor } from './components/MarkdownEditor';
import { Sidebar } from './components/Sidebar';
import { FileCard } from './components/FileCard';
import { ChangedFileEntry } from './components/ChangedFileEntry';
import { SessionRequiredView } from './components/SessionRequiredView';
import { DiagramEditor } from './components/diagram/DiagramEditor';
import { parseDiagramContent, serializeDiagramData } from './utils/diagramUtils';
import yaml from 'yaml';
import { useSessionIndicators } from './hooks/useSessionIndicators';
import { useSessionPermissions } from './hooks/useSessionPermissions';

// Acquire VSCode API once at module level
const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : undefined;

// Make vscode API globally available for child components (like DiagramEditor)
if (vscode) {
  (window as any).vscode = vscode;
}

interface FeatureChangeEntry {
  path: string;
  change_type: 'added' | 'modified';
  scenarios_added?: string[];
  scenarios_modified?: string[];
  scenarios_removed?: string[];
}

interface ActiveSession {
  sessionId: string;
  problemStatement: string;
  startTime: string;
  changedFiles: FeatureChangeEntry[] | string[]; // Support both formats for backwards compatibility
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
  const [counts, setCounts] = React.useState<{ sessions: number; features: number; diagrams: number; specs: number; actors: number; stories: number; tasks: number } | null>(null);
  const [route, setRoute] = React.useState<{ page: 'dashboard' | 'features' | 'diagrams' | 'specs' | 'actors' | 'sessions'; folderPath?: string; params?: any }>({ page: 'dashboard' });
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
          // Session saved successfully - reload active session and sessions list
          vscode?.postMessage({ type: 'getActiveSession' });
          vscode?.postMessage({ type: 'listSessions' });
        }
      }
      if (msg?.type === 'structureChanged') {
        // Structure changed - reload sessions list
        vscode?.postMessage({ type: 'listSessions' });
      }
    }
    window.addEventListener('message', onMessage);
    vscode?.postMessage({ type: 'getInitialState' });
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const handleNavigate = (page: string, folderPath?: string) => {
    setRoute({ page: page as any, folderPath });
  };

  return (
    <div className="container">
      <Sidebar
        currentPage={route.page}
        activeSession={activeSession}
        onNavigate={handleNavigate}
        vscode={vscode}
      />
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
            />
          </div>
        )}

        {route.page === 'features' && (
          <BrowserPage category="features" title="Features" activeSession={activeSession} folderPath={route.folderPath} />
        )}

        {route.page === 'diagrams' && (
          <BrowserPage category="diagrams" title="Diagrams" activeSession={activeSession} folderPath={route.folderPath} />
        )}

        {route.page === 'specs' && (
          <BrowserPage category="specs" title="Specifications" activeSession={activeSession} folderPath={route.folderPath} />
        )}

        {route.page === 'actors' && (
          <BrowserPage category="actors" title="Actors" activeSession={activeSession} folderPath={route.folderPath} />
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

function BrowserPage({ category, title, activeSession, folderPath }: { category: string; title: string; activeSession: ActiveSession | null; folderPath?: string }) {
  const [folderContents, setFolderContents] = React.useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [fileContent, setFileContent] = React.useState<FileContent | null>(null);

  // Load folder contents when folderPath changes
  React.useEffect(() => {
    if (folderPath) {
      vscode?.postMessage({ type: 'getFolderContents', folderPath, category });
      setSelectedFile(null);
      setFileContent(null);
    }
  }, [category, folderPath, vscode]);

  // Listen for messages
  React.useEffect(() => {
    function onMessage(event: MessageEvent) {
      const msg = event.data;
      console.log('BrowserPage received message:', msg?.type, msg);
      if (msg?.type === 'folderContents') {
        console.log('Setting folder contents:', msg.data?.length, 'items');
        setFolderContents(msg.data || []);
      }
      if (msg?.type === 'fileContent') {
        console.log('Received file content:', msg.data ? 'has data' : 'NO DATA', msg.data);
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
      if (msg?.type === 'fileCreated') {
        if (msg.data?.success) {
          // Refresh folder contents
          if (folderPath) {
            vscode?.postMessage({ type: 'getFolderContents', folderPath, category });
          }
        }
      }
      if (msg?.type === 'structureChanged') {
        // Refresh folder contents if a folder is selected
        if (folderPath) {
          vscode?.postMessage({ type: 'getFolderContents', folderPath, category });
        }
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [folderPath, selectedFile, vscode]);

  const handleItemClick = (itemPath: string, itemType: 'file' | 'folder') => {
    if (itemType === 'folder') {
      // Navigate into the folder - this would need to update the route, but for now just handle files
      // In the future, could call a prop function to update route with new folder path
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

  console.log('BrowserPage render - folderPath:', folderPath, 'selectedFile:', selectedFile, 'fileContent:', fileContent ? 'exists' : 'null');

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {!folderPath && !selectedFile && (
        <CategoryEmptyState 
          category={category}
          title={title}
          activeSession={activeSession}
        />
      )}
      {folderPath && !selectedFile && (
        <FolderProfile 
          files={folderContents}
          onFileClick={(path) => {
            const item = folderContents.find(f => f.path === path);
            if (item) {
              handleItemClick(path, item.type);
            }
          }}
          folderPath={folderPath}
          category={category}
          activeSession={activeSession}
        />
      )}
      {selectedFile && !fileContent && (
        <div style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ marginTop: 40, opacity: 0.7 }}>Loading file...</div>
        </div>
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
  );
}

function CategoryEmptyState({ category, title, activeSession }: {
  category: string;
  title: string;
  activeSession: ActiveSession | null;
}) {
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1, -1);
  const isFoundational = category === 'actors' || category === 'specs' || category === 'diagrams';
  const { isEditable, getLockMessage } = useSessionPermissions();
  const canEdit = isEditable(category, activeSession);
  const lockMessage = getLockMessage(category);

  const handleCreateFile = () => {
    if (!canEdit) return;
    vscode?.postMessage({
      type: 'promptCreateFile',
      folderPath: '', // Backend will use base category path
      category
    });
  };

  const handleCreateFolder = () => {
    if (!canEdit && !isFoundational) return;
    vscode?.postMessage({
      type: 'promptCreateFolder',
      folderPath: '', // Backend will use base category path
      category
    });
  };

  return (
    <div className="p-16">
      <div className="empty-state">
        <div className="empty-state-icon">📂</div>
        <div style={{ marginBottom: 16 }}>Select a folder from the sidebar</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          Click on a folder in the navigation tree to view its contents.
        </div>
      </div>
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
  const isFoundational = category === 'actors';
  const { isModified, getChangeType } = useSessionIndicators(activeSession);
  const { isEditable, getLockMessage } = useSessionPermissions();
  const canEdit = isEditable(category, activeSession);
  const lockMessage = getLockMessage(category);
  
  const handleCreateFile = () => {
    if (!canEdit) return;
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
        {(activeSession || isFoundational || category === 'features') && (
          <button 
            className="btn btn-primary"
            style={{ 
              fontSize: 12, 
              padding: '6px 12px',
              opacity: canEdit ? 1 : 0.5,
              cursor: canEdit ? 'pointer' : 'not-allowed'
            }}
            onClick={handleCreateFile}
            disabled={!canEdit}
            title={!canEdit ? (lockMessage || 'Features require an active design session. Start a session to create or modify features.') : undefined}
          >
            {!canEdit && <span style={{ marginRight: 4 }}>🔒</span>}
            + New {categoryLabel}
          </button>
        )}
      </div>
      
      {files.length === 0 && (
        <div className="empty-state">
          <div>No items in this folder</div>
        </div>
      )}
      
      {files.map(item => {
        // Get relative path for session tracking
        const relativePath = getRelativePath(item.path);
        const fileIsModified = isModified(relativePath);
        const changeType = getChangeType(relativePath);
        
        return (
          <FileCard
            key={item.path}
            name={item.name}
            path={item.path}
            type={item.type}
            objectId={item.objectId}
            modified={item.modified ? new Date(item.modified).getTime() : undefined}
            isModified={fileIsModified}
            changeType={changeType}
            onClick={() => onFileClick(item.path)}
          />
        );
      })}
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


// TagInput Component
function TagInput({ tags, onChange, readOnly }: { 
  tags: string[]; 
  onChange: (tags: string[]) => void;
  readOnly: boolean;
}) {
  const [inputValue, setInputValue] = React.useState('');

  const handleAddTag = () => {
    if (!inputValue.trim()) return;
    
    // Support comma-separated input
    const newTags = inputValue
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag && !tags.includes(tag));
    
    if (newTags.length > 0) {
      onChange([...tags, ...newTags]);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {tags.map((tag, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              background: 'var(--vscode-badge-background)',
              color: 'var(--vscode-badge-foreground)',
              borderRadius: 3,
              fontSize: 12,
              fontWeight: 500
            }}
          >
            <span>{tag}</span>
            {!readOnly && (
              <button
                onClick={() => handleRemoveTag(tag)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 14,
                  lineHeight: 1,
                  opacity: 0.8
                }}
                title="Remove tag"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      {!readOnly && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add tags (comma-separated)"
            style={{ flex: 1, fontSize: 12 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleAddTag}
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
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

// Scenario Indicator Component with Tooltip
function ScenarioIndicator({ changeType }: { changeType: 'added' | 'modified' | 'removed' }) {
  const [showTooltip, setShowTooltip] = React.useState(false);
  
  const tooltipText = {
    added: 'Added in current session',
    modified: 'Modified in current session',
    removed: 'Removed in current session'
  }[changeType];

  // Get color using VSCode theme variables with fallbacks
  const indicatorColor = changeType === 'added' 
    ? 'var(--vscode-charts-green, #10B981)'
    : changeType === 'modified'
    ? 'var(--vscode-charts-yellow, #F59E0B)'
    : 'var(--vscode-charts-red, #EF4444)';

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        marginRight: 8
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: indicatorColor,
          verticalAlign: 'middle'
        }}
      />
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 4,
            padding: '4px 8px',
            backgroundColor: 'var(--vscode-editorWidget-background, #252526)',
            color: 'var(--vscode-editorWidget-foreground, #cccccc)',
            fontSize: 11,
            borderRadius: 3,
            whiteSpace: 'nowrap',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none'
          }}
        >
          {tooltipText}
        </div>
      )}
    </span>
  );
}

// ScenariosSection Component
function ScenariosSection({ 
  scenarios, 
  readOnly, 
  onChange,
  scenarioChanges
}: {
  scenarios: GherkinScenario[];
  readOnly: boolean;
  onChange: (scenarios: GherkinScenario[]) => void;
  scenarioChanges?: { added: string[]; modified: string[]; removed: string[] } | null;
}) {
  const [expandedScenarios, setExpandedScenarios] = React.useState<Set<number>>(new Set([0]));

  // Helper function to determine change type for a scenario
  const getScenarioChangeType = (scenarioTitle: string): 'added' | 'modified' | 'removed' | null => {
    if (!scenarioChanges) {
      return null;
    }
    
    if (scenarioChanges.added.includes(scenarioTitle)) {
      return 'added';
    }
    if (scenarioChanges.modified.includes(scenarioTitle)) {
      return 'modified';
    }
    if (scenarioChanges.removed.includes(scenarioTitle)) {
      return 'removed';
    }
    
    return null;
  };

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
            {scenarioChanges && (() => {
              const changeType = getScenarioChangeType(scenario.title);
              return changeType ? <ScenarioIndicator changeType={changeType} /> : null;
            })()}
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

function ItemProfile({ category, fileContent, activeSession, onBack }: {
  category: string;
  fileContent: FileContent;
  activeSession: ActiveSession | null;
  onBack: () => void;
}) {
  const [frontmatter, setFrontmatter] = React.useState(fileContent.frontmatter || {});
  const [content, setContent] = React.useState(fileContent.content || '');
  const [parsedFeature, setParsedFeature] = React.useState<ParsedFeatureContent | null>(null);
  const [isDirty, setIsDirty] = React.useState(false);
  const [propertiesCollapsed, setPropertiesCollapsed] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const isFoundational = category === 'actors' || category === 'specs' || category === 'diagrams';
  const { isEditable, getLockMessage } = useSessionPermissions();
  const isReadOnly = !isEditable(category, activeSession);
  const lockMessage = getLockMessage(category);
  const { getScenarioChanges } = useSessionIndicators(activeSession);

  // Convert file path to ai/ relative path
  const getRelativePath = React.useCallback((filePath: string): string => {
    const normalized = filePath.replace(/\\/g, '/');
    
    // If path starts with ai/, return as is (but remove ai/ prefix)
    if (normalized.startsWith('ai/')) {
      return normalized.substring(4);
    }
    
    // If path contains /ai/, extract from there
    const aiIndex = normalized.indexOf('/ai/');
    if (aiIndex !== -1) {
      return normalized.substring(aiIndex + 5); // +5 to skip '/ai/'
    }
    
    // Otherwise assume it's already relative to ai/
    return normalized;
  }, []);

  // Get scenario changes for this feature file
  const scenarioChanges = React.useMemo(() => {
    if (category !== 'features') {
      return null;
    }
    const relativePath = getRelativePath(fileContent.path);
    return getScenarioChanges(relativePath);
  }, [category, fileContent.path, getRelativePath, getScenarioChanges]);

  React.useEffect(() => {
    setFrontmatter(fileContent.frontmatter || {});
    setContent(fileContent.content || '');
    setIsDirty(false);

    // Parse feature content if this is a feature
    if (category === 'features') {
      setParsedFeature(parseFeatureContent(fileContent.content || ''));
    } else {
      setParsedFeature(null);
    }
  }, [fileContent, category]);

  const handleSave = () => {
    let finalContent = content;
    
    // Serialize parsed feature back to content if this is a feature
    if (category === 'features' && parsedFeature) {
      finalContent = serializeFeatureContent(parsedFeature);
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
    setIsCancelling(true);
    setFrontmatter(fileContent.frontmatter || {});
    setContent(fileContent.content || '');
    if (category === 'features') {
      setParsedFeature(parseFeatureContent(fileContent.content || ''));
    } else {
      setParsedFeature(null);
    }
    setIsDirty(false);
    // Reset the cancelling flag after a short delay to allow state updates to complete
    setTimeout(() => setIsCancelling(false), 0);
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


  return (
    <div className="p-16">
      <div className="toolbar">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <span className="font-medium">{fileContent.path.split('/').pop()}</span>
      </div>

      {isReadOnly && (
        <div className="alert alert-info mt-16" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔒</span>
          <span>
            {category === 'features' 
              ? (lockMessage || 'Features require an active design session. Start a session to create or modify features.')
              : 'Read-only mode. Start a design session to edit files.'}
          </span>
        </div>
      )}

      <div className="content-section">
        <h3 
          className="section-title" 
          style={{ 
            cursor: 'pointer', 
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          onClick={() => setPropertiesCollapsed(!propertiesCollapsed)}
        >
          <span>
            {category === 'features' && 'Feature Properties'}
            {category === 'diagrams' && 'Diagram Properties'}
            {category === 'specs' && 'Spec Properties'}
            {category === 'actors' && 'Actor Properties'}
          </span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            {propertiesCollapsed ? '▸' : '▾'}
          </span>
        </h3>
        {!propertiesCollapsed && (
          <>
            {category === 'features' && (
              <FeatureFrontmatter 
                frontmatter={frontmatter} 
                onChange={updateFrontmatter}
                readOnly={isReadOnly}
              />
            )}
            {category === 'diagrams' && (
              <DiagramFrontmatter 
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
          </>
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
            scenarioChanges={scenarioChanges}
          />
        </>
      ) : category === 'diagrams' ? (
        <>
          {/* Diagram Editor Section */}
          <div className="content-section">
            <h3 className="section-title">Diagram</h3>
            <div style={{ height: '600px' }}>
              <DiagramEditor
                diagramData={parseDiagramContent(content)}
                onChange={(data) => {
                  // Don't trigger content updates during cancel operations
                  if (isCancelling) return;
                  const frontmatterYaml = `---\n${yaml.stringify(frontmatter)}---`;
                  const newContent = serializeDiagramData(data, frontmatterYaml);
                  updateContent(newContent);
                }}
                readOnly={isReadOnly}
              />
            </div>
          </div>
        </>
      ) : category === 'specs' ? (
        <div className="content-section">
          <h3 className="section-title">Specification Content</h3>
          <div style={{ height: 400 }}>
            <MarkdownEditor
              content={content}
              onChange={(markdown) => updateContent(markdown)}
              readOnly={isReadOnly}
            />
          </div>
        </div>
      ) : (
        <div className="content-section">
          <h3 className="section-title">Content</h3>
          <div style={{ height: 400 }}>
            <MarkdownEditor
              content={content}
              onChange={(markdown) => updateContent(markdown)}
              readOnly={isReadOnly}
            />
          </div>
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
        <label className="form-label">Tags</label>
        <TagInput
          tags={Array.isArray(frontmatter.tags) ? frontmatter.tags : []}
          onChange={(tags) => onChange('tags', tags)}
          readOnly={readOnly}
        />
      </div>
    </>
  );
}

function DiagramFrontmatter({ frontmatter, onChange, readOnly }: { 
  frontmatter: any; 
  onChange: (key: string, value: any) => void;
  readOnly: boolean;
}) {
  return (
    <>
      <div className="form-group">
        <label className="form-label">Diagram ID</label>
        <input 
          className="form-input"
          value={frontmatter.diagram_id || ''}
          onChange={(e) => onChange('diagram_id', e.target.value)}
          readOnly={readOnly}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Name</label>
        <input 
          className="form-input"
          value={frontmatter.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          readOnly={readOnly}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea 
          className="form-textarea"
          value={frontmatter.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          readOnly={readOnly}
          rows={2}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Diagram Type</label>
        <select 
          className="form-input"
          value={frontmatter.diagram_type || 'flow'}
          onChange={(e) => onChange('diagram_type', e.target.value)}
          disabled={readOnly}
        >
          <option value="flow">Flow</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="component">Component</option>
          <option value="state">State</option>
          <option value="sequence">Sequence</option>
        </select>
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
      <div className="form-note" style={{ 
        padding: '8px 12px', 
        background: 'var(--vscode-textBlockQuote-background)', 
        border: '1px solid var(--vscode-panel-border)', 
        borderRadius: '4px',
        fontSize: '12px',
        color: 'var(--vscode-descriptionForeground)',
        marginTop: '8px'
      }}>
        <strong>Note:</strong> Specs are linked at the element level via node properties, not in diagram frontmatter.
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
        <label className="form-label">Diagram IDs (comma-separated)</label>
        <input 
          className="form-input"
          value={Array.isArray(frontmatter.diagram_id) ? frontmatter.diagram_id.join(', ') : frontmatter.diagram_id || ''}
          onChange={(e) => onChange('diagram_id', e.target.value.split(',').map((s: string) => s.trim()))}
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
      <div className="form-group">
        <label className="form-label">Tags</label>
        <TagInput
          tags={Array.isArray(frontmatter.tags) ? frontmatter.tags : []}
          onChange={(tags) => onChange('tags', tags)}
          readOnly={readOnly}
        />
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
            Changed Features: {activeSession.changedFiles.length}
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

function SessionsPage({ sessions, activeSession, showNewSessionForm, onShowNewSessionForm, onHideNewSessionForm }: any) {
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
                Changed Features: {activeSession.changedFiles.length}
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

interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  html_url: string;
  labels: Array<{ name: string; color: string }>;
  state: string;
}

function GitHubIssuePicker({
  sessionPath,
  onClose,
  onLinked
}: {
  sessionPath: string;
  onClose: () => void;
  onLinked: () => void;
}) {
  const [activeTab, setActiveTab] = React.useState<'browse' | 'input'>('browse');
  const [issues, setIssues] = React.useState<GitHubIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = React.useState<GitHubIssue | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [issueInput, setIssueInput] = React.useState('');
  const [repoInfo, setRepoInfo] = React.useState<{ owner: string; repo: string } | null>(null);

  // Get repo info on mount
  React.useEffect(() => {
    vscode?.postMessage({ type: 'getGitHubRepoInfo' });
  }, []);

  // Load issues when switching to browse tab
  React.useEffect(() => {
    if (activeTab === 'browse' && issues.length === 0 && repoInfo) {
      loadIssues();
    }
  }, [activeTab, repoInfo]);

  // Listen for messages
  React.useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data;
      
      if (msg?.type === 'githubRepoInfo') {
        setRepoInfo(msg.data);
        if (!msg.data) {
          setError('No GitHub repository detected. Ensure this project has a GitHub remote configured.');
        }
      }
      
      if (msg?.type === 'githubIssuesResponse') {
        setLoading(false);
        setIssues(msg.data?.issues || []);
      }
      
      if (msg?.type === 'githubIssuesError') {
        setLoading(false);
        setError(msg.error);
      }
      
      if (msg?.type === 'githubIssueResponse') {
        setLoading(false);
        setSelectedIssue(msg.data);
      }
      
      if (msg?.type === 'githubIssueError') {
        setLoading(false);
        setError(msg.error);
      }
      
      if (msg?.type === 'githubIssueLinkSuccess') {
        setLoading(false);
        onLinked();
        onClose();
      }
      
      if (msg?.type === 'githubIssueLinkError') {
        setLoading(false);
        setError(msg.error);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClose, onLinked]);

  const loadIssues = () => {
    setLoading(true);
    setError(null);
    vscode?.postMessage({ type: 'getGitHubIssues', perPage: 20 });
  };

  const handleFetchIssue = () => {
    if (!issueInput.trim()) {
      setError('Please enter a GitHub issue URL or issue number');
      return;
    }
    
    setLoading(true);
    setError(null);
    vscode?.postMessage({ type: 'getGitHubIssue', issueIdentifier: issueInput.trim() });
  };

  const handleLinkIssue = () => {
    if (!selectedIssue) {
      setError('Please select an issue');
      return;
    }
    
    setLoading(true);
    setError(null);
    vscode?.postMessage({ 
      type: 'linkGitHubIssue', 
      sessionPath: sessionPath,
      issueData: selectedIssue
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--vscode-editor-background)',
        border: '1px solid var(--vscode-panel-border)',
        borderRadius: 6,
        width: '90%',
        maxWidth: 800,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: 16,
          borderBottom: '1px solid var(--vscode-panel-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0 }}>Link GitHub Issue</h3>
          <button 
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '4px 12px' }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--vscode-panel-border)'
        }}>
          <button
            onClick={() => setActiveTab('browse')}
            style={{
              flex: 1,
              padding: 12,
              border: 'none',
              background: activeTab === 'browse' ? 'var(--vscode-editor-background)' : 'transparent',
              color: 'var(--vscode-foreground)',
              borderBottom: activeTab === 'browse' ? '2px solid var(--vscode-focusBorder)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'browse' ? 600 : 400
            }}
          >
            Browse Issues {repoInfo && `(${repoInfo.owner}/${repoInfo.repo})`}
          </button>
          <button
            onClick={() => setActiveTab('input')}
            style={{
              flex: 1,
              padding: 12,
              border: 'none',
              background: activeTab === 'input' ? 'var(--vscode-editor-background)' : 'transparent',
              color: 'var(--vscode-foreground)',
              borderBottom: activeTab === 'input' ? '2px solid var(--vscode-focusBorder)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'input' ? 600 : 400
            }}
          >
            Enter URL or Number
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {error && (
            <div style={{
              padding: 12,
              marginBottom: 16,
              background: 'var(--vscode-inputValidation-errorBackground)',
              border: '1px solid var(--vscode-inputValidation-errorBorder)',
              borderRadius: 4,
              fontSize: 13
            }}>
              {error}
            </div>
          )}

          {activeTab === 'browse' && (
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 32, opacity: 0.7 }}>
                  Loading issues...
                </div>
              ) : issues.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {issues.map((issue) => (
                    <div
                      key={issue.number}
                      onClick={() => setSelectedIssue(issue)}
                      style={{
                        padding: 12,
                        border: `1px solid ${selectedIssue?.number === issue.number ? 'var(--vscode-focusBorder)' : 'var(--vscode-panel-border)'}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        background: selectedIssue?.number === issue.number ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent',
                        transition: 'all 0.1s'
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>#{issue.number}</span>
                        <span style={{ fontSize: 13 }}>{issue.title}</span>
                      </div>
                      {issue.labels && issue.labels.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {issue.labels.map((label) => (
                            <span
                              key={label.name}
                              style={{
                                padding: '2px 8px',
                                borderRadius: 10,
                                fontSize: 11,
                                background: `#${label.color}40`,
                                color: 'var(--vscode-foreground)'
                              }}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : repoInfo ? (
                <div style={{ textAlign: 'center', padding: 32, opacity: 0.7 }}>
                  No open issues found
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 32, opacity: 0.7 }}>
                  No GitHub repository detected
                </div>
              )}
            </div>
          )}

          {activeTab === 'input' && (
            <div>
              <div className="form-group">
                <label className="form-label">
                  GitHub Issue URL or Number
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://github.com/owner/repo/issues/123 or 123"
                  value={issueInput}
                  onChange={(e) => setIssueInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleFetchIssue();
                    }
                  }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleFetchIssue}
                  disabled={loading}
                  style={{ marginTop: 8 }}
                >
                  {loading ? 'Loading...' : 'Fetch Issue'}
                </button>
              </div>

              {selectedIssue && (
                <div style={{
                  marginTop: 16,
                  padding: 12,
                  border: '1px solid var(--vscode-panel-border)',
                  borderRadius: 4
                }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>#{selectedIssue.number}</span>
                    <span>{selectedIssue.title}</span>
                  </div>
                  {selectedIssue.body && (
                    <div style={{
                      fontSize: 13,
                      opacity: 0.85,
                      marginTop: 8,
                      maxHeight: 200,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {selectedIssue.body.length > 300
                        ? selectedIssue.body.substring(0, 300) + '...'
                        : selectedIssue.body}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: 16,
          borderTop: '1px solid var(--vscode-panel-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8
        }}>
          <button 
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleLinkIssue}
            disabled={!selectedIssue || loading}
          >
            {loading ? 'Linking...' : 'Link Issue'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SessionDetail({
  session,
  onClose
}: {
  session: Session;
  onClose: () => void;
}) {
  const [sessionData, setSessionData] = React.useState<Session>(session);
  const [sessionContent, setSessionContent] = React.useState<{
    goals: string;
    approach: string;
    keyDecisions: string;
    notes: string;
  } | null>(null);
  const [showGitHubPicker, setShowGitHubPicker] = React.useState(false);

  // Function to load session file content
  const loadSessionContent = React.useCallback(() => {
    const sessionPath = `ai/sessions/${session.sessionId}/${session.sessionId}.session.md`;
    vscode?.postMessage({ type: 'getFileContent', filePath: sessionPath });
  }, [session.sessionId]);

  // Load full session file content and listen for updates
  React.useEffect(() => {
    loadSessionContent();

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      
      // Handle file content response
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
        
        // Update session data with latest frontmatter
        setSessionData({
          ...sessionData,
          frontmatter: msg.data.frontmatter
        });
      }
      
      // Handle structure changes - reload session data
      if (msg?.type === 'structureChanged') {
        loadSessionContent();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [session.sessionId, loadSessionContent]);

  const status = sessionData.frontmatter?.status || 'unknown';
  const problemStatement = sessionData.frontmatter?.problem_statement || 'No description';
  const startTime = sessionData.frontmatter?.start_time;
  const endTime = sessionData.frontmatter?.end_time;
  const changedFilesRaw = sessionData.frontmatter?.changed_files || [];
  // Normalize to array format (handle both old string[] and new FeatureChangeEntry[] formats)
  const changedFiles = Array.isArray(changedFilesRaw) ? changedFilesRaw : [];
  const commandFile = sessionData.frontmatter?.command_file;

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'design':
        return { bg: 'var(--vscode-charts-green)', fg: 'var(--vscode-editor-background)' };
      case 'scribe':
        return { bg: 'var(--vscode-charts-blue)', fg: 'var(--vscode-editor-background)' };
      case 'development':
        return { bg: 'var(--vscode-charts-orange)', fg: 'var(--vscode-editor-background)' };
      case 'completed':
        return { bg: 'var(--vscode-charts-purple)', fg: 'var(--vscode-editor-background)' };
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
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignments: 'start', marginBottom: 12 }}>
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
            
            {/* GitHub issue badge */}
            {sessionData.frontmatter?.github_issue && (
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 4,
                fontSize: 11,
                background: 'var(--vscode-badge-background)',
                color: 'var(--vscode-badge-foreground)',
                marginLeft: 8
              }}>
                🔗 #{sessionData.frontmatter.github_issue.number}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Link GitHub Issue button - show for design and scribe status */}
            {(status === 'design' || status === 'scribe') && (
              <button 
                className="btn btn-secondary"
                onClick={() => setShowGitHubPicker(true)}
              >
                {sessionData.frontmatter?.github_issue ? 'Update' : 'Link'} GitHub Issue
              </button>
            )}
            
            {/* Development status: Show "Mark Complete" button */}
            {status === 'development' && (
              <button 
                className="btn btn-primary"
                onClick={() => {
                  vscode?.postMessage({
                    type: 'markComplete',
                    sessionId: session.sessionId
                  });
                }}
              >
                Mark Complete
              </button>
            )}
            
            {/* Completed status: No action buttons */}
            {status === 'completed' && (
              <div style={{
                padding: '8px 12px',
                fontSize: 12,
                color: 'var(--vscode-charts-green)',
                fontWeight: 600
              }}>
                ✓ Session Complete
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status-based instructions */}
      {status === 'design' && (
        <div className="card" style={{ 
          marginBottom: 16,
          background: 'var(--vscode-editor-inactiveSelectionBackground)',
          borderLeft: '3px solid var(--vscode-charts-green)'
        }}>
          <h3 className="section-title">AI Assisted Design</h3>
          <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
            Use the forge-design command to update AI documentation during this session:
          </div>
          <div style={{
            padding: '10px 14px',
            background: 'var(--vscode-editor-background)',
            borderRadius: 4,
            fontSize: 13,
            fontFamily: 'monospace',
            fontWeight: 600,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ color: 'var(--vscode-charts-green)' }}>›</span>
            <span style={{ color: 'var(--vscode-textLink-foreground)' }}>/forge-design</span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>
            Open the agent chat and run this command to update features, specs, diagrams, and models. All changes will be automatically tracked. When you're finished designing, click "End Session" in the Active Session panel to transition to 'scribe' status.
          </div>
        </div>
      )}

      {status === 'scribe' && (
        <div className="card" style={{ 
          marginBottom: 16,
          background: 'var(--vscode-editor-inactiveSelectionBackground)',
          borderLeft: '3px solid var(--vscode-charts-blue)'
        }}>
          <h3 className="section-title">Next Step: Run Scribe Command</h3>
          <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
            Run the forge-scribe command to analyze this session and generate Stories and Tasks:
          </div>
          <div style={{
            padding: '10px 14px',
            background: 'var(--vscode-editor-background)',
            borderRadius: 4,
            fontSize: 13,
            fontFamily: 'monospace',
            fontWeight: 600,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ color: 'var(--vscode-charts-blue)' }}>›</span>
            <span style={{ color: 'var(--vscode-textLink-foreground)' }}>/forge-scribe {session.sessionId}</span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>
            Open the agent chat and run this command. The agent will analyze the changed files, create implementation stories and tasks, then ask if you want to transition the session to 'development' status.
          </div>
        </div>
      )}

      {status === 'development' && (
        <div className="card" style={{ 
          marginBottom: 16,
          background: 'var(--vscode-editor-inactiveSelectionBackground)',
          borderLeft: '3px solid var(--vscode-charts-orange)'
        }}>
          <h3 className="section-title">Next Step: Build Stories</h3>
          <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
            Implement stories using the forge-build command:
          </div>
          <div style={{
            padding: '10px 14px',
            background: 'var(--vscode-editor-background)',
            borderRadius: 4,
            fontSize: 13,
            fontFamily: 'monospace',
            fontWeight: 600,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ color: 'var(--vscode-charts-orange)' }}>›</span>
            <span style={{ color: 'var(--vscode-textLink-foreground)' }}>/forge-build @filename</span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>
            Select a story file from <code style={{ 
              padding: '2px 6px', 
              background: 'var(--vscode-editor-background)', 
              borderRadius: 3,
              fontSize: 11
            }}>ai/sessions/{session.sessionId}/tickets/</code> and run <code style={{ 
              padding: '2px 6px', 
              background: 'var(--vscode-editor-background)', 
              borderRadius: 3,
              fontSize: 11
            }}>/forge-build</code> with the file to implement it. The agent will verify the session is in 'development' status and automatically mark the session as 'completed' when the last story is built.
          </div>
        </div>
      )}

      {status === 'design' && (
        <div className="card" style={{ 
          marginBottom: 16,
          background: 'var(--vscode-editor-inactiveSelectionBackground)',
          borderLeft: '3px solid var(--vscode-charts-green)'
        }}>
          <h3 className="section-title">Active Design Session</h3>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            Modify features, specs, diagrams, and models. All changes are being tracked automatically. When you're done with your design work, click "End Design Session" to transition to 'scribe' status.
          </div>
        </div>
      )}


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
          <div style={{ fontWeight: 600 }}>Changed Features:</div>
          <div>{changedFiles.length} feature{changedFiles.length !== 1 ? 's' : ''}</div>
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

      {/* Changed Features */}
      {changedFiles.length > 0 && (
        <ChangedFilesSection files={changedFiles} />
      )}
      
      {/* GitHub Issue Picker Modal */}
      {showGitHubPicker && (
        <GitHubIssuePicker
          sessionPath={sessionData.filePath}
          onClose={() => setShowGitHubPicker(false)}
          onLinked={() => {
            loadSessionContent();
          }}
        />
      )}
    </div>
  );
}

function ChangedFilesSection({ files }: { files: any[] }) {
  // Normalize files to FeatureChangeEntry format (handle both old string[] and new FeatureChangeEntry[] formats)
  const normalizedFiles = React.useMemo(() => {
    return files.map((file: any): FeatureChangeEntry => {
      if (typeof file === 'string') {
        // Old format: just a path string
        return {
          path: file,
          change_type: 'modified'
        };
      } else if (file && typeof file === 'object' && file.path) {
        // New format: FeatureChangeEntry object
        return file as FeatureChangeEntry;
      } else {
        // Fallback
        return {
          path: String(file),
          change_type: 'modified'
        };
      }
    });
  }, [files]);

  // Group files by type
  const groupedFiles = React.useMemo(() => {
    const groups: {
      features: FeatureChangeEntry[];
      specs: FeatureChangeEntry[];
      actors: FeatureChangeEntry[];
      sessions: FeatureChangeEntry[];
      tickets: FeatureChangeEntry[];
      other: FeatureChangeEntry[];
    } = {
      features: [],
      specs: [],
      actors: [],
      sessions: [],
      tickets: [],
      other: []
    };

    normalizedFiles.forEach(file => {
      const normalizedPath = file.path.replace(/\\/g, '/');
      
      if (normalizedPath.includes('/features/')) {
        groups.features.push(file);
      } else if (normalizedPath.includes('/specs/')) {
        groups.specs.push(file);
      } else if (normalizedPath.includes('/actors/')) {
        groups.actors.push(file);
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
    files: FeatureChangeEntry[]; 
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
            <div key={index}>
              <FileItem filePath={file.path} onClick={() => handleFileClick(file.path)} />
              {/* Display scenario details if available */}
              {(file.scenarios_added?.length || file.scenarios_modified?.length || file.scenarios_removed?.length) && (
                <div style={{ 
                  marginLeft: 20, 
                  marginTop: 4, 
                  fontSize: 11, 
                  opacity: 0.8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  {file.scenarios_added && file.scenarios_added.length > 0 && (
                    <div style={{ color: 'var(--vscode-textLink-foreground)' }}>
                      + Added: {file.scenarios_added.join(', ')}
                    </div>
                  )}
                  {file.scenarios_modified && file.scenarios_modified.length > 0 && (
                    <div style={{ color: 'var(--vscode-charts-orange)' }}>
                      ~ Modified: {file.scenarios_modified.join(', ')}
                    </div>
                  )}
                  {file.scenarios_removed && file.scenarios_removed.length > 0 && (
                    <div style={{ color: 'var(--vscode-errorForeground)' }}>
                      - Removed: {file.scenarios_removed.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 className="section-title">Changed Features ({files.length})</h3>
      
      <FileGroup title="Features" files={groupedFiles.features} icon="✨" />
      <FileGroup title="Specifications" files={groupedFiles.specs} icon="📐" />
      <FileGroup title="Actors" files={groupedFiles.actors} icon="👤" />
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
      case 'design':
        return {
          background: 'var(--vscode-charts-green)',
          color: 'var(--vscode-editor-background)'
        };
      case 'scribe':
        return {
          background: 'var(--vscode-charts-blue)',
          color: 'var(--vscode-editor-background)'
        };
      case 'development':
        return {
          background: 'var(--vscode-charts-orange)',
          color: 'var(--vscode-editor-background)'
        };
      case 'completed':
        return {
          background: 'var(--vscode-charts-purple)',
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
  const [expandedFiles, setExpandedFiles] = React.useState<Set<string>>(new Set());

  // Load session file content on mount
  React.useEffect(() => {
    const loadSessionContent = async () => {
      // Request the full session file content via getFileContent
      const sessionPath = `ai/sessions/${session.sessionId}/${session.sessionId}.session.md`;
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
      status: 'design',
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

  // Normalize changedFiles to FeatureChangeEntry format (handle backwards compatibility)
  const normalizedChangedFiles = React.useMemo(() => {
    return session.changedFiles.map((file: any): FeatureChangeEntry => {
      if (typeof file === 'string') {
        // Old format: just a path string
        return {
          path: file,
          change_type: 'modified'
        };
      } else if (file && typeof file === 'object' && file.path) {
        // New format: FeatureChangeEntry object
        return file as FeatureChangeEntry;
      } else {
        // Fallback
        return {
          path: String(file),
          change_type: 'modified'
        };
      }
    });
  }, [session.changedFiles]);

  // Calculate total scenario count across all files
  const totalScenarioCount = React.useMemo(() => {
    return normalizedChangedFiles.reduce((total, entry) => {
      return total +
        (entry.scenarios_added?.length || 0) +
        (entry.scenarios_modified?.length || 0) +
        (entry.scenarios_removed?.length || 0);
    }, 0);
  }, [normalizedChangedFiles]);

  // Toggle expanded state for a file
  const toggleFileExpand = React.useCallback((filePath: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  }, []);

  // Handle file click
  const handleFileClick = React.useCallback((filePath: string) => {
    vscode?.postMessage({ type: 'openFile', filePath });
  }, []);

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
            Changed Features ({session.changedFiles.length}
            {totalScenarioCount > 0 && `, ${totalScenarioCount} ${totalScenarioCount === 1 ? 'scenario' : 'scenarios'}`})
          </label>
          <div style={{
            maxHeight: 200,
            overflow: 'auto',
            fontSize: 10,
            background: 'var(--vscode-input-background)',
            borderRadius: 3,
            padding: 6
          }}>
            {normalizedChangedFiles.length === 0 ? (
              <div style={{ fontStyle: 'italic', opacity: 0.7 }}>No features changed yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {normalizedChangedFiles.map((entry, i: number) => (
                  <ChangedFileEntry
                    key={i}
                    entry={entry}
                    onFileClick={handleFileClick}
                    isExpanded={expandedFiles.has(entry.path)}
                    onToggleExpand={() => toggleFileExpand(entry.path)}
                  />
                ))}
              </div>
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
