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
    'Contexts': 'Provide technical guidance and best practices - Always accessible reference',
    'Diagrams': 'Visual architecture and system diagrams - Always accessible reference',
    'Specifications': 'Technical contracts and implementation details - Always accessible reference',
    'Sessions': 'Manage design sessions and track changes - Always accessible workflow entry',
    'Features': 'Define user-facing functionality and behavior - Requires active design session',
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
}) => {
  return (
    <div style={styles.navSection}>
      <div style={styles.navSectionHeader}>{title}</div>
      {items.map((item) => {
        const isActive = currentPage === item.id;
        const isDisabled = item.requiresSession && !activeSession;

        return (
          <div
            key={item.id}
            style={{
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
              ...(isDisabled ? styles.navItemDisabled : {}),
            }}
            onClick={() => !isDisabled && onNavigate(item.id)}
            title={getTooltip(item.label, isDisabled, item.requiresSession)}
          >
            <span>{item.label}</span>
            {isDisabled && <span style={styles.lockIcon}>🔒</span>}
          </div>
        );
      })}
    </div>
  );
};


