'use strict';

const { NativeConnection, Worker } = require('@temporalio/worker');

function resolveSetting(envKey, fallback) {
    const value = process.env[envKey];
    if (value !== undefined && value.length > 0) {
        return value;
    }
    return fallback;
}

function resolveBooleanSetting(envKey, fallback) {
    const value = process.env[envKey];
    if (value === undefined || value.length === 0) {
        return fallback;
    }
    return value === 'true' || value === '1';
}

function buildConnectionOptions() {
    const mode = resolveSetting('FORGE_TEMPORAL_MODE', 'managedLocal');
    const address =
        mode === 'external'
            ? resolveSetting('FORGE_TEMPORAL_EXTERNAL_ADDRESS', '')
            : resolveSetting(
                  'FORGE_TEMPORAL_ADDRESS',
                  `127.0.0.1:${resolveSetting('FORGE_TEMPORAL_MANAGED_LOCAL_GRPC_PORT', '7233')}`
              );

    if (!address) {
        throw new Error('Temporal worker address is not configured.');
    }

    const authMode = resolveSetting('FORGE_TEMPORAL_EXTERNAL_AUTH_MODE', 'apiKey');
    const tlsEnabled = resolveBooleanSetting('FORGE_TEMPORAL_EXTERNAL_TLS_ENABLED', true);
    const options = { address };

    if (mode === 'external') {
        if (authMode === 'insecure' || !tlsEnabled) {
            options.tls = false;
        } else {
            const serverName = resolveSetting('FORGE_TEMPORAL_EXTERNAL_TLS_SERVER_NAME', '');
            options.tls = serverName ? { serverNameOverride: serverName } : true;
        }

        if (authMode === 'apiKey') {
            const apiKey = resolveSetting('FORGE_TEMPORAL_EXTERNAL_API_KEY', '');
            if (apiKey) {
                options.apiKey = apiKey;
            }
        }
    }

    return options;
}

function resolveNamespace() {
    const mode = resolveSetting('FORGE_TEMPORAL_MODE', 'managedLocal');
    if (mode === 'external') {
        return resolveSetting('FORGE_TEMPORAL_EXTERNAL_NAMESPACE', '');
    }
    return resolveSetting('FORGE_TEMPORAL_MANAGED_LOCAL_NAMESPACE', 'forge-local');
}

function resolveTaskQueue() {
    const mode = resolveSetting('FORGE_TEMPORAL_MODE', 'managedLocal');
    if (mode === 'external') {
        return resolveSetting('FORGE_TEMPORAL_EXTERNAL_TASK_QUEUE', 'forge-workflows');
    }
    return resolveSetting('FORGE_TEMPORAL_MANAGED_LOCAL_TASK_QUEUE', 'forge-workflows');
}

async function main() {
    const namespace = resolveNamespace();
    const taskQueue = resolveTaskQueue();

    if (!namespace) {
        throw new Error('Temporal worker namespace is not configured.');
    }

    const connection = await NativeConnection.connect(buildConnectionOptions());
    const worker = await Worker.create({
        connection,
        namespace,
        taskQueue,
        activities: {},
    });

    process.stdout.write(`FORGE_WORKER_READY:taskQueue=${taskQueue}\n`);

    process.on('SIGTERM', () => {
        worker.shutdown();
    });
    process.on('SIGINT', () => {
        worker.shutdown();
    });

    await worker.run();
    await connection.close().catch(() => undefined);
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
});
