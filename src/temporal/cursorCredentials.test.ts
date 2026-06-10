import { describe, expect, it, vi } from 'vitest';
import { resolveCursorApiKeyForWorker } from './cursorCredentials';

describe('resolveCursorApiKeyForWorker', () => {
    it('prefers CURSOR_API_KEY env override over SecretStorage reader', async () => {
        process.env.CURSOR_API_KEY = 'env-key';
        const reader = vi.fn(async () => 'stored-key');

        await expect(resolveCursorApiKeyForWorker(reader)).resolves.toBe('env-key');

        delete process.env.CURSOR_API_KEY;
    });

    it('falls back to SecretStorage reader when env is unset', async () => {
        delete process.env.CURSOR_API_KEY;
        const reader = vi.fn(async () => 'stored-key');

        await expect(resolveCursorApiKeyForWorker(reader)).resolves.toBe('stored-key');
    });
});
