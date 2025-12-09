interface ActiveSession {
  sessionId: string;
  problemStatement: string;
  startTime: string;
  changedFiles: any[];
}

/**
 * Hook to determine if a category of files is editable based on session status
 * 
 * Features are directive - require active session for editing
 * Specs/diagrams/actors are informative - always editable
 */
export function useSessionPermissions() {
  /**
   * Check if a category is editable given the current session state
   * @param category - The file category ('features', 'specs', 'diagrams', 'actors')
   * @param activeSession - The active session or null
   * @returns true if editable, false if read-only
   */
  const isEditable = (category: string, activeSession: ActiveSession | null): boolean => {
    // Features are directive - require session
    if (category === 'features') {
      return activeSession !== null;
    }
    // Specs, diagrams, actors are informative - always editable
    return true;
  };

  /**
   * Check if features specifically require a session
   * @param activeSession - The active session or null
   * @returns true if features require a session (i.e., no session exists)
   */
  const featuresRequireSession = (activeSession: ActiveSession | null): boolean => {
    return activeSession === null;
  };

  /**
   * Get a user-friendly message explaining why a category is locked
   * @param category - The file category
   * @returns Message string or null if not applicable
   */
  const getLockMessage = (category: string): string | null => {
    if (category === 'features') {
      return 'Features require an active design session. Start a session to create or modify features.';
    }
    return null;
  };

  return {
    isEditable,
    featuresRequireSession,
    getLockMessage
  };
}

