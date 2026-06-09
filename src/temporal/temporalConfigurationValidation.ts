import type { Diagnostic } from '../workflows/types';
import * as vscode from 'vscode';
import {
    EXTERNAL_API_KEY_SECRET_KEY,
    resolveExternalApiKey,
    resolveExternalSettings,
    type ResolvedExternalSettings,
} from './externalSettings';
import { isSettingExplicitlyConfigured } from './settingPrecedence';
import { resolveTemporalMode } from './temporalSettings';

export const TEMPORAL_CONFIGURATION_VALIDATOR_ID = 'forge.temporal.configuration';

const MANAGED_LOCAL_SETTING_KEYS = [
    'grpcPort',
    'uiPort',
    'persistencePath',
    'namespace',
    'taskQueue',
] as const;

const EXTERNAL_SETTING_KEYS = [
    'address',
    'namespace',
    'taskQueue',
    'auth.mode',
    'tls.enabled',
    'tls.serverName',
] as const;

export interface TemporalConfigurationValidationOptions {
    resolveMode?: () => ReturnType<typeof resolveTemporalMode>;
    resolveSettings?: () => ResolvedExternalSettings;
    getStoredApiKey?: () => Promise<string | undefined>;
}

function configurationDiagnostic(
    path: string,
    message: string,
    severity: Diagnostic['severity'] = 'error'
): Diagnostic {
    return {
        code: 'forge.temporal.configuration_invalid',
        severity,
        path,
        message,
        validator_id: TEMPORAL_CONFIGURATION_VALIDATOR_ID,
    };
}

export function parseAddressHost(address: string): string | undefined {
    const trimmed = address.trim();
    if (trimmed.length === 0) {
        return undefined;
    }

    if (trimmed.startsWith('[')) {
        const closingBracket = trimmed.indexOf(']');
        if (closingBracket > 1) {
            return trimmed.slice(1, closingBracket).toLowerCase();
        }
        return undefined;
    }

    const lastColon = trimmed.lastIndexOf(':');
    if (lastColon <= 0) {
        return trimmed.toLowerCase();
    }

    return trimmed.slice(0, lastColon).toLowerCase();
}

export function isLoopbackHost(host: string | undefined): boolean {
    if (!host) {
        return false;
    }

    const normalized = host.toLowerCase();
    if (normalized === 'localhost') {
        return true;
    }
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') {
        return true;
    }
    if (normalized.startsWith('127.')) {
        return true;
    }

    return false;
}

function hasPopulatedSettings(
    section: 'forge.temporal.managedLocal' | 'forge.temporal.external',
    keys: readonly string[]
): boolean {
    const config = vscode.workspace.getConfiguration(section);
    if (typeof config.inspect !== 'function') {
        return false;
    }

    return keys.some((key) => isSettingExplicitlyConfigured(config.inspect(key)));
}

function hasPopulatedManagedLocalSettings(): boolean {
    return hasPopulatedSettings('forge.temporal.managedLocal', MANAGED_LOCAL_SETTING_KEYS);
}

function hasPopulatedExternalSettings(): boolean {
    return hasPopulatedSettings('forge.temporal.external', EXTERNAL_SETTING_KEYS);
}

function inactiveFamilyInfoDiagnostics(mode: ReturnType<typeof resolveTemporalMode>): Diagnostic[] {
    if (mode === 'external' && hasPopulatedManagedLocalSettings()) {
        return [
            configurationDiagnostic(
                'forge.temporal.managedLocal',
                'Managed-local settings have no effect while forge.temporal.mode is external.',
                'warning'
            ),
        ];
    }

    if (mode === 'managedLocal' && hasPopulatedExternalSettings()) {
        return [
            configurationDiagnostic(
                'forge.temporal.external',
                'External settings have no effect while forge.temporal.mode is managedLocal.',
                'warning'
            ),
        ];
    }

    return [];
}

function validateExternalSettings(
    settings: ResolvedExternalSettings,
    apiKey: string | undefined
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    if (!settings.address) {
        diagnostics.push(
            configurationDiagnostic(
                'forge.temporal.external.address',
                'External Temporal address is required when forge.temporal.mode is external.'
            )
        );
    }

    if (!settings.namespace) {
        diagnostics.push(
            configurationDiagnostic(
                'forge.temporal.external.namespace',
                'External Temporal namespace is required when forge.temporal.mode is external.'
            )
        );
    }

    if (settings.authMode === 'apiKey' && !apiKey) {
        diagnostics.push(
            configurationDiagnostic(
                EXTERNAL_API_KEY_SECRET_KEY,
                'API key not configured. Run Forge: Set Temporal API Key or set FORGE_TEMPORAL_EXTERNAL_API_KEY.'
            )
        );
    }

    if (settings.authMode === 'insecure') {
        const host = settings.address ? parseAddressHost(settings.address) : undefined;
        if (!isLoopbackHost(host)) {
            diagnostics.push(
                configurationDiagnostic(
                    'forge.temporal.external.address',
                    'Insecure mode is allowed only for localhost loopback hosts.'
                )
            );
        }
    }

    if (!settings.tlsEnabled && settings.authMode !== 'insecure') {
        diagnostics.push(
            configurationDiagnostic(
                'forge.temporal.external.tls.enabled',
                'TLS is required for this auth mode. Set forge.temporal.external.tls.enabled to true or use auth.mode insecure on loopback only.'
            )
        );
    }

    return diagnostics;
}

export async function validateTemporalConfiguration(
    options: TemporalConfigurationValidationOptions = {}
): Promise<Diagnostic[]> {
    const resolveMode = options.resolveMode ?? resolveTemporalMode;
    const mode = resolveMode();
    const infoDiagnostics = inactiveFamilyInfoDiagnostics(mode);

    if (mode !== 'external') {
        return infoDiagnostics;
    }

    const settings = options.resolveSettings?.() ?? resolveExternalSettings();
    const apiKey = await resolveExternalApiKey(options.getStoredApiKey);
    const errorDiagnostics = validateExternalSettings(settings, apiKey);

    return [...infoDiagnostics, ...errorDiagnostics];
}

export function getTemporalConfigurationErrors(
    diagnostics: Diagnostic[]
): Diagnostic[] {
    return diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
}
