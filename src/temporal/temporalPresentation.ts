import path from 'path';
import type {
    ExternalConnectFailureRemediation,
    ExternalTemporalHealthState,
    ManagedLocalHealthState,
    StartFailureRemediation,
    WorkerHealthState,
    WorkerStartFailureRemediation,
} from './types';

export interface ManagedLocalPresentationContext {
    windowId: string;
    grpcPort: number;
    namespace: string;
    persistencePathDisplay: string;
    exitCode?: number;
}

export function formatPersistencePathForDisplay(
    persistencePath: string,
    userConfigured: boolean
): string {
    if (!userConfigured) {
        return persistencePath;
    }
    return path.basename(persistencePath);
}

export function formatManagedLocalStatusBarLabel(
    state: ManagedLocalHealthState,
    workerState?: WorkerHealthState
): string {
    const temporalLabel = formatTemporalConnectionSegment(state);
    if (workerState === undefined) {
        return temporalLabel;
    }
    return `${temporalLabel} · ${formatWorkerStatusBarSegment(workerState)}`;
}

function formatTemporalConnectionSegment(state: ManagedLocalHealthState): string {
    switch (state) {
        case 'idle':
            return '$(pulse) Temporal: idle';
        case 'starting':
            return '$(pulse) Temporal: starting…';
        case 'ready':
            return '$(pulse) Temporal: ready';
        case 'unhealthy':
            return '$(pulse) Temporal: unhealthy';
        case 'start_failed':
            return '$(pulse) Temporal: failed';
        case 'stopped':
            return '$(pulse) Temporal: stopped';
    }
}

export function formatWorkerStatusBarSegment(state: WorkerHealthState): string {
    switch (state) {
        case 'idle':
            return 'Worker: idle';
        case 'starting':
            return 'Worker: starting…';
        case 'ready':
            return 'Worker: ready';
        case 'unhealthy':
            return 'Worker: unhealthy';
        case 'start_failed':
            return 'Worker: failed';
        case 'restarting':
            return 'Worker: restarting…';
        case 'stopped':
            return 'Worker: stopped';
    }
}

export function formatExternalStatusBarLabel(
    state: ExternalTemporalHealthState,
    workerState?: WorkerHealthState
): string {
    const temporalLabel = formatExternalConnectionSegment(state);
    if (workerState === undefined) {
        return temporalLabel;
    }
    return `${temporalLabel} · ${formatWorkerStatusBarSegment(workerState)}`;
}

function formatExternalConnectionSegment(state: ExternalTemporalHealthState): string {
    switch (state) {
        case 'idle':
            return '$(pulse) Temporal: idle';
        case 'connecting':
            return '$(pulse) Temporal: connecting…';
        case 'ready':
            return '$(pulse) Temporal: ready';
        case 'unhealthy':
            return '$(pulse) Temporal: unhealthy';
        case 'connect_failed':
            return '$(pulse) Temporal: failed';
        case 'disconnected':
            return '$(pulse) Temporal: disconnected';
    }
}

export function formatManagedLocalStatusBarTooltip(context: {
    grpcPort: number;
    namespace: string;
    persistencePathDisplay: string;
}): string {
    return [
        `gRPC port: ${context.grpcPort}`,
        `namespace: ${context.namespace}`,
        `persistence: ${context.persistencePathDisplay}`,
    ].join('\n');
}

export function formatReadyNotification(): string {
    return 'Forge Temporal ready — managed local dev server is accepting workflow runs.';
}

export function formatStartFailedNotification(
    remediation: StartFailureRemediation,
    grpcPort: number,
    persistencePathDisplay: string
): string {
    switch (remediation) {
        case 'port':
            return `Forge could not start Temporal — port ${grpcPort} is in use. Change \`forge.temporal.managedLocal.grpcPort\` or stop the conflicting process.`;
        case 'asset':
            return 'Forge could not start Temporal — dev server assets are missing from the extension package. Reinstall Forge Studio.';
        case 'permission':
            return `Forge could not start Temporal — cannot write persistence data to ${persistencePathDisplay}. Check permissions or set \`forge.temporal.managedLocal.persistencePath\`.`;
    }
}

export function formatWorkflowBlockedNotification(): string {
    return 'Workflow runs are blocked until Temporal is ready. See Forge Temporal output for details.';
}

export function formatWorkflowRunStartDefinitionBlockedCatalogMessage(): string {
    return 'Fix validation errors before starting a run.';
}

export function formatWorkflowRunStartInputBlockedCatalogMessage(): string {
    return 'Complete required inputs before starting this workflow.';
}

export function formatWorkflowRunStartTemporalBlockedCatalogMessage(): string {
    return formatWorkflowBlockedNotification();
}

export function formatWorkflowRunStartWorkerBlockedCatalogMessage(): string {
    return formatWorkerBlockedNotification();
}

export function formatWorkflowRunStartInFlightCatalogMessage(): string {
    return 'Starting workflow run…';
}

export function formatWorkflowRunStartFailedCatalogMessage(reason: string): string {
    const normalizedReason = reason.replace(/\.\s*$/, '').trim() || 'Temporal start failed';
    return `Could not start workflow run — ${normalizedReason}.`;
}

export function formatWorkflowRunStartFailedNotification(reason: string): string {
    return formatWorkflowRunStartFailedCatalogMessage(reason);
}

export function formatStateTransitionLogLine(
    state: ManagedLocalHealthState,
    context: ManagedLocalPresentationContext
): string {
    const exitCodePart =
        context.exitCode !== undefined ? ` exitCode=${context.exitCode}` : '';
    return `[forge.temporal.local] state=${state} windowId=${context.windowId} grpcPort=${context.grpcPort} persistencePath=${context.persistencePathDisplay}${exitCodePart}`;
}

export interface ExternalPresentationContext {
    windowId: string;
    address: string;
    namespace: string;
    authMode: string;
    tlsEnabled: boolean;
    probeErrorCode?: string;
}

export function formatExternalStatusBarTooltip(context: {
    address: string;
    namespace: string;
    authMode: string;
    tlsEnabled: boolean;
}): string {
    return [
        `address: ${context.address}`,
        `namespace: ${context.namespace}`,
        `authMode: ${context.authMode}`,
        `tlsEnabled: ${context.tlsEnabled}`,
    ].join('\n');
}

export function formatExternalReadyNotification(namespace: string, address: string): string {
    return `Forge Temporal ready — connected to ${namespace} at ${address}.`;
}

export function formatExternalConnectFailedNotification(
    remediation: ExternalConnectFailureRemediation,
    address: string
): string {
    switch (remediation) {
        case 'auth':
            return 'Forge could not connect to Temporal — authentication failed. Run **Forge: Set Temporal API Key** or check `forge.temporal.external.auth.mode`.';
        case 'tls':
            return `Forge could not connect to Temporal — TLS handshake failed at ${address}. Verify \`forge.temporal.external.tls.enabled\` and cluster certificates.`;
        case 'address':
            return `Forge could not connect to Temporal — ${address} is unreachable. Check \`forge.temporal.external.address\` and network access.`;
        case 'config':
            return 'Forge Temporal configuration is incomplete — external settings are required for external mode. See Forge Temporal output.';
    }
}

export function formatInsecureModeWarning(address: string): string {
    return `Forge Temporal is using insecure (plaintext) gRPC to ${address}. Use only for local development.`;
}

export function formatExternalStateTransitionLogLine(
    state: ExternalTemporalHealthState,
    context: ExternalPresentationContext
): string {
    const probeErrorPart =
        context.probeErrorCode !== undefined ? ` probeErrorCode=${context.probeErrorCode}` : '';
    return `[forge.temporal.external] state=${state} windowId=${context.windowId} address=${context.address} namespace=${context.namespace} authMode=${context.authMode} tlsEnabled=${context.tlsEnabled}${probeErrorPart}`;
}

export interface WorkerPresentationContext {
    windowId: string;
    taskQueue: string;
    namespace: string;
    mode: string;
    extensionVersion: string;
    pid?: number;
    exitCode?: number;
}

export function formatWorkerReadyNotification(): string {
    return 'Forge workflow worker is ready.';
}

export function formatWorkerStartFailedNotification(
    remediation: WorkerStartFailureRemediation
): string {
    switch (remediation) {
        case 'asset':
            return 'Forge could not start the workflow worker — worker assets are missing from the extension package. Reinstall Forge Studio.';
        case 'permission':
            return 'Forge could not start the workflow worker — cannot write worker state. Check extension global storage permissions.';
        case 'port':
            return 'Forge could not start the workflow worker — Temporal connection settings are unavailable.';
        case 'crash':
            return 'Forge workflow worker stopped unexpectedly. See Forge Temporal output. Workflow runs are blocked until the worker is healthy.';
    }
}

export function formatWorkerBlockedNotification(): string {
    return 'Workflow runs are blocked until the Forge worker is ready. See Forge Temporal output for details.';
}

export function formatWorkerUpgradeRestartLogLine(
    context: Pick<WorkerPresentationContext, 'windowId' | 'extensionVersion'>
): string {
    return `[forge.temporal.worker] Forge updated the workflow worker for this window. windowId=${context.windowId} extensionVersion=${context.extensionVersion}`;
}

export function formatWorkerStateTransitionLogLine(
    state: WorkerHealthState,
    context: WorkerPresentationContext
): string {
    const pidPart = context.pid !== undefined ? ` pid=${context.pid}` : '';
    const exitCodePart =
        context.exitCode !== undefined ? ` exitCode=${context.exitCode}` : '';
    return `[forge.temporal.worker] state=${state} windowId=${context.windowId} taskQueue=${context.taskQueue} namespace=${context.namespace} mode=${context.mode} extensionVersion=${context.extensionVersion}${pidPart}${exitCodePart}`;
}

export function formatRecoveryBadgeLabel(
    recoveryState: import('./workflowRunIndex').RecoveryState
): string {
    switch (recoveryState) {
        case 'synced':
            return 'Synced';
        case 'recovery_pending':
            return 'Recovering…';
        case 'refresh_failed':
            return 'Refresh failed';
        case 'orphaned':
            return 'Stale';
        case 'unreachable':
            return 'Waiting for Temporal…';
    }
}

export function formatCancelConfirmMessage(workflowId: string, runId: string): string {
    return `Cancel workflow run ${workflowId}/${runId}? This terminates execution in Temporal.`;
}

export function formatRunActionsBlockedMessage(): string {
    return 'Run actions are unavailable until recovery finishes. See Forge Temporal output.';
}

export function formatHumanInputBlockedMessage(): string {
    return 'Submit answers after the run finishes recovering.';
}

export function formatOrphanedRunMessage(): string {
    return 'This run is no longer in Temporal. You can dismiss it from the run list.';
}

export function formatRefreshFailedRunMessage(
    workflowId: string,
    runId: string,
    reason: string
): string {
    return `Could not refresh run ${workflowId}/${runId} — ${reason}. Try **Forge: Refresh workflow runs**.`;
}

export function formatNeedsInputBadgeLabel(): string {
    return 'Needs input';
}
