import { Connection } from '@temporalio/client';
import { buildExternalConnectionOptions } from './externalConnection';
import type { ResolvedExternalSettings } from './externalSettings';

export async function probeManagedLocalTemporalHealth(options: {
    address: string;
    namespace: string;
}): Promise<boolean> {
    let connection: Connection | undefined;
    try {
        connection = await Connection.connect({
            address: options.address,
        });
        await connection.workflowService.getSystemInfo({});
        return true;
    } catch {
        return false;
    } finally {
        await connection?.close().catch(() => undefined);
    }
}

export async function probeExternalTemporalPreflight(options: {
    settings: ResolvedExternalSettings;
    apiKey: string | undefined;
}): Promise<void> {
    const { settings, apiKey } = options;
    if (!settings.address || !settings.namespace) {
        throw new Error('External Temporal address and namespace are required.');
    }

    const connectionOptions = buildExternalConnectionOptions(settings, apiKey);
    let connection: Connection | undefined;
    try {
        connection = await Connection.connect(connectionOptions);
        await connection.workflowService.getSystemInfo({});
        await connection.workflowService.describeNamespace({
            namespace: settings.namespace,
        });
        await connection.workflowService.describeTaskQueue({
            namespace: settings.namespace,
            taskQueue: { name: settings.taskQueue },
        });
    } finally {
        await connection?.close().catch(() => undefined);
    }
}

export async function probeExternalTemporalHealth(options: {
    settings: ResolvedExternalSettings;
    apiKey: string | undefined;
}): Promise<boolean> {
    try {
        await probeExternalTemporalPreflight(options);
        return true;
    } catch {
        return false;
    }
}
