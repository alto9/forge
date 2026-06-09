import path from 'path';
import type {
    ExternalConnectFailureRemediation,
    ExternalTemporalHealthState,
    ManagedLocalHealthState,
    StartFailureRemediation,
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

export function formatManagedLocalStatusBarLabel(state: ManagedLocalHealthState): string {
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

export function formatExternalStatusBarLabel(state: ExternalTemporalHealthState): string {
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
