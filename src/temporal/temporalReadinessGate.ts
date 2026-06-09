import type { Diagnostic } from '../workflows/types';
import { ExternalReadinessBlockedError, ExternalTemporalSupervisor } from './ExternalTemporalSupervisor';
import { TemporalLocalSupervisor, TemporalReadinessBlockedError } from './TemporalLocalSupervisor';
import { notifyWorkflowBlockedByTemporal } from './temporalHealthSurfaces';
import {
    getExternalTemporalSupervisor,
    getTemporalLocalSupervisor,
} from './temporalWindowRegistry';
import {
    getTemporalConfigurationErrors,
    validateTemporalConfiguration,
    type TemporalConfigurationValidationOptions,
} from './temporalConfigurationValidation';
import { resolveTemporalMode } from './temporalSettings';

export const TEMPORAL_READINESS_VALIDATOR_ID = 'forge.temporal.readiness';

export class TemporalConfigurationInvalidError extends Error {
    readonly diagnostics: Diagnostic[];

    constructor(diagnostics: Diagnostic[]) {
        super('workflow run start blocked: Temporal configuration invalid');
        this.name = 'TemporalConfigurationInvalidError';
        this.diagnostics = diagnostics;
    }
}

export interface TemporalReadinessGateOptions extends TemporalConfigurationValidationOptions {
    getSupervisor?: () => TemporalLocalSupervisor | undefined;
    getExternalSupervisor?: () => ExternalTemporalSupervisor | undefined;
    resolveMode?: () => ReturnType<typeof resolveTemporalMode>;
}

function remediationMessage(remediation: string): string {
    switch (remediation) {
        case 'port':
            return 'Change forge.temporal.managedLocal.grpcPort or stop the conflicting process.';
        case 'permission':
            return 'Check permissions or set forge.temporal.managedLocal.persistencePath.';
        case 'asset':
            return 'Reinstall the Forge extension or run Forge: Initialize Cursor Agents.';
        default:
            return 'Fix the managed-local Temporal environment or switch forge.temporal.mode explicitly.';
    }
}

function externalConnectRemediationMessage(remediation: string): string {
    switch (remediation) {
        case 'auth':
            return 'Run Forge: Set Temporal API Key or check forge.temporal.external.auth.mode.';
        case 'tls':
            return 'Verify forge.temporal.external.tls.enabled and cluster certificates.';
        case 'address':
            return 'Check forge.temporal.external.address and network access.';
        default:
            return 'Fix external Temporal settings. See Forge Temporal output for details.';
    }
}

function externalConnectInvalidDiagnostic(
    message: string,
    remediation: string
): Diagnostic {
    return {
        code: 'forge.temporal.configuration_invalid',
        severity: 'error',
        path: 'forge.temporal.external',
        message: `${message} ${externalConnectRemediationMessage(remediation)}`,
        validator_id: TEMPORAL_READINESS_VALIDATOR_ID,
    };
}
function configurationInvalidDiagnostic(
    message: string,
    remediation: string
): Diagnostic {
    return {
        code: 'forge.temporal.configuration_invalid',
        severity: 'error',
        path: 'forge.temporal.managedLocal',
        message: `${message} ${remediationMessage(remediation)}`,
        validator_id: TEMPORAL_READINESS_VALIDATOR_ID,
    };
}

export async function gateTemporalReadiness(
    options: TemporalReadinessGateOptions = {}
): Promise<void> {
    const resolveMode = options.resolveMode ?? resolveTemporalMode;
    const mode = resolveMode();

    if (mode === 'external') {
        const diagnostics = await validateTemporalConfiguration(options);
        const errors = getTemporalConfigurationErrors(diagnostics);
        if (errors.length > 0) {
            throw new TemporalConfigurationInvalidError(errors);
        }

        const supervisor =
            options.getExternalSupervisor?.() ?? getExternalTemporalSupervisor();
        if (!supervisor) {
            throw new TemporalConfigurationInvalidError([
                {
                    code: 'forge.temporal.configuration_invalid',
                    severity: 'error',
                    path: 'forge.temporal.external',
                    message:
                        'External Temporal supervisor is not registered for this window. Reload the window and retry.',
                    validator_id: TEMPORAL_READINESS_VALIDATOR_ID,
                },
            ]);
        }

        try {
            await supervisor.ensureReady();
        } catch (error) {
            if (error instanceof ExternalReadinessBlockedError) {
                notifyWorkflowBlockedByTemporal();
                throw new TemporalConfigurationInvalidError([
                    externalConnectInvalidDiagnostic(error.message, error.remediation),
                ]);
            }
            throw error;
        }
        return;
    }

    await validateTemporalConfiguration(options);

    const supervisor = options.getSupervisor?.() ?? getTemporalLocalSupervisor();
    if (!supervisor) {
        throw new TemporalConfigurationInvalidError([
            {
                code: 'forge.temporal.configuration_invalid',
                severity: 'error',
                path: 'forge.temporal.managedLocal',
                message:
                    'Managed-local Temporal supervisor is not registered for this window. Reload the window and retry.',
                validator_id: TEMPORAL_READINESS_VALIDATOR_ID,
            },
        ]);
    }

    try {
        await supervisor.ensureReady();
    } catch (error) {
        if (error instanceof TemporalReadinessBlockedError) {
            notifyWorkflowBlockedByTemporal();
            throw new TemporalConfigurationInvalidError([
                configurationInvalidDiagnostic(error.message, error.remediation),
            ]);
        }
        throw error;
    }
}
