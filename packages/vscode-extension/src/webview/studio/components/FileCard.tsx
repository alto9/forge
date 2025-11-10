import React from 'react';

interface FileCardProps {
  name: string;
  path: string;
  type: 'file' | 'folder';
  objectId?: string;
  modified?: number;
  isModified: boolean;
  changeType: string | null;
  onClick: () => void;
}

export function FileCard({
  name,
  path,
  type,
  objectId,
  modified,
  isModified,
  changeType,
  onClick
}: FileCardProps) {
  const isFolder = type === 'folder';
  
  // Format modified date
  const getModifiedText = () => {
    if (!modified) return '';
    const date = new Date(modified);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Badge for change type
  const renderChangeBadge = () => {
    if (!isModified || !changeType) return null;
    
    const badgeStyles: Record<string, { bg: string; text: string }> = {
      added: { bg: 'var(--vscode-gitDecoration-addedResourceForeground)', text: 'Added' },
      modified: { bg: 'var(--vscode-gitDecoration-modifiedResourceForeground)', text: 'Modified' },
      removed: { bg: 'var(--vscode-gitDecoration-deletedResourceForeground)', text: 'Removed' }
    };
    
    const badge = badgeStyles[changeType] || { bg: 'var(--vscode-badge-background)', text: changeType };
    
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 6px',
          borderRadius: 3,
          fontSize: 10,
          fontWeight: 600,
          background: badge.bg,
          color: 'var(--vscode-badge-foreground)',
          marginLeft: 8
        }}
      >
        {badge.text}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--vscode-list-inactiveSelectionBackground)',
        border: '1px solid var(--vscode-panel-border)',
        borderRadius: 4,
        cursor: 'pointer',
        marginBottom: 8,
        transition: 'all 0.15s ease',
        ...(isModified && {
          borderLeftWidth: 3,
          borderLeftColor: 'var(--vscode-gitDecoration-modifiedResourceForeground)',
        })
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--vscode-list-hoverBackground)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--vscode-list-inactiveSelectionBackground)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <span
          style={{
            marginRight: 12,
            fontSize: 16,
            opacity: 0.8
          }}
        >
          {isFolder ? '📁' : '📄'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 500,
              fontSize: 13,
              marginBottom: objectId ? 2 : 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {name}
            {renderChangeBadge()}
          </div>
          {objectId && (
            <div
              style={{
                fontSize: 11,
                opacity: 0.7,
                fontFamily: 'var(--vscode-editor-font-family)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {objectId}
            </div>
          )}
        </div>
      </div>
      {modified && (
        <div
          style={{
            fontSize: 11,
            opacity: 0.6,
            marginLeft: 12,
            whiteSpace: 'nowrap'
          }}
        >
          {getModifiedText()}
        </div>
      )}
    </div>
  );
}


