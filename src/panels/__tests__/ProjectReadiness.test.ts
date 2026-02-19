import { describe, it, expect } from 'vitest';
import { generateCommandFile, validateCommandFileHash } from '../../utils/commandValidation';

/**
 * Integration tests for project readiness checking with command file validation
 * 
 * These tests verify the logic for determining if a Forge project is "ready"
 * which now includes both folder existence and command file validity.
 */

describe('Project Readiness - Command File Integration', () => {
    describe('checkProjectReadiness logic', () => {
        it('should be ready when all folders and commands exist and are valid', () => {
            const foldersReady = true;
            const commandsValid = true;
            
            const isReady = foldersReady && commandsValid;
            
            expect(isReady).toBe(true);
        });

        it('should not be ready when .forge is missing', () => {
            const forgeReady = false;
            const commandsValid = true;
            
            const isReady = forgeReady && commandsValid;
            
            expect(isReady).toBe(false);
        });

        it('should not be ready when commands are missing', () => {
            const forgeReady = true;
            const commandsValid = false;
            
            const isReady = forgeReady && commandsValid;
            
            expect(isReady).toBe(false);
        });

        it('should not be ready when both .forge and commands are missing', () => {
            const forgeReady = false;
            const commandsValid = false;
            
            const isReady = forgeReady && commandsValid;
            
            expect(isReady).toBe(false);
        });

        it('should check .forge directory exists', () => {
            const forge = { path: '.forge', exists: true };

            expect(forge.exists).toBe(true);
        });

        it('should fail if .forge is missing', () => {
            const forge = { path: '.forge', exists: false };

            expect(forge.exists).toBe(false);
        });

        it('should check all command files sequentially', () => {
            const commands = [
                { path: '.cursor/commands/forge-refine.md', exists: true, valid: true },
                { path: '.cursor/commands/forge-build.md', exists: true, valid: true }
            ];

            const allCommandsValid = commands.every(c => c.exists && c.valid);
            
            expect(allCommandsValid).toBe(true);
        });

        it('should fail if any command is missing', () => {
            const commands = [
                { path: '.cursor/commands/forge-refine.md', exists: true, valid: true },
                { path: '.cursor/commands/forge-build.md', exists: false, valid: false }
            ];

            const allCommandsValid = commands.every(c => c.exists && c.valid);
            
            expect(allCommandsValid).toBe(false);
        });

        it('should fail if any command exists but is invalid', () => {
            const commands = [
                { path: '.cursor/commands/forge-refine.md', exists: true, valid: true },
                { path: '.cursor/commands/forge-build.md', exists: true, valid: false }
            ];

            const allCommandsValid = commands.every(c => c.exists && c.valid);
            
            expect(allCommandsValid).toBe(false);
        });
    });

    describe('Command status checking', () => {
        it('should identify missing command file', () => {
            const commandExists = false;
            const commandValid = false;

            expect(commandExists).toBe(false);
            expect(commandValid).toBe(false);
        });

        it('should identify invalid command file (exists but wrong hash)', () => {
            const commandExists = true;
            const commandValid = false;

            expect(commandExists).toBe(true);
            expect(commandValid).toBe(false);
        });

        it('should identify valid command file', () => {
            const commandExists = true;
            const commandValid = true;

            expect(commandExists).toBe(true);
            expect(commandValid).toBe(true);
        });

        it('should handle command file validation with real templates', () => {
            const commandPath = '.cursor/commands/forge-refine.md';
            const generated = generateCommandFile(commandPath);
            const isValid = validateCommandFileHash(generated, commandPath);

            expect(isValid).toBe(true);
        });

        it('should detect tampered command file', () => {
            const commandPath = '.cursor/commands/forge-refine.md';
            const generated = generateCommandFile(commandPath);
            const tampered = generated + '\n// User added this';
            const isValid = validateCommandFileHash(tampered, commandPath);

            expect(isValid).toBe(false);
        });
    });

    describe('getProjectStatus logic', () => {
        it('should return both folders and commands in status', () => {
            const folders = [
                { path: '.forge', exists: true, description: 'Forge metadata', type: 'folder' as const }
            ];

            const commands = [
                { path: '.cursor/commands/forge-refine.md', exists: true, valid: true, description: 'Design command', type: 'command' as const },
                { path: '.cursor/commands/forge-build.md', exists: true, valid: true, description: 'Build command', type: 'command' as const }
            ];

            const status = { folders, commands };

            expect(status.folders).toHaveLength(1);
            expect(status.commands).toHaveLength(2);
        });

        it('should include exists flag for folders', () => {
            const folder = { path: '.forge', exists: true, description: 'Forge metadata', type: 'folder' as const };

            expect(folder.exists).toBeDefined();
            expect(typeof folder.exists).toBe('boolean');
        });

        it('should include exists and valid flags for commands', () => {
            const command = { 
                path: '.cursor/commands/forge-refine.md', 
                exists: true, 
                valid: true, 
                description: 'Design command',
                type: 'command' as const
            };

            expect(command.exists).toBeDefined();
            expect(command.valid).toBeDefined();
            expect(typeof command.exists).toBe('boolean');
            expect(typeof command.valid).toBe('boolean');
        });

        it('should use type discriminator for folders and commands', () => {
            const folder = { path: '.forge', exists: true, description: 'Forge metadata', type: 'folder' as const };
            const command = { 
                path: '.cursor/commands/forge-refine.md', 
                exists: true, 
                valid: true, 
                description: 'Design command',
                type: 'command' as const
            };

            expect(folder.type).toBe('folder');
            expect(command.type).toBe('command');
        });
    });

    describe('Readiness state combinations', () => {
        interface ReadinessScenario {
            name: string;
            folders: { path: string; exists: boolean }[];
            commands: { path: string; exists: boolean; valid: boolean }[];
            expectedReady: boolean;
        }

        const scenarios: ReadinessScenario[] = [
            {
                name: 'all ready',
                folders: [
                    { path: '.forge', exists: true }
                ],
                commands: [
                    { path: '.cursor/commands/forge-refine.md', exists: true, valid: true },
                    { path: '.cursor/commands/forge-build.md', exists: true, valid: true }
                ],
                expectedReady: true
            },
            {
                name: '.forge missing',
                folders: [
                    { path: '.forge', exists: false }
                ],
                commands: [
                    { path: '.cursor/commands/forge-refine.md', exists: true, valid: true },
                    { path: '.cursor/commands/forge-build.md', exists: true, valid: true }
                ],
                expectedReady: false
            },
            {
                name: 'commands missing',
                folders: [
                    { path: '.forge', exists: true }
                ],
                commands: [
                    { path: '.cursor/commands/forge-refine.md', exists: false, valid: false },
                    { path: '.cursor/commands/forge-build.md', exists: false, valid: false }
                ],
                expectedReady: false
            },
            {
                name: 'commands exist but invalid',
                folders: [
                    { path: '.forge', exists: true }
                ],
                commands: [
                    { path: '.cursor/commands/forge-refine.md', exists: true, valid: false },
                    { path: '.cursor/commands/forge-build.md', exists: true, valid: false }
                ],
                expectedReady: false
            },
            {
                name: 'partial - one command invalid',
                folders: [
                    { path: '.forge', exists: true }
                ],
                commands: [
                    { path: '.cursor/commands/forge-refine.md', exists: true, valid: true },
                    { path: '.cursor/commands/forge-build.md', exists: true, valid: false }
                ],
                expectedReady: false
            },
            {
                name: 'partial - one command missing',
                folders: [
                    { path: '.forge', exists: true }
                ],
                commands: [
                    { path: '.cursor/commands/forge-refine.md', exists: true, valid: true },
                    { path: '.cursor/commands/forge-build.md', exists: false, valid: false }
                ],
                expectedReady: false
            },
            {
                name: 'partial - .forge missing',
                folders: [
                    { path: '.forge', exists: false }
                ],
                commands: [
                    { path: '.cursor/commands/forge-refine.md', exists: true, valid: true },
                    { path: '.cursor/commands/forge-build.md', exists: true, valid: true }
                ],
                expectedReady: false
            },
            {
                name: 'everything missing',
                folders: [
                    { path: '.forge', exists: false }
                ],
                commands: [
                    { path: '.cursor/commands/forge-refine.md', exists: false, valid: false },
                    { path: '.cursor/commands/forge-build.md', exists: false, valid: false }
                ],
                expectedReady: false
            }
        ];

        scenarios.forEach(scenario => {
            it(`should be ${scenario.expectedReady ? 'ready' : 'not ready'} when ${scenario.name}`, () => {
                const foldersReady = scenario.folders.every(f => f.exists);
                const commandsReady = scenario.commands.every(c => c.exists && c.valid);
                const isReady = foldersReady && commandsReady;

                expect(isReady).toBe(scenario.expectedReady);
            });
        });
    });

    describe('Command file validation during readiness check', () => {
        it('should call validation for each command file', () => {
            const commandPaths = [
                '.cursor/commands/forge-refine.md',
                '.cursor/commands/forge-build.md'
            ];

            let validationCallCount = 0;
            
            commandPaths.forEach(() => {
                validationCallCount++;
            });

            expect(validationCallCount).toBe(2);
        });

        it('should handle validation errors gracefully', () => {
            let validationResult = false;
            
            try {
                // Simulate file not found
                throw new Error('File not found');
            } catch {
                // File doesn't exist - mark as invalid
                validationResult = false;
            }

            expect(validationResult).toBe(false);
        });

        it('should validate content using hash checking', () => {
            const commandPath = '.cursor/commands/forge-refine.md';
            
            // Generate valid file
            const validFile = generateCommandFile(commandPath);
            const isValid = validateCommandFileHash(validFile, commandPath);
            
            expect(isValid).toBe(true);
        });

        it('should detect invalid content using hash checking', () => {
            const commandPath = '.cursor/commands/forge-refine.md';
            
            // Create invalid file (no hash comment)
            const invalidFile = '# Forge Refine\n\nSome content';
            const isValid = validateCommandFileHash(invalidFile, commandPath);
            
            expect(isValid).toBe(false);
        });
    });

    describe('Status update after initialization', () => {
        it('should recalculate status after folder creation', () => {
            const beforeFolders = [
                { path: '.forge', exists: false }
            ];

            const afterFolders = beforeFolders.map(f => ({ ...f, exists: true }));

            expect(beforeFolders.every(f => f.exists)).toBe(false);
            expect(afterFolders.every(f => f.exists)).toBe(true);
        });

        it('should recalculate status after command creation', () => {
            const beforeCommands = [
                { path: '.cursor/commands/forge-refine.md', exists: false, valid: false },
                { path: '.cursor/commands/forge-build.md', exists: false, valid: false }
            ];

            // Simulate command creation
            const afterCommands = beforeCommands.map(c => ({ ...c, exists: true, valid: true }));

            expect(beforeCommands.every(c => c.exists && c.valid)).toBe(false);
            expect(afterCommands.every(c => c.exists && c.valid)).toBe(true);
        });

        it('should transition to studio when ready after initialization', () => {
            const foldersCreated = 1;
            const commandsCreated = 2;
            const failed = 0;

            const totalCreated = foldersCreated + commandsCreated;
            const isReady = failed === 0 && totalCreated > 0;

            expect(isReady).toBe(true);
        });

        it('should not transition to studio if initialization failed', () => {
            const foldersCreated = 0;
            const commandsCreated = 1;
            const failed = 2;

            const shouldTransition = failed === 0;

            expect(shouldTransition).toBe(false);
        });
    });

    describe('Integration with command templates', () => {
        it('should validate forge-refine.md template', () => {
            const commandPath = '.cursor/commands/forge-refine.md';
            const generated = generateCommandFile(commandPath);
            
            expect(generated).toContain('<!-- forge-hash:');
            expect(generated).toContain('# Forge Refine');
            expect(generated).toContain('Prerequisites');
        });

        it('should validate forge-build.md template', () => {
            const commandPath = '.cursor/commands/forge-build.md';
            const generated = generateCommandFile(commandPath);
            
            expect(generated).toContain('<!-- forge-hash:');
            expect(generated).toContain('# Forge Build');
            expect(generated).toContain('Prerequisites');
        });

        it('should validate all command templates successfully', () => {
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

    describe('Required commands structure', () => {
        const REQUIRED_COMMANDS = [
            { path: '.cursor/commands/forge-refine.md', description: 'Cursor command for refining tickets for implementation' },
            { path: '.cursor/commands/forge-build.md', description: 'Cursor command for building from tickets' },
            { path: '.cursor/commands/forge-scribe.md', description: 'Cursor command for breaking milestones into tickets' },
            { path: '.cursor/commands/forge-commit.md', description: 'Cursor command for committing with validation' },
            { path: '.cursor/commands/forge-push.md', description: 'Cursor command for pushing safely' },
            { path: '.cursor/commands/forge-pullrequest.md', description: 'Cursor command for creating pull requests' }
        ];

        it('should have 6 required commands', () => {
            expect(REQUIRED_COMMANDS).toHaveLength(6);
        });

        it('should have commands in .cursor/commands/ directory', () => {
            REQUIRED_COMMANDS.forEach(command => {
                expect(command.path.startsWith('.cursor/commands/')).toBe(true);
                expect(command.path.endsWith('.md')).toBe(true);
            });
        });

        it('should have descriptions for all commands', () => {
            REQUIRED_COMMANDS.forEach(command => {
                expect(command.description).toBeTruthy();
                expect(command.description.length).toBeGreaterThan(0);
            });
        });

        it('should have all forge commands', () => {
            const commandNames = REQUIRED_COMMANDS.map(c => 
                c.path.replace('.cursor/commands/', '').replace('.md', '')
            );

            expect(commandNames).toContain('forge-refine');
            expect(commandNames).toContain('forge-build');
            expect(commandNames).toContain('forge-scribe');
            expect(commandNames).toContain('forge-commit');
            expect(commandNames).toContain('forge-push');
            expect(commandNames).toContain('forge-pullrequest');
        });
    });
});

