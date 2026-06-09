import fs from 'fs';
import path from 'path';

export interface WorkerManifest {
    extensionVersion: string;
    workerEntryPath: string;
    pid: number;
}

export function readWorkerManifest(manifestPath: string): WorkerManifest | undefined {
    if (!fs.existsSync(manifestPath)) {
        return undefined;
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as WorkerManifest;
        if (
            typeof parsed.extensionVersion !== 'string' ||
            typeof parsed.workerEntryPath !== 'string' ||
            typeof parsed.pid !== 'number'
        ) {
            return undefined;
        }
        return parsed;
    } catch {
        return undefined;
    }
}

export function writeWorkerManifest(manifestPath: string, manifest: WorkerManifest): void {
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

export function workerManifestVersionMismatch(
    manifest: WorkerManifest | undefined,
    extensionVersion: string
): boolean {
    return manifest !== undefined && manifest.extensionVersion !== extensionVersion;
}
