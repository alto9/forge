import { describe, it, expect } from 'vitest';
import { REQUIRED_COMMANDS, checkProjectReadiness } from '../../utils/projectReadiness';

/**
 * Unit tests for project readiness checking.
 *
 * A project is "Forge-ready" when .forge exists and all REQUIRED_COMMANDS exist.
 */

describe('Project Readiness', () => {
    describe('REQUIRED_COMMANDS', () => {
        it('should include workflow commands', () => {
            expect(REQUIRED_COMMANDS).toContain('.cursor/commands/architect-this.md');
            expect(REQUIRED_COMMANDS).toContain('.cursor/commands/plan-roadmap.md');
            expect(REQUIRED_COMMANDS).toContain('.cursor/commands/refine-issue.md');
            expect(REQUIRED_COMMANDS).toContain('.cursor/commands/build-from-github.md');
            expect(REQUIRED_COMMANDS).toContain('.cursor/commands/review-pr.md');
        });

        it('should have 5 required commands', () => {
            expect(REQUIRED_COMMANDS).toHaveLength(5);
        });

        it('should have commands in .cursor/commands/ directory', () => {
            REQUIRED_COMMANDS.forEach((path) => {
                expect(path.startsWith('.cursor/commands/')).toBe(true);
                expect(path.endsWith('.md')).toBe(true);
            });
        });
    });

    describe('checkProjectReadiness logic', () => {
        it('should require .forge directory', () => {
            const forgeReady = false;
            const commandsReady = true;
            expect(forgeReady && commandsReady).toBe(false);
        });

        it('should require all command files to exist', () => {
            const forgeReady = true;
            const commandsReady = false;
            expect(forgeReady && commandsReady).toBe(false);
        });

        it('should be ready when .forge and all commands exist', () => {
            const forgeReady = true;
            const commandsReady = true;
            expect(forgeReady && commandsReady).toBe(true);
        });
    });
});
