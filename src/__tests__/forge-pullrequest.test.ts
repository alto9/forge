import { describe, it, expect } from 'vitest';
import { FORGE_PULLREQUEST_TEMPLATE } from '../templates/cursorCommands';
import { FORGE_PULLREQUEST_INSTRUCTIONS } from '../personas/forge-pullrequest';
import { COMMAND_TEMPLATES, getCommandTemplate, getManagedCommandPaths } from '../templates/cursorCommands';

/**
 * Unit tests for forge-pullrequest command and persona
 * 
 * Note: These tests verify the template structure, persona content, and integration.
 * Full integration tests would require VSCode extension host and GitHub API access.
 */

describe('forge-pullrequest command template', () => {
    describe('template structure', () => {
        it('should have FORGE_PULLREQUEST_TEMPLATE defined', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toBeDefined();
            expect(typeof FORGE_PULLREQUEST_TEMPLATE).toBe('string');
            expect(FORGE_PULLREQUEST_TEMPLATE.length).toBeGreaterThan(0);
        });

        it('should start with "# Forge Pull Request"', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toMatch(/^# Forge Pull Request/);
        });

        it('should include prerequisites section', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('## Prerequisites');
        });

        it('should include conventional commit validation section', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('## Conventional Commit Validation');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('CRITICAL');
        });

        it('should include GitHub MCP preference', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('GitHub MCP');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('mcp_github_create_pull_request');
        });

        it('should include GH CLI fallback', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('GitHub CLI');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('gh pr create');
        });

        it('should include workflow steps', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('## Workflow');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('Step 1: Branch Safety Check');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('Step 2: Verify Branch is Pushed');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('Step 3: Determine Base Branch');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('Step 4: Validate Conventional Commits');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('Step 5: Generate PR Details');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('Step 6: Create Pull Request');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('Step 7: Post-Creation Verification');
        });

        it('should include conventional commit types', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('feat');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('fix');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('docs');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('refactor');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('test');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('chore');
        });

        it('should include validation rules', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('Type is required');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('Subject is required');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('imperative mood');
        });

        it('should include error scenarios', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('## Error Scenarios');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('Invalid Commits Detected');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('Branch Not Pushed');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('On Main Branch');
        });
    });

    describe('conventional commit validation', () => {
        it('should document valid commit examples', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('feat: add user authentication');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('fix(api): resolve timeout issue');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('docs: update installation guide');
        });

        it('should document invalid commit examples', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('update readme');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('Missing type');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('Capitalized subject');
        });

        it('should specify validation is mandatory', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('STRICT');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('No exceptions');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('Cannot skip or bypass validation');
        });
    });

    describe('GitHub integration', () => {
        it('should prioritize GitHub MCP over GH CLI', () => {
            const mcpSection = FORGE_PULLREQUEST_TEMPLATE.indexOf('#### Preferred: GitHub MCP');
            const cliSection = FORGE_PULLREQUEST_TEMPLATE.indexOf('#### Fallback: GitHub CLI');
            
            expect(mcpSection).toBeGreaterThan(-1);
            expect(cliSection).toBeGreaterThan(-1);
            expect(mcpSection).toBeLessThan(cliSection);
        });

        it('should include MCP tool name', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('mcp_github_create_pull_request');
        });

        it('should include GH CLI command', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('gh pr create');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('gh --version');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('gh auth status');
        });

        it('should include error handling for both methods', () => {
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('If MCP fails: Fall back to GH CLI');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('If GH CLI fails');
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('If both fail');
            // Also check for the bullet point format
            expect(FORGE_PULLREQUEST_TEMPLATE).toContain('- If MCP fails: Fall back to GH CLI');
        });
    });

    describe('command template registration', () => {
        it('should be registered in COMMAND_TEMPLATES', () => {
            expect(COMMAND_TEMPLATES['.cursor/commands/forge-pullrequest.md']).toBeDefined();
            expect(COMMAND_TEMPLATES['.cursor/commands/forge-pullrequest.md']).toBe(FORGE_PULLREQUEST_TEMPLATE);
        });

        it('should be retrievable via getCommandTemplate', () => {
            const template = getCommandTemplate('.cursor/commands/forge-pullrequest.md');
            expect(template).toBeDefined();
            expect(template).toBe(FORGE_PULLREQUEST_TEMPLATE);
        });

        it('should be included in managed command paths', () => {
            const paths = getManagedCommandPaths();
            expect(paths).toContain('.cursor/commands/forge-pullrequest.md');
        });
    });
});

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

describe('forge-pullrequest integration', () => {
    describe('template and persona consistency', () => {
        it('should have consistent structure between template and persona', () => {
            const templateHasValidation = FORGE_PULLREQUEST_TEMPLATE.includes('Conventional Commit Validation');
            const personaHasValidation = FORGE_PULLREQUEST_INSTRUCTIONS.includes('Conventional Commit Validation');
            
            expect(templateHasValidation).toBe(true);
            expect(personaHasValidation).toBe(true);
        });

        it('should both mention GitHub MCP preference', () => {
            const templateHasMCP = FORGE_PULLREQUEST_TEMPLATE.includes('GitHub MCP');
            const personaHasMCP = FORGE_PULLREQUEST_INSTRUCTIONS.includes('GitHub MCP');
            
            expect(templateHasMCP).toBe(true);
            expect(personaHasMCP).toBe(true);
        });

        it('should both mention GH CLI fallback', () => {
            const templateHasCLI = FORGE_PULLREQUEST_TEMPLATE.includes('GitHub CLI');
            const personaHasCLI = FORGE_PULLREQUEST_INSTRUCTIONS.includes('GitHub CLI');
            
            expect(templateHasCLI).toBe(true);
            expect(personaHasCLI).toBe(true);
        });
    });

    describe('command path consistency', () => {
        it('should use correct command path format', () => {
            const path = '.cursor/commands/forge-pullrequest.md';
            const template = getCommandTemplate(path);
            
            expect(template).toBeDefined();
            expect(template).toBe(FORGE_PULLREQUEST_TEMPLATE);
        });

        it('should be accessible via managed paths', () => {
            const paths = getManagedCommandPaths();
            const forgePullrequestPath = paths.find(p => p.includes('forge-pullrequest'));
            
            expect(forgePullrequestPath).toBe('.cursor/commands/forge-pullrequest.md');
        });
    });
});
