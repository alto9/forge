import React from 'react';

interface SessionRequiredViewProps {
  itemType: 'Features';
  onStartSession: () => void;
}

/**
 * SessionRequiredView displays when users navigate to Features
 * without an active session, explaining why a session is required and
 * providing a prominent call-to-action to start a new session.
 */
export const SessionRequiredView: React.FC<SessionRequiredViewProps> = ({
  itemType,
  onStartSession,
}) => {
  const itemTypeLower = itemType.toLowerCase();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Large lock icon */}
        <div style={styles.iconContainer}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={styles.icon}
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Heading */}
        <h2 style={styles.heading}>Active Session Required</h2>

        {/* Explanatory text */}
        <p style={styles.description}>
          {itemType} are created and edited within design sessions. Start a new
          session to work with {itemTypeLower}.
        </p>

        {/* Explanation box */}
        <div style={styles.explanationBox}>
          <strong style={styles.explanationTitle}>Why sessions?</strong>
          <p style={styles.explanationText}>
            {itemType} represent design decisions and changes that should be
            tracked together as a cohesive unit of work. Sessions help you
            organize your design process and generate implementation stories
            from your changes.
          </p>
        </div>

        {/* Call-to-action button */}
        <button style={styles.button} onClick={onStartSession}>
          Start New Session
        </button>
      </div>
    </div>
  );
};

// Styles using VSCode theme variables
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '48px 24px',
    minHeight: '400px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '600px',
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: '24px',
    opacity: 0.3,
  },
  icon: {
    color: 'var(--vscode-foreground)',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    color: 'var(--vscode-foreground)',
  },
  description: {
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
    color: 'var(--vscode-descriptionForeground)',
  },
  explanationBox: {
    padding: '16px 20px',
    marginBottom: '32px',
    background: 'var(--vscode-editorWidget-background)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '6px',
    textAlign: 'left',
    width: '100%',
    maxWidth: '500px',
  },
  explanationTitle: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '8px',
    color: 'var(--vscode-foreground)',
  },
  explanationText: {
    fontSize: '13px',
    lineHeight: '1.5',
    margin: 0,
    color: 'var(--vscode-descriptionForeground)',
  },
  button: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--vscode-button-foreground)',
    background: 'var(--vscode-button-background)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'opacity 0.15s ease',
    fontFamily: 'var(--vscode-font-family)',
  },
};

// Add hover effect via CSS-in-JS workaround
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    button:hover {
      opacity: 0.9;
    }
    button:active {
      opacity: 0.8;
    }
  `;
  document.head.appendChild(style);
}




