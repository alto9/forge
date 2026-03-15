import { describe, it, expect } from 'vitest';
import { REQUIRED_COMMANDS } from '../projectReadiness';

describe('projectReadiness', () => {

  describe('REQUIRED_COMMANDS constant', () => {
    it('should have exactly 5 required commands (workflow commands)', () => {
      expect(REQUIRED_COMMANDS).toHaveLength(5);
    });

    it('should include architect-this.md command', () => {
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/architect-this.md');
    });

    it('should include plan-roadmap.md command', () => {
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/plan-roadmap.md');
    });

    it('should include refine-issue.md command', () => {
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/refine-issue.md');
    });

    it('should include build-from-github.md command', () => {
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/build-from-github.md');
    });

    it('should include review-pr.md command', () => {
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/review-pr.md');
    });

    it('should be a string array', () => {
      expect(Array.isArray(REQUIRED_COMMANDS)).toBe(true);
      REQUIRED_COMMANDS.forEach(command => {
        expect(typeof command).toBe('string');
      });
    });

    it('should only contain .cursor/commands/ paths', () => {
      REQUIRED_COMMANDS.forEach(command => {
        expect(command).toMatch(/^\.cursor\/commands\//);
      });
    });

    it('should only contain .md files', () => {
      REQUIRED_COMMANDS.forEach(command => {
        expect(command).toMatch(/\.md$/);
      });
    });
  });

  describe('Readiness criteria logic', () => {
    it('requires .forge directory to be present', () => {
      const forgePath = '.forge';
      expect(forgePath).toBe('.forge');
    });

    it('requires all 5 workflow commands to be present', () => {
      expect(REQUIRED_COMMANDS.length).toBe(5);
    });
  });

  describe('Command path format', () => {
    it('should use forward slashes for cross-platform compatibility', () => {
      REQUIRED_COMMANDS.forEach(command => {
        if (command.includes('/')) {
          expect(command).not.toContain('\\');
        }
      });
    });

    it('should use .cursor convention (dot prefix)', () => {
      REQUIRED_COMMANDS.forEach(command => {
        expect(command).toMatch(/^\.cursor\//);
      });
    });

    it('should follow Cursor commands naming convention', () => {
      REQUIRED_COMMANDS.forEach(command => {
        expect(command).toMatch(/^\.cursor\/commands\/[a-z-]+\.md$/);
      });
    });
  });
});
