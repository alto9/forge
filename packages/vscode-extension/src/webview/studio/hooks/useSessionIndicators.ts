import React from 'react';

interface ActiveSession {
  sessionId: string;
  problemStatement: string;
  startTime: string;
  changedFiles: any[]; // Can be string[] or ChangedFileEntry[]
}

interface ChangedFileEntry {
  path: string;
  change_type?: 'added' | 'modified' | 'removed';
  scenarios_added?: string[];
  scenarios_modified?: string[];
  scenarios_removed?: string[];
  sections_modified?: string[];
  description?: string;
}

/**
 * Hook to check if files are modified in the current active session
 * and determine what type of change was made
 */
export function useSessionIndicators(activeSession: ActiveSession | null = null) {
  /**
   * Check if a file path is in the active session's changed files
   * @param relativePath - Path relative to ai/ folder (e.g., 'features/studio/actors.feature.md')
   */
  const isModified = React.useCallback((relativePath: string): boolean => {
    if (!activeSession || !activeSession.changedFiles) {
      return false;
    }

    // Check if this file is in the changed files list
    return activeSession.changedFiles.some((entry: any) => {
      if (typeof entry === 'string') {
        // Simple string comparison
        return entry === relativePath || entry.endsWith('/' + relativePath);
      } else if (entry && typeof entry === 'object' && entry.path) {
        // Object with path property
        const entryPath = entry.path;
        return entryPath === relativePath || entryPath.endsWith('/' + relativePath);
      }
      return false;
    });
  }, [activeSession]);

  /**
   * Get the change type for a file
   * @param relativePath - Path relative to ai/ folder
   * @returns 'added', 'modified', 'removed', or null
   */
  const getChangeType = React.useCallback((relativePath: string): string | null => {
    if (!activeSession || !activeSession.changedFiles) {
      return null;
    }

    // Find the entry for this file
    const entry = activeSession.changedFiles.find((e: any) => {
      if (typeof e === 'string') {
        return e === relativePath || e.endsWith('/' + relativePath);
      } else if (e && typeof e === 'object' && e.path) {
        const entryPath = e.path;
        return entryPath === relativePath || entryPath.endsWith('/' + relativePath);
      }
      return false;
    });

    if (!entry) {
      return null;
    }

    // If entry is an object with change_type, return it
    if (typeof entry === 'object' && entry.change_type) {
      return entry.change_type;
    }

    // Default to 'modified' if we just have a string
    return 'modified';
  }, [activeSession]);

  return {
    isModified,
    getChangeType
  };
}

