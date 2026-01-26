import React from 'react';
import { createRoot } from 'react-dom/client';
import yaml from 'yaml';

// Acquire VSCode API once at module level
const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : undefined;

interface FeatureChangeEntry {
  path: string;
  change_type: 'added' | 'modified';
  scenarios_added?: string[];
  scenarios_modified?: string[];
  scenarios_removed?: string[];
}

interface SessionData {
  path: string;
  frontmatter: {
    session_id: string;
    github_issue?: string;
    start_time: string;
    end_time?: string;
    status: string;
    problem_statement: string;
    priority?: string;
    changed_files: FeatureChangeEntry[];
  };
  content: string;
}

function App() {
  const [sessionData, setSessionData] = React.useState<SessionData | null>(null);
  const [editedData, setEditedData] = React.useState<{
    githubIssue: string;
    problemStatement: string;
    proposedSolution: string;
    alternativesConsidered: string;
    useCases: string;
    priority: string;
    additionalContext: string;
    status: string;
  } | null>(null);

  React.useEffect(() => {
    // Request initial data
    vscode?.postMessage({ type: 'getInitialData' });

    // Listen for messages from extension
    function handleMessage(event: MessageEvent) {
      const msg = event.data;
      
      if (msg?.type === 'documentData') {
        setSessionData(msg.data);
        
        // Parse content sections
        const content = msg.data.content || '';
        const proposedSolutionMatch = content.match(/## Proposed Solution\s*\n([\s\S]*?)(?=\n## |\Z)/);
        const alternativesMatch = content.match(/## Alternatives Considered\s*\n([\s\S]*?)(?=\n## |\Z)/);
        const useCasesMatch = content.match(/## Use Cases\s*\n([\s\S]*?)(?=\n## |\Z)/);
        const contextMatch = content.match(/## Additional Context\s*\n([\s\S]*?)(?=\n## |\Z)/);
        
        setEditedData({
          githubIssue: msg.data.frontmatter.github_issue || '',
          problemStatement: msg.data.frontmatter.problem_statement || '',
          proposedSolution: proposedSolutionMatch ? proposedSolutionMatch[1].trim() : '',
          alternativesConsidered: alternativesMatch ? alternativesMatch[1].trim() : '',
          useCases: useCasesMatch ? useCasesMatch[1].trim() : '',
          priority: msg.data.frontmatter.priority || 'Medium - Would be helpful',
          additionalContext: contextMatch ? contextMatch[1].trim() : '',
          status: msg.data.frontmatter.status || 'planning'
        });
      }
    }

    // Add keyboard shortcut listener for Cmd+S / Ctrl+S
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    }

    window.addEventListener('message', handleMessage);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSave = () => {
    if (!sessionData || !editedData) {
      return;
    }

    // Reconstruct content
    const content = `# ${sessionData.frontmatter.session_id} Session

## Problem Statement
${editedData.problemStatement}

## Proposed Solution
${editedData.proposedSolution}

## Alternatives Considered
${editedData.alternativesConsidered}

## Use Cases
${editedData.useCases}

## Additional Context
${editedData.additionalContext}
`;

    // Update frontmatter
    const updatedFrontmatter = {
      ...sessionData.frontmatter,
      github_issue: editedData.githubIssue,
      problem_statement: editedData.problemStatement,
      priority: editedData.priority,
      status: editedData.status
    };

    vscode?.postMessage({
      type: 'save',
      frontmatter: updatedFrontmatter,
      content: content
    });
  };

  const statusFlow = ['planning', 'design', 'scribe', 'development', 'completed'];
  const priorityOptions = [
    'Low - Nice to have',
    'Medium - Would be helpful',
    'High - Important for my workflow',
    'Critical - Blocking my use of Forge'
  ];

  const handlePreviousPhase = () => {
    if (!editedData) return;
    const currentIndex = statusFlow.indexOf(editedData.status);
    if (currentIndex > 0) {
      setEditedData({ ...editedData, status: statusFlow[currentIndex - 1] });
    }
  };

  const handleNextPhase = () => {
    if (!editedData) return;
    const currentIndex = statusFlow.indexOf(editedData.status);
    if (currentIndex < statusFlow.length - 1) {
      setEditedData({ ...editedData, status: statusFlow[currentIndex + 1] });
    }
  };

  if (!sessionData || !editedData) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div>Loading session...</div>
      </div>
    );
  }

  const sessionId = sessionData.frontmatter.session_id;
  const changedFiles = sessionData.frontmatter.changed_files || [];
  const currentStatusIndex = statusFlow.indexOf(editedData.status);
  const canGoBack = currentStatusIndex > 0;
  const canGoForward = currentStatusIndex < statusFlow.length - 1;

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return { bg: 'var(--vscode-charts-purple)', fg: 'var(--vscode-editor-background)' };
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

  const statusColors = getStatusColor(editedData.status);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      {/* Header with Status and Save Button */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: 8 }}>{sessionId}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Status badge (display only) */}
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
                {editedData.status}
              </div>
              
              {/* Phase transition buttons */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={handlePreviousPhase}
                  disabled={!canGoBack}
                  title="Previous phase"
                  style={{
                    padding: '4px 8px',
                    background: canGoBack ? 'var(--vscode-button-secondaryBackground)' : 'var(--vscode-input-background)',
                    color: canGoBack ? 'var(--vscode-button-secondaryForeground)' : 'var(--vscode-disabledForeground)',
                    border: '1px solid var(--vscode-button-border)',
                    borderRadius: 4,
                    cursor: canGoBack ? 'pointer' : 'not-allowed',
                    fontSize: 11,
                    fontWeight: 600
                  }}
                >
                  ←
                </button>
                <button
                  onClick={handleNextPhase}
                  disabled={!canGoForward}
                  title="Next phase"
                  style={{
                    padding: '4px 8px',
                    background: canGoForward ? 'var(--vscode-button-secondaryBackground)' : 'var(--vscode-input-background)',
                    color: canGoForward ? 'var(--vscode-button-secondaryForeground)' : 'var(--vscode-disabledForeground)',
                    border: '1px solid var(--vscode-button-border)',
                    borderRadius: 4,
                    cursor: canGoForward ? 'pointer' : 'not-allowed',
                    fontSize: 11,
                    fontWeight: 600
                  }}
                >
                  →
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              background: 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            Save (⌘S)
          </button>
        </div>
      </div>

      {/* GitHub Issue */}
      <div style={{ 
        marginBottom: 16,
        padding: 16,
        background: 'var(--vscode-editor-inactiveSelectionBackground)',
        borderRadius: 4
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>GitHub Issue</h3>
        <input
          type="text"
          value={editedData.githubIssue}
          onChange={(e) => setEditedData({ ...editedData, githubIssue: e.target.value })}
          placeholder="owner/repo#123"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 13,
            background: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: 4
          }}
        />
      </div>

      {/* Priority */}
      <div style={{ 
        marginBottom: 16,
        padding: 16,
        background: 'var(--vscode-editor-inactiveSelectionBackground)',
        borderRadius: 4
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Priority</h3>
        <select
          value={editedData.priority}
          onChange={(e) => setEditedData({ ...editedData, priority: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 13,
            background: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: 4
          }}
        >
          {priorityOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {/* Problem Statement */}
      <div style={{ 
        marginBottom: 16,
        padding: 16,
        background: 'var(--vscode-editor-inactiveSelectionBackground)',
        borderRadius: 4
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Problem Statement</h3>
        <textarea
          value={editedData.problemStatement}
          onChange={(e) => setEditedData({ ...editedData, problemStatement: e.target.value })}
          rows={3}
          placeholder="What problem does this feature solve?"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 13,
            background: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: 4,
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Proposed Solution */}
      <div style={{ 
        marginBottom: 16,
        padding: 16,
        background: 'var(--vscode-editor-inactiveSelectionBackground)',
        borderRadius: 4
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Proposed Solution</h3>
        <textarea
          value={editedData.proposedSolution}
          onChange={(e) => setEditedData({ ...editedData, proposedSolution: e.target.value })}
          rows={5}
          placeholder="How would you like this feature to work?"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 13,
            background: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: 4,
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Alternatives Considered */}
      <div style={{ 
        marginBottom: 16,
        padding: 16,
        background: 'var(--vscode-editor-inactiveSelectionBackground)',
        borderRadius: 4
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Alternatives Considered</h3>
        <textarea
          value={editedData.alternativesConsidered}
          onChange={(e) => setEditedData({ ...editedData, alternativesConsidered: e.target.value })}
          rows={4}
          placeholder="What other solutions or workarounds have you tried?"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 13,
            background: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: 4,
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Use Cases */}
      <div style={{ 
        marginBottom: 16,
        padding: 16,
        background: 'var(--vscode-editor-inactiveSelectionBackground)',
        borderRadius: 4
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Use Cases</h3>
        <textarea
          value={editedData.useCases}
          onChange={(e) => setEditedData({ ...editedData, useCases: e.target.value })}
          rows={5}
          placeholder="Describe specific scenarios where this would be useful"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 13,
            background: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: 4,
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Additional Context */}
      <div style={{ 
        marginBottom: 16,
        padding: 16,
        background: 'var(--vscode-editor-inactiveSelectionBackground)',
        borderRadius: 4
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Additional Context</h3>
        <textarea
          value={editedData.additionalContext}
          onChange={(e) => setEditedData({ ...editedData, additionalContext: e.target.value })}
          rows={8}
          placeholder="Any mockups, examples, or additional details"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 13,
            background: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: 4,
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Changed Files */}
      {changedFiles.length > 0 && (
        <div style={{ 
          marginBottom: 16,
          padding: 16,
          background: 'var(--vscode-editor-inactiveSelectionBackground)',
          borderRadius: 4
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Changed Files ({changedFiles.length})</h3>
          {changedFiles.map((file, index) => (
            <div key={index} style={{ 
              marginBottom: 12,
              padding: 12,
              background: 'var(--vscode-editor-background)',
              borderRadius: 4
            }}>
              <div style={{ 
                fontFamily: 'monospace',
                fontSize: 12,
                marginBottom: 4,
                color: 'var(--vscode-textLink-foreground)'
              }}>
                {typeof file === 'string' ? file : file.path}
              </div>
              {typeof file === 'object' && (
                <div style={{ fontSize: 11, opacity: 0.8 }}>
                  <span style={{ 
                    color: file.change_type === 'added' ? 'var(--vscode-charts-green)' : 'var(--vscode-charts-orange)'
                  }}>
                    {file.change_type}
                  </span>
                  {file.scenarios_added && file.scenarios_added.length > 0 && (
                    <span> • +{file.scenarios_added.length} scenarios</span>
                  )}
                  {file.scenarios_modified && file.scenarios_modified.length > 0 && (
                    <span> • ~{file.scenarios_modified.length} modified</span>
                  )}
                  {file.scenarios_removed && file.scenarios_removed.length > 0 && (
                    <span> • -{file.scenarios_removed.length} removed</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
