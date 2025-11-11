import React from 'react';

interface NavItemConfig {
  id: string;
  label: string;
  alwaysEnabled?: boolean;
  requiresSession?: boolean;
}

interface NavSectionProps {
  title: string;
  items: NavItemConfig[];
  currentPage: string;
  activeSession: any;
  onNavigate: (page: string) => void;
}

interface SidebarProps {
  currentPage: string;
  activeSession: any;
  onNavigate: (page: string) => void;
}

/**
 * NavSection renders a group of navigation items with a header
 */
const NavSection: React.FC<NavSectionProps> = ({
  title,
  items,
  currentPage,
  activeSession,
  onNavigate,
}) => {
  return (
    <div style={styles.navSection}>
      <div style={styles.navSectionHeader}>{title}</div>
      {items.map((item) => {
        const isActive = currentPage === item.id;
        const requiresSessionForEditing = item.requiresSession && !activeSession;

        return (
          <div
            key={item.id}
            style={{
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            }}
            onClick={() => onNavigate(item.id)}
            title={getTooltip(item.label, requiresSessionForEditing, item.requiresSession)}
          >
            <span style={styles.navLabel}>{item.label}</span>
            {requiresSessionForEditing && <span style={styles.lockIcon}>🔒</span>}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Sidebar component with INFORM and DESIGN sections
 */
export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  activeSession,
  onNavigate,
}) => {
  const foundationalItems: NavItemConfig[] = [
    { id: 'actors', label: 'Actors', alwaysEnabled: true },
    { id: 'contexts', label: 'Contexts', alwaysEnabled: true },
    { id: 'sessions', label: 'Sessions', alwaysEnabled: true },
  ];

  const designItems: NavItemConfig[] = [
    { id: 'features', label: 'Features', requiresSession: true },
    { id: 'diagrams', label: 'Diagrams' },
    { id: 'specs', label: 'Specifications' },
  ];

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
      <div
        style={{
          ...styles.navItem,
          ...(currentPage === 'dashboard' ? styles.navItemActive : {}),
          marginBottom: '12px',
        }}
        onClick={() => onNavigate('dashboard')}
      >
        <span style={styles.navLabel}>Dashboard</span>
      </div>

      {/* Inform Section */}
      <NavSection
        title="INFORM"
        items={foundationalItems}
        currentPage={currentPage}
        activeSession={activeSession}
        onNavigate={onNavigate}
      />

      {/* Visual divider */}
      <div style={styles.divider} />

      {/* Design Section */}
      <NavSection
        title="DESIGN"
        items={designItems}
        currentPage={currentPage}
        activeSession={activeSession}
        onNavigate={onNavigate}
      />
    </div>
  );
};

/**
 * Get tooltip text for navigation item
 */
function getTooltip(
  label: string,
  requiresSessionForEditing: boolean,
  requiresSession?: boolean
): string {
  const tooltips: { [key: string]: string } = {
    'Actors': 'Define system actors and personas - Always editable',
    'Contexts': 'Provide technical guidance and context - Always editable',
    'Sessions': 'Manage design sessions - Create and manage at any time',
    'Features': 'Define user-facing functionality - Requires active session for editing',
    'Diagrams': 'Visual architecture diagrams - Always editable',
    'Specifications': 'Define technical specifications - Always editable',
  };

  let tooltip = tooltips[label] || label;

  if (requiresSession && requiresSessionForEditing) {
    tooltip += ' - Browsable now, session required for editing';
  }

  return tooltip;
}

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
  navLabel: {
    flex: 1,
  },
  lockIcon: {
    fontSize: '10px',
    marginLeft: '8px',
  },
  divider: {
    height: '1px',
    background: 'var(--vscode-panel-border)',
    margin: '12px 0',
  },
};

// Add hover styles via global style injection
if (typeof document !== 'undefined') {
  const styleId = 'sidebar-hover-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .nav-item:hover:not(.disabled) {
        background: var(--vscode-list-hoverBackground) !important;
      }
    `;
    document.head.appendChild(style);
  }
}


