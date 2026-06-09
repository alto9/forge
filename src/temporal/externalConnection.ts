import type { ConnectionOptions } from '@temporalio/client';
import type { ResolvedExternalSettings } from './externalSettings';

export function buildExternalConnectionOptions(
    settings: ResolvedExternalSettings,
    apiKey: string | undefined
): ConnectionOptions {
    const options: ConnectionOptions = {};

    if (settings.address) {
        options.address = settings.address;
    }

    if (settings.authMode === 'insecure' || !settings.tlsEnabled) {
        options.tls = false;
    } else if (settings.tlsServerName) {
        options.tls = {
            serverNameOverride: settings.tlsServerName,
        };
    } else {
        options.tls = true;
    }

    if (settings.authMode === 'apiKey' && apiKey) {
        options.apiKey = apiKey;
    }

    return options;
}
