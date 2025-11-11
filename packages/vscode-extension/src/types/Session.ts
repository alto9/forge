import { FeatureChangeEntry } from './FeatureChangeEntry';

/**
 * Session frontmatter structure for tracking design sessions
 * 
 * @property changed_files - Array of FeatureChangeEntry objects tracking
 *   feature file changes at scenario-level granularity. Only feature files
 *   (*.feature.md) are tracked in sessions. Each entry includes the file path,
 *   change type ('added' | 'modified'), and optional arrays of scenario names
 *   that were added, modified, or removed. See FeatureChangeEntry interface
 *   for complete structure details.
 */
export interface Session {
    session_id: string;
    start_time: string;
    end_time?: string;
    status: 'design' | 'scribe' | 'development' | 'completed';
    problem_statement: string;
    changed_files: FeatureChangeEntry[];
}

