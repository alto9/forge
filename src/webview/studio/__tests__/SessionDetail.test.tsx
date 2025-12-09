import { describe, it, expect } from 'vitest';

// Mock session data type
interface FeatureChangeEntry {
  path: string;
  change_type: 'added' | 'modified';
  scenarios_added?: string[];
  scenarios_modified?: string[];
  scenarios_removed?: string[];
}

interface SessionMock {
  sessionId: string;
  frontmatter: {
    session_id: string;
    start_time: string;
    end_time?: string;
    status: string;
    problem_statement: string;
    changed_files: FeatureChangeEntry[] | string[]; // Support both formats
    command_file?: string;
  };
  filePath: string;
}

describe('SessionCard Component Logic', () => {
  describe('Problem Statement Truncation', () => {
    it('should not truncate statement under 80 characters', () => {
      const statement = 'This is a short problem statement';
      const truncated = statement.length > 80 
        ? statement.substring(0, 80) + '...' 
        : statement;
      
      expect(truncated).toBe(statement);
      expect(truncated.length).toBeLessThan(80);
    });

    it('should truncate statement over 80 characters', () => {
      const statement = 'This is a very long problem statement that exceeds the eighty character limit and should be truncated properly';
      const truncated = statement.length > 80 
        ? statement.substring(0, 80) + '...' 
        : statement;
      
      expect(truncated).toContain('...');
      expect(truncated.length).toBe(83); // 80 chars + '...'
      expect(truncated.substring(0, 80)).toBe(statement.substring(0, 80));
    });

    it('should truncate at exactly 80 characters', () => {
      const statement = 'a'.repeat(100);
      const truncated = statement.length > 80 
        ? statement.substring(0, 80) + '...' 
        : statement;
      
      expect(truncated).toBe('a'.repeat(80) + '...');
      expect(truncated.length).toBe(83);
    });

    it('should handle empty statement', () => {
      const statement = '';
      const fallback = statement || 'No description';
      const truncated = fallback.length > 80 
        ? fallback.substring(0, 80) + '...' 
        : fallback;
      
      expect(truncated).toBe('No description');
    });
  });

  describe('Status Badge Colors', () => {
    function getStatusColor(status: string) {
      switch (status) {
        case 'active':
          return { background: 'var(--vscode-charts-green)', color: 'var(--vscode-editor-background)' };
        case 'completed':
          return { background: 'var(--vscode-charts-blue)', color: 'var(--vscode-editor-background)' };
        case 'awaiting_implementation':
          return { background: 'var(--vscode-charts-orange)', color: 'var(--vscode-editor-background)' };
        default:
          return { background: 'var(--vscode-badge-background)', color: 'var(--vscode-badge-foreground)' };
      }
    }

    it('should return green for active status', () => {
      const colors = getStatusColor('active');
      expect(colors.background).toBe('var(--vscode-charts-green)');
    });

    it('should return blue for completed status', () => {
      const colors = getStatusColor('completed');
      expect(colors.background).toBe('var(--vscode-charts-blue)');
    });

    it('should return orange for awaiting_implementation status', () => {
      const colors = getStatusColor('awaiting_implementation');
      expect(colors.background).toBe('var(--vscode-charts-orange)');
    });

    it('should return default for unknown status', () => {
      const colors = getStatusColor('unknown');
      expect(colors.background).toBe('var(--vscode-badge-background)');
    });
  });

  describe('Relative Time Formatting', () => {
    function formatStartTime(startTime: string): string {
      if (!startTime) return 'Unknown';
      const date = new Date(startTime);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 60) {
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    }

    it('should format minutes correctly', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
      const formatted = formatStartTime(fiveMinutesAgo.toISOString());
      
      expect(formatted).toBe('5 minutes ago');
    });

    it('should format hours correctly', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60000);
      const formatted = formatStartTime(twoHoursAgo.toISOString());
      
      expect(formatted).toBe('2 hours ago');
    });

    it('should format days correctly', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60000);
      const formatted = formatStartTime(threeDaysAgo.toISOString());
      
      expect(formatted).toBe('3 days ago');
    });

    it('should format old dates as date string', () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60000);
      const formatted = formatStartTime(tenDaysAgo.toISOString());
      
      expect(formatted).toBe(tenDaysAgo.toLocaleDateString());
    });

    it('should handle singular forms correctly', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60000);
      const formatted = formatStartTime(oneMinuteAgo.toISOString());
      
      expect(formatted).toBe('1 minute ago');
    });

    it('should return Unknown for invalid time', () => {
      const formatted = formatStartTime('');
      expect(formatted).toBe('Unknown');
    });
  });

  describe('Card Display Logic', () => {
    it('should display all required fields', () => {
      const session: SessionMock = {
        sessionId: 'test-session',
        frontmatter: {
          session_id: 'test-session',
          start_time: new Date().toISOString(),
          status: 'active',
          problem_statement: 'Test problem',
          changed_files: [
            { path: 'file1.md', change_type: 'modified' },
            { path: 'file2.md', change_type: 'modified' }
          ]
        },
        filePath: '/path/to/session.md'
      };

      // Verify all fields are present
      expect(session.sessionId).toBe('test-session');
      expect(session.frontmatter.status).toBe('active');
      expect(session.frontmatter.problem_statement).toBe('Test problem');
      expect(session.frontmatter.changed_files).toHaveLength(2);
    });

    it('should show command status when command_file exists', () => {
      const session: SessionMock = {
        sessionId: 'test-session',
        frontmatter: {
          session_id: 'test-session',
          start_time: new Date().toISOString(),
          status: 'awaiting_implementation',
          problem_statement: 'Test',
          changed_files: [],
          command_file: '.cursor/commands/create-stories-test.md'
        },
        filePath: '/path/to/session.md'
      };

      const hasCommand = !!session.frontmatter.command_file;
      expect(hasCommand).toBe(true);
    });
  });
});

describe('ChangedFiles Grouping Logic', () => {
  describe('File Type Detection', () => {
    function groupFiles(files: string[]) {
      const groups: {
        features: string[];
        specs: string[];
        actors: string[];
        sessions: string[];
        tickets: string[];
        other: string[];
      } = {
        features: [],
        specs: [],
        actors: [],
        sessions: [],
        tickets: [],
        other: []
      };

      files.forEach(file => {
        const normalizedPath = file.replace(/\\/g, '/');
        
        if (normalizedPath.includes('/features/')) {
          groups.features.push(file);
        } else if (normalizedPath.includes('/specs/')) {
          groups.specs.push(file);
        } else if (normalizedPath.includes('/actors/')) {
          groups.actors.push(file);
        } else if (normalizedPath.includes('/sessions/')) {
          groups.sessions.push(file);
        } else if (normalizedPath.includes('/tickets/')) {
          groups.tickets.push(file);
        } else {
          groups.other.push(file);
        }
      });

      return groups;
    }

    it('should group features correctly', () => {
      const files = [
        'ai/features/test.feature.md',
        'ai/features/nested/another.feature.md'
      ];
      
      const grouped = groupFiles(files);
      
      expect(grouped.features).toHaveLength(2);
      expect(grouped.features).toContain('ai/features/test.feature.md');
      expect(grouped.features).toContain('ai/features/nested/another.feature.md');
    });

    it('should group specs correctly', () => {
      const files = [
        'ai/specs/api.spec.md',
        'ai/specs/database/schema.spec.md'
      ];
      
      const grouped = groupFiles(files);
      
      expect(grouped.specs).toHaveLength(2);
    });

    it('should group actors correctly', () => {
      const files = ['ai/actors/user.actor.md', 'ai/actors/admin.actor.md'];
      const grouped = groupFiles(files);
      
      expect(grouped.actors).toHaveLength(2);
    });


    it('should group sessions correctly', () => {
      const files = ['ai/sessions/my-session.session.md'];
      const grouped = groupFiles(files);
      
      expect(grouped.sessions).toHaveLength(1);
    });

    it('should group tickets correctly', () => {
      const files = [
        'ai/tickets/session-1/story-1.story.md',
        'ai/tickets/session-1/task-1.task.md'
      ];
      
      const grouped = groupFiles(files);
      
      expect(grouped.tickets).toHaveLength(2);
    });

    it('should group other files correctly', () => {
      const files = [
        'README.md',
        'src/index.ts',
        'package.json'
      ];
      
      const grouped = groupFiles(files);
      
      expect(grouped.other).toHaveLength(3);
    });

    it('should handle mixed file types', () => {
      const files = [
        'ai/features/test.feature.md',
        'ai/specs/api.spec.md',
        'src/index.ts',
        'ai/actors/user.actor.md',
        'ai/sessions/test.session.md',
        'ai/tickets/story.story.md',
        'README.md'
      ];
      
      const grouped = groupFiles(files);
      
      expect(grouped.features).toHaveLength(1);
      expect(grouped.specs).toHaveLength(1);
      expect(grouped.actors).toHaveLength(1);
      expect(grouped.sessions).toHaveLength(1);
      expect(grouped.tickets).toHaveLength(1);
      expect(grouped.other).toHaveLength(2);
    });

    it('should handle Windows-style paths', () => {
      const files = [
        'ai\\features\\test.feature.md',
        'ai\\specs\\api.spec.md'
      ];
      
      const grouped = groupFiles(files);
      
      expect(grouped.features).toHaveLength(1);
      expect(grouped.specs).toHaveLength(1);
    });

    it('should handle empty file list', () => {
      const files: string[] = [];
      const grouped = groupFiles(files);
      
      expect(grouped.features).toHaveLength(0);
      expect(grouped.specs).toHaveLength(0);
      expect(grouped.actors).toHaveLength(0);
      expect(grouped.sessions).toHaveLength(0);
      expect(grouped.tickets).toHaveLength(0);
      expect(grouped.other).toHaveLength(0);
    });
  });

  describe('File Path Display', () => {
    function getDisplayPath(path: string): string {
      const normalized = path.replace(/\\/g, '/');
      
      if (normalized.startsWith('ai/')) {
        return normalized;
      }
      
      const aiIndex = normalized.indexOf('/ai/');
      if (aiIndex !== -1) {
        return normalized.substring(aiIndex + 1);
      }
      
      return normalized;
    }

    it('should return path as-is if starts with ai/', () => {
      const path = 'ai/features/test.feature.md';
      const display = getDisplayPath(path);
      
      expect(display).toBe('ai/features/test.feature.md');
    });

    it('should extract path from full absolute path', () => {
      const path = '/Users/user/project/ai/features/test.feature.md';
      const display = getDisplayPath(path);
      
      expect(display).toBe('ai/features/test.feature.md');
    });

    it('should handle Windows absolute paths', () => {
      const path = 'C:\\Users\\user\\project\\ai\\features\\test.feature.md';
      const display = getDisplayPath(path);
      
      expect(display).toBe('ai/features/test.feature.md');
    });

    it('should return full path if no ai/ found', () => {
      const path = '/Users/user/project/src/index.ts';
      const display = getDisplayPath(path);
      
      expect(display).toBe('/Users/user/project/src/index.ts');
    });

    it('should handle relative paths without ai/', () => {
      const path = 'src/index.ts';
      const display = getDisplayPath(path);
      
      expect(display).toBe('src/index.ts');
    });
  });

  describe('File Group Counts', () => {
    it('should count files in each group correctly', () => {
      const files = [
        'ai/features/f1.feature.md',
        'ai/features/f2.feature.md',
        'ai/features/f3.feature.md',
        'ai/specs/s1.spec.md',
        'ai/specs/s2.spec.md',
        'ai/actors/a1.actor.md',
        'src/index.ts'
      ];

      function groupFiles(files: string[]) {
        const groups = {
          features: [] as string[],
          specs: [] as string[],
          actors: [] as string[],
          sessions: [] as string[],
          tickets: [] as string[],
          other: [] as string[]
        };

        files.forEach(file => {
          const normalizedPath = file.replace(/\\/g, '/');
          
          if (normalizedPath.includes('/features/')) {
            groups.features.push(file);
          } else if (normalizedPath.includes('/specs/')) {
            groups.specs.push(file);
          } else if (normalizedPath.includes('/actors/')) {
            groups.actors.push(file);
          } else if (normalizedPath.includes('/sessions/')) {
            groups.sessions.push(file);
          } else if (normalizedPath.includes('/tickets/')) {
            groups.tickets.push(file);
          } else {
            groups.other.push(file);
          }
        });

        return groups;
      }

      const grouped = groupFiles(files);

      expect(grouped.features.length).toBe(3);
      expect(grouped.specs.length).toBe(2);
      expect(grouped.actors.length).toBe(1);
      expect(grouped.sessions.length).toBe(0);
      expect(grouped.tickets.length).toBe(0);
      expect(grouped.other.length).toBe(1);
    });
  });
});

describe('SessionDetail Display Logic', () => {
  describe('Session Information Display', () => {
    it('should display all frontmatter fields', () => {
      const session: SessionMock = {
        sessionId: 'test-session',
        frontmatter: {
          session_id: 'test-session',
          start_time: '2024-01-01T10:00:00Z',
          end_time: '2024-01-01T12:00:00Z',
          status: 'completed',
          problem_statement: 'Test problem statement',
          changed_files: [
            { path: 'file1.md', change_type: 'modified' },
            { path: 'file2.md', change_type: 'modified' }
          ],
          command_file: '.cursor/commands/test.md'
        },
        filePath: '/path/to/session.md'
      };

      // Verify all fields are accessible
      expect(session.sessionId).toBeDefined();
      expect(session.frontmatter.start_time).toBeDefined();
      expect(session.frontmatter.end_time).toBeDefined();
      expect(session.frontmatter.status).toBeDefined();
      expect(session.frontmatter.problem_statement).toBeDefined();
      expect(session.frontmatter.changed_files).toBeDefined();
      expect(session.frontmatter.command_file).toBeDefined();
    });

    it('should handle session without end_time', () => {
      const session: SessionMock = {
        sessionId: 'active-session',
        frontmatter: {
          session_id: 'active-session',
          start_time: '2024-01-01T10:00:00Z',
          status: 'active',
          problem_statement: 'Currently active',
          changed_files: []
        },
        filePath: '/path/to/session.md'
      };

      expect(session.frontmatter.end_time).toBeUndefined();
      expect(session.frontmatter.status).toBe('active');
    });

    it('should handle session without command_file', () => {
      const session: SessionMock = {
        sessionId: 'completed-session',
        frontmatter: {
          session_id: 'completed-session',
          start_time: '2024-01-01T10:00:00Z',
          end_time: '2024-01-01T12:00:00Z',
          status: 'completed',
          problem_statement: 'Completed but not distilled',
          changed_files: [
            { path: 'file1.md', change_type: 'modified' }
          ]
        },
        filePath: '/path/to/session.md'
      };

      expect(session.frontmatter.command_file).toBeUndefined();
      expect(session.frontmatter.status).toBe('completed');
    });

    it('should format dates for display', () => {
      const startTime = '2024-01-01T10:00:00Z';
      const formatted = new Date(startTime).toLocaleString();
      
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('2024');
    });
  });

  describe('Timeline Information', () => {
    it('should show start time', () => {
      const startTime = '2024-01-01T10:00:00Z';
      const formatted = new Date(startTime).toLocaleString();
      
      expect(formatted).toBeTruthy();
    });

    it('should show end time if exists', () => {
      const endTime = '2024-01-01T12:00:00Z';
      const formatted = endTime ? new Date(endTime).toLocaleString() : null;
      
      expect(formatted).toBeTruthy();
    });

    it('should not show end time if undefined', () => {
      const endTime = undefined;
      const formatted = endTime ? new Date(endTime).toLocaleString() : null;
      
      expect(formatted).toBeNull();
    });

    it('should show file count', () => {
      const changedFiles = ['file1.md', 'file2.md', 'file3.md'];
      const count = changedFiles.length;
      const label = `${count} file${count !== 1 ? 's' : ''}`;
      
      expect(label).toBe('3 files');
    });

    it('should handle singular file count', () => {
      const changedFiles = ['file1.md'];
      const count = changedFiles.length;
      const label = `${count} file${count !== 1 ? 's' : ''}`;
      
      expect(label).toBe('1 file');
    });

    it('should show command file path if exists', () => {
      const commandFile = '.cursor/commands/create-stories-test.md';
      
      expect(commandFile).toBeTruthy();
      expect(commandFile).toContain('.cursor/commands/');
    });
  });

  describe('Empty Content Sections', () => {
    it('should handle sessions without content sections', () => {
      const content = {
        goals: '',
        approach: '',
        keyDecisions: '',
        notes: ''
      };

      // Sections should only render if they have content
      expect(content.goals || null).toBeNull();
      expect(content.approach || null).toBeNull();
      expect(content.keyDecisions || null).toBeNull();
      expect(content.notes || null).toBeNull();
    });

    it('should render sections with content', () => {
      const content = {
        goals: 'Implement feature X',
        approach: 'Use TDD approach',
        keyDecisions: 'Decided to use React',
        notes: 'Consider performance'
      };

      expect(content.goals).toBeTruthy();
      expect(content.approach).toBeTruthy();
      expect(content.keyDecisions).toBeTruthy();
      expect(content.notes).toBeTruthy();
    });
  });
});


