import React from 'react';
import { createRoot } from 'react-dom/client';

// Import Gherkin editing components from studio
// These will be extracted into a shared location, but for now we'll import them
import {
    parseFeatureContent,
    serializeFeatureContent,
    ParsedFeatureContent,
    GherkinStep,
    GherkinScenario,
    GherkinRule,
    BackgroundSection,
    RulesSection,
    ScenariosSection,
    FeatureFrontmatter,
    TagInput
} from './featureComponents';

// Acquire VSCode API
const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : undefined;

interface DocumentData {
  path: string;
  frontmatter: any;
  content: string;
}

interface ActiveSession {
  sessionId: string;
  problemStatement: string;
  startTime: string;
  changedFiles: any[];
}

function App() {
  const [documentData, setDocumentData] = React.useState<DocumentData | null>(null);
  const [frontmatter, setFrontmatter] = React.useState<any>({});
  const [parsedFeature, setParsedFeature] = React.useState<ParsedFeatureContent | null>(null);
  const [isDirty, setIsDirty] = React.useState(false);
  const [activeSession, setActiveSession] = React.useState<ActiveSession | null>(null);
  const [propertiesCollapsed, setPropertiesCollapsed] = React.useState(false);

  React.useEffect(() => {
    // Request initial data
    vscode?.postMessage({ type: 'getInitialData' });
    vscode?.postMessage({ type: 'getActiveSession' });

    // Listen for messages from extension
    function onMessage(event: MessageEvent) {
      const msg = event.data;
      
      if (msg?.type === 'documentData') {
        setDocumentData(msg.data);
        setFrontmatter(msg.data.frontmatter || {});
        // Parse feature content
        const parsed = parseFeatureContent(msg.data.content);
        setParsedFeature(parsed);
        setIsDirty(false);
      }

      if (msg?.type === 'activeSession') {
        setActiveSession(msg.data);
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const handleSave = () => {
    if (!documentData || !parsedFeature) return;

    // Serialize parsed feature back to markdown
    const content = serializeFeatureContent(parsedFeature);

    vscode?.postMessage({
      type: 'save',
      frontmatter,
      content
    });

    setIsDirty(false);
  };

  const handleDiscard = () => {
    if (!documentData) return;
    // Reload original content
    setFrontmatter(documentData.frontmatter || {});
    const parsed = parseFeatureContent(documentData.content);
    setParsedFeature(parsed);
    setIsDirty(false);
  };

  const updateFrontmatter = (key: string, value: any) => {
    setFrontmatter({ ...frontmatter, [key]: value });
    setIsDirty(true);
  };

  const updateParsedFeature = (updated: ParsedFeatureContent) => {
    setParsedFeature(updated);
    setIsDirty(true);
  };

  // Get scenario changes for this feature file
  const getScenarioChanges = () => {
    if (!activeSession || !documentData) {
      return null;
    }

    // Convert file path to relative path from ai/
    const getRelativePath = (filePath: string): string => {
      const normalized = filePath.replace(/\\/g, '/');
      const aiIndex = normalized.indexOf('/ai/');
      if (aiIndex !== -1) {
        return normalized.substring(aiIndex + 5);
      }
      return normalized;
    };

    const relativePath = getRelativePath(documentData.path);
    const changedFile = activeSession.changedFiles.find((file: any) => {
      const path = typeof file === 'string' ? file : file.path;
      return path === relativePath;
    });

    if (!changedFile || typeof changedFile === 'string') {
      return null;
    }

    return {
      added: changedFile.scenarios_added || [],
      modified: changedFile.scenarios_modified || [],
      removed: changedFile.scenarios_removed || []
    };
  };

  const scenarioChanges = getScenarioChanges();
  const isReadOnly = !activeSession;

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
        Loading feature...
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
            {frontmatter.feature_id || 'Feature Editor'}
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
          {!isReadOnly && (
            <>
              <button
                onClick={handleSave}
                disabled={!isDirty}
                className="btn btn-primary"
              >
                Save
              </button>
              <button
                onClick={handleDiscard}
                disabled={!isDirty}
                className="btn btn-secondary"
              >
                Discard Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Read-only indicator */}
      {isReadOnly && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--vscode-inputValidation-infoBackground)',
          border: '1px solid var(--vscode-inputValidation-infoBorder)',
          borderRadius: '4px',
          margin: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🔒</span>
          <span>Features require an active design session. Start a session to create or modify features.</span>
        </div>
      )}

      {/* Feature Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Feature Properties */}
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
            <span>Feature Properties</span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              {propertiesCollapsed ? '▸' : '▾'}
            </span>
          </h3>
          {!propertiesCollapsed && parsedFeature && (
            <FeatureFrontmatter 
              frontmatter={frontmatter} 
              onChange={updateFrontmatter}
              readOnly={isReadOnly}
            />
          )}
        </div>

        {/* Gherkin Sections */}
        {parsedFeature && (
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
        )}
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

// Export types for use in other files
export type { ParsedFeatureContent, GherkinStep, GherkinScenario, GherkinRule };
