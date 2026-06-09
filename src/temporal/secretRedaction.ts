const AUTHORIZATION_BEARER_PATTERN = /authorization\s*:\s*bearer\s+[^\s\r\n]+/gi;
const BEARER_TOKEN_PATTERN = /\bbearer\s+[^\s\r\n]+/gi;
const AUTHORIZATION_HEADER_PATTERN = /authorization\s*:\s*[^\s\r\n]+/gi;

export function redactAuthorizationMaterial(text: string): string {
    return text
        .replace(AUTHORIZATION_BEARER_PATTERN, 'authorization: [redacted]')
        .replace(BEARER_TOKEN_PATTERN, 'Bearer [redacted]')
        .replace(AUTHORIZATION_HEADER_PATTERN, 'authorization: [redacted]');
}

export function redactKnownSecrets(text: string, secrets: readonly string[]): string {
    let redacted = redactAuthorizationMaterial(text);

    for (const secret of secrets) {
        const trimmed = secret.trim();
        if (trimmed.length === 0) {
            continue;
        }
        redacted = redacted.split(trimmed).join('[redacted]');
    }

    return redacted;
}

export function formatSafeForLog(
    message: string,
    options: { knownSecrets?: readonly string[] } = {}
): string {
    return redactKnownSecrets(message, options.knownSecrets ?? []);
}
