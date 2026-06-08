import fs from 'fs';
export {
    computeDefaultPersistencePath,
    resolveManagedLocalSettings,
    resolveTemporalMode,
} from './temporalSettings';
export type { ResolvedManagedLocalSettings, TemporalMode } from './temporalSettings';

export function ensurePersistenceDirectory(persistencePath: string): void {
    fs.mkdirSync(persistencePath, { recursive: true });
}
