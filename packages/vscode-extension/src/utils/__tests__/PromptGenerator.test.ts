import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptGenerator } from '../PromptGenerator';
import { FileParser } from '../FileParser';
import { GitUtils } from '../GitUtils';
import * as vscode from 'vscode';
import path from 'path';

// Mock FileParser
vi.mock('../FileParser', () => ({
    FileParser: {
        readFile: vi.fn(),
        parseFrontmatter: vi.fn()
    }
}));

// Mock GitUtils
vi.mock('../GitUtils', () => ({
    GitUtils: {
        isGitRepository: vi.fn(),
        getDiffForFile: vi.fn(),
        getFileStatus: vi.fn(),
        getCurrentCommit: vi.fn()
    }
}));

describe('PromptGenerator.findGlobalContexts', () => {
    const mockWorkspaceRoot = '/test/workspace';
    const mockContextsPath = path.join(mockWorkspaceRoot, 'ai', 'contexts');

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('finds global contexts in root directory', () => {
        it('should return contexts marked as global in ai/contexts/', async () => {
            // Mock directory structure: ai/contexts with two files
            vi.mocked(vscode.workspace.fs.readDirectory).mockResolvedValueOnce([
                ['build.context.md', vscode.FileType.File],
                ['local.context.md', vscode.FileType.File]
            ]);

            // Mock file reads and parsing
            const buildContent = `---
context_id: build-procedures
global: true
---
# Build Procedures`;

            const localContent = `---
context_id: local-development
global: true
---
# Local Development`;

            vi.mocked(FileParser.readFile)
                .mockResolvedValueOnce(buildContent)
                .mockResolvedValueOnce(localContent);

            vi.mocked(FileParser.parseFrontmatter)
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'build-procedures', global: true },
                    content: '# Build Procedures'
                })
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'local-development', global: true },
                    content: '# Local Development'
                });

            const result = await PromptGenerator.findGlobalContexts(mockWorkspaceRoot);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                contextId: 'build-procedures',
                filePath: path.join(mockContextsPath, 'build.context.md'),
                content: buildContent
            });
            expect(result[1]).toEqual({
                contextId: 'local-development',
                filePath: path.join(mockContextsPath, 'local.context.md'),
                content: localContent
            });
        });
    });

    describe('finds global contexts in nested directories', () => {
        it('should recursively find global contexts in subdirectories', async () => {
            // Mock root directory with a subdirectory
            vi.mocked(vscode.workspace.fs.readDirectory)
                .mockResolvedValueOnce([
                    ['foundation', vscode.FileType.Directory]
                ])
                // Mock subdirectory contents
                .mockResolvedValueOnce([
                    ['node.context.md', vscode.FileType.File],
                    ['mcp.context.md', vscode.FileType.File]
                ]);

            const nodeContent = `---
context_id: node
global: true
---
# Node Context`;

            const mcpContent = `---
context_id: mcp
global: true
---
# MCP Context`;

            vi.mocked(FileParser.readFile)
                .mockResolvedValueOnce(nodeContent)
                .mockResolvedValueOnce(mcpContent);

            vi.mocked(FileParser.parseFrontmatter)
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'node', global: true },
                    content: '# Node Context'
                })
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'mcp', global: true },
                    content: '# MCP Context'
                });

            const result = await PromptGenerator.findGlobalContexts(mockWorkspaceRoot);

            expect(result).toHaveLength(2);
            expect(result[0].contextId).toBe('node');
            expect(result[0].filePath).toBe(path.join(mockContextsPath, 'foundation', 'node.context.md'));
            expect(result[1].contextId).toBe('mcp');
            expect(result[1].filePath).toBe(path.join(mockContextsPath, 'foundation', 'mcp.context.md'));
        });

        it('should handle deeply nested directory structures', async () => {
            // Mock: ai/contexts/level1/level2/deep.context.md
            vi.mocked(vscode.workspace.fs.readDirectory)
                .mockResolvedValueOnce([
                    ['level1', vscode.FileType.Directory]
                ])
                .mockResolvedValueOnce([
                    ['level2', vscode.FileType.Directory]
                ])
                .mockResolvedValueOnce([
                    ['deep.context.md', vscode.FileType.File]
                ]);

            const deepContent = `---
context_id: deep-context
global: true
---
# Deep Context`;

            vi.mocked(FileParser.readFile).mockResolvedValueOnce(deepContent);
            vi.mocked(FileParser.parseFrontmatter).mockReturnValueOnce({
                frontmatter: { context_id: 'deep-context', global: true },
                content: '# Deep Context'
            });

            const result = await PromptGenerator.findGlobalContexts(mockWorkspaceRoot);

            expect(result).toHaveLength(1);
            expect(result[0].filePath).toBe(
                path.join(mockContextsPath, 'level1', 'level2', 'deep.context.md')
            );
        });
    });

    describe('filters out non-global contexts', () => {
        it('should only return contexts with global: true', async () => {
            vi.mocked(vscode.workspace.fs.readDirectory).mockResolvedValueOnce([
                ['global.context.md', vscode.FileType.File],
                ['local.context.md', vscode.FileType.File],
                ['explicit-false.context.md', vscode.FileType.File]
            ]);

            const globalContent = `---
context_id: global-context
global: true
---
# Global Context`;

            const localContent = `---
context_id: local-context
---
# Local Context (no global field)`;

            const explicitFalseContent = `---
context_id: explicit-false
global: false
---
# Explicitly False`;

            vi.mocked(FileParser.readFile)
                .mockResolvedValueOnce(globalContent)
                .mockResolvedValueOnce(localContent)
                .mockResolvedValueOnce(explicitFalseContent);

            vi.mocked(FileParser.parseFrontmatter)
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'global-context', global: true },
                    content: '# Global Context'
                })
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'local-context' },
                    content: '# Local Context (no global field)'
                })
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'explicit-false', global: false },
                    content: '# Explicitly False'
                });

            const result = await PromptGenerator.findGlobalContexts(mockWorkspaceRoot);

            expect(result).toHaveLength(1);
            expect(result[0].contextId).toBe('global-context');
        });

        it('should filter in mixed directory structure', async () => {
            // Root with subdirectory
            vi.mocked(vscode.workspace.fs.readDirectory)
                .mockResolvedValueOnce([
                    ['root-global.context.md', vscode.FileType.File],
                    ['root-local.context.md', vscode.FileType.File],
                    ['subdir', vscode.FileType.Directory]
                ])
                .mockResolvedValueOnce([
                    ['sub-global.context.md', vscode.FileType.File],
                    ['sub-local.context.md', vscode.FileType.File]
                ]);

            vi.mocked(FileParser.readFile)
                .mockResolvedValueOnce('---\ncontext_id: root-global\nglobal: true\n---\n# Root Global')
                .mockResolvedValueOnce('---\ncontext_id: root-local\n---\n# Root Local')
                .mockResolvedValueOnce('---\ncontext_id: sub-global\nglobal: true\n---\n# Sub Global')
                .mockResolvedValueOnce('---\ncontext_id: sub-local\n---\n# Sub Local');

            vi.mocked(FileParser.parseFrontmatter)
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'root-global', global: true },
                    content: '# Root Global'
                })
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'root-local' },
                    content: '# Root Local'
                })
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'sub-global', global: true },
                    content: '# Sub Global'
                })
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'sub-local' },
                    content: '# Sub Local'
                });

            const result = await PromptGenerator.findGlobalContexts(mockWorkspaceRoot);

            expect(result).toHaveLength(2);
            expect(result[0].contextId).toBe('root-global');
            expect(result[1].contextId).toBe('sub-global');
        });
    });

    describe('returns empty array when no global contexts', () => {
        it('should return empty array when no contexts have global: true', async () => {
            vi.mocked(vscode.workspace.fs.readDirectory).mockResolvedValueOnce([
                ['local1.context.md', vscode.FileType.File],
                ['local2.context.md', vscode.FileType.File]
            ]);

            vi.mocked(FileParser.readFile)
                .mockResolvedValueOnce('---\ncontext_id: local1\n---\n# Local 1')
                .mockResolvedValueOnce('---\ncontext_id: local2\nglobal: false\n---\n# Local 2');

            vi.mocked(FileParser.parseFrontmatter)
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'local1' },
                    content: '# Local 1'
                })
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'local2', global: false },
                    content: '# Local 2'
                });

            const result = await PromptGenerator.findGlobalContexts(mockWorkspaceRoot);

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });

        it('should return empty array when contexts directory is empty', async () => {
            vi.mocked(vscode.workspace.fs.readDirectory).mockResolvedValueOnce([]);

            const result = await PromptGenerator.findGlobalContexts(mockWorkspaceRoot);

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });
    });

    describe('handles missing contexts directory', () => {
        it('should return empty array when ai/contexts does not exist', async () => {
            vi.mocked(vscode.workspace.fs.readDirectory).mockRejectedValueOnce(
                new Error('Directory not found')
            );

            const result = await PromptGenerator.findGlobalContexts(mockWorkspaceRoot);

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });

        it('should not throw when directory read fails', async () => {
            vi.mocked(vscode.workspace.fs.readDirectory).mockRejectedValueOnce(
                new Error('Permission denied')
            );

            await expect(
                PromptGenerator.findGlobalContexts(mockWorkspaceRoot)
            ).resolves.toEqual([]);
        });
    });

    describe('includes full content of global contexts', () => {
        it('should return complete file content including frontmatter and body', async () => {
            vi.mocked(vscode.workspace.fs.readDirectory).mockResolvedValueOnce([
                ['complete.context.md', vscode.FileType.File]
            ]);

            const fullContent = `---
context_id: complete-context
global: true
category: testing
description: A complete context file
---

# Complete Context

This is the full body content.

## Section 1
Details here.

## Section 2
More details here.

\`\`\`gherkin
Given a condition
When an action occurs
Then expect a result
\`\`\`
`;

            vi.mocked(FileParser.readFile).mockResolvedValueOnce(fullContent);
            vi.mocked(FileParser.parseFrontmatter).mockReturnValueOnce({
                frontmatter: {
                    context_id: 'complete-context',
                    global: true,
                    category: 'testing',
                    description: 'A complete context file'
                },
                content: `# Complete Context

This is the full body content.

## Section 1
Details here.

## Section 2
More details here.

\`\`\`gherkin
Given a condition
When an action occurs
Then expect a result
\`\`\`
`
            });

            const result = await PromptGenerator.findGlobalContexts(mockWorkspaceRoot);

            expect(result).toHaveLength(1);
            expect(result[0].content).toBe(fullContent);
            expect(result[0].content).toContain('---');
            expect(result[0].content).toContain('context_id: complete-context');
            expect(result[0].content).toContain('# Complete Context');
            expect(result[0].content).toContain('```gherkin');
        });
    });

    describe('returns correct file paths', () => {
        it('should return absolute file paths for root contexts', async () => {
            vi.mocked(vscode.workspace.fs.readDirectory).mockResolvedValueOnce([
                ['test.context.md', vscode.FileType.File]
            ]);

            vi.mocked(FileParser.readFile).mockResolvedValueOnce(
                '---\ncontext_id: test\nglobal: true\n---\n# Test'
            );
            vi.mocked(FileParser.parseFrontmatter).mockReturnValueOnce({
                frontmatter: { context_id: 'test', global: true },
                content: '# Test'
            });

            const result = await PromptGenerator.findGlobalContexts(mockWorkspaceRoot);

            expect(result).toHaveLength(1);
            expect(result[0].filePath).toBe(path.join(mockContextsPath, 'test.context.md'));
            expect(path.isAbsolute(result[0].filePath)).toBe(true);
        });

        it('should return absolute file paths for nested contexts', async () => {
            vi.mocked(vscode.workspace.fs.readDirectory)
                .mockResolvedValueOnce([['nested', vscode.FileType.Directory]])
                .mockResolvedValueOnce([['test.context.md', vscode.FileType.File]]);

            vi.mocked(FileParser.readFile).mockResolvedValueOnce(
                '---\ncontext_id: test\nglobal: true\n---\n# Test'
            );
            vi.mocked(FileParser.parseFrontmatter).mockReturnValueOnce({
                frontmatter: { context_id: 'test', global: true },
                content: '# Test'
            });

            const result = await PromptGenerator.findGlobalContexts(mockWorkspaceRoot);

            expect(result).toHaveLength(1);
            expect(result[0].filePath).toBe(
                path.join(mockContextsPath, 'nested', 'test.context.md')
            );
            expect(path.isAbsolute(result[0].filePath)).toBe(true);
        });
    });

    describe('handles malformed files gracefully', () => {
        it('should skip files that cannot be read', async () => {
            vi.mocked(vscode.workspace.fs.readDirectory).mockResolvedValueOnce([
                ['good.context.md', vscode.FileType.File],
                ['bad.context.md', vscode.FileType.File],
                ['another-good.context.md', vscode.FileType.File]
            ]);

            vi.mocked(FileParser.readFile)
                .mockResolvedValueOnce('---\ncontext_id: good\nglobal: true\n---\n# Good')
                .mockRejectedValueOnce(new Error('File read error'))
                .mockResolvedValueOnce('---\ncontext_id: another-good\nglobal: true\n---\n# Another Good');

            vi.mocked(FileParser.parseFrontmatter)
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'good', global: true },
                    content: '# Good'
                })
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'another-good', global: true },
                    content: '# Another Good'
                });

            const result = await PromptGenerator.findGlobalContexts(mockWorkspaceRoot);

            expect(result).toHaveLength(2);
            expect(result[0].contextId).toBe('good');
            expect(result[1].contextId).toBe('another-good');
        });

        it('should skip files with invalid frontmatter', async () => {
            vi.mocked(vscode.workspace.fs.readDirectory).mockResolvedValueOnce([
                ['valid.context.md', vscode.FileType.File],
                ['invalid.context.md', vscode.FileType.File]
            ]);

            vi.mocked(FileParser.readFile)
                .mockResolvedValueOnce('---\ncontext_id: valid\nglobal: true\n---\n# Valid')
                .mockResolvedValueOnce('Invalid frontmatter content');

            vi.mocked(FileParser.parseFrontmatter)
                .mockReturnValueOnce({
                    frontmatter: { context_id: 'valid', global: true },
                    content: '# Valid'
                })
                .mockImplementationOnce(() => {
                    throw new Error('Invalid frontmatter');
                });

            const result = await PromptGenerator.findGlobalContexts(mockWorkspaceRoot);

            expect(result).toHaveLength(1);
            expect(result[0].contextId).toBe('valid');
        });

        it('should handle context_id missing from frontmatter', async () => {
            vi.mocked(vscode.workspace.fs.readDirectory).mockResolvedValueOnce([
                ['no-id.context.md', vscode.FileType.File]
            ]);

            vi.mocked(FileParser.readFile).mockResolvedValueOnce(
                '---\nglobal: true\n---\n# No ID'
            );
            vi.mocked(FileParser.parseFrontmatter).mockReturnValueOnce({
                frontmatter: { global: true },
                content: '# No ID'
            });

            const result = await PromptGenerator.findGlobalContexts(mockWorkspaceRoot);

            expect(result).toHaveLength(1);
            // Should fall back to filename without extension
            expect(result[0].contextId).toBe('no-id');
        });
    });

    describe('ignores non-context files', () => {
        it('should only process .context.md files', async () => {
            vi.mocked(vscode.workspace.fs.readDirectory).mockResolvedValueOnce([
                ['valid.context.md', vscode.FileType.File],
                ['readme.md', vscode.FileType.File],
                ['feature.feature.md', vscode.FileType.File],
                ['spec.spec.md', vscode.FileType.File]
            ]);

            vi.mocked(FileParser.readFile).mockResolvedValueOnce(
                '---\ncontext_id: valid\nglobal: true\n---\n# Valid'
            );
            vi.mocked(FileParser.parseFrontmatter).mockReturnValueOnce({
                frontmatter: { context_id: 'valid', global: true },
                content: '# Valid'
            });

            const result = await PromptGenerator.findGlobalContexts(mockWorkspaceRoot);

            expect(result).toHaveLength(1);
            expect(result[0].contextId).toBe('valid');
            // FileParser.readFile should only be called once (for valid.context.md)
            expect(FileParser.readFile).toHaveBeenCalledTimes(1);
        });
    });
});

describe('PromptGenerator.generateDistillSessionPrompt - Global Contexts', () => {
    const mockWorkspaceRoot = '/test/workspace';
    const mockSessionPath = path.join(mockWorkspaceRoot, 'ai', 'sessions', 'test-session.session.md');
    
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Setup default workspace folder mock
        vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
            uri: { fsPath: mockWorkspaceRoot, path: mockWorkspaceRoot, scheme: 'file' },
            name: 'test-workspace',
            index: 0
        } as any);
        
        // Default git repository mock (not a git repo for simplicity)
        vi.mocked(GitUtils.isGitRepository).mockResolvedValue(false);
    });

    describe('includes global contexts section when contexts exist', () => {
        it('should include "## Global Contexts" section in prompt when global contexts are found', async () => {
            // Mock session file
            const sessionContent = `---
session_id: test-session
status: active
changed_files: []
---
# Test Session

This is a test session.`;

            vi.mocked(FileParser.readFile).mockResolvedValueOnce(sessionContent);
            vi.mocked(FileParser.parseFrontmatter).mockReturnValueOnce({
                frontmatter: {
                    session_id: 'test-session',
                    status: 'active',
                    changed_files: []
                },
                content: '# Test Session\n\nThis is a test session.'
            });

            // Mock global contexts
            const mockGlobalContexts = [
                {
                    contextId: 'build-procedures',
                    filePath: path.join(mockWorkspaceRoot, 'ai', 'contexts', 'build.context.md'),
                    content: '---\ncontext_id: build-procedures\nglobal: true\n---\n# Build Procedures'
                }
            ];

            // Spy on findGlobalContexts and return mock data
            const findGlobalContextsSpy = vi.spyOn(PromptGenerator, 'findGlobalContexts').mockResolvedValue(mockGlobalContexts);

            const sessionUri = { fsPath: mockSessionPath } as vscode.Uri;
            const prompt = await PromptGenerator.generateDistillSessionPrompt(sessionUri);

            expect(findGlobalContextsSpy).toHaveBeenCalledWith(mockWorkspaceRoot);
            expect(prompt).toContain('## Global Contexts');
            expect(prompt).toContain('The following contexts are marked as global and should inform all story generation:');
        });
    });

    describe('omits global contexts section when none exist', () => {
        it('should not include "## Global Contexts" section when no global contexts are found', async () => {
            const sessionContent = `---
session_id: test-session
status: active
changed_files: []
---
# Test Session`;

            vi.mocked(FileParser.readFile).mockResolvedValueOnce(sessionContent);
            vi.mocked(FileParser.parseFrontmatter).mockReturnValueOnce({
                frontmatter: {
                    session_id: 'test-session',
                    status: 'active',
                    changed_files: []
                },
                content: '# Test Session'
            });

            // Mock no global contexts
            const findGlobalContextsSpy = vi.spyOn(PromptGenerator, 'findGlobalContexts').mockResolvedValue([]);

            const sessionUri = { fsPath: mockSessionPath } as vscode.Uri;
            const prompt = await PromptGenerator.generateDistillSessionPrompt(sessionUri);

            expect(findGlobalContextsSpy).toHaveBeenCalledWith(mockWorkspaceRoot);
            expect(prompt).not.toContain('## Global Contexts');
            expect(prompt).not.toContain('The following contexts are marked as global');
        });
    });

    describe('formats global contexts correctly', () => {
        it('should format each context with heading, full content, and separator', async () => {
            const sessionContent = `---
session_id: test-session
status: active
changed_files: []
---
# Test Session`;

            vi.mocked(FileParser.readFile).mockResolvedValueOnce(sessionContent);
            vi.mocked(FileParser.parseFrontmatter).mockReturnValueOnce({
                frontmatter: {
                    session_id: 'test-session',
                    status: 'active',
                    changed_files: []
                },
                content: '# Test Session'
            });

            const mockGlobalContexts = [
                {
                    contextId: 'build-procedures',
                    filePath: path.join(mockWorkspaceRoot, 'ai', 'contexts', 'foundation', 'build.context.md'),
                    content: `---
context_id: build-procedures
global: true
---
# Build Procedures

\`\`\`gherkin
Given a build context
When building
Then it should succeed
\`\`\``
                },
                {
                    contextId: 'local-development',
                    filePath: path.join(mockWorkspaceRoot, 'ai', 'contexts', 'local.context.md'),
                    content: '---\ncontext_id: local-development\nglobal: true\n---\n# Local Development'
                }
            ];

            vi.spyOn(PromptGenerator, 'findGlobalContexts').mockResolvedValue(mockGlobalContexts);

            const sessionUri = { fsPath: mockSessionPath } as vscode.Uri;
            const prompt = await PromptGenerator.generateDistillSessionPrompt(sessionUri);

            // Check first context formatting
            expect(prompt).toContain('### build-procedures (ai/contexts/foundation/build.context.md)');
            expect(prompt).toContain('# Build Procedures');
            expect(prompt).toContain('```gherkin');
            
            // Check second context formatting
            expect(prompt).toContain('### local-development (ai/contexts/local.context.md)');
            expect(prompt).toContain('# Local Development');
            
            // Check separators
            expect(prompt).toMatch(/### build-procedures.*\n\n.*\n\n---\n\n/s);
            expect(prompt).toMatch(/### local-development.*\n\n.*\n\n---\n\n/s);
        });
    });

    describe('includes relative file paths in headings', () => {
        it('should show relative paths in context headings', async () => {
            const sessionContent = `---
session_id: test-session
status: active
changed_files: []
---
# Test Session`;

            vi.mocked(FileParser.readFile).mockResolvedValueOnce(sessionContent);
            vi.mocked(FileParser.parseFrontmatter).mockReturnValueOnce({
                frontmatter: {
                    session_id: 'test-session',
                    status: 'active',
                    changed_files: []
                },
                content: '# Test Session'
            });

            const mockGlobalContexts = [
                {
                    contextId: 'nested-context',
                    filePath: path.join(mockWorkspaceRoot, 'ai', 'contexts', 'level1', 'level2', 'nested.context.md'),
                    content: '---\ncontext_id: nested-context\nglobal: true\n---\n# Nested'
                }
            ];

            vi.spyOn(PromptGenerator, 'findGlobalContexts').mockResolvedValue(mockGlobalContexts);

            const sessionUri = { fsPath: mockSessionPath } as vscode.Uri;
            const prompt = await PromptGenerator.generateDistillSessionPrompt(sessionUri);

            expect(prompt).toContain('### nested-context (ai/contexts/level1/level2/nested.context.md)');
        });
    });

    describe('includes full context content', () => {
        it('should include complete frontmatter and Gherkin content', async () => {
            const sessionContent = `---
session_id: test-session
status: active
changed_files: []
---
# Test Session`;

            vi.mocked(FileParser.readFile).mockResolvedValueOnce(sessionContent);
            vi.mocked(FileParser.parseFrontmatter).mockReturnValueOnce({
                frontmatter: {
                    session_id: 'test-session',
                    status: 'active',
                    changed_files: []
                },
                content: '# Test Session'
            });

            const fullContextContent = `---
context_id: complete-context
global: true
category: testing
description: A complete test context
---

# Complete Context

## Overview
This is a complete context with all parts.

## Usage

\`\`\`gherkin
Scenario: Using the context
  Given a complete context file
  When the context is included in prompt
  Then all content should be present
  And frontmatter should be included
  And Gherkin scenarios should be included
\`\`\`

## Additional Notes
These notes should also be included.`;

            const mockGlobalContexts = [
                {
                    contextId: 'complete-context',
                    filePath: path.join(mockWorkspaceRoot, 'ai', 'contexts', 'complete.context.md'),
                    content: fullContextContent
                }
            ];

            vi.spyOn(PromptGenerator, 'findGlobalContexts').mockResolvedValue(mockGlobalContexts);

            const sessionUri = { fsPath: mockSessionPath } as vscode.Uri;
            const prompt = await PromptGenerator.generateDistillSessionPrompt(sessionUri);

            // Verify all parts of the content are included
            expect(prompt).toContain('context_id: complete-context');
            expect(prompt).toContain('global: true');
            expect(prompt).toContain('category: testing');
            expect(prompt).toContain('# Complete Context');
            expect(prompt).toContain('## Overview');
            expect(prompt).toContain('## Usage');
            expect(prompt).toContain('```gherkin');
            expect(prompt).toContain('Scenario: Using the context');
            expect(prompt).toContain('Given a complete context file');
            expect(prompt).toContain('## Additional Notes');
            expect(prompt).toContain('These notes should also be included');
        });
    });

    describe('positions global contexts after changed files', () => {
        it('should place global contexts section after changed files section', async () => {
            const sessionContent = `---
session_id: test-session
status: active
changed_files:
  - ai/features/test.feature.md
---
# Test Session`;

            const featureContent = `---
feature_id: test-feature
---
# Test Feature`;

            vi.mocked(FileParser.readFile)
                .mockResolvedValueOnce(sessionContent)
                .mockResolvedValueOnce(featureContent);
            
            vi.mocked(FileParser.parseFrontmatter)
                .mockReturnValueOnce({
                    frontmatter: {
                        session_id: 'test-session',
                        status: 'active',
                        changed_files: ['ai/features/test.feature.md']
                    },
                    content: '# Test Session'
                })
                .mockReturnValueOnce({
                    frontmatter: {
                        feature_id: 'test-feature'
                    },
                    content: '# Test Feature'
                });

            const mockGlobalContexts = [
                {
                    contextId: 'build-procedures',
                    filePath: path.join(mockWorkspaceRoot, 'ai', 'contexts', 'build.context.md'),
                    content: '---\ncontext_id: build-procedures\nglobal: true\n---\n# Build'
                }
            ];

            vi.spyOn(PromptGenerator, 'findGlobalContexts').mockResolvedValue(mockGlobalContexts);

            const sessionUri = { fsPath: mockSessionPath } as vscode.Uri;
            const prompt = await PromptGenerator.generateDistillSessionPrompt(sessionUri);

            // Check that changed files section appears before global contexts
            const changedFilesIndex = prompt.indexOf('**Changed Files During Session**');
            const globalContextsIndex = prompt.indexOf('## Global Contexts');
            
            expect(changedFilesIndex).toBeGreaterThan(-1);
            expect(globalContextsIndex).toBeGreaterThan(-1);
            expect(globalContextsIndex).toBeGreaterThan(changedFilesIndex);
        });
    });

    describe('positions global contexts before distillation steps', () => {
        it('should place global contexts before STEP 5 (context guidance)', async () => {
            const sessionContent = `---
session_id: test-session
status: active
changed_files: []
---
# Test Session`;

            vi.mocked(FileParser.readFile).mockResolvedValueOnce(sessionContent);
            vi.mocked(FileParser.parseFrontmatter).mockReturnValueOnce({
                frontmatter: {
                    session_id: 'test-session',
                    status: 'active',
                    changed_files: []
                },
                content: '# Test Session'
            });

            const mockGlobalContexts = [
                {
                    contextId: 'build-procedures',
                    filePath: path.join(mockWorkspaceRoot, 'ai', 'contexts', 'build.context.md'),
                    content: '---\ncontext_id: build-procedures\nglobal: true\n---\n# Build'
                }
            ];

            vi.spyOn(PromptGenerator, 'findGlobalContexts').mockResolvedValue(mockGlobalContexts);

            const sessionUri = { fsPath: mockSessionPath } as vscode.Uri;
            const prompt = await PromptGenerator.generateDistillSessionPrompt(sessionUri);

            const globalContextsIndex = prompt.indexOf('## Global Contexts');
            const step5Index = prompt.indexOf('STEP 5: Review changed files and follow context guidance');
            
            expect(globalContextsIndex).toBeGreaterThan(-1);
            expect(step5Index).toBeGreaterThan(-1);
            expect(step5Index).toBeGreaterThan(globalContextsIndex);
        });
    });

    describe('includes guidance text', () => {
        it('should include explanatory text and closing guidance', async () => {
            const sessionContent = `---
session_id: test-session
status: active
changed_files: []
---
# Test Session`;

            vi.mocked(FileParser.readFile).mockResolvedValueOnce(sessionContent);
            vi.mocked(FileParser.parseFrontmatter).mockReturnValueOnce({
                frontmatter: {
                    session_id: 'test-session',
                    status: 'active',
                    changed_files: []
                },
                content: '# Test Session'
            });

            const mockGlobalContexts = [
                {
                    contextId: 'build-procedures',
                    filePath: path.join(mockWorkspaceRoot, 'ai', 'contexts', 'build.context.md'),
                    content: '---\ncontext_id: build-procedures\nglobal: true\n---\n# Build'
                }
            ];

            vi.spyOn(PromptGenerator, 'findGlobalContexts').mockResolvedValue(mockGlobalContexts);

            const sessionUri = { fsPath: mockSessionPath } as vscode.Uri;
            const prompt = await PromptGenerator.generateDistillSessionPrompt(sessionUri);

            // Check for opening explanatory text
            expect(prompt).toContain('The following contexts are marked as global and should inform all story generation:');
            
            // Check for closing guidance text
            expect(prompt).toContain('Use the guidance above when creating stories and tasks. These foundational contexts ensure consistency across all implementation work.');
        });
    });

    describe('handles multiple global contexts', () => {
        it('should include all global contexts in correct order', async () => {
            const sessionContent = `---
session_id: test-session
status: active
changed_files: []
---
# Test Session`;

            vi.mocked(FileParser.readFile).mockResolvedValueOnce(sessionContent);
            vi.mocked(FileParser.parseFrontmatter).mockReturnValueOnce({
                frontmatter: {
                    session_id: 'test-session',
                    status: 'active',
                    changed_files: []
                },
                content: '# Test Session'
            });

            const mockGlobalContexts = [
                {
                    contextId: 'build-procedures',
                    filePath: path.join(mockWorkspaceRoot, 'ai', 'contexts', 'build.context.md'),
                    content: '---\ncontext_id: build-procedures\nglobal: true\n---\n# Build Procedures'
                },
                {
                    contextId: 'local-development',
                    filePath: path.join(mockWorkspaceRoot, 'ai', 'contexts', 'local.context.md'),
                    content: '---\ncontext_id: local-development\nglobal: true\n---\n# Local Development'
                },
                {
                    contextId: 'node',
                    filePath: path.join(mockWorkspaceRoot, 'ai', 'contexts', 'foundation', 'node.context.md'),
                    content: '---\ncontext_id: node\nglobal: true\n---\n# Node Context'
                }
            ];

            vi.spyOn(PromptGenerator, 'findGlobalContexts').mockResolvedValue(mockGlobalContexts);

            const sessionUri = { fsPath: mockSessionPath } as vscode.Uri;
            const prompt = await PromptGenerator.generateDistillSessionPrompt(sessionUri);

            // Verify all contexts are included
            expect(prompt).toContain('### build-procedures (ai/contexts/build.context.md)');
            expect(prompt).toContain('# Build Procedures');
            
            expect(prompt).toContain('### local-development (ai/contexts/local.context.md)');
            expect(prompt).toContain('# Local Development');
            
            expect(prompt).toContain('### node (ai/contexts/foundation/node.context.md)');
            expect(prompt).toContain('# Node Context');

            // Verify they appear in order
            const buildIndex = prompt.indexOf('### build-procedures');
            const localIndex = prompt.indexOf('### local-development');
            const nodeIndex = prompt.indexOf('### node');
            
            expect(buildIndex).toBeGreaterThan(-1);
            expect(localIndex).toBeGreaterThan(buildIndex);
            expect(nodeIndex).toBeGreaterThan(localIndex);
        });
    });
});
