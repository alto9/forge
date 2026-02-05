import { describe, it, expect } from 'vitest';
import { FORGE_PULL_TEMPLATE } from '../templates/cursorCommands';
import { FORGE_PULL_INSTRUCTIONS } from '../personas/forge-pull';
import { COMMAND_TEMPLATES, getCommandTemplate, getManagedCommandPaths } from '../templates/cursorCommands';

/**
 * Unit tests for forge-pull command and persona
 * 
 * Note: These tests verify the template structure, persona content, and integration.
 * Full integration tests would require VSCode extension host and GitHub API access.
 */

describe('forge-pull command template', () => {
    describe('template structure', () => {
        it('should have FORGE_PULL_TEMPLATE defined', () => {
            expect(FORGE_PULL_TEMPLATE).toBeDefined();
            expect(typeof FORGE_PULL_TEMPLATE).toBe('string');
            expect(FORGE_PULL_TEMPLATE.length).toBeGreaterThan(0);
        });

        it('should start with "# Forge Pull"', () => {
            expect(FORGE_PULL_TEMPLATE).toMatch(/^# Forge Pull/);
        });

        it('should include prerequisites section', () => {
            expect(FORGE_PULL_TEMPLATE).toContain('## Prerequisites');
        });

        it('should include conventional commit validation section', () => {
            expect(FORGE_PULL_TEMPLATE).toContain('## Conventional Commit Validation');
            expect(FORGE_PULL_TEMPLATE).toContain('CRITICAL');
        });

        it('should include GitHub MCP preference', () => {
            expect(FORGE_PULL_TEMPLATE).toContain('GitHub MCP');
            expect(FORGE_PULL_TEMPLATE).toContain('mcp_github_create_pull_request');
        });

        it('should include GH CLI fallback', () => {
            expect(FORGE_PULL_TEMPLATE).toContain('GitHub CLI');
            expect(FORGE_PULL_TEMPLATE).toContain('gh pr create');
        });

        it('should include workflow steps', () => {
            expect(FORGE_PULL_TEMPLATE).toContain('## Workflow');
            expect(FORGE_PULL_TEMPLATE).toContain('Step 1: Branch Safety Check');
            expect(FORGE_PULL_TEMPLATE).toContain('Step 2: Verify Branch is Pushed');
            expect(FORGE_PULL_TEMPLATE).toContain('Step 3: Determine Base Branch');
            expect(FORGE_PULL_TEMPLATE).toContain('Step 4: Validate Conventional Commits');
            expect(FORGE_PULL_TEMPLATE).toContain('Step 5: Generate PR Details');
            expect(FORGE_PULL_TEMPLATE).toContain('Step 6: Create Pull Request');
            expect(FORGE_PULL_TEMPLATE).toContain('Step 7: Post-Creation Verification');
        });

        it('should include conventional commit types', () => {
            expect(FORGE_PULL_TEMPLATE).toContain('feat');
            expect(FORGE_PULL_TEMPLATE).toContain('fix');
            expect(FORGE_PULL_TEMPLATE).toContain('docs');
            expect(FORGE_PULL_TEMPLATE).toContain('refactor');
            expect(FORGE_PULL_TEMPLATE).toContain('test');
            expect(FORGE_PULL_TEMPLATE).toContain('chore');
        });

        it('should include validation rules', () => {
            expect(FORGE_PULL_TEMPLATE).toContain('Type is required');
            expect(FORGE_PULL_TEMPLATE).toContain('Subject is required');
            expect(FORGE_PULL_TEMPLATE).toContain('imperative mood');
        });

        it('should include error scenarios', () => {
            expect(FORGE_PULL_TEMPLATE).toContain('## Error Scenarios');
            expect(FORGE_PULL_TEMPLATE).toContain('Invalid Commits Detected');
            expect(FORGE_PULL_TEMPLATE).toContain('Branch Not Pushed');
            expect(FORGE_PULL_TEMPLATE).toContain('On Main Branch');
        });
    });

    describe('conventional commit validation', () => {
        it('should document valid commit examples', () => {
            expect(FORGE_PULL_TEMPLATE).toContain('feat: add user authentication');
            expect(FORGE_PULL_TEMPLATE).toContain('fix(api): resolve timeout issue');
            expect(FORGE_PULL_TEMPLATE).toContain('docs: update installation guide');
        });

        it('should document invalid commit examples', () => {
            expect(FORGE_PULL_TEMPLATE).toContain('update readme');
            expect(FORGE_PULL_TEMPLATE).toContain('Missing type');
            expect(FORGE_PULL_TEMPLATE).toContain('Capitalized subject');
        });

        it('should specify validation is mandatory', () => {
            expect(FORGE_PULL_TEMPLATE).toContain('STRICT');
            expect(FORGE_PULL_TEMPLATE).toContain('No exceptions');
            expect(FORGE_PULL_TEMPLATE).toContain('Cannot skip or bypass validation');
        });
    });

    describe('GitHub integration', () => {
        it('should prioritize GitHub MCP over GH CLI', () => {
            const mcpSection = FORGE_PULL_TEMPLATE.indexOf('#### Preferred: GitHub MCP');
            const cliSection = FORGE_PULL_TEMPLATE.indexOf('#### Fallback: GitHub CLI');
            
            expect(mcpSection).toBeGreaterThan(-1);
            expect(cliSection).toBeGreaterThan(-1);
            expect(mcpSection).toBeLessThan(cliSection);
        });

        it('should include MCP tool name', () => {
            expect(FORGE_PULL_TEMPLATE).toContain('mcp_github_create_pull_request');
        });

        it('should include GH CLI command', () => {
            expect(FORGE_PULL_TEMPLATE).toContain('gh pr create');
            expect(FORGE_PULL_TEMPLATE).toContain('gh --version');
            expect(FORGE_PULL_TEMPLATE).toContain('gh auth status');
        });

        it('should include error handling for both methods', () => {
            expect(FORGE_PULL_TEMPLATE).toContain('If MCP fails: Fall back to GH CLI');
            expect(FORGE_PULL_TEMPLATE).toContain('If GH CLI fails');
            expect(FORGE_PULL_TEMPLATE).toContain('If both fail');
            // Also check for the bullet point format
            expect(FORGE_PULL_TEMPLATE).toContain('- If MCP fails: Fall back to GH CLI');
        });
    });

    describe('command template registration', () => {
        it('should be registered in COMMAND_TEMPLATES', () => {
            expect(COMMAND_TEMPLATES['.cursor/commands/forge-pull.md']).toBeDefined();
            expect(COMMAND_TEMPLATES['.cursor/commands/forge-pull.md']).toBe(FORGE_PULL_TEMPLATE);
        });

        it('should be retrievable via getCommandTemplate', () => {
            const template = getCommandTemplate('.cursor/commands/forge-pull.md');
            expect(template).toBeDefined();
            expect(template).toBe(FORGE_PULL_TEMPLATE);
        });

        it('should be included in managed command paths', () => {
            const paths = getManagedCommandPaths();
            expect(paths).toContain('.cursor/commands/forge-pull.md');
        });
    });
});

describe('forge-pull persona', () => {
    describe('persona structure', () => {
        it('should have FORGE_PULL_INSTRUCTIONS defined', () => {
            expect(FORGE_PULL_INSTRUCTIONS).toBeDefined();
            expect(typeof FORGE_PULL_INSTRUCTIONS).toBe('string');
            expect(FORGE_PULL_INSTRUCTIONS.length).toBeGreaterThan(0);
        });

        it('should start with "# Forge Pull"', () => {
            expect(FORGE_PULL_INSTRUCTIONS).toMatch(/^# Forge Pull/);
        });

        it('should include prerequisites', () => {
            expect(FORGE_PULL_INSTRUCTIONS).toContain('## Prerequisites');
        });

        it('should include workflow steps', () => {
            expect(FORGE_PULL_INSTRUCTIONS).toContain('## Workflow');
            expect(FORGE_PULL_INSTRUCTIONS).toContain('Step 1: Branch Safety Check');
        });

        it('should include conventional commit validation', () => {
            expect(FORGE_PULL_INSTRUCTIONS).toContain('## Conventional Commit Validation');
            expect(FORGE_PULL_INSTRUCTIONS).toContain('CRITICAL');
        });
    });

    describe('conventional commit guidance', () => {
        it('should list valid commit types', () => {
            expect(FORGE_PULL_INSTRUCTIONS).toContain('feat');
            expect(FORGE_PULL_INSTRUCTIONS).toContain('fix');
            expect(FORGE_PULL_INSTRUCTIONS).toContain('docs');
        });

        it('should include validation rules', () => {
            expect(FORGE_PULL_INSTRUCTIONS).toContain('Type is required');
            expect(FORGE_PULL_INSTRUCTIONS).toContain('Subject is required');
        });

        it('should provide valid and invalid examples', () => {
            expect(FORGE_PULL_INSTRUCTIONS).toContain('Valid Commit Examples');
            expect(FORGE_PULL_INSTRUCTIONS).toContain('Invalid Commit Examples');
        });
    });

    describe('GitHub integration guidance', () => {
        it('should prioritize GitHub MCP', () => {
            expect(FORGE_PULL_INSTRUCTIONS).toContain('GitHub MCP');
            expect(FORGE_PULL_INSTRUCTIONS).toContain('mcp_github_create_pull_request');
        });

        it('should include GH CLI fallback', () => {
            expect(FORGE_PULL_INSTRUCTIONS).toContain('GitHub CLI');
            expect(FORGE_PULL_INSTRUCTIONS).toContain('gh pr create');
        });

        it('should specify priority order', () => {
            expect(FORGE_PULL_INSTRUCTIONS).toContain('First choice');
            expect(FORGE_PULL_INSTRUCTIONS).toContain('Second choice');
            expect(FORGE_PULL_INSTRUCTIONS).toContain('Last resort');
        });
    });

    describe('error handling guidance', () => {
        it('should include error scenarios', () => {
            expect(FORGE_PULL_INSTRUCTIONS).toContain('## Error Scenarios');
        });

        it('should cover invalid commits', () => {
            expect(FORGE_PULL_INSTRUCTIONS).toContain('Invalid Commits Detected');
        });

        it('should cover branch not pushed', () => {
            expect(FORGE_PULL_INSTRUCTIONS).toContain('Branch Not Pushed');
        });

        it('should cover main branch error', () => {
            expect(FORGE_PULL_INSTRUCTIONS).toContain('On Main Branch');
        });
    });
});

describe('forge-pull integration', () => {
    describe('template and persona consistency', () => {
        it('should have consistent structure between template and persona', () => {
            const templateHasValidation = FORGE_PULL_TEMPLATE.includes('Conventional Commit Validation');
            const personaHasValidation = FORGE_PULL_INSTRUCTIONS.includes('Conventional Commit Validation');
            
            expect(templateHasValidation).toBe(true);
            expect(personaHasValidation).toBe(true);
        });

        it('should both mention GitHub MCP preference', () => {
            const templateHasMCP = FORGE_PULL_TEMPLATE.includes('GitHub MCP');
            const personaHasMCP = FORGE_PULL_INSTRUCTIONS.includes('GitHub MCP');
            
            expect(templateHasMCP).toBe(true);
            expect(personaHasMCP).toBe(true);
        });

        it('should both mention GH CLI fallback', () => {
            const templateHasCLI = FORGE_PULL_TEMPLATE.includes('GitHub CLI');
            const personaHasCLI = FORGE_PULL_INSTRUCTIONS.includes('GitHub CLI');
            
            expect(templateHasCLI).toBe(true);
            expect(personaHasCLI).toBe(true);
        });
    });

    describe('command path consistency', () => {
        it('should use correct command path format', () => {
            const path = '.cursor/commands/forge-pull.md';
            const template = getCommandTemplate(path);
            
            expect(template).toBeDefined();
            expect(template).toBe(FORGE_PULL_TEMPLATE);
        });

        it('should be accessible via managed paths', () => {
            const paths = getManagedCommandPaths();
            const forgePullPath = paths.find(p => p.includes('forge-pull'));
            
            expect(forgePullPath).toBe('.cursor/commands/forge-pull.md');
        });
    });
});
