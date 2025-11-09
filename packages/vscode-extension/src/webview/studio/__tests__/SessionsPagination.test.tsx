import { describe, it, expect } from 'vitest';

// Mock session data for testing
interface SessionMock {
  sessionId: string;
  frontmatter: {
    session_id: string;
    start_time: string;
    status: string;
    problem_statement: string;
    changed_files: string[];
  };
  filePath: string;
}

// Helper function to generate mock sessions
function generateMockSessions(count: number): SessionMock[] {
  const statuses = ['active', 'completed', 'awaiting_implementation'];
  const sessions: SessionMock[] = [];
  
  for (let i = 0; i < count; i++) {
    const date = new Date(2024, 0, i + 1);
    sessions.push({
      sessionId: `session-${String.fromCharCode(97 + (i % 26))}-${i}`,
      frontmatter: {
        session_id: `session-${String.fromCharCode(97 + (i % 26))}-${i}`,
        start_time: date.toISOString(),
        status: statuses[i % statuses.length],
        problem_statement: `Problem statement ${i}`,
        changed_files: [`file${i}.md`]
      },
      filePath: `/path/to/session-${i}.session.md`
    });
  }
  
  return sessions;
}

// Pagination logic extracted from SessionsPage
function paginateSessions(sessions: SessionMock[], currentPage: number, itemsPerPage: number = 10) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return sessions.slice(startIndex, endIndex);
}

function getTotalPages(sessions: SessionMock[], itemsPerPage: number = 10): number {
  return Math.ceil(sessions.length / itemsPerPage);
}

// Sorting logic extracted from SessionsPage
function sortSessions(sessions: SessionMock[], sortBy: string): SessionMock[] {
  const sessionsCopy = [...sessions];
  
  switch (sortBy) {
    case 'newest':
      return sessionsCopy.sort((a, b) => {
        const timeA = a.frontmatter?.start_time ? new Date(a.frontmatter.start_time).getTime() : 0;
        const timeB = b.frontmatter?.start_time ? new Date(b.frontmatter.start_time).getTime() : 0;
        return timeB - timeA;
      });
    
    case 'oldest':
      return sessionsCopy.sort((a, b) => {
        const timeA = a.frontmatter?.start_time ? new Date(a.frontmatter.start_time).getTime() : 0;
        const timeB = b.frontmatter?.start_time ? new Date(b.frontmatter.start_time).getTime() : 0;
        return timeA - timeB;
      });
    
    case 'status':
      const statusOrder: { [key: string]: number } = {
        'active': 0,
        'completed': 1,
        'awaiting_implementation': 2
      };
      return sessionsCopy.sort((a, b) => {
        const statusA = a.frontmatter?.status || 'unknown';
        const statusB = b.frontmatter?.status || 'unknown';
        const orderA = statusOrder[statusA] !== undefined ? statusOrder[statusA] : 999;
        const orderB = statusOrder[statusB] !== undefined ? statusOrder[statusB] : 999;
        return orderA - orderB;
      });
    
    case 'id':
      return sessionsCopy.sort((a, b) => {
        const idA = a.sessionId || '';
        const idB = b.sessionId || '';
        return idA.localeCompare(idB);
      });
    
    default:
      return sessionsCopy;
  }
}

describe('Sessions Pagination', () => {
  describe('paginateSessions', () => {
    it('should return first 10 sessions for page 1', () => {
      const sessions = generateMockSessions(25);
      const result = paginateSessions(sessions, 1);
      
      expect(result).toHaveLength(10);
      expect(result[0].sessionId).toBe(sessions[0].sessionId);
      expect(result[9].sessionId).toBe(sessions[9].sessionId);
    });

    it('should return next 10 sessions for page 2', () => {
      const sessions = generateMockSessions(25);
      const result = paginateSessions(sessions, 2);
      
      expect(result).toHaveLength(10);
      expect(result[0].sessionId).toBe(sessions[10].sessionId);
      expect(result[9].sessionId).toBe(sessions[19].sessionId);
    });

    it('should return remaining sessions for last page', () => {
      const sessions = generateMockSessions(25);
      const result = paginateSessions(sessions, 3);
      
      expect(result).toHaveLength(5);
      expect(result[0].sessionId).toBe(sessions[20].sessionId);
      expect(result[4].sessionId).toBe(sessions[24].sessionId);
    });

    it('should handle exactly 10 sessions', () => {
      const sessions = generateMockSessions(10);
      const result = paginateSessions(sessions, 1);
      
      expect(result).toHaveLength(10);
    });

    it('should handle less than 10 sessions', () => {
      const sessions = generateMockSessions(5);
      const result = paginateSessions(sessions, 1);
      
      expect(result).toHaveLength(5);
    });

    it('should return empty array for invalid page', () => {
      const sessions = generateMockSessions(15);
      const result = paginateSessions(sessions, 5); // Only 2 pages exist
      
      expect(result).toHaveLength(0);
    });
  });

  describe('getTotalPages', () => {
    it('should calculate correct pages for 25 sessions', () => {
      const sessions = generateMockSessions(25);
      const totalPages = getTotalPages(sessions);
      
      expect(totalPages).toBe(3);
    });

    it('should calculate correct pages for exactly 10 sessions', () => {
      const sessions = generateMockSessions(10);
      const totalPages = getTotalPages(sessions);
      
      expect(totalPages).toBe(1);
    });

    it('should calculate correct pages for 11 sessions', () => {
      const sessions = generateMockSessions(11);
      const totalPages = getTotalPages(sessions);
      
      expect(totalPages).toBe(2);
    });

    it('should handle empty sessions array', () => {
      const sessions: SessionMock[] = [];
      const totalPages = getTotalPages(sessions);
      
      expect(totalPages).toBe(0);
    });

    it('should handle 1 session', () => {
      const sessions = generateMockSessions(1);
      const totalPages = getTotalPages(sessions);
      
      expect(totalPages).toBe(1);
    });
  });

  describe('Page Navigation', () => {
    it('should navigate through pages correctly', () => {
      const sessions = generateMockSessions(25);
      let currentPage = 1;
      
      // Page 1
      let result = paginateSessions(sessions, currentPage);
      expect(result).toHaveLength(10);
      expect(result[0].sessionId).toBe(sessions[0].sessionId);
      
      // Navigate to page 2
      currentPage = 2;
      result = paginateSessions(sessions, currentPage);
      expect(result).toHaveLength(10);
      expect(result[0].sessionId).toBe(sessions[10].sessionId);
      
      // Navigate to page 3
      currentPage = 3;
      result = paginateSessions(sessions, currentPage);
      expect(result).toHaveLength(5);
      expect(result[0].sessionId).toBe(sessions[20].sessionId);
    });

    it('should handle next page correctly', () => {
      const sessions = generateMockSessions(25);
      let currentPage = 1;
      const totalPages = getTotalPages(sessions);
      
      // Can go next from page 1
      expect(currentPage < totalPages).toBe(true);
      currentPage = Math.min(totalPages, currentPage + 1);
      expect(currentPage).toBe(2);
      
      // Can go next from page 2
      expect(currentPage < totalPages).toBe(true);
      currentPage = Math.min(totalPages, currentPage + 1);
      expect(currentPage).toBe(3);
      
      // Cannot go next from page 3
      expect(currentPage < totalPages).toBe(false);
      currentPage = Math.min(totalPages, currentPage + 1);
      expect(currentPage).toBe(3);
    });

    it('should handle previous page correctly', () => {
      const sessions = generateMockSessions(25);
      let currentPage = 3;
      
      // Can go previous from page 3
      expect(currentPage > 1).toBe(true);
      currentPage = Math.max(1, currentPage - 1);
      expect(currentPage).toBe(2);
      
      // Can go previous from page 2
      expect(currentPage > 1).toBe(true);
      currentPage = Math.max(1, currentPage - 1);
      expect(currentPage).toBe(1);
      
      // Cannot go previous from page 1
      expect(currentPage > 1).toBe(false);
      currentPage = Math.max(1, currentPage - 1);
      expect(currentPage).toBe(1);
    });
  });
});

describe('Sessions Sorting', () => {
  describe('Sort by Newest First', () => {
    it('should sort sessions by start_time descending', () => {
      const sessions = generateMockSessions(5);
      const sorted = sortSessions(sessions, 'newest');
      
      // Should be in reverse chronological order (newest first)
      for (let i = 0; i < sorted.length - 1; i++) {
        const timeA = new Date(sorted[i].frontmatter.start_time).getTime();
        const timeB = new Date(sorted[i + 1].frontmatter.start_time).getTime();
        expect(timeA).toBeGreaterThanOrEqual(timeB);
      }
    });

    it('should handle sessions with same timestamp', () => {
      const baseDate = new Date(2024, 0, 1).toISOString();
      const sessions: SessionMock[] = [
        {
          sessionId: 'session-1',
          frontmatter: {
            session_id: 'session-1',
            start_time: baseDate,
            status: 'active',
            problem_statement: 'Test 1',
            changed_files: []
          },
          filePath: '/path/1'
        },
        {
          sessionId: 'session-2',
          frontmatter: {
            session_id: 'session-2',
            start_time: baseDate,
            status: 'completed',
            problem_statement: 'Test 2',
            changed_files: []
          },
          filePath: '/path/2'
        }
      ];
      
      const sorted = sortSessions(sessions, 'newest');
      expect(sorted).toHaveLength(2);
    });
  });

  describe('Sort by Oldest First', () => {
    it('should sort sessions by start_time ascending', () => {
      const sessions = generateMockSessions(5);
      const sorted = sortSessions(sessions, 'oldest');
      
      // Should be in chronological order (oldest first)
      for (let i = 0; i < sorted.length - 1; i++) {
        const timeA = new Date(sorted[i].frontmatter.start_time).getTime();
        const timeB = new Date(sorted[i + 1].frontmatter.start_time).getTime();
        expect(timeA).toBeLessThanOrEqual(timeB);
      }
    });
  });

  describe('Sort by Status', () => {
    it('should group sessions by status correctly', () => {
      const sessions: SessionMock[] = [
        {
          sessionId: 'session-1',
          frontmatter: {
            session_id: 'session-1',
            start_time: new Date().toISOString(),
            status: 'completed',
            problem_statement: 'Test',
            changed_files: []
          },
          filePath: '/path/1'
        },
        {
          sessionId: 'session-2',
          frontmatter: {
            session_id: 'session-2',
            start_time: new Date().toISOString(),
            status: 'active',
            problem_statement: 'Test',
            changed_files: []
          },
          filePath: '/path/2'
        },
        {
          sessionId: 'session-3',
          frontmatter: {
            session_id: 'session-3',
            start_time: new Date().toISOString(),
            status: 'awaiting_implementation',
            problem_statement: 'Test',
            changed_files: []
          },
          filePath: '/path/3'
        }
      ];
      
      const sorted = sortSessions(sessions, 'status');
      
      // Expected order: active, completed, awaiting_implementation
      expect(sorted[0].frontmatter.status).toBe('active');
      expect(sorted[1].frontmatter.status).toBe('completed');
      expect(sorted[2].frontmatter.status).toBe('awaiting_implementation');
    });

    it('should handle unknown status', () => {
      const sessions: SessionMock[] = [
        {
          sessionId: 'session-1',
          frontmatter: {
            session_id: 'session-1',
            start_time: new Date().toISOString(),
            status: 'active',
            problem_statement: 'Test',
            changed_files: []
          },
          filePath: '/path/1'
        },
        {
          sessionId: 'session-2',
          frontmatter: {
            session_id: 'session-2',
            start_time: new Date().toISOString(),
            status: 'unknown_status' as any,
            problem_statement: 'Test',
            changed_files: []
          },
          filePath: '/path/2'
        }
      ];
      
      const sorted = sortSessions(sessions, 'status');
      
      // Active should come before unknown
      expect(sorted[0].frontmatter.status).toBe('active');
      expect(sorted[1].frontmatter.status).toBe('unknown_status');
    });
  });

  describe('Sort by Session ID', () => {
    it('should sort sessions alphabetically by sessionId', () => {
      const sessions: SessionMock[] = [
        {
          sessionId: 'session-zebra',
          frontmatter: {
            session_id: 'session-zebra',
            start_time: new Date().toISOString(),
            status: 'active',
            problem_statement: 'Test',
            changed_files: []
          },
          filePath: '/path/1'
        },
        {
          sessionId: 'session-alpha',
          frontmatter: {
            session_id: 'session-alpha',
            start_time: new Date().toISOString(),
            status: 'completed',
            problem_statement: 'Test',
            changed_files: []
          },
          filePath: '/path/2'
        },
        {
          sessionId: 'session-beta',
          frontmatter: {
            session_id: 'session-beta',
            start_time: new Date().toISOString(),
            status: 'completed',
            problem_statement: 'Test',
            changed_files: []
          },
          filePath: '/path/3'
        }
      ];
      
      const sorted = sortSessions(sessions, 'id');
      
      expect(sorted[0].sessionId).toBe('session-alpha');
      expect(sorted[1].sessionId).toBe('session-beta');
      expect(sorted[2].sessionId).toBe('session-zebra');
    });

    it('should handle numeric session IDs', () => {
      const sessions: SessionMock[] = [
        {
          sessionId: 'session-10',
          frontmatter: { session_id: 'session-10', start_time: new Date().toISOString(), status: 'active', problem_statement: '', changed_files: [] },
          filePath: '/path/1'
        },
        {
          sessionId: 'session-2',
          frontmatter: { session_id: 'session-2', start_time: new Date().toISOString(), status: 'active', problem_statement: '', changed_files: [] },
          filePath: '/path/2'
        },
        {
          sessionId: 'session-1',
          frontmatter: { session_id: 'session-1', start_time: new Date().toISOString(), status: 'active', problem_statement: '', changed_files: [] },
          filePath: '/path/3'
        }
      ];
      
      const sorted = sortSessions(sessions, 'id');
      
      // String comparison: "session-1" < "session-10" < "session-2"
      expect(sorted[0].sessionId).toBe('session-1');
      expect(sorted[1].sessionId).toBe('session-10');
      expect(sorted[2].sessionId).toBe('session-2');
    });
  });
});

describe('Pagination + Sorting Integration', () => {
  it('should sort then paginate correctly', () => {
    const sessions = generateMockSessions(25);
    
    // Sort by ID
    const sorted = sortSessions(sessions, 'id');
    
    // Paginate page 1
    const page1 = paginateSessions(sorted, 1);
    expect(page1).toHaveLength(10);
    
    // First item should be alphabetically first
    expect(page1[0].sessionId.localeCompare(sorted[0].sessionId)).toBe(0);
    
    // Paginate page 2
    const page2 = paginateSessions(sorted, 2);
    expect(page2).toHaveLength(10);
    expect(page2[0].sessionId).toBe(sorted[10].sessionId);
  });

  it('should maintain sort order across pages', () => {
    const sessions = generateMockSessions(30);
    
    // Sort newest first
    const sorted = sortSessions(sessions, 'newest');
    
    // Get all pages
    const page1 = paginateSessions(sorted, 1);
    const page2 = paginateSessions(sorted, 2);
    const page3 = paginateSessions(sorted, 3);
    
    // Verify chronological order across pages
    const lastOfPage1 = new Date(page1[page1.length - 1].frontmatter.start_time).getTime();
    const firstOfPage2 = new Date(page2[0].frontmatter.start_time).getTime();
    expect(lastOfPage1).toBeGreaterThanOrEqual(firstOfPage2);
    
    const lastOfPage2 = new Date(page2[page2.length - 1].frontmatter.start_time).getTime();
    const firstOfPage3 = new Date(page3[0].frontmatter.start_time).getTime();
    expect(lastOfPage2).toBeGreaterThanOrEqual(firstOfPage3);
  });

  it('should handle sort change resetting pagination', () => {
    const sessions = generateMockSessions(25);
    let currentPage = 3;
    let sortBy = 'newest';
    
    // User is on page 3
    let sorted = sortSessions(sessions, sortBy);
    let result = paginateSessions(sorted, currentPage);
    expect(result).toHaveLength(5); // Last page has 5 items
    
    // User changes sort - should reset to page 1
    sortBy = 'id';
    currentPage = 1; // This is what the component does
    
    sorted = sortSessions(sessions, sortBy);
    result = paginateSessions(sorted, currentPage);
    expect(result).toHaveLength(10); // Page 1 has 10 items
  });

  it('should handle empty sessions with pagination and sorting', () => {
    const sessions: SessionMock[] = [];
    
    const sorted = sortSessions(sessions, 'newest');
    const paginated = paginateSessions(sorted, 1);
    const totalPages = getTotalPages(sorted);
    
    expect(sorted).toHaveLength(0);
    expect(paginated).toHaveLength(0);
    expect(totalPages).toBe(0);
  });

  it('should preserve original array when sorting and paginating', () => {
    const sessions = generateMockSessions(15);
    const originalFirst = sessions[0].sessionId;
    
    // Sort and paginate
    const sorted = sortSessions(sessions, 'id');
    const paginated = paginateSessions(sorted, 1);
    
    // Original array should be unchanged
    expect(sessions[0].sessionId).toBe(originalFirst);
    expect(sessions).toHaveLength(15);
  });
});


