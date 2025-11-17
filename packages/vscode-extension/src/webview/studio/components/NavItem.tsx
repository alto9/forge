import React from 'react';

interface NavItemProps {
  id: string;
  label: string;
  icon?: string;
  currentPage: string;
  isDisabled?: boolean;
  requiresSession?: boolean;
  onNavigate: (page: string) => void;
}

/**
 * Get tooltip text for navigation item
 */
function getTooltip(
  label: string,
  isDisabled: boolean,
  requiresSession?: boolean
): string {
  const tooltips: { [key: string]: string } = {
    'Dashboard': 'Forge Studio dashboard - Always accessible overview',
    'Actors': 'Define system actors and personas - Always accessible foundational reference',
    'Contexts': 'Provide technical guidance and best practices - Always accessible reference',
    'Diagrams': 'Visual architecture and system diagrams - Always accessible reference',
    'Specifications': 'Technical contracts and implementation details - Always accessible reference',
    'Sessions': 'Manage design sessions and track changes - Always accessible workflow entry',
    'Features': 'Define user-facing functionality and behavior - Requires active design session',
  };

  let tooltip = tooltips[label] || label;

  if (requiresSession && isDisabled) {
    tooltip += ' - Active session required';
  }

  return tooltip;
}

// Styles using VSCode theme variables
const styles: { [key: string]: React.CSSProperties } = {
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
  icon: {
    width: '20px',
    height: '20px',
    marginRight: '10px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: '10px',
    marginLeft: '8px',
  },
};

/**
 * NavItem renders an individual navigation item
 */
export const NavItem: React.FC<NavItemProps> = ({
  id,
  label,
  icon,
  currentPage,
  isDisabled = false,
  requiresSession,
  onNavigate,
}) => {
  const isActive = currentPage === id;

  const handleClick = () => {
    if (!isDisabled) {
      onNavigate(id);
    }
  };

  return (
    <div
      style={{
        ...styles.navItem,
        ...(isActive ? styles.navItemActive : {}),
        ...(isDisabled ? styles.navItemDisabled : {}),
      }}
      onClick={handleClick}
      title={getTooltip(label, isDisabled, requiresSession)}
    >
      {icon && <i style={styles.icon} className={`icon icon-${icon}`} />}
      <span>{label}</span>
      {isDisabled && <span style={styles.lockIcon}>🔒</span>}
    </div>
  );
};


