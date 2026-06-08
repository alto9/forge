'use strict';

const { Runtime } = require('@temporalio/worker');
const { native } = require('@temporalio/core-bridge');
const workerPkg = require('@temporalio/worker/package.json');

function parseArgs(argv) {
    const args = {
        grpcPort: 7233,
        uiPort: 8233,
        dbFilename: undefined,
        namespace: 'forge-local',
    };

    for (let index = 2; index < argv.length; index += 1) {
        const token = argv[index];
        const next = argv[index + 1];

        switch (token) {
            case '--grpc-port':
                args.grpcPort = Number.parseInt(next, 10);
                index += 1;
                break;
            case '--ui-port':
                args.uiPort = Number.parseInt(next, 10);
                index += 1;
                break;
            case '--db-filename':
                args.dbFilename = next;
                index += 1;
                break;
            case '--namespace':
                args.namespace = next;
                index += 1;
                break;
            default:
                break;
        }
    }

    return args;
}

async function main() {
    const args = parseArgs(process.argv);
    const runtime = Runtime.instance();
    const server = await runtime.createEphemeralServer({
        type: 'dev-server',
        exe: {
            type: 'cached-download',
            downloadDir: null,
            version: 'default',
            ttl: 86_400_000,
            sdkName: 'sdk-typescript',
            sdkVersion: workerPkg.version,
        },
        namespace: args.namespace,
        ip: '127.0.0.1',
        port: args.grpcPort,
        uiPort: args.uiPort,
        dbFilename: args.dbFilename ?? null,
        ui: true,
        log: { format: 'json', level: 'warn' },
        extraArgs: [],
    });

    const target = native.ephemeralServerGetTarget(server);
    process.stdout.write(`FORGE_TEMPORAL_LISTENING:${target}\n`);

    const shutdown = async () => {
        try {
            await runtime.shutdownEphemeralServer(server);
        } finally {
            process.exit(0);
        }
    };

    process.on('SIGTERM', () => {
        void shutdown();
    });
    process.on('SIGINT', () => {
        void shutdown();
    });
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
});
