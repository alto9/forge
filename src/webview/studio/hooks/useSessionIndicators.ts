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

    // Only show indicators for feature files
    if (!relativePath.endsWith('.feature.md')) {
      return false;
    }

    // Check if this feature file is in the changed files list
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

    // Only return change type for feature files
    if (!relativePath.endsWith('.feature.md')) {
      return null;
    }

    // Find the entry for this feature file
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

  /**
   * Get scenario-level changes for a feature file
   * @param relativePath - Path relative to ai/ folder (e.g., 'features/studio/actors.feature.md')
   * @returns Object with added, modified, and removed scenario arrays, or null if not found or using old format
   */
  const getScenarioChanges = React.useCallback((relativePath: string): { added: string[]; modified: string[]; removed: string[] } | null => {
    if (!activeSession || !activeSession.changedFiles) {
      return null;
    }

    // Only return scenario changes for feature files
    if (!relativePath.endsWith('.feature.md')) {
      return null;
    }

    // Find the entry for this feature file
    const entry = activeSession.changedFiles.find((e: any) => {
      if (typeof e === 'string') {
        // Old format - no scenario-level data available
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

    // If entry is a string (old format), return null (no scenario-level data)
    if (typeof entry === 'string') {
      return null;
    }

    // If entry is an object, extract scenario arrays
    if (entry && typeof entry === 'object') {
      return {
        added: entry.scenarios_added || [],
        modified: entry.scenarios_modified || [],
        removed: entry.scenarios_removed || []
      };
    }

    return null;
  }, [activeSession]);

  return {
    isModified,
    getChangeType,
    getScenarioChanges
  };
}

