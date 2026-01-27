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

interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  html_url: string;
  labels: Array<{ name: string; color: string }>;
  state: string;
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
  const [showGitHubPicker, setShowGitHubPicker] = React.useState(false);
  const [githubRepoInfo, setGithubRepoInfo] = React.useState<{ owner: string; repo: string } | null>(null);
  const [githubIssues, setGithubIssues] = React.useState<GitHubIssue[]>([]);
  const [selectedGithubIssue, setSelectedGithubIssue] = React.useState<GitHubIssue | null>(null);
  const [githubLoading, setGithubLoading] = React.useState(false);
  const [githubError, setGithubError] = React.useState<string | null>(null);
  const [githubActiveTab, setGithubActiveTab] = React.useState<'browse' | 'input'>('browse');
  const [githubIssueInput, setGithubIssueInput] = React.useState('');

  React.useEffect(() => {
    // Request initial data
    vscode?.postMessage({ type: 'getInitialData' });
    vscode?.postMessage({ type: 'getGitHubRepoInfo' });

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
      
      if (msg?.type === 'githubRepoInfo') {
        setGithubRepoInfo(msg.data);
        if (!msg.data) {
          setGithubError('No GitHub repository detected');
        }
      }
      
      if (msg?.type === 'githubIssuesResponse') {
        setGithubLoading(false);
        setGithubIssues(msg.data?.issues || []);
      }
      
      if (msg?.type === 'githubIssuesError') {
        setGithubLoading(false);
        setGithubError(msg.error);
      }
      
      if (msg?.type === 'githubIssueResponse') {
        setGithubLoading(false);
        setSelectedGithubIssue(msg.data);
      }
      
      if (msg?.type === 'githubIssueError') {
        setGithubLoading(false);
        setGithubError(msg.error);
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

  // Load GitHub issues when picker opens on browse tab
  React.useEffect(() => {
    if (showGitHubPicker && githubActiveTab === 'browse' && githubIssues.length === 0 && githubRepoInfo) {
      handleLoadGitHubIssues();
    }
  }, [showGitHubPicker, githubActiveTab, githubRepoInfo]);

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

  const handleLoadGitHubIssues = () => {
    if (!githubRepoInfo) return;
    setGithubLoading(true);
    setGithubError(null);
    vscode?.postMessage({ type: 'getGitHubIssues', perPage: 20 });
  };

  const handleFetchGitHubIssue = () => {
    if (!githubIssueInput.trim()) {
      setGithubError('Please enter a GitHub issue URL or issue number');
      return;
    }
    
    setGithubLoading(true);
    setGithubError(null);
    vscode?.postMessage({ type: 'getGitHubIssue', issueIdentifier: githubIssueInput.trim() });
  };

  const handleLinkGitHubIssue = () => {
    if (!selectedGithubIssue) {
      setGithubError('Please select an issue');
      return;
    }
    
    // Format as owner/repo#number
    const issueRef = `${githubRepoInfo?.owner || ''}/${githubRepoInfo?.repo || ''}#${selectedGithubIssue.number}`;
    
    setEditedData({
      ...editedData!,
      githubIssue: issueRef,
      problemStatement: editedData!.problemStatement || selectedGithubIssue.title
    });
    
    setShowGitHubPicker(false);
    setSelectedGithubIssue(null);
    setGithubIssueInput('');
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <input
            type="text"
            value={editedData.githubIssue}
            onChange={(e) => setEditedData({ ...editedData, githubIssue: e.target.value })}
            placeholder="owner/repo#123"
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: 13,
              background: 'var(--vscode-input-background)',
              color: 'var(--vscode-input-foreground)',
              border: '1px solid var(--vscode-input-border)',
              borderRadius: 4
            }}
          />
          <button
            onClick={() => {
              setShowGitHubPicker(true);
              setGithubError(null);
            }}
            style={{
              padding: '8px 16px',
              background: 'var(--vscode-button-secondaryBackground)',
              color: 'var(--vscode-button-secondaryForeground)',
              border: '1px solid var(--vscode-button-border)',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            🔗 Link Issue
          </button>
        </div>
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

      {/* GitHub Issue Picker Modal */}
      {showGitHubPicker && (
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
                onClick={() => {
                  setShowGitHubPicker(false);
                  setGithubError(null);
                  setSelectedGithubIssue(null);
                }}
                style={{
                  padding: '4px 12px',
                  background: 'var(--vscode-button-secondaryBackground)',
                  color: 'var(--vscode-button-secondaryForeground)',
                  border: '1px solid var(--vscode-button-border)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13
                }}
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
                onClick={() => setGithubActiveTab('browse')}
                style={{
                  flex: 1,
                  padding: 12,
                  border: 'none',
                  background: githubActiveTab === 'browse' ? 'var(--vscode-editor-background)' : 'transparent',
                  color: 'var(--vscode-foreground)',
                  borderBottom: githubActiveTab === 'browse' ? '2px solid var(--vscode-focusBorder)' : '2px solid transparent',
                  cursor: 'pointer',
                  fontWeight: githubActiveTab === 'browse' ? 600 : 400
                }}
              >
                Browse Issues {githubRepoInfo && `(${githubRepoInfo.owner}/${githubRepoInfo.repo})`}
              </button>
              <button
                onClick={() => setGithubActiveTab('input')}
                style={{
                  flex: 1,
                  padding: 12,
                  border: 'none',
                  background: githubActiveTab === 'input' ? 'var(--vscode-editor-background)' : 'transparent',
                  color: 'var(--vscode-foreground)',
                  borderBottom: githubActiveTab === 'input' ? '2px solid var(--vscode-focusBorder)' : '2px solid transparent',
                  cursor: 'pointer',
                  fontWeight: githubActiveTab === 'input' ? 600 : 400
                }}
              >
                Enter URL or Number
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              {githubError && (
                <div style={{
                  padding: 12,
                  marginBottom: 16,
                  background: 'var(--vscode-inputValidation-errorBackground)',
                  border: '1px solid var(--vscode-inputValidation-errorBorder)',
                  borderRadius: 4,
                  fontSize: 13
                }}>
                  {githubError}
                </div>
              )}

              {githubActiveTab === 'browse' && (
                <div>
                  {githubLoading ? (
                    <div style={{ textAlign: 'center', padding: 32, opacity: 0.7 }}>
                      Loading issues...
                    </div>
                  ) : githubIssues.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {githubIssues.map((issue) => (
                        <div
                          key={issue.number}
                          onClick={() => setSelectedGithubIssue(issue)}
                          style={{
                            padding: 12,
                            border: `1px solid ${selectedGithubIssue?.number === issue.number ? 'var(--vscode-focusBorder)' : 'var(--vscode-panel-border)'}`,
                            borderRadius: 4,
                            cursor: 'pointer',
                            background: selectedGithubIssue?.number === issue.number ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent',
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
                  ) : githubRepoInfo ? (
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

              {githubActiveTab === 'input' && (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                      GitHub Issue URL or Number
                    </label>
                    <input
                      type="text"
                      value={githubIssueInput}
                      onChange={(e) => setGithubIssueInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleFetchGitHubIssue();
                        }
                      }}
                      placeholder="https://github.com/owner/repo/issues/123 or 123"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: 13,
                        background: 'var(--vscode-input-background)',
                        color: 'var(--vscode-input-foreground)',
                        border: '1px solid var(--vscode-input-border)',
                        borderRadius: 4,
                        fontFamily: 'inherit'
                      }}
                    />
                    <button
                      onClick={handleFetchGitHubIssue}
                      disabled={githubLoading}
                      style={{
                        marginTop: 8,
                        padding: '8px 16px',
                        background: 'var(--vscode-button-secondaryBackground)',
                        color: 'var(--vscode-button-secondaryForeground)',
                        border: '1px solid var(--vscode-button-border)',
                        borderRadius: 4,
                        cursor: githubLoading ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    >
                      {githubLoading ? 'Loading...' : 'Fetch Issue'}
                    </button>
                  </div>

                  {selectedGithubIssue && (
                    <div style={{
                      marginTop: 16,
                      padding: 12,
                      border: '1px solid var(--vscode-panel-border)',
                      borderRadius: 4
                    }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>#{selectedGithubIssue.number}</span>
                        <span>{selectedGithubIssue.title}</span>
                      </div>
                      {selectedGithubIssue.body && (
                        <div style={{
                          fontSize: 13,
                          opacity: 0.85,
                          marginTop: 8,
                          maxHeight: 200,
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {selectedGithubIssue.body.length > 300
                            ? selectedGithubIssue.body.substring(0, 300) + '...'
                            : selectedGithubIssue.body}
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
                onClick={() => {
                  setShowGitHubPicker(false);
                  setGithubError(null);
                  setSelectedGithubIssue(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--vscode-button-secondaryBackground)',
                  color: 'var(--vscode-button-secondaryForeground)',
                  border: '1px solid var(--vscode-button-border)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleLinkGitHubIssue}
                disabled={!selectedGithubIssue || githubLoading}
                style={{
                  padding: '8px 16px',
                  background: selectedGithubIssue && !githubLoading ? 'var(--vscode-button-background)' : 'var(--vscode-input-background)',
                  color: selectedGithubIssue && !githubLoading ? 'var(--vscode-button-foreground)' : 'var(--vscode-disabledForeground)',
                  border: 'none',
                  borderRadius: 4,
                  cursor: selectedGithubIssue && !githubLoading ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                {githubLoading ? 'Linking...' : 'Link Issue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
