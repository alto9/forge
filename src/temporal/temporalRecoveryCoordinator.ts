import type * as vscode from 'vscode';
import { getRegisteredStoredApiKeyReader } from './externalCredentials';
import { resolveExternalApiKey, resolveExternalSettings } from './externalSettings';
import { resolveManagedLocalSettings } from './managedLocalSettings';
import { resolveTemporalMode } from './temporalSettings';
import {
    buildExternalRecoveryConnectionOptions,
    createTemporalRecoveryClient,
    markNonTerminalIndexEntriesUnreachable,
    runRecoveryScan,
    type TemporalRecoveryClient,
} from './temporalRecoveryScan';
import { WorkflowRunIndexStore } from './workflowRunIndex';
import { notifyWorkflowRunIndexChanged } from './workflowRunRecoveryService';

export interface CombinedReadinessSnapshot {
    temporalReady: boolean;
    workerReady: boolean;
}

export interface TemporalRecoveryCoordinatorConfig {
    windowId: string;
    globalStoragePath: string;
    log: (line: string) => void;
    indexStore?: WorkflowRunIndexStore;
    resolveMode?: () => ReturnType<typeof resolveTemporalMode>;
    createRecoveryClient?: () => Promise<TemporalRecoveryClient>;
}

export interface TemporalRecoveryCoordinator {
    onReadinessChanged(snapshot: CombinedReadinessSnapshot): void;
}

let recoveryScanCompletedThisSession = false;
let recoveryScanInFlight: Promise<void> | undefined;

export function resetRecoveryScanSessionForTests(): void {
    recoveryScanCompletedThisSession = false;
    recoveryScanInFlight = undefined;
}

export function hasRecoveryScanCompletedThisSession(): boolean {
    return recoveryScanCompletedThisSession;
}

function isCombinedReadinessSatisfied(snapshot: CombinedReadinessSnapshot): boolean {
    return snapshot.temporalReady && snapshot.workerReady;
}

async function defaultCreateRecoveryClient(
    config: TemporalRecoveryCoordinatorConfig
): Promise<TemporalRecoveryClient> {
    const mode = (config.resolveMode ?? resolveTemporalMode)();

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
        globalStoragePath: config.globalStoragePath,
        windowId: config.windowId,
    });

    return createTemporalRecoveryClient({
        mode,
        namespace: settings.namespace,
        grpcPort: settings.grpcPort,
    });
}

export function registerTemporalRecoveryCoordinator(
    _context: vscode.ExtensionContext,
    config: TemporalRecoveryCoordinatorConfig
): TemporalRecoveryCoordinator {
    const indexStore =
        config.indexStore ?? new WorkflowRunIndexStore(config.globalStoragePath, config.windowId);
    const createClient = config.createRecoveryClient ?? (() => defaultCreateRecoveryClient(config));

    const onReadinessChanged = (snapshot: CombinedReadinessSnapshot): void => {
        if (!isCombinedReadinessSatisfied(snapshot)) {
            if (recoveryScanInFlight) {
                return;
            }
            markNonTerminalIndexEntriesUnreachable(indexStore, {
                windowId: config.windowId,
                log: config.log,
            });
            return;
        }

        if (recoveryScanCompletedThisSession || recoveryScanInFlight) {
            return;
        }

        recoveryScanInFlight = runRecoveryScan({
            windowId: config.windowId,
            globalStoragePath: config.globalStoragePath,
            indexStore,
            log: config.log,
            createClient,
        })
            .then(() => {
                recoveryScanCompletedThisSession = true;
                notifyWorkflowRunIndexChanged();
            })
            .catch((error) => {
                const message = error instanceof Error ? error.message : String(error);
                config.log(`[forge.temporal.recovery] windowId=${config.windowId} recoveryState=refresh_failed errorCode=SCAN_FAILED message=${message}`);
            })
            .finally(() => {
                recoveryScanInFlight = undefined;
            });
    };

    return { onReadinessChanged };
}
