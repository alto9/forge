import { classifyStartFailure } from './failureClassification';
import type { StartFailureRemediation } from './types';

export interface ClassifiedWorkerStartFailure {
    remediation: StartFailureRemediation | 'crash';
    message: string;
}

export function classifyWorkerStartFailure(input: {
    spawnError?: Error;
    exitCode?: number | null;
    stderr?: string;
    repeatedCrash?: boolean;
}): ClassifiedWorkerStartFailure {
    if (input.repeatedCrash) {
        return {
            remediation: 'crash',
            message: 'Forge workflow worker stopped unexpectedly after repeated supervised restarts.',
        };
    }

    const classified = classifyStartFailure(input);
    return {
        remediation: classified.remediation,
        message: classified.message.replace(
            /managed-local Temporal dev server/gi,
            'Forge workflow worker'
        ),
    };
}
