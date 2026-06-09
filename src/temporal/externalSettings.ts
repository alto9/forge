import * as vscode from 'vscode';
import {
    resolveBooleanSetting,
    resolveOptionalStringSetting,
    resolveStringSetting,
} from './settingPrecedence';

export type ExternalAuthMode = 'apiKey' | 'tlsServer' | 'insecure';

const DEFAULT_TASK_QUEUE = 'forge-workflows';
const DEFAULT_AUTH_MODE: ExternalAuthMode = 'apiKey';
const DEFAULT_TLS_ENABLED = true;

export const EXTERNAL_API_KEY_SECRET_KEY = 'forge.temporal.external.apiKey';

export interface ResolvedExternalSettings {
    address: string | undefined;
    namespace: string | undefined;
    taskQueue: string;
    authMode: ExternalAuthMode;
    tlsEnabled: boolean;
    tlsServerName: string;
}

export function resolveExternalAuthMode(raw: string): ExternalAuthMode {
    if (raw === 'tlsServer' || raw === 'insecure') {
        return raw;
    }
    return 'apiKey';
}

export function resolveExternalSettings(): ResolvedExternalSettings {
    const config = vscode.workspace.getConfiguration('forge.temporal.external');

    const address = resolveOptionalStringSetting(
        config.inspect<string>('address'),
        'FORGE_TEMPORAL_EXTERNAL_ADDRESS'
    );
    const namespace = resolveOptionalStringSetting(
        config.inspect<string>('namespace'),
        'FORGE_TEMPORAL_EXTERNAL_NAMESPACE'
    );
    const taskQueue = resolveStringSetting(
        config.inspect<string>('taskQueue'),
        'FORGE_TEMPORAL_EXTERNAL_TASK_QUEUE',
        DEFAULT_TASK_QUEUE
    );
    const authMode = resolveExternalAuthMode(
        resolveStringSetting(
            config.inspect<string>('auth.mode'),
            'FORGE_TEMPORAL_EXTERNAL_AUTH_MODE',
            DEFAULT_AUTH_MODE
        )
    );
    const tlsEnabled = resolveBooleanSetting(
        config.inspect<boolean>('tls.enabled'),
        'FORGE_TEMPORAL_EXTERNAL_TLS_ENABLED',
        DEFAULT_TLS_ENABLED
    );
    const tlsServerName = resolveStringSetting(
        config.inspect<string>('tls.serverName'),
        'FORGE_TEMPORAL_EXTERNAL_TLS_SERVER_NAME',
        ''
    );

    return {
        address,
        namespace,
        taskQueue,
        authMode,
        tlsEnabled,
        tlsServerName,
    };
}

export async function resolveExternalApiKey(
    getStoredApiKey?: () => Promise<string | undefined>
): Promise<string | undefined> {
    const envKey = process.env.FORGE_TEMPORAL_EXTERNAL_API_KEY?.trim();
    if (envKey) {
        return envKey;
    }

    if (getStoredApiKey) {
        const stored = await getStoredApiKey();
        if (stored?.trim()) {
            return stored.trim();
        }
    }

    return undefined;
}
