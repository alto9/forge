import * as vscode from 'vscode';
import { TemporalLocalSupervisor } from './TemporalLocalSupervisor';
import {
    formatManagedLocalStatusBarLabel,
    formatManagedLocalStatusBarTooltip,
    formatReadyNotification,
    formatStartFailedNotification,
    formatStateTransitionLogLine,
    formatWorkflowBlockedNotification,
} from './temporalPresentation';
import type { ManagedLocalHealthState, ManagedLocalSupervisorConfig } from './types';

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
