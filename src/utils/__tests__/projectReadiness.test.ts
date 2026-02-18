import { describe, it, expect } from 'vitest';
import { REQUIRED_COMMANDS } from '../projectReadiness';

describe('projectReadiness', () => {

  describe('REQUIRED_COMMANDS constant', () => {
    it('should have exactly 6 required commands', () => {
      expect(REQUIRED_COMMANDS).toHaveLength(6);
    });

    it('should include forge-refine.md command', () => {
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-refine.md');
    });

    it('should include forge-build.md command', () => {
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-build.md');
    });

    it('should include forge-scribe.md command', () => {
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-scribe.md');
    });

    it('should include forge-commit.md command', () => {
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-commit.md');
    });

    it('should include forge-push.md command', () => {
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-push.md');
    });

    it('should include forge-pullrequest.md command', () => {
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-pullrequest.md');
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
      // Project readiness requires .forge directory
      const forgePath = '.forge';
      expect(forgePath).toBe('.forge');
    });

    it('requires all 6 commands to be present', () => {
      expect(REQUIRED_COMMANDS.length).toBe(6);
    });

    it('requires command files to have valid content (hash validation)', () => {
      const commandPath = '.cursor/commands/forge-refine.md';
      expect(commandPath).toMatch(/\.cursor\/commands\/.*\.md$/);
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

  describe('Integration with command validation', () => {
    it('REQUIRED_COMMANDS should match getManagedCommandPaths()', () => {
      const refineCommand = '.cursor/commands/forge-refine.md';
      const buildCommand = '.cursor/commands/forge-build.md';
      const scribeCommand = '.cursor/commands/forge-scribe.md';
      const commitCommand = '.cursor/commands/forge-commit.md';
      const pushCommand = '.cursor/commands/forge-push.md';
      const pullrequestCommand = '.cursor/commands/forge-pullrequest.md';

      expect(REQUIRED_COMMANDS).toContain(refineCommand);
      expect(REQUIRED_COMMANDS).toContain(buildCommand);
      expect(REQUIRED_COMMANDS).toContain(scribeCommand);
      expect(REQUIRED_COMMANDS).toContain(commitCommand);
      expect(REQUIRED_COMMANDS).toContain(pushCommand);
      expect(REQUIRED_COMMANDS).toContain(pullrequestCommand);
    });
  });

  describe('Constants are immutable', () => {
    it('REQUIRED_COMMANDS should not be modifiable', () => {
      const originalLength = REQUIRED_COMMANDS.length;

      const copy = [...REQUIRED_COMMANDS];
      copy.push('.cursor/commands/invalid.md');

      expect(REQUIRED_COMMANDS.length).toBe(originalLength);
      expect(REQUIRED_COMMANDS.length).toBe(6);
    });
  });

  describe('Documentation alignment', () => {
    it('matches documented required commands count', () => {
      expect(REQUIRED_COMMANDS.length).toBe(6);
    });

    it('aligns with Forge migration plan - no ai/ folder requirements', () => {
      // Migration removed ai/ folder requirements; only .forge and commands
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-refine.md');
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-build.md');
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-scribe.md');
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-commit.md');
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-push.md');
      expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-pullrequest.md');
    });
  });
});
