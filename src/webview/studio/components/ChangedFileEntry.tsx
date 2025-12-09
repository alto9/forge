import React from 'react';
import { FeatureChangeEntry } from '../../../types/FeatureChangeEntry';

interface ChangedFileEntryProps {
  entry: FeatureChangeEntry;
  onFileClick: (path: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ChangedFileEntry({
  entry,
  onFileClick,
  isExpanded,
  onToggleExpand
}: ChangedFileEntryProps) {
  // Calculate total scenario count
  const totalScenarios = 
    (entry.scenarios_added?.length || 0) +
    (entry.scenarios_modified?.length || 0) +
    (entry.scenarios_removed?.length || 0);

  // Check if there are any scenarios to show
  const hasScenarios = totalScenarios > 0;

  // Get display path (show relative to ai/ if possible)
  const getDisplayPath = (filePath: string): string => {
    const normalized = filePath.replace(/\\/g, '/');
    
    // If path contains /ai/, extract from there
    const aiIndex = normalized.indexOf('/ai/');
    if (aiIndex !== -1) {
      return normalized.substring(aiIndex + 1);
    }
    
    // Otherwise return the full path
    return normalized;
  };

  const displayPath = getDisplayPath(entry.path);

  return (
    <div style={{ marginBottom: 4 }}>
      {/* File path header with expand/collapse */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: hasScenarios ? 'pointer' : 'default',
          padding: '4px 0',
          fontSize: 10,
          opacity: 0.7
        }}
        onClick={hasScenarios ? onToggleExpand : undefined}
      >
        {/* Chevron icon */}
        {hasScenarios && (
          <span
            style={{
              marginRight: 6,
              fontSize: 10,
              transform: isExpanded ? 'rotate(90deg)' : 'none',
              display: 'inline-block',
              transition: 'transform 0.15s ease',
              color: 'var(--vscode-foreground)'
            }}
          >
            ▸
          </span>
        )}
        {!hasScenarios && (
          <span style={{ marginRight: 6, fontSize: 10, opacity: 0 }}>▸</span>
        )}
        
        {/* File path - clickable */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            onFileClick(entry.path);
          }}
          style={{
            flex: 1,
            fontFamily: 'monospace',
            color: 'var(--vscode-textLink-foreground)',
            cursor: 'pointer',
            textDecoration: 'underline',
            textDecorationColor: 'transparent',
            transition: 'text-decoration-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecorationColor = 'var(--vscode-textLink-foreground)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecorationColor = 'transparent';
          }}
        >
          {displayPath}
        </span>

        {/* Scenario count badge */}
        {hasScenarios && (
          <span
            style={{
              marginLeft: 8,
              padding: '2px 6px',
              borderRadius: 3,
              fontSize: 9,
              fontWeight: 600,
              background: 'var(--vscode-badge-background)',
              color: 'var(--vscode-badge-foreground)'
            }}
          >
            {totalScenarios} {totalScenarios === 1 ? 'scenario' : 'scenarios'}
          </span>
        )}
      </div>

      {/* Expanded scenario details */}
      {isExpanded && hasScenarios && (
        <div
          style={{
            marginLeft: 16,
            marginTop: 4,
            fontSize: 10,
            opacity: 0.8,
            display: 'flex',
            flexDirection: 'column',
            gap: 3
          }}
        >
          {/* Added scenarios */}
          {entry.scenarios_added && entry.scenarios_added.length > 0 && (
            <div style={{ color: 'var(--vscode-charts-green)' }}>
              <span style={{ fontWeight: 600 }}>Added:</span>{' '}
              {entry.scenarios_added.join(', ')}
            </div>
          )}

          {/* Modified scenarios */}
          {entry.scenarios_modified && entry.scenarios_modified.length > 0 && (
            <div style={{ color: 'var(--vscode-charts-orange)' }}>
              <span style={{ fontWeight: 600 }}>Modified:</span>{' '}
              {entry.scenarios_modified.join(', ')}
            </div>
          )}

          {/* Removed scenarios */}
          {entry.scenarios_removed && entry.scenarios_removed.length > 0 && (
            <div style={{ color: 'var(--vscode-errorForeground)' }}>
              <span style={{ fontWeight: 600 }}>Removed:</span>{' '}
              {entry.scenarios_removed.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

