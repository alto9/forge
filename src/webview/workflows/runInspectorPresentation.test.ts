import { describe, expect, it } from 'vitest';
import {
    formatActivityStatusLabel,
    formatRetryLabel,
    getArtifactPreviewDescription,
    getDiagnosticAccessibleName,
    RUN_INSPECTOR_COPY,
} from './runInspectorPresentation';

describe('runInspectorPresentation', () => {
    it('formats activity status labels per presentation copy', () => {
        expect(formatActivityStatusLabel('finished')).toBe('Activity finished');
        expect(formatActivityStatusLabel('error', 'execution')).toBe(
            'Activity failed — execution'
        );
    });

    it('formats retry labels for in-progress and completed retries', () => {
        expect(formatRetryLabel({ attempt: 2, max: 3, in_progress: true })).toBe(
            'Automatic retry 2 of 3'
        );
        expect(formatRetryLabel({ attempt: 1, max: 3, in_progress: false })).toBe(
            'Retry 1 of 3'
        );
    });

    it('builds diagnostic accessible names with severity prefix', () => {
        expect(
            getDiagnosticAccessibleName({
                code: 'forge.artifact.missing',
                severity: 'error',
                message: 'artifact output not found',
                validator_id: 'forge.artifact.exists',
            })
        ).toBe('ERROR: forge.artifact.missing: artifact output not found');
    });

    it('describes truncated artifact previews for accessibility', () => {
        expect(
            getArtifactPreviewDescription({
                artifact_id: 'output',
                path: 'artifacts/output.md',
                size_bytes: 40000,
                sha256_prefix: 'abcd1234',
                preview_mode: 'truncated',
                truncated: true,
            })
        ).toBe(RUN_INSPECTOR_COPY.truncatedBanner);
    });
});
