import type { StartFailureRemediation } from './types';

export interface ClassifiedStartFailure {
    remediation: StartFailureRemediation;
    message: string;
}

const PORT_PATTERNS = [
    /EADDRINUSE/i,
    /address already in use/i,
    /bind:.*in use/i,
    /port.*already/i,
];

const PERMISSION_PATTERNS = [
    /EACCES/i,
    /permission denied/i,
    /EPERM/i,
];

const ASSET_PATTERNS = [
    /ENOENT/i,
    /not found/i,
    /failed to download/i,
    /cannot find module/i,
    /no such file/i,
];

export function classifyStartFailure(input: {
    spawnError?: Error;
    exitCode?: number | null;
    stderr?: string;
}): ClassifiedStartFailure {
    const combined = [input.spawnError?.message, input.stderr].filter(Boolean).join('\n');

    if (input.spawnError?.message && /EACCES|EPERM/i.test(input.spawnError.message)) {
        return {
            remediation: 'permission',
            message: 'Could not start the managed-local Temporal dev server due to a permission error.',
        };
    }

    if (input.spawnError?.message && /ENOENT/i.test(input.spawnError.message)) {
        return {
            remediation: 'asset',
            message: 'Could not start the managed-local Temporal dev server because a required asset is missing.',
        };
    }

    for (const pattern of PORT_PATTERNS) {
        if (pattern.test(combined)) {
            return {
                remediation: 'port',
                message: `Could not start the managed-local Temporal dev server because gRPC port is unavailable.`,
            };
        }
    }

    for (const pattern of PERMISSION_PATTERNS) {
        if (pattern.test(combined)) {
            return {
                remediation: 'permission',
                message: 'Could not start the managed-local Temporal dev server due to a permission error.',
            };
        }
    }

    for (const pattern of ASSET_PATTERNS) {
        if (pattern.test(combined)) {
            return {
                remediation: 'asset',
                message: 'Could not start the managed-local Temporal dev server because a required asset is missing.',
            };
        }
    }

    if (input.exitCode === 126 || input.exitCode === 127) {
        return {
            remediation: 'asset',
            message: 'Could not start the managed-local Temporal dev server because the launch entry is not executable.',
        };
    }

    return {
        remediation: 'asset',
        message: 'Could not start the managed-local Temporal dev server.',
    };
}
