/**
 * Represents a change entry for a feature file with scenario-level tracking
 */
export interface FeatureChangeEntry {
    /** Relative path from workspace root */
    path: string;
    /** Type of change: 'added' for new files, 'modified' for existing files */
    change_type: 'added' | 'modified';
    /** Scenario names that were added (optional) */
    scenarios_added?: string[];
    /** Scenario names that were modified (optional) */
    scenarios_modified?: string[];
    /** Scenario names that were removed (optional) */
    scenarios_removed?: string[];
}

