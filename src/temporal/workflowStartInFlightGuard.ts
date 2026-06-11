import type { WorkflowRunStartInput } from '../workflows/types';

const inFlightKeys = new Set<string>();

export function buildWorkflowStartInFlightKey(
    workflowId: string,
    repositoryRoot: string,
    runInputs: WorkflowRunStartInput
): string {
    const sortedPairs = Object.keys(runInputs)
        .sort()
        .map((key) => `${key}=${runInputs[key]}`)
        .join('&');

    return `${workflowId}::${repositoryRoot}::${sortedPairs}`;
}

export function tryAcquireWorkflowStartInFlight(key: string): boolean {
    if (inFlightKeys.has(key)) {
        return false;
    }

    inFlightKeys.add(key);
    return true;
}

export function releaseWorkflowStartInFlight(key: string): void {
    inFlightKeys.delete(key);
}

export function resetWorkflowStartInFlightGuardForTests(): void {
    inFlightKeys.clear();
}
