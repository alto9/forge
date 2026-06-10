import { redactAuthorizationMaterial } from '../temporal/secretRedaction';

const SECRET_ENV_VAR_PATTERN =
    /(?<=^|[\s&;])([A-Za-z_][A-Za-z0-9_]*(?:KEY|TOKEN|SECRET)[A-Za-z0-9_]*)=([^\s&;]+)/gi;
const API_KEY_LIKE_PATTERN = /\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{8,}\b/g;

export function redactInspectorText(text: string): string {
    let redacted = redactAuthorizationMaterial(text);
    redacted = redacted.replace(SECRET_ENV_VAR_PATTERN, '$1=[REDACTED]');
    redacted = redacted.replace(API_KEY_LIKE_PATTERN, '[REDACTED]');
    return redacted;
}
