// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepListSidebar } from './graph/StepListSidebar';
import type { WorkflowGraphStepListEntry } from '../../workflows/types';

const steps: WorkflowGraphStepListEntry[] = [
    {
        node_id: 'start',
        name: 'Start',
        visual_state: 'completed',
        status_label: 'Completed',
    },
    {
        node_id: 'act-1',
        name: 'Implement feature',
        visual_state: 'retrying',
        status_label: 'Retrying (2/3)',
    },
    {
        node_id: 'wait-1',
        name: 'Wait for review',
        visual_state: 'waiting',
        status_label: 'Waiting',
    },
];

describe('StepListSidebar', () => {
    it('renders ordered steps with status labels', () => {
        render(
            <StepListSidebar steps={steps} selectedNodeId="act-1" onSelectStep={() => undefined} />
        );

        expect(screen.getByRole('navigation', { name: 'Workflow steps' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Start, Completed' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Implement feature, Retrying (2/3)' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Wait for review, Waiting' })).toBeTruthy();
        expect(screen.getByText('Retrying (2/3)')).toBeTruthy();
    });

    it('calls onSelectStep when a step is activated', async () => {
        const user = userEvent.setup();
        const onSelectStep = vi.fn();

        render(<StepListSidebar steps={steps} onSelectStep={onSelectStep} />);

        await user.click(screen.getByRole('button', { name: 'Wait for review, Waiting' }));
        expect(onSelectStep).toHaveBeenCalledWith('wait-1');
    });
});
