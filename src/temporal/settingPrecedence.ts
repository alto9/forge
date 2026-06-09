interface ConfigurationInspectValue<T> {
    workspaceValue?: T;
    globalValue?: T;
}

export function resolvePositiveIntSetting(
    inspected: ConfigurationInspectValue<number> | undefined,
    envVar: string,
    defaultValue: number
): number {
    if (inspected?.workspaceValue !== undefined) {
        const parsed = parsePositiveInt(inspected.workspaceValue);
        if (parsed !== undefined) {
            return parsed;
        }
    }

    if (inspected?.globalValue !== undefined) {
        const parsed = parsePositiveInt(inspected.globalValue);
        if (parsed !== undefined) {
            return parsed;
        }
    }

    const envRaw = process.env[envVar];
    if (envRaw !== undefined && envRaw.trim() !== '') {
        const parsed = parsePositiveInt(envRaw);
        if (parsed !== undefined) {
            return parsed;
        }
    }

    return defaultValue;
}

export function resolveStringSetting(
    inspected: ConfigurationInspectValue<string> | undefined,
    envVar: string,
    defaultValue: string
): string {
    if (inspected?.workspaceValue !== undefined) {
        const trimmed = inspected.workspaceValue.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
    }

    if (inspected?.globalValue !== undefined) {
        const trimmed = inspected.globalValue.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
    }

    const envRaw = process.env[envVar];
    if (envRaw !== undefined && envRaw.trim() !== '') {
        return envRaw.trim();
    }

    return defaultValue;
}

export function resolveBooleanSetting(
    inspected: ConfigurationInspectValue<boolean> | undefined,
    envVar: string,
    defaultValue: boolean
): boolean {
    if (inspected?.workspaceValue !== undefined) {
        return inspected.workspaceValue;
    }

    if (inspected?.globalValue !== undefined) {
        return inspected.globalValue;
    }

    const envRaw = process.env[envVar];
    if (envRaw !== undefined && envRaw.trim() !== '') {
        const normalized = envRaw.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') {
            return true;
        }
        if (normalized === 'false' || normalized === '0') {
            return false;
        }
    }

    return defaultValue;
}

export function isSettingExplicitlyConfigured<T>(
    inspected: ConfigurationInspectValue<T> | undefined
): boolean {
    return inspected?.workspaceValue !== undefined || inspected?.globalValue !== undefined;
}

export function resolveOptionalStringSetting(
    inspected: ConfigurationInspectValue<string> | undefined,
    envVar: string
): string | undefined {
    if (inspected?.workspaceValue !== undefined) {
        const trimmed = inspected.workspaceValue.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
        if (inspected.workspaceValue === '') {
            return undefined;
        }
    }

    if (inspected?.globalValue !== undefined) {
        const trimmed = inspected.globalValue.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
        if (inspected.globalValue === '') {
            return undefined;
        }
    }

    const envRaw = process.env[envVar];
    if (envRaw !== undefined && envRaw.trim() !== '') {
        return envRaw.trim();
    }

    return undefined;
}

function parsePositiveInt(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
        return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number.parseInt(value, 10);
        if (Number.isInteger(parsed) && parsed > 0) {
            return parsed;
        }
    }
    return undefined;
}
