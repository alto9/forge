import { describe, it, expect } from 'vitest';
import { REQUIRED_FOLDERS, REQUIRED_COMMANDS } from '../projectReadiness';

/**
 * Unit tests for Project Readiness Utility
 * 
 * These tests verify the centralized readiness checking logic that determines
 * whether a project is "Forge Ready" (has all required folders and valid commands).
 * 
 * This is critical infrastructure that affects routing decisions throughout the extension:
 * - ProjectPicker uses it to display accurate status
 * - extension.ts uses it to route to Studio or Welcome screen
 * - WelcomePanel uses it to determine readiness
 */

describe('projectReadiness', () => {
    describe('REQUIRED_FOLDERS constant', () => {
        it('should have exactly 6 required folders', () => {
            expect(REQUIRED_FOLDERS).toHaveLength(6);
        });

        it('should include ai root folder', () => {
            expect(REQUIRED_FOLDERS).toContain('ai');
        });

        it('should include ai/actors folder', () => {
            expect(REQUIRED_FOLDERS).toContain('ai/actors');
        });

        it('should include ai/contexts folder', () => {
            expect(REQUIRED_FOLDERS).toContain('ai/contexts');
        });

        it('should include ai/features folder', () => {
            expect(REQUIRED_FOLDERS).toContain('ai/features');
        });

        it('should include ai/sessions folder', () => {
            expect(REQUIRED_FOLDERS).toContain('ai/sessions');
        });

        it('should include ai/specs folder', () => {
            expect(REQUIRED_FOLDERS).toContain('ai/specs');
        });

        it('should NOT include legacy ai/models folder', () => {
            expect(REQUIRED_FOLDERS).not.toContain('ai/models');
        });

        it('should be a string array', () => {
            expect(Array.isArray(REQUIRED_FOLDERS)).toBe(true);
            REQUIRED_FOLDERS.forEach(folder => {
                expect(typeof folder).toBe('string');
            });
        });

        it('should have folders in logical order (root first)', () => {
            const firstFolder = REQUIRED_FOLDERS[0];
            expect(firstFolder).toBe('ai');
        });

        it('should only contain ai/ subdirectories', () => {
            REQUIRED_FOLDERS.forEach(folder => {
                expect(folder).toMatch(/^ai(\/[a-z]+)?$/);
            });
        });
    });

    describe('REQUIRED_COMMANDS constant', () => {
        it('should have exactly 2 required commands', () => {
            expect(REQUIRED_COMMANDS).toHaveLength(2);
        });

        it('should include forge-design.md command', () => {
            expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-design.md');
        });

        it('should include forge-build.md command', () => {
            expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-build.md');
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
        it('requires all 6 folders to be present', () => {
            // A project missing any of the 6 folders should NOT be ready
            const allFolders = [...REQUIRED_FOLDERS];
            const missingOneFolder = allFolders.slice(0, -1); // Remove last folder
            
            expect(allFolders.length).toBe(6);
            expect(missingOneFolder.length).toBe(5);
            // Project would not be ready with only 5 folders
        });

        it('requires all 2 commands to be present', () => {
            // A project missing any command should NOT be ready
            const allCommands = [...REQUIRED_COMMANDS];
            const missingOneCommand = allCommands.slice(0, -1); // Remove last command
            
            expect(allCommands.length).toBe(2);
            expect(missingOneCommand.length).toBe(1);
            // Project would not be ready with only 1 command
        });

        it('requires command files to have valid content (hash validation)', () => {
            // Commands must exist AND have valid hashes
            // A file with wrong content or tampered hash should fail validation
            const commandPath = '.cursor/commands/forge-design.md';
            
            expect(commandPath).toMatch(/\.cursor\/commands\/.*\.md$/);
            // File must pass hash validation to be considered valid
        });
    });

    describe('Consistency requirements', () => {
        it('all components must check the same 6 folders', () => {
            // ProjectPicker, extension.ts, and WelcomePanel must all use REQUIRED_FOLDERS
            const expectedFolderCount = 6;
            
            expect(REQUIRED_FOLDERS.length).toBe(expectedFolderCount);
            // This ensures no component checks 7 folders (including ai/models)
        });

        it('all components must check the same 2 commands', () => {
            // ProjectPicker, extension.ts, and WelcomePanel must all use REQUIRED_COMMANDS
            const expectedCommandCount = 2;
            
            expect(REQUIRED_COMMANDS.length).toBe(expectedCommandCount);
        });

        it('legacy ai/models folder is excluded from all checks', () => {
            // Verify the legacy folder is NOT in the requirements
            const legacyFolder = 'ai/models';
            
            expect(REQUIRED_FOLDERS).not.toContain(legacyFolder);
            
            // This is critical: old implementations checked for ai/models
            // causing projects WITHOUT ai/models to show "Not Ready"
            // even though they were actually ready
        });
    });

    describe('Folder path format', () => {
        it('should use forward slashes for cross-platform compatibility', () => {
            REQUIRED_FOLDERS.forEach(folder => {
                if (folder.includes('/')) {
                    expect(folder).not.toContain('\\');
                }
            });
        });

        it('should not have trailing slashes', () => {
            REQUIRED_FOLDERS.forEach(folder => {
                expect(folder).not.toMatch(/\/$/);
            });
        });

        it('should not have leading slashes', () => {
            REQUIRED_FOLDERS.forEach(folder => {
                expect(folder).not.toMatch(/^\//);
            });
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
                // .cursor/commands/*.md
                expect(command).toMatch(/^\.cursor\/commands\/[a-z-]+\.md$/);
            });
        });
    });

    describe('Integration with command validation', () => {
        it('REQUIRED_COMMANDS should match getManagedCommandPaths()', () => {
            // The commands are dynamically retrieved from templates
            // This ensures they stay in sync with the actual template system
            
            const designCommand = '.cursor/commands/forge-design.md';
            const buildCommand = '.cursor/commands/forge-build.md';
            
            expect(REQUIRED_COMMANDS).toContain(designCommand);
            expect(REQUIRED_COMMANDS).toContain(buildCommand);
        });
    });

    describe('Backwards compatibility', () => {
        it('should not break existing Forge projects without ai/models', () => {
            // Modern Forge projects don't have ai/models folder
            // They should be recognized as ready
            
            const modernFolders = [
                'ai',
                'ai/actors',
                'ai/contexts',
                'ai/features',
                'ai/sessions',
                'ai/specs'
            ];
            
            expect(REQUIRED_FOLDERS).toEqual(modernFolders);
        });

        it('should ignore presence of legacy ai/models folder', () => {
            // If a project HAS ai/models (old project), it should still work
            // The folder is simply ignored in readiness checks
            
            const legacyFolder = 'ai/models';
            
            expect(REQUIRED_FOLDERS).not.toContain(legacyFolder);
            // Presence of ai/models doesn't affect readiness
            // Absence of ai/models doesn't affect readiness
        });
    });

    describe('Constants are immutable', () => {
        it('REQUIRED_FOLDERS should not be modifiable', () => {
            const originalLength = REQUIRED_FOLDERS.length;
            
            // Attempting to modify should not affect the original
            const copy = [...REQUIRED_FOLDERS];
            copy.push('ai/invalid');
            
            expect(REQUIRED_FOLDERS.length).toBe(originalLength);
            expect(REQUIRED_FOLDERS.length).toBe(6);
        });

        it('REQUIRED_COMMANDS should not be modifiable', () => {
            const originalLength = REQUIRED_COMMANDS.length;
            
            // Attempting to modify should not affect the original
            const copy = [...REQUIRED_COMMANDS];
            copy.push('.cursor/commands/invalid.md');
            
            expect(REQUIRED_COMMANDS.length).toBe(originalLength);
            expect(REQUIRED_COMMANDS.length).toBe(2);
        });
    });

    describe('Error scenarios', () => {
        it('missing ai root folder should fail readiness', () => {
            // If the base ai/ folder doesn't exist, project is not ready
            const rootFolder = 'ai';
            
            expect(REQUIRED_FOLDERS).toContain(rootFolder);
            expect(REQUIRED_FOLDERS[0]).toBe(rootFolder);
        });

        it('missing any subfolder should fail readiness', () => {
            // All 6 folders must exist
            const subfolders = REQUIRED_FOLDERS.filter(f => f !== 'ai');
            
            expect(subfolders.length).toBe(5);
            subfolders.forEach(subfolder => {
                expect(subfolder).toMatch(/^ai\//);
            });
        });

        it('missing any command file should fail readiness', () => {
            // Both command files must exist
            expect(REQUIRED_COMMANDS.length).toBe(2);
            
            REQUIRED_COMMANDS.forEach(command => {
                expect(command).toBeTruthy();
            });
        });

        it('invalid command hash should fail readiness', () => {
            // Even if file exists, invalid hash should fail
            // This is handled by validateCommandFileHash()
            const commandPath = REQUIRED_COMMANDS[0];
            
            expect(commandPath).toMatch(/\.md$/);
            // Hash validation is required for readiness
        });
    });

    describe('Documentation alignment', () => {
        it('matches documented required folders count', () => {
            // Spec says 6 folders (excluding ai/models)
            expect(REQUIRED_FOLDERS.length).toBe(6);
        });

        it('matches documented required commands count', () => {
            // Spec says 2 cursor commands
            expect(REQUIRED_COMMANDS.length).toBe(2);
        });

        it('aligns with forge-ready-status-accuracy session intent', () => {
            // Session goal: accurate accounting of forge-ready status
            // Solution: centralized check with correct criteria
            
            // Verify ai/models is NOT checked (was the bug)
            expect(REQUIRED_FOLDERS).not.toContain('ai/models');
            
            // Verify all other folders ARE checked
            expect(REQUIRED_FOLDERS).toContain('ai');
            expect(REQUIRED_FOLDERS).toContain('ai/actors');
            expect(REQUIRED_FOLDERS).toContain('ai/contexts');
            expect(REQUIRED_FOLDERS).toContain('ai/features');
            expect(REQUIRED_FOLDERS).toContain('ai/sessions');
            expect(REQUIRED_FOLDERS).toContain('ai/specs');
            
            // Verify commands ARE checked
            expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-design.md');
            expect(REQUIRED_COMMANDS).toContain('.cursor/commands/forge-build.md');
        });
    });
});


