import { Connection } from '@temporalio/client';

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
