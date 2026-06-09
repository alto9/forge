import * as vscode from 'vscode';
import { ExternalTemporalSupervisor } from './ExternalTemporalSupervisor';
import { TemporalLocalSupervisor } from './TemporalLocalSupervisor';
import { TemporalWorkerSupervisor } from './TemporalWorkerSupervisor';
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
    formatWorkerBlockedNotification,
    formatWorkerReadyNotification,
    formatWorkerStartFailedNotification,
    formatWorkerStateTransitionLogLine,
    formatWorkflowBlockedNotification,
} from './temporalPresentation';
import type { ResolvedExternalSettings } from './externalSettings';
import type {
    ExternalTemporalHealthState,
    ExternalTemporalSupervisorConfig,
    ManagedLocalHealthState,
    ManagedLocalSupervisorConfig,
    TemporalWorkerSupervisorConfig,
    WorkerHealthState,
} from './types';

export const TEMPORAL_OUTPUT_CHANNEL_NAME = 'Forge Temporal';

let statusBarItem: vscode.StatusBarItem | undefined;
let presentationConfig: ManagedLocalSupervisorConfig | undefined;
let persistencePathDisplay: string | undefined;
let workerPresentationConfig: TemporalWorkerSupervisorConfig | undefined;
let managedLocalState: ManagedLocalHealthState = 'idle';
let externalState: ExternalTemporalHealthState = 'idle';
let workerState: WorkerHealthState = 'idle';
let workerReadyNotifiedThisSession = false;
let statusBarMode: 'managedLocal' | 'external' = 'managedLocal';

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

export function notifyWorkflowBlockedByWorker(): void {
    void vscode.window.showWarningMessage(formatWorkerBlockedNotification());
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
    statusBarMode = 'managedLocal';

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);

    const applyState = (state: ManagedLocalHealthState) => {
        managedLocalState = state;
        updateStatusBar();
        logManagedLocalStateTransition(state, supervisor, outputChannel);
        notifyManagedLocalForState(state, supervisor);
    };

    applyState(supervisor.getHealthState());

    const unsubscribe = supervisor.onStateChange((state) => {
        applyState(state);
    });
    context.subscriptions.push({ dispose: unsubscribe });
}

export function registerWorkerHealthSurfaces(
    context: vscode.ExtensionContext,
    supervisor: TemporalWorkerSupervisor,
    config: TemporalWorkerSupervisorConfig,
    outputChannel: vscode.OutputChannel
): void {
    workerPresentationConfig = config;

    const applyState = (state: WorkerHealthState) => {
        workerState = state;
        updateStatusBar();
        logWorkerStateTransition(state, supervisor, outputChannel);
        notifyWorkerForState(state, supervisor);
    };

    applyState(supervisor.getHealthState());

    const unsubscribe = supervisor.onStateChange((state) => {
        applyState(state);
    });
    context.subscriptions.push({ dispose: unsubscribe });
}

function updateStatusBar(): void {
    if (!statusBarItem) {
        return;
    }

    if (statusBarMode === 'managedLocal') {
        if (!presentationConfig || !persistencePathDisplay) {
            return;
        }
        statusBarItem.text = formatManagedLocalStatusBarLabel(managedLocalState, workerState);
        statusBarItem.tooltip = formatManagedLocalStatusBarTooltip({
            grpcPort: presentationConfig.grpcPort,
            namespace: presentationConfig.namespace,
            persistencePathDisplay,
        });
    } else {
        statusBarItem.text = formatExternalStatusBarLabel(externalState, workerState);
    }

    statusBarItem.show();
}

function logManagedLocalStateTransition(
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

function notifyManagedLocalForState(
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

function logWorkerStateTransition(
    state: WorkerHealthState,
    supervisor: TemporalWorkerSupervisor,
    outputChannel: vscode.OutputChannel
): void {
    if (!workerPresentationConfig) {
        return;
    }

    const startError = supervisor.getStartError();
    const pid = supervisor.getWorkerPid();
    outputChannel.appendLine(
        formatWorkerStateTransitionLogLine(state, {
            windowId: workerPresentationConfig.windowId,
            taskQueue: workerPresentationConfig.taskQueue,
            namespace: workerPresentationConfig.namespace,
            mode: workerPresentationConfig.mode,
            extensionVersion: workerPresentationConfig.extensionVersion,
            pid,
            exitCode: startError?.exitCode,
        })
    );
}

function notifyWorkerForState(
    state: WorkerHealthState,
    supervisor: TemporalWorkerSupervisor
): void {
    if (state === 'ready') {
        if (workerReadyNotifiedThisSession) {
            return;
        }
        workerReadyNotifiedThisSession = true;
        void vscode.window.showInformationMessage(formatWorkerReadyNotification());
        return;
    }

    if (state === 'start_failed') {
        const startError = supervisor.getStartError();
        if (!startError) {
            return;
        }
        void vscode.window.showErrorMessage(
            formatWorkerStartFailedNotification(startError.remediation)
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
    statusBarMode = 'external';

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);

    const applyState = (state: ExternalTemporalHealthState) => {
        externalState = state;
        updateStatusBar();

        const settings = resolveSettings();
        const address = settings.address ?? 'unknown';
        const namespace = settings.namespace ?? 'unknown';

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
