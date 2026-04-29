import { describe, it, expect } from 'vitest';
import { FORGE_PULLREQUEST_INSTRUCTIONS } from '../personas/forge-pullrequest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Persona + shipped orchestration skills for pull-request related flows.
 */

describe('forge-pullrequest persona', () => {
    describe('persona structure', () => {
        it('should have FORGE_PULLREQUEST_INSTRUCTIONS defined', () => {
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toBeDefined();
            expect(typeof FORGE_PULLREQUEST_INSTRUCTIONS).toBe('string');
            expect(FORGE_PULLREQUEST_INSTRUCTIONS.length).toBeGreaterThan(0);
        });

        it('should start with "# Forge Pull Request"', () => {
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toMatch(/^# Forge Pull Request/);
        });

        it('should include prerequisites', () => {
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('## Prerequisites');
        });

        it('should include workflow steps', () => {
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('## Workflow');
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('Step 1: Branch Safety Check');
        });

        it('should include conventional commit validation', () => {
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('## Conventional Commit Validation');
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('CRITICAL');
        });
    });

    describe('conventional commit guidance', () => {
        it('should list valid commit types', () => {
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('feat');
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('fix');
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('docs');
        });

        it('should include validation rules', () => {
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('Type is required');
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('Subject is required');
        });

        it('should provide valid and invalid examples', () => {
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('Valid Commit Examples');
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('Invalid Commit Examples');
        });
    });

    describe('GitHub integration guidance', () => {
        it('should prioritize GitHub MCP', () => {
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('GitHub MCP');
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('mcp_github_create_pull_request');
        });

        it('should include GH CLI fallback', () => {
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('GitHub CLI');
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('gh pr create');
        });

        it('should specify priority order', () => {
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('First choice');
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('Second choice');
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('Last resort');
        });
    });

    describe('error handling guidance', () => {
        it('should include error scenarios', () => {
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('## Error Scenarios');
        });

        it('should cover invalid commits', () => {
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('Invalid Commits Detected');
        });

        it('should cover branch not pushed', () => {
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('Branch Not Pushed');
        });

        it('should cover main branch error', () => {
            expect(FORGE_PULLREQUEST_INSTRUCTIONS).toContain('On Main Branch');
        });
    });
});

describe('workflow orchestration skills (resources)', () => {
    const skillsRoot = path.join(process.cwd(), 'resources', 'workflow', 'skills');

    it('should ship orchestration SKILL.md under resources/workflow/skills', () => {
        expect(fs.existsSync(skillsRoot)).toBe(true);
    });

    it('should include expected orchestration skill folders', () => {
        const expected = [
            'architect-this',
            'build-from-github',
            'build-from-pr-review',
            'plan-roadmap',
            'refine-issue',
            'review-pr'
        ];
        for (const id of expected) {
            const p = path.join(skillsRoot, id, 'SKILL.md');
            expect(fs.existsSync(p), `missing ${id}/SKILL.md`).toBe(true);
            expect(fs.readFileSync(p, 'utf8').trim().length).toBeGreaterThan(0);
        }
    });
});
