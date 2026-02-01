import React from 'react';
import { createRoot } from 'react-dom/client';
import { DiagramEditor, DiagramData } from '../studio/components/diagram/DiagramEditor';
import { parseDiagramContent, serializeDiagramData } from '../studio/utils/diagramUtils';
import yaml from 'yaml';

// Acquire VSCode API
const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : undefined;

// Make vscode API globally available for child components
if (vscode) {
  (window as any).vscode = vscode;
}

interface DocumentData {
  path: string;
  frontmatter: any;
  content: string;
}

function App() {
  const [documentData, setDocumentData] = React.useState<DocumentData | null>(null);
  const [diagramData, setDiagramData] = React.useState<DiagramData>({ nodes: [], edges: [] });
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    // Request initial data
    vscode?.postMessage({ type: 'getInitialData' });

    // Listen for messages from extension
    function onMessage(event: MessageEvent) {
      const msg = event.data;
      
      if (msg?.type === 'documentData') {
        setDocumentData(msg.data);
        // Parse diagram content from the markdown
        const parsed = parseDiagramContent(msg.data.content);
        setDiagramData(parsed);
        setIsDirty(false);
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const handleDiagramChange = (data: DiagramData) => {
    setDiagramData(data);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!documentData) return;

    // Serialize diagram data back to markdown format
    const frontmatterYaml = `---\n${yaml.stringify(documentData.frontmatter)}---`;
    const newContent = serializeDiagramData(diagramData, frontmatterYaml);

    vscode?.postMessage({
      type: 'save',
      frontmatter: documentData.frontmatter,
      content: newContent
    });

    setIsDirty(false);
  };

  const handleDiscard = () => {
    if (!documentData) return;
    // Reload original content
    const parsed = parseDiagramContent(documentData.content);
    setDiagramData(parsed);
    setIsDirty(false);
  };

  if (!documentData) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--vscode-foreground)',
        fontSize: '14px'
      }}>
        Loading diagram...
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: 'var(--vscode-editor-background)'
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--vscode-panel-border)',
        background: 'var(--vscode-editor-background)',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--vscode-foreground)'
        }}>
          <span style={{ fontWeight: 500 }}>
            {documentData.frontmatter.name || 'Diagram Editor'}
          </span>
          {isDirty && (
            <span style={{
              fontSize: '11px',
              color: 'var(--vscode-descriptionForeground)',
              opacity: 0.8
            }}>
              • Unsaved changes
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSave}
            disabled={!isDirty}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: '3px',
              cursor: isDirty ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              fontFamily: 'var(--vscode-font-family)',
              background: 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
              opacity: isDirty ? 1 : 0.5
            }}
          >
            Save
          </button>
          <button
            onClick={handleDiscard}
            disabled={!isDirty}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: '3px',
              cursor: isDirty ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              fontFamily: 'var(--vscode-font-family)',
              background: 'var(--vscode-button-secondaryBackground)',
              color: 'var(--vscode-button-secondaryForeground)',
              opacity: isDirty ? 1 : 0.5
            }}
          >
            Discard Changes
          </button>
        </div>
      </div>

      {/* Diagram Editor */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <DiagramEditor
          diagramData={diagramData}
          onChange={handleDiagramChange}
          readOnly={false}
        />
      </div>
    </div>
  );
}

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
