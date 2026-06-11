import type { WorkflowRunInputDefinition } from './types';

function readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    return value as Record<string, unknown>;
}

function parseRunInputDescriptor(
    value: unknown,
    index: number
): WorkflowRunInputDefinition | undefined {
    const record = readRecord(value);
    if (!record) {
        return undefined;
    }

    const input_id = readString(record.input_id);
    const type = record.type;
    const label = readString(record.label);

    if (!input_id || type !== 'string' || !label) {
        return undefined;
    }

    const descriptor: WorkflowRunInputDefinition = {
        input_id,
        type: 'string',
        label,
    };

    const description = readString(record.description);
    if (description !== undefined) {
        descriptor.description = description;
    }

    if (record.required === true) {
        descriptor.required = true;
    }

    const validation_hint = readString(record.validation_hint);
    if (validation_hint !== undefined) {
        descriptor.validation_hint = validation_hint;
    }

    return descriptor;
}

export function parseRunInputsFromRecord(
    record: Record<string, unknown>
): WorkflowRunInputDefinition[] {
    const raw = record.run_inputs;
    if (!Array.isArray(raw)) {
        return [];
    }

    const descriptors: WorkflowRunInputDefinition[] = [];
    raw.forEach((item, index) => {
        const parsed = parseRunInputDescriptor(item, index);
        if (parsed) {
            descriptors.push(parsed);
        }
    });

    return descriptors;
}

export function workflowRequiresRunInputCollection(
    runInputs: WorkflowRunInputDefinition[] | undefined
): boolean {
    return (runInputs ?? []).some((descriptor) => descriptor.required === true);
}
