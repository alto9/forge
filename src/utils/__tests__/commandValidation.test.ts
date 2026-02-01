import { describe, it, expect } from 'vitest';
import { computeContentHash, validateCommandFileHash, generateCommandFile } from '../commandValidation';
import { getCommandTemplate } from '../../templates/cursorCommands';

describe('commandValidation', () => {
    describe('computeContentHash', () => {
        it('returns a 64-character hex string', () => {
            const content = 'test content';
            const hash = computeContentHash(content);
            
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
            expect(hash.length).toBe(64);
        });

        it('produces same hash for same content', () => {
            const content = 'identical content';
            const hash1 = computeContentHash(content);
            const hash2 = computeContentHash(content);
            
            expect(hash1).toBe(hash2);
        });

        it('produces different hashes for different content', () => {
            const content1 = 'first content';
            const content2 = 'second content';
            const hash1 = computeContentHash(content1);
            const hash2 = computeContentHash(content2);
            
            expect(hash1).not.toBe(hash2);
        });

        it('handles empty string', () => {
            const hash = computeContentHash('');
            
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
            expect(hash.length).toBe(64);
        });

        it('handles multiline content', () => {
            const content = `Line 1
Line 2
Line 3`;
            const hash = computeContentHash(content);
            
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
            expect(hash.length).toBe(64);
        });

        it('is sensitive to whitespace changes', () => {
            const content1 = 'test content';
            const content2 = 'test  content'; // extra space
            const hash1 = computeContentHash(content1);
            const hash2 = computeContentHash(content2);
            
            expect(hash1).not.toBe(hash2);
        });
    });

    describe('validateCommandFileHash', () => {
        it('returns true for valid file with matching hash', () => {
            const validTemplate = getCommandTemplate('.cursor/commands/forge-refine.md')!;
            const hash = computeContentHash(validTemplate);
            const fileContent = `<!-- forge-hash: ${hash} -->

${validTemplate}`;
            
            const isValid = validateCommandFileHash(fileContent, '.cursor/commands/forge-refine.md');
            
            expect(isValid).toBe(true);
        });

        it('returns false for file with no hash comment', () => {
            const fileContent = `# Test Command

This is a test command template.`;
            
            const isValid = validateCommandFileHash(fileContent, '.cursor/commands/forge-refine.md');
            
            expect(isValid).toBe(false);
        });

        it('returns false for file with incorrect hash', () => {
            const validTemplate = getCommandTemplate('.cursor/commands/forge-refine.md')!;
            const fileContent = `<!-- forge-hash: 0000000000000000000000000000000000000000000000000000000000000000 -->

${validTemplate}`;
            
            const isValid = validateCommandFileHash(fileContent, '.cursor/commands/forge-refine.md');
            
            expect(isValid).toBe(false);
        });

        it('returns false for file with tampered content', () => {
            const validTemplate = getCommandTemplate('.cursor/commands/forge-refine.md')!;
            const hash = computeContentHash(validTemplate);
            const tamperedContent = `<!-- forge-hash: ${hash} -->

${validTemplate}

Extra content added by user`;
            
            const isValid = validateCommandFileHash(tamperedContent, '.cursor/commands/forge-refine.md');
            
            expect(isValid).toBe(false);
        });

        it('returns false for unknown command path', () => {
            const validTemplate = getCommandTemplate('.cursor/commands/forge-refine.md')!;
            const hash = computeContentHash(validTemplate);
            const fileContent = `<!-- forge-hash: ${hash} -->

${validTemplate}`;
            
            const isValid = validateCommandFileHash(fileContent, '.cursor/commands/unknown.md');
            
            expect(isValid).toBe(false);
        });

        it('returns false for malformed hash comment', () => {
            const validTemplate = getCommandTemplate('.cursor/commands/forge-refine.md')!;
            const fileContent = `<!-- forge-hash: invalid-hash -->

${validTemplate}`;
            
            const isValid = validateCommandFileHash(fileContent, '.cursor/commands/forge-refine.md');
            
            expect(isValid).toBe(false);
        });

        it('returns false for hash comment with wrong length', () => {
            const validTemplate = getCommandTemplate('.cursor/commands/forge-refine.md')!;
            const fileContent = `<!-- forge-hash: abcdef123456 -->

${validTemplate}`;
            
            const isValid = validateCommandFileHash(fileContent, '.cursor/commands/forge-refine.md');
            
            expect(isValid).toBe(false);
        });

        it('handles files with extra whitespace', () => {
            const validTemplate = getCommandTemplate('.cursor/commands/forge-refine.md')!;
            const hash = computeContentHash(validTemplate);
            const fileContent = `<!-- forge-hash: ${hash} -->

${validTemplate}
`;
            
            const isValid = validateCommandFileHash(fileContent, '.cursor/commands/forge-refine.md');
            
            expect(isValid).toBe(true);
        });

        it('validates forge-build.md command path', () => {
            const validTemplate = getCommandTemplate('.cursor/commands/forge-build.md')!;
            const hash = computeContentHash(validTemplate);
            const fileContent = `<!-- forge-hash: ${hash} -->

${validTemplate}`;
            
            const isValid = validateCommandFileHash(fileContent, '.cursor/commands/forge-build.md');
            
            expect(isValid).toBe(true);
        });
    });

    describe('generateCommandFile', () => {
        it('generates file with hash comment at top', () => {
            const generated = generateCommandFile('.cursor/commands/forge-refine.md');
            
            expect(generated).toMatch(/^<!-- forge-hash: [a-f0-9]{64} -->/);
        });

        it('hash comment format is correct', () => {
            const generated = generateCommandFile('.cursor/commands/forge-refine.md');
            const firstLine = generated.split('\n')[0];
            
            expect(firstLine).toMatch(/^<!-- forge-hash: [a-f0-9]{64} -->$/);
        });

        it('generated file validates successfully', () => {
            const generated = generateCommandFile('.cursor/commands/forge-refine.md');
            const isValid = validateCommandFileHash(generated, '.cursor/commands/forge-refine.md');
            
            expect(isValid).toBe(true);
        });

        it('throws error for unknown command path', () => {
            expect(() => {
                generateCommandFile('.cursor/commands/unknown.md');
            }).toThrow('Unknown command path');
        });

        it('generates valid file for forge-build.md', () => {
            const generated = generateCommandFile('.cursor/commands/forge-build.md');
            const isValid = validateCommandFileHash(generated, '.cursor/commands/forge-build.md');
            
            expect(isValid).toBe(true);
        });

        it('includes template content after hash', () => {
            const generated = generateCommandFile('.cursor/commands/forge-refine.md');
            
            expect(generated).toContain('<!-- forge-hash:');
            expect(generated).toContain('# Forge Refine');
        });

        it('preserves template content integrity', () => {
            const generated = generateCommandFile('.cursor/commands/forge-refine.md');
            const lines = generated.split('\n');
            
            // Remove hash comment and empty line
            const contentWithoutHash = lines.slice(2).join('\n');
            
            expect(contentWithoutHash).toContain('# Forge Refine');
            expect(contentWithoutHash).toContain('Prerequisites');
        });

        it('generated hash matches template content', () => {
            const generated = generateCommandFile('.cursor/commands/forge-refine.md');
            const lines = generated.split('\n');
            
            // Extract hash from comment
            const hashMatch = lines[0].match(/<!-- forge-hash: ([a-f0-9]{64}) -->/);
            expect(hashMatch).not.toBeNull();
            
            const embeddedHash = hashMatch![1];
            
            // Extract content without hash
            const contentWithoutHash = lines.slice(2).join('\n');
            
            // Compute hash of content
            const computedHash = computeContentHash(contentWithoutHash);
            
            expect(embeddedHash).toBe(computedHash);
        });

        it('generates consistent output for same path', () => {
            const generated1 = generateCommandFile('.cursor/commands/forge-refine.md');
            const generated2 = generateCommandFile('.cursor/commands/forge-refine.md');
            
            expect(generated1).toBe(generated2);
        });

        it('generates different output for different paths', () => {
            const generated1 = generateCommandFile('.cursor/commands/forge-refine.md');
            const generated2 = generateCommandFile('.cursor/commands/forge-build.md');
            
            expect(generated1).not.toBe(generated2);
        });
    });

    describe('integration tests', () => {
        it('validates a file that was just generated', () => {
            const commandPath = '.cursor/commands/forge-refine.md';
            const generated = generateCommandFile(commandPath);
            const isValid = validateCommandFileHash(generated, commandPath);
            
            expect(isValid).toBe(true);
        });

        it('detects modification to generated file', () => {
            const commandPath = '.cursor/commands/forge-refine.md';
            const generated = generateCommandFile(commandPath);
            const modified = generated + '\n\n// User added this comment';
            const isValid = validateCommandFileHash(modified, commandPath);
            
            expect(isValid).toBe(false);
        });

        it('detects hash tampering', () => {
            const commandPath = '.cursor/commands/forge-refine.md';
            const generated = generateCommandFile(commandPath);
            const tamperedHash = generated.replace(/[a-f0-9]{64}/, '0'.repeat(64));
            const isValid = validateCommandFileHash(tamperedHash, commandPath);
            
            expect(isValid).toBe(false);
        });

        it('validates all command file types', () => {
            const paths = [
                '.cursor/commands/forge-refine.md',
                '.cursor/commands/forge-build.md',
                '.cursor/commands/forge-scribe.md'
            ];
            
            paths.forEach(path => {
                const generated = generateCommandFile(path);
                const isValid = validateCommandFileHash(generated, path);
                expect(isValid).toBe(true);
            });
        });
    });
});

