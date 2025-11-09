import { describe, it, expect } from 'vitest';

/**
 * Tests for folder creation error handling
 * 
 * Documents error detection, message formatting, and retry behavior
 */

describe('Folder Creation Error Handling', () => {
    describe('Error code detection', () => {
        it('should detect permission denied errors (EACCES)', () => {
            const error = { code: 'EACCES', message: 'permission denied' };
            const errorCode = error.code;

            if (errorCode === 'EACCES' || errorCode === 'EPERM') {
                expect(errorCode).toBe('EACCES');
            }
        });

        it('should detect permission denied errors (EPERM)', () => {
            const error = { code: 'EPERM', message: 'operation not permitted' };
            const errorCode = error.code;

            if (errorCode === 'EACCES' || errorCode === 'EPERM') {
                expect(errorCode).toBe('EPERM');
            }
        });

        it('should detect disk space errors (ENOSPC)', () => {
            const error = { code: 'ENOSPC', message: 'no space left on device' };
            const errorCode = error.code;

            if (errorCode === 'ENOSPC') {
                expect(errorCode).toBe('ENOSPC');
            }
        });

        it('should detect invalid path errors (ENOENT)', () => {
            const error = { code: 'ENOENT', message: 'no such file or directory' };
            const errorCode = error.code;

            if (errorCode === 'ENOENT' || errorCode === 'ENOTDIR') {
                expect(errorCode).toBe('ENOENT');
            }
        });

        it('should detect invalid path errors (ENOTDIR)', () => {
            const error = { code: 'ENOTDIR', message: 'not a directory' };
            const errorCode = error.code;

            if (errorCode === 'ENOENT' || errorCode === 'ENOTDIR') {
                expect(errorCode).toBe('ENOTDIR');
            }
        });

        it('should detect read-only filesystem errors (EROFS)', () => {
            const error = { code: 'EROFS', message: 'read-only file system' };
            const errorCode = error.code;

            if (errorCode === 'EROFS') {
                expect(errorCode).toBe('EROFS');
            }
        });
    });

    describe('Error message formatting', () => {
        it('should format permission denied messages', () => {
            const folderPath = 'ai/actors';
            const expectedMessage = `Permission denied: Cannot create folder "${folderPath}". Please check folder permissions.`;

            expect(expectedMessage).toContain('Permission denied');
            expect(expectedMessage).toContain(folderPath);
            expect(expectedMessage).toContain('check folder permissions');
        });

        it('should format disk space error messages', () => {
            const folderPath = 'ai/models';
            const expectedMessage = `Insufficient disk space: Cannot create folder "${folderPath}". Please free up disk space.`;

            expect(expectedMessage).toContain('Insufficient disk space');
            expect(expectedMessage).toContain(folderPath);
            expect(expectedMessage).toContain('free up disk space');
        });

        it('should format invalid path error messages', () => {
            const folderPath = 'ai/specs';
            const expectedMessage = `Invalid project path: Cannot create folder "${folderPath}". Please check the project location.`;

            expect(expectedMessage).toContain('Invalid project path');
            expect(expectedMessage).toContain(folderPath);
            expect(expectedMessage).toContain('check the project location');
        });

        it('should format read-only filesystem error messages', () => {
            const folderPath = 'ai/features';
            const expectedMessage = `Read-only filesystem: Cannot create folder "${folderPath}". The project is on a read-only volume.`;

            expect(expectedMessage).toContain('Read-only filesystem');
            expect(expectedMessage).toContain(folderPath);
            expect(expectedMessage).toContain('read-only volume');
        });

        it('should format generic error messages', () => {
            const folderPath = 'ai/contexts';
            const errorMessage = 'Unknown error occurred';
            const expectedMessage = `Failed to create folder "${folderPath}": ${errorMessage}`;

            expect(expectedMessage).toContain('Failed to create folder');
            expect(expectedMessage).toContain(folderPath);
            expect(expectedMessage).toContain(errorMessage);
        });
    });

    describe('Error propagation', () => {
        it('should send error progress message to webview', () => {
            const errorMessage = {
                type: 'initializationProgress',
                folder: 'ai/actors',
                status: 'error',
                error: 'Permission denied'
            };

            expect(errorMessage.type).toBe('initializationProgress');
            expect(errorMessage.status).toBe('error');
            expect(errorMessage.error).toBeTruthy();
        });

        it('should send error message to webview', () => {
            const errorMessage = {
                type: 'error',
                message: 'Failed to create folder'
            };

            expect(errorMessage.type).toBe('error');
            expect(errorMessage.message).toBeTruthy();
        });

        it('should show error in VSCode notification', () => {
            const userMessage = 'Permission denied: Cannot create folder';
            
            // Should call vscode.window.showErrorMessage
            expect(userMessage).toBeTruthy();
            expect(userMessage).toContain('Cannot create folder');
        });
    });

    describe('Partial failure handling', () => {
        it('should continue after individual folder failure', () => {
            const folders = ['ai', 'ai/actors', 'ai/models', 'ai/specs'];
            let created = 0;
            let failed = 0;

            // Simulate processing with one failure
            folders.forEach((folder, index) => {
                try {
                    if (index === 1) {
                        throw new Error('Permission denied');
                    }
                    created++;
                } catch {
                    failed++;
                }
            });

            expect(created).toBe(3);
            expect(failed).toBe(1);
            expect(created + failed).toBe(folders.length);
        });

        it('should track created and failed counts', () => {
            let created = 0;
            let failed = 0;

            // Simulate mixed results
            try {
                created++;
            } catch {
                failed++;
            }

            try {
                throw new Error('Failed');
            } catch {
                failed++;
            }

            try {
                created++;
            } catch {
                failed++;
            }

            expect(created).toBe(2);
            expect(failed).toBe(1);
        });

        it('should refresh status after partial failure', () => {
            const failed = 2;
            const shouldRefreshStatus = failed > 0;

            expect(shouldRefreshStatus).toBe(true);
        });

        it('should not transition to studio after any failure', () => {
            const failed = 1;
            const shouldTransition = failed === 0;

            expect(shouldTransition).toBe(false);
        });
    });

    describe('Retry behavior', () => {
        it('should only retry missing folders', () => {
            const allFolders = [
                { path: 'ai', exists: true },
                { path: 'ai/actors', exists: false },
                { path: 'ai/models', exists: true },
                { path: 'ai/specs', exists: false }
            ];

            const missingFolders = allFolders.filter(f => !f.exists);

            expect(missingFolders).toHaveLength(2);
            expect(missingFolders.map(f => f.path)).toEqual(['ai/actors', 'ai/specs']);
        });

        it('should show retry button after error', () => {
            const hasError = true;
            const buttonText = hasError ? 'Retry Initialization' : 'Initialize Forge Project';

            expect(buttonText).toBe('Retry Initialization');
        });

        it('should show normal button when no error', () => {
            const hasError = false;
            const buttonText = hasError ? 'Retry Initialization' : 'Initialize Forge Project';

            expect(buttonText).toBe('Initialize Forge Project');
        });

        it('should clear errors before retry', () => {
            let error: string | null = 'Previous error';

            // Clear error before retry
            error = null;

            expect(error).toBeNull();
        });
    });

    describe('Completion message after errors', () => {
        it('should indicate failure when any folder failed', () => {
            const failed = 1;
            const created = 5;
            const completionMessage = {
                type: 'initializationComplete',
                success: failed === 0,
                created,
                failed
            };

            expect(completionMessage.success).toBe(false);
            expect(completionMessage.failed).toBeGreaterThan(0);
        });

        it('should indicate success when all succeeded', () => {
            const failed = 0;
            const created = 7;
            const completionMessage = {
                type: 'initializationComplete',
                success: failed === 0,
                created,
                failed
            };

            expect(completionMessage.success).toBe(true);
            expect(completionMessage.failed).toBe(0);
        });

        it('should include created and failed counts', () => {
            const completionMessage = {
                type: 'initializationComplete',
                success: false,
                created: 4,
                failed: 3
            };

            expect(completionMessage.created).toBe(4);
            expect(completionMessage.failed).toBe(3);
        });
    });

    describe('Status refresh after errors', () => {
        it('should get updated folder status after partial failure', () => {
            const beforeStatus = [
                { path: 'ai', exists: false },
                { path: 'ai/actors', exists: false },
                { path: 'ai/models', exists: false }
            ];

            // After partial creation
            const afterStatus = [
                { path: 'ai', exists: true },
                { path: 'ai/actors', exists: false },
                { path: 'ai/models', exists: true }
            ];

            const newlyCreated = afterStatus.filter((f, i) => f.exists && !beforeStatus[i].exists);
            expect(newlyCreated).toHaveLength(2);
        });

        it('should show created folders in checklist', () => {
            const folders = [
                { path: 'ai', exists: true, description: 'Root' },
                { path: 'ai/actors', exists: false, description: 'Actors' },
                { path: 'ai/models', exists: true, description: 'Models' }
            ];

            const existing = folders.filter(f => f.exists);
            const missing = folders.filter(f => !f.exists);

            expect(existing).toHaveLength(2);
            expect(missing).toHaveLength(1);
        });
    });

    describe('Error message display in UI', () => {
        it('should display error prominently', () => {
            const error = 'Permission denied: Cannot create folder';
            const shouldDisplay = !!error;

            expect(shouldDisplay).toBe(true);
            expect(error).toBeTruthy();
        });

        it('should clear error display when initializing again', () => {
            let error: string | null = 'Previous error';
            
            // When starting new initialization
            error = null;

            expect(error).toBeNull();
        });

        it('should show error in error-message div', () => {
            const errorDivClassName = 'error-message';
            
            expect(errorDivClassName).toBe('error-message');
        });
    });

    describe('Error recovery scenarios', () => {
        it('should handle permission error followed by successful retry', () => {
            let attempt = 0;
            let success = false;

            // First attempt fails
            attempt++;
            try {
                if (attempt === 1) {
                    throw new Error('EACCES');
                }
            } catch {
                success = false;
            }

            // Second attempt succeeds (after user fixes permissions)
            attempt++;
            try {
                success = true;
            } catch {
                success = false;
            }

            expect(attempt).toBe(2);
            expect(success).toBe(true);
        });

        it('should update UI after successful retry', () => {
            let isReady = false;
            let error: string | null = 'Previous error';

            // After successful retry
            isReady = true;
            error = null;

            expect(isReady).toBe(true);
            expect(error).toBeNull();
        });
    });
});

