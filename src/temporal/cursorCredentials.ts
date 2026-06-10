import type * as vscode from 'vscode';

export const CURSOR_API_KEY_SECRET_KEY = 'forge.cursor.apiKey';

export type StoredCursorApiKeyReader = () => Promise<string | undefined>;

export function createStoredCursorApiKeyReader(
    secrets: vscode.SecretStorage
): StoredCursorApiKeyReader {
    return async () => {
        const stored = await secrets.get(CURSOR_API_KEY_SECRET_KEY);
        return stored?.trim() || undefined;
    };
}

let registeredStoredCursorApiKeyReader: StoredCursorApiKeyReader | undefined;

export function registerStoredCursorApiKeyReader(reader: StoredCursorApiKeyReader): void {
    registeredStoredCursorApiKeyReader = reader;
}

export function getRegisteredStoredCursorApiKeyReader(): StoredCursorApiKeyReader | undefined {
    return registeredStoredCursorApiKeyReader;
}

export function clearRegisteredStoredCursorApiKeyReader(): void {
    registeredStoredCursorApiKeyReader = undefined;
}

export async function resolveCursorApiKeyForWorker(
    reader?: StoredCursorApiKeyReader
): Promise<string | undefined> {
    const envKey = process.env.CURSOR_API_KEY?.trim();
    if (envKey) {
        return envKey;
    }

    if (!reader) {
        return undefined;
    }

    return reader();
}
