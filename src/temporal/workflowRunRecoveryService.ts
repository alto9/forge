import * as vscode from 'vscode';
import { getRegisteredStoredApiKeyReader } from './externalCredentials';
import { resolveExternalApiKey, resolveExternalSettings } from './externalSettings';
import { resolveManagedLocalSettings } from './managedLocalSettings';
import { resolveTemporalMode } from './temporalSettings';
import {
    buildExternalRecoveryConnectionOptions,
    createTemporalRecoveryClient,
    runManualRecoveryRefresh,
    type TemporalRecoveryClient,
} from './temporalRecoveryScan';
import { WorkflowRunIndexStore } from './workflowRunIndex';

export interface WorkflowRunRecoveryContext {
    windowId: string;
    globalStoragePath: string;
    log: (line: string) => void;
    indexStore: WorkflowRunIndexStore;
    createRecoveryClient: () => Promise<TemporalRecoveryClient>;
    isReady: () => boolean;
}

let recoveryContext: WorkflowRunRecoveryContext | undefined;
const refreshListeners = new Set<() => void>();

export function registerWorkflowRunRecoveryContext(context: WorkflowRunRecoveryContext): void {
    recoveryContext = context;
}

export function getWorkflowRunRecoveryContext(): WorkflowRunRecoveryContext | undefined {
    return recoveryContext;
}

export function onWorkflowRunIndexChanged(listener: () => void): () => void {
    refreshListeners.add(listener);
    return () => {
        refreshListeners.delete(listener);
    };
}

export function notifyWorkflowRunIndexChanged(): void {
    for (const listener of refreshListeners) {
        listener();
    }
}

export async function createDefaultRecoveryClient(
    globalStoragePath: string,
    windowId: string
): Promise<TemporalRecoveryClient> {
    const mode = resolveTemporalMode();

    if (mode === 'external') {
        const settings = resolveExternalSettings();
        const apiKey = await resolveExternalApiKey(getRegisteredStoredApiKeyReader());
        return createTemporalRecoveryClient({
            mode,
            namespace: settings.namespace ?? 'default',
            externalConnectionOptions: buildExternalRecoveryConnectionOptions(settings, apiKey),
        });
    }

    const settings = resolveManagedLocalSettings({
        globalStoragePath,
        windowId,
    });

    return createTemporalRecoveryClient({
        mode,
        namespace: settings.namespace,
        grpcPort: settings.grpcPort,
    });
}

export function createWorkflowRunRecoveryContext(
    extensionContext: vscode.ExtensionContext,
    input: {
        log: (line: string) => void;
        isReady: () => boolean;
    }
): WorkflowRunRecoveryContext {
    const windowId = vscode.env.sessionId;
    const globalStoragePath = extensionContext.globalStorageUri.fsPath;
    const indexStore = new WorkflowRunIndexStore(globalStoragePath, windowId);

    return {
        windowId,
        globalStoragePath,
        log: input.log,
        indexStore,
        isReady: input.isReady,
        createRecoveryClient: () => createDefaultRecoveryClient(globalStoragePath, windowId),
    };
}

export async function refreshWorkflowRunsManually(): Promise<void> {
    const context = recoveryContext;
    if (!context) {
        throw new Error('Workflow run recovery is not initialized.');
    }

    if (!context.isReady()) {
        throw new Error('Temporal and worker must be ready before refreshing workflow runs.');
    }

    context.indexStore.reload();
    await runManualRecoveryRefresh({
        windowId: context.windowId,
        globalStoragePath: context.globalStoragePath,
        indexStore: context.indexStore,
        log: context.log,
        createClient: context.createRecoveryClient,
    });
    notifyWorkflowRunIndexChanged();
}
