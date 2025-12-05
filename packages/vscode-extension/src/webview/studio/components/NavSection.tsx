import React from 'react';

interface NavItemConfig {
  id: string;
  label: string;
  alwaysEnabled?: boolean;
  requiresSession?: boolean;
}

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
}

interface NavSectionProps {
  title: string;
  items: NavItemConfig[];
  currentPage: string;
  activeSession: any;
  onNavigate: (page: string, folderPath?: string) => void;
  folderTrees?: { [category: string]: FolderNode[] };
  expandedSections?: Set<string>;
  onToggleSection?: (sectionId: string) => void;
}

/**
 * Get tooltip text for navigation item
 */
function getTooltip(
  label: string,
  requiresSessionForEditing: boolean,
  requiresSession?: boolean
): string {
  const tooltips: { [key: string]: string } = {
    'Actors': 'Define system actors and personas - Always accessible foundational reference',
    'Diagrams': 'Visual architecture and system diagrams - Always accessible reference',
    'Specifications': 'Technical contracts and implementation details - Always accessible reference',
    'Sessions': 'Manage design sessions and track changes - Always accessible workflow entry',
    'Features': 'Browse features anytime, edit during design sessions',
  };

  let tooltip = tooltips[label] || label;

  if (requiresSession && requiresSessionForEditing) {
    tooltip += ' - Active session required';
  }

  return tooltip;
}

// Styles using VSCode theme variables
const styles: { [key: string]: React.CSSProperties } = {
  navSection: {
    marginBottom: '8px',
  },
  navSectionHeader: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: 'var(--vscode-descriptionForeground)',
    padding: '12px 16px 8px 16px',
  },
  navItem: {
    padding: '8px 16px 8px 13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'background-color 0.15s ease',
    fontSize: '13px',
    color: 'var(--vscode-foreground)',
    borderLeft: '3px solid transparent',
  },
  navItemActive: {
    background: 'var(--vscode-list-activeSelectionBackground)',
    color: 'var(--vscode-list-activeSelectionForeground)',
    borderLeft: '3px solid var(--vscode-focusBorder)',
  },
  navItemDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  lockIcon: {
    fontSize: '10px',
    marginLeft: '8px',
  },
  chevron: {
    display: 'inline-block',
    fontSize: '10px',
    marginRight: '4px',
    transition: 'transform 0.15s ease',
    width: '12px',
    textAlign: 'center' as const,
  },
  chevronExpanded: {
    transform: 'rotate(90deg)',
  },
  folderItem: {
    padding: '6px 16px 6px 0px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: 'var(--vscode-foreground)',
    transition: 'background-color 0.15s ease',
  },
  folderItemHover: {
    background: 'var(--vscode-list-hoverBackground)',
  },
};

/**
 * NavSection renders a group of navigation items with a header
 */
export const NavSection: React.FC<NavSectionProps> = ({
  title,
  items,
  currentPage,
  activeSession,
  onNavigate,
  folderTrees = {},
  expandedSections = new Set(),
  onToggleSection = () => {},
}) => {
  const [hoveredFolder, setHoveredFolder] = React.useState<string | null>(null);

  const renderFolder = (folder: FolderNode, level: number, categoryId: string) => {
    const paddingLeft = 13 + (level + 1) * 16;
    const isHovered = hoveredFolder === folder.path;

    return (
      <div key={folder.path}>
        <div
          style={{
            ...styles.folderItem,
            paddingLeft: `${paddingLeft}px`,
            ...(isHovered ? styles.folderItemHover : {}),
          }}
          onClick={() => onNavigate(categoryId, folder.path)}
          onMouseEnter={() => setHoveredFolder(folder.path)}
          onMouseLeave={() => setHoveredFolder(null)}
          className="nav-folder-item"
        >
          <span style={{ fontSize: '10px', marginRight: '6px' }}>📁</span>
          <span>{folder.name}</span>
        </div>
        {folder.children && folder.children.length > 0 && (
          <>
            {folder.children.map(child => renderFolder(child, level + 1, categoryId))}
          </>
        )}
      </div>
    );
  };

  return (
    <div style={styles.navSection}>
      <div style={styles.navSectionHeader}>{title}</div>
      {items.map((item) => {
        const isActive = currentPage === item.id;
        const isDisabled = item.requiresSession && !activeSession;
        const folders = folderTrees[item.id] || [];
        const hasFolders = folders.length > 0;
        const isExpanded = expandedSections.has(item.id);
        const showChevron = hasFolders || item.id === 'features' || item.id === 'actors' || item.id === 'diagrams' || item.id === 'specs';

        return (
          <div key={item.id}>
            <div
              style={{
                ...styles.navItem,
                ...(isActive && !hasFolders ? styles.navItemActive : {}),
                ...(isDisabled ? styles.navItemDisabled : {}),
              }}
              onClick={() => !isDisabled && onNavigate(item.id)}
              title={getTooltip(item.label, isDisabled, item.requiresSession)}
            >
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                {showChevron && (
                  <span
                    style={{
                      ...styles.chevron,
                      ...(isExpanded ? styles.chevronExpanded : {}),
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSection(item.id);
                    }}
                  >
                    ▸
                  </span>
                )}
                {!showChevron && <span style={{ width: '16px' }}></span>}
                <span>{item.label}</span>
              </div>
              {isDisabled && <span style={styles.lockIcon}>🔒</span>}
            </div>
            {isExpanded && hasFolders && (
              <div>
                {folders.map(folder => renderFolder(folder, 0, item.id))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Add hover styles via global style injection
if (typeof document !== 'undefined') {
  const styleId = 'navsection-hover-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .nav-folder-item:hover {
        background: var(--vscode-list-hoverBackground) !important;
      }
    `;
    document.head.appendChild(style);
  }
}


