import type * as vscode from 'vscode';
import { EXTERNAL_API_KEY_SECRET_KEY } from './externalSettings';

export const EXTERNAL_CLIENT_CERT_SECRET_KEY = 'forge.temporal.external.clientCert';
export const EXTERNAL_CLIENT_KEY_SECRET_KEY = 'forge.temporal.external.clientKey';

export const RESERVED_EXTERNAL_SECRET_KEYS = [
    EXTERNAL_API_KEY_SECRET_KEY,
    EXTERNAL_CLIENT_CERT_SECRET_KEY,
    EXTERNAL_CLIENT_KEY_SECRET_KEY,
] as const;

export type StoredApiKeyReader = () => Promise<string | undefined>;

export function createStoredApiKeyReader(
    secrets: vscode.SecretStorage
): StoredApiKeyReader {
    return async () => {
        const stored = await secrets.get(EXTERNAL_API_KEY_SECRET_KEY);
        return stored?.trim() || undefined;
    };
}

export async function storeExternalApiKey(
    secrets: vscode.SecretStorage,
    apiKey: string
): Promise<void> {
    await secrets.store(EXTERNAL_API_KEY_SECRET_KEY, apiKey.trim());
}

export async function clearExternalApiKey(secrets: vscode.SecretStorage): Promise<void> {
    await secrets.delete(EXTERNAL_API_KEY_SECRET_KEY);
}

export async function hasStoredExternalApiKey(
    secrets: vscode.SecretStorage
): Promise<boolean> {
    const stored = await secrets.get(EXTERNAL_API_KEY_SECRET_KEY);
    return Boolean(stored?.trim());
}

let registeredStoredApiKeyReader: StoredApiKeyReader | undefined;

export function registerStoredApiKeyReader(reader: StoredApiKeyReader): void {
    registeredStoredApiKeyReader = reader;
}

export function getRegisteredStoredApiKeyReader(): StoredApiKeyReader | undefined {
    return registeredStoredApiKeyReader;
}

export function clearRegisteredStoredApiKeyReader(): void {
    registeredStoredApiKeyReader = undefined;
}
