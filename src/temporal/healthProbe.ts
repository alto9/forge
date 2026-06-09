import { Connection } from '@temporalio/client';
import { buildExternalConnectionOptions } from './externalConnection';
import type { ResolvedExternalSettings } from './externalSettings';
import type { TemporalMode } from './temporalSettings';

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

export async function probeWorkerTaskQueuePoll(options: {
    mode: TemporalMode;
    address: string;
    namespace: string;
    taskQueue: string;
    externalSettings?: ResolvedExternalSettings;
    apiKey?: string;
    connectionOptions?: import('@temporalio/client').ConnectionOptions;
}): Promise<boolean> {
    let connection: Connection | undefined;
    try {
        if (options.mode === 'external' && options.externalSettings) {
            const connectionOptions =
                options.connectionOptions ??
                buildExternalConnectionOptions(options.externalSettings, options.apiKey);
            connection = await Connection.connect(connectionOptions);
        } else {
            connection = await Connection.connect({
                address: options.address,
            });
        }

        const response = await connection.workflowService.describeTaskQueue({
            namespace: options.namespace,
            taskQueue: { name: options.taskQueue },
            taskQueueType: 1,
            reportPollers: true,
        });

        const pollers = response.pollers ?? [];
        return pollers.length > 0;
    } catch {
        return false;
    } finally {
        await connection?.close().catch(() => undefined);
    }
}
