export function resolveCursorApiKeyFromEnv(): string | undefined {
    const value = process.env.CURSOR_API_KEY?.trim();
    return value && value.length > 0 ? value : undefined;
}
