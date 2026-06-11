import { redactAuthorizationMaterial } from '../temporal/secretRedaction';
import type { WorkflowRunInputDefinition, WorkflowRunStartInput } from './types';

const SECRET_VALUE_PATTERN =
    /\b(?:api[_-]?key|token|secret|password|bearer)\b/i;
const BEARER_TOKEN_PATTERN = /\bbearer\s+[^\s\r\n]+/gi;

function redactStartInputValue(value: string): string {
    let redacted = redactAuthorizationMaterial(value);
    redacted = redacted.replace(BEARER_TOKEN_PATTERN, 'Bearer [redacted]');

    if (SECRET_VALUE_PATTERN.test(value)) {
        return '[redacted]';
    }

    return redacted;
}

export function buildStartInputSummary(
    declarations: WorkflowRunInputDefinition[],
    normalizedInputs: WorkflowRunStartInput
): string | undefined {
    if (Object.keys(normalizedInputs).length === 0) {
        return undefined;
    }

    const parts: string[] = [];
    for (const declaration of declarations) {
        const value = normalizedInputs[declaration.input_id];
        if (value === undefined) {
            continue;
        }

        parts.push(`${declaration.input_id}: ${redactStartInputValue(value)}`);
    }

    return parts.length > 0 ? parts.join('; ') : undefined;
}
