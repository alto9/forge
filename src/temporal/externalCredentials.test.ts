import { afterEach, describe, expect, it, vi } from 'vitest';
import { EXTERNAL_API_KEY_SECRET_KEY } from './externalSettings';
import {
    EXTERNAL_CLIENT_CERT_SECRET_KEY,
    EXTERNAL_CLIENT_KEY_SECRET_KEY,
    RESERVED_EXTERNAL_SECRET_KEYS,
    clearExternalApiKey,
    clearRegisteredStoredApiKeyReader,
    createStoredApiKeyReader,
    getRegisteredStoredApiKeyReader,
    hasStoredExternalApiKey,
    registerStoredApiKeyReader,
    storeExternalApiKey,
} from './externalCredentials';

describe('externalCredentials', () => {
    afterEach(() => {
        clearRegisteredStoredApiKeyReader();
    });

    it('reserves future mTLS secret key names', () => {
        expect(RESERVED_EXTERNAL_SECRET_KEYS).toEqual([
            EXTERNAL_API_KEY_SECRET_KEY,
            EXTERNAL_CLIENT_CERT_SECRET_KEY,
            EXTERNAL_CLIENT_KEY_SECRET_KEY,
        ]);
    });

    it('stores and reads API keys from SecretStorage', async () => {
        const storage = new Map<string, string>();
        const secrets = {
            get: vi.fn(async (key: string) => storage.get(key)),
            store: vi.fn(async (key: string, value: string) => {
                storage.set(key, value);
            }),
            delete: vi.fn(async (key: string) => {
                storage.delete(key);
            }),
            onDidChange: vi.fn(),
        };

        await storeExternalApiKey(secrets, '  stored-key  ');
        expect(secrets.store).toHaveBeenCalledWith(
            EXTERNAL_API_KEY_SECRET_KEY,
            'stored-key'
        );

        const reader = createStoredApiKeyReader(secrets);
        await expect(reader()).resolves.toBe('stored-key');
        await expect(hasStoredExternalApiKey(secrets)).resolves.toBe(true);

        await clearExternalApiKey(secrets);
        await expect(reader()).resolves.toBeUndefined();
        await expect(hasStoredExternalApiKey(secrets)).resolves.toBe(false);
    });

    it('registers a default SecretStorage reader for validation', async () => {
        const reader = vi.fn(async () => 'registered-key');
        registerStoredApiKeyReader(reader);

        await expect(getRegisteredStoredApiKeyReader()?.()).resolves.toBe('registered-key');
    });
});
