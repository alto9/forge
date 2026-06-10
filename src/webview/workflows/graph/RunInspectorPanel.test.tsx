// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RunInspectorDetail } from '../../../workflows/types';
import { RunInspectorPanel } from './RunInspectorPanel';

const runDetail: RunInspectorDetail = {
    mode: 'run',
    selected_node_id: 'activity_a',
    summary: {
        node_id: 'activity_a',
        type: 'activity',
        name: 'Implement feature',
        status_label: 'Completed',
    },
    activity: {
        activity_id: 'forge.test.activity',
        cursor_agent_id: 'agent-1',
        cursor_run_id: 'cursor-run-1',
        status: 'finished',
        retryable: false,
        output_type: 'markdown',
    },
    validation: {
        valid: false,
        validated_at: '2026-06-10T12:00:00.000Z',
        validator_outcomes: [
            {
                validator_id: 'forge.artifact.exists',
                type: 'artifact',
                passed: false,
                blocking: true,
            },
        ],
        diagnostics: [
            {
                code: 'forge.artifact.missing',
                severity: 'error',
                message: 'artifact output not found',
                validator_id: 'forge.artifact.exists',
            },
        ],
    },
    artifacts: [
        {
            artifact_id: 'output',
            path: 'artifacts/output.md',
            size_bytes: 12,
            sha256_prefix: 'abcd1234',
            preview_mode: 'inline',
            preview_text: '# Hello',
        },
    ],
    recovery_actions: [
        {
            action_id: 'refresh',
            label: 'Refresh',
            enabled: true,
        },
        {
            action_id: 'cancel_run',
            label: 'Cancel run',
            enabled: false,
            disabled_reason: 'Run actions are unavailable until recovery finishes.',
        },
    ],
};

describe('RunInspectorPanel', () => {
    it('renders empty state when no detail is provided', () => {
        render(<RunInspectorPanel onRecoveryAction={() => undefined} />);

        expect(
            screen.getByText(
                'Select a step to inspect activity output, validation, and artifacts.'
            )
        ).toBeTruthy();
    });

    it('renders run-mode sections and recovery actions', () => {
        render(<RunInspectorPanel detail={runDetail} onRecoveryAction={() => undefined} />);

        expect(screen.getByRole('heading', { name: 'Summary' })).toBeTruthy();
        expect(screen.getByText('Implement feature')).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Activity' })).toBeTruthy();
        expect(screen.getByText('Activity finished')).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Validation' })).toBeTruthy();
        expect(screen.getByText('Validation failed')).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Artifacts' })).toBeTruthy();
        expect(screen.getByText('# Hello')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy();
        expect(screen.getByText('Run actions are unavailable until recovery finishes.')).toBeTruthy();
    });

    it('expands validation diagnostics with aria-expanded', async () => {
        const user = userEvent.setup();
        render(<RunInspectorPanel detail={runDetail} onRecoveryAction={() => undefined} />);

        const toggle = screen.getByRole('button', { name: 'Show diagnostics' });
        expect(toggle.getAttribute('aria-expanded')).toBe('false');

        await user.click(toggle);
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        expect(screen.getByText(/forge.artifact.missing/)).toBeTruthy();
    });

    it('dispatches recovery actions when enabled buttons are clicked', async () => {
        const user = userEvent.setup();
        const onRecoveryAction = vi.fn();

        render(<RunInspectorPanel detail={runDetail} onRecoveryAction={onRecoveryAction} />);

        await user.click(screen.getByRole('button', { name: 'Refresh' }));
        expect(onRecoveryAction).toHaveBeenCalledWith('refresh');
    });
});
