import * as vscode from 'vscode';
import { ExternalTemporalSupervisor } from './ExternalTemporalSupervisor';
import { TemporalLocalSupervisor } from './TemporalLocalSupervisor';
import {
    formatExternalConnectFailedNotification,
    formatExternalReadyNotification,
    formatExternalStateTransitionLogLine,
    formatExternalStatusBarLabel,
    formatExternalStatusBarTooltip,
    formatInsecureModeWarning,
    formatManagedLocalStatusBarLabel,
    formatManagedLocalStatusBarTooltip,
    formatReadyNotification,
    formatStartFailedNotification,
    formatStateTransitionLogLine,
    formatWorkflowBlockedNotification,
} from './temporalPresentation';
import type { ResolvedExternalSettings } from './externalSettings';
import type {
    ExternalTemporalHealthState,
    ExternalTemporalSupervisorConfig,
    ManagedLocalHealthState,
    ManagedLocalSupervisorConfig,
} from './types';

export const TEMPORAL_OUTPUT_CHANNEL_NAME = 'Forge Temporal';

let statusBarItem: vscode.StatusBarItem | undefined;
let presentationConfig: ManagedLocalSupervisorConfig | undefined;
let persistencePathDisplay: string | undefined;

export function createTemporalOutputChannel(
    context: vscode.ExtensionContext
): vscode.OutputChannel {
    const channel = vscode.window.createOutputChannel(TEMPORAL_OUTPUT_CHANNEL_NAME);
    context.subscriptions.push(channel);
    return channel;
}

export function notifyWorkflowBlockedByTemporal(): void {
    void vscode.window.showWarningMessage(formatWorkflowBlockedNotification());
}

export function registerManagedLocalTemporalHealthSurfaces(
    context: vscode.ExtensionContext,
    supervisor: TemporalLocalSupervisor,
    config: ManagedLocalSupervisorConfig,
    persistencePathForDisplay: string,
    outputChannel: vscode.OutputChannel
): void {
    presentationConfig = config;
    persistencePathDisplay = persistencePathForDisplay;

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);

    const applyState = (state: ManagedLocalHealthState) => {
        updateStatusBar(state);
        logStateTransition(state, supervisor, outputChannel);
        notifyForState(state, supervisor);
    };

    applyState(supervisor.getHealthState());

    const unsubscribe = supervisor.onStateChange((state) => {
        applyState(state);
    });
    context.subscriptions.push({ dispose: unsubscribe });
}

function updateStatusBar(state: ManagedLocalHealthState): void {
    if (!statusBarItem || !presentationConfig || !persistencePathDisplay) {
        return;
    }

    statusBarItem.text = formatManagedLocalStatusBarLabel(state);
    statusBarItem.tooltip = formatManagedLocalStatusBarTooltip({
        grpcPort: presentationConfig.grpcPort,
        namespace: presentationConfig.namespace,
        persistencePathDisplay,
    });
    statusBarItem.show();
}

function logStateTransition(
    state: ManagedLocalHealthState,
    supervisor: TemporalLocalSupervisor,
    outputChannel: vscode.OutputChannel
): void {
    if (!presentationConfig || !persistencePathDisplay) {
        return;
    }

    const startError = supervisor.getStartError();
    outputChannel.appendLine(
        formatStateTransitionLogLine(state, {
            windowId: presentationConfig.windowId,
            grpcPort: presentationConfig.grpcPort,
            namespace: presentationConfig.namespace,
            persistencePathDisplay,
            exitCode: startError?.exitCode,
        })
    );
}

function notifyForState(
    state: ManagedLocalHealthState,
    supervisor: TemporalLocalSupervisor
): void {
    if (!presentationConfig || !persistencePathDisplay) {
        return;
    }

    if (state === 'ready') {
        void vscode.window.showInformationMessage(formatReadyNotification());
        return;
    }

    if (state === 'start_failed') {
        const startError = supervisor.getStartError();
        if (!startError) {
            return;
        }
        void vscode.window.showErrorMessage(
            formatStartFailedNotification(
                startError.remediation,
                presentationConfig.grpcPort,
                persistencePathDisplay
            )
        );
    }
}

export function registerExternalTemporalHealthSurfaces(
    context: vscode.ExtensionContext,
    supervisor: ExternalTemporalSupervisor,
    config: ExternalTemporalSupervisorConfig,
    resolveSettings: () => ResolvedExternalSettings,
    outputChannel: vscode.OutputChannel
): void {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);

    const applyState = (state: ExternalTemporalHealthState) => {
        const settings = resolveSettings();
        const address = settings.address ?? 'unknown';
        const namespace = settings.namespace ?? 'unknown';

        statusBarItem.text = formatExternalStatusBarLabel(state);
        statusBarItem.tooltip = formatExternalStatusBarTooltip({
            address,
            namespace,
            authMode: settings.authMode,
            tlsEnabled: settings.tlsEnabled,
        });
        statusBarItem.show();

        const connectError = supervisor.getConnectError();
        outputChannel.appendLine(
            formatExternalStateTransitionLogLine(state, {
                windowId: config.windowId,
                address,
                namespace,
                authMode: settings.authMode,
                tlsEnabled: settings.tlsEnabled,
                probeErrorCode: connectError?.probeErrorCode,
            })
        );

        if (state === 'ready') {
            void vscode.window.showInformationMessage(
                formatExternalReadyNotification(namespace, address)
            );
            return;
        }

        if (state === 'connect_failed') {
            if (!connectError) {
                return;
            }
            void vscode.window.showErrorMessage(
                formatExternalConnectFailedNotification(connectError.remediation, address)
            );
            return;
        }

        if (state === 'connecting' && settings.authMode === 'insecure') {
            outputChannel.appendLine(
                `[forge.temporal.external] warning ${formatInsecureModeWarning(address)}`
            );
        }
    };

    applyState(supervisor.getHealthState());

    const unsubscribe = supervisor.onStateChange((state) => {
        applyState(state);
    });
    context.subscriptions.push({ dispose: unsubscribe });
}
