import React from 'react';
import { NavSection } from './NavSection';
import { NavItem } from './NavItem';

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

interface SidebarProps {
  currentPage: string;
  activeSession: any;
  onNavigate: (page: string, folderPath?: string) => void;
  vscode?: any;
}


/**
 * Sidebar component with INFORM and DESIGN sections
 */
export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  activeSession,
  onNavigate,
  vscode,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set());
  const [folderTrees, setFolderTrees] = React.useState<{ [category: string]: FolderNode[] }>({});

  const informItems: NavItemConfig[] = [
    { id: 'actors', label: 'Actors', alwaysEnabled: true },
    { id: 'contexts', label: 'Contexts', alwaysEnabled: true },
    { id: 'diagrams', label: 'Diagrams', alwaysEnabled: true },
    { id: 'specs', label: 'Specifications', alwaysEnabled: true },
  ];

  const designItems: NavItemConfig[] = [
    { id: 'sessions', label: 'Sessions', alwaysEnabled: true },
    { id: 'features', label: 'Features', alwaysEnabled: true },
  ];

  // Fetch folder trees on mount
  React.useEffect(() => {
    const categories = ['actors', 'contexts', 'diagrams', 'specs', 'features'];
    categories.forEach(category => {
      vscode?.postMessage({ type: 'getFolderTree', category });
    });

    function onMessage(event: MessageEvent) {
      const msg = event.data;
      if (msg?.type === 'folderTree') {
        setFolderTrees(prev => ({
          ...prev,
          [msg.category]: msg.data || []
        }));
      }
      if (msg?.type === 'structureChanged') {
        // Refresh all folder trees when structure changes
        categories.forEach(category => {
          vscode?.postMessage({ type: 'getFolderTree', category });
        });
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [vscode]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>Forge Studio</div>
        {activeSession && (
          <div style={styles.sessionIndicator}>
            ● Session Active
          </div>
        )}
      </div>

      {/* Dashboard always visible */}
      <NavItem
        id="dashboard"
        label="Dashboard"
        currentPage={currentPage}
        onNavigate={onNavigate}
      />

      {/* Inform Section */}
      <NavSection
        title="INFORM"
        items={informItems}
        currentPage={currentPage}
        activeSession={activeSession}
        onNavigate={onNavigate}
        folderTrees={folderTrees}
        expandedSections={expandedSections}
        onToggleSection={toggleSection}
      />

      {/* Design Section */}
      <NavSection
        title="DESIGN"
        items={designItems}
        currentPage={currentPage}
        activeSession={activeSession}
        onNavigate={onNavigate}
        folderTrees={folderTrees}
        expandedSections={expandedSections}
        onToggleSection={toggleSection}
      />
    </div>
  );
};


// Styles using VSCode theme variables
const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    width: '220px',
    background: 'var(--vscode-sideBar-background)',
    borderRight: '1px solid var(--vscode-panel-border)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
  },
  header: {
    padding: '12px 16px',
    fontWeight: 600,
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  title: {
    fontSize: '14px',
    color: 'var(--vscode-foreground)',
  },
  sessionIndicator: {
    fontSize: '10px',
    marginTop: '4px',
    color: 'var(--vscode-charts-green)',
    fontWeight: 'normal',
  },
};

// Add hover styles via global style injection
if (typeof document !== 'undefined') {
  const styleId = 'sidebar-hover-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .nav-item:hover {
        background: var(--vscode-list-hoverBackground) !important;
      }
      .nav-item-disabled:hover {
        background: transparent !important;
        cursor: not-allowed !important;
      }
    `;
    document.head.appendChild(style);
  }
}


