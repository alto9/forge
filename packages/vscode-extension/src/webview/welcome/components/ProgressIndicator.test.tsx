import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressIndicator } from './ProgressIndicator';

describe('ProgressIndicator', () => {
    it('renders the component with creating folders message', () => {
        render(
            <ProgressIndicator
                currentFolder="ai/actors"
                createdCount={2}
                totalCount={7}
            />
        );

        expect(screen.getByText('Creating folders...')).toBeInTheDocument();
    });

    it('displays the current folder being created', () => {
        render(
            <ProgressIndicator
                currentFolder="ai/actors"
                createdCount={2}
                totalCount={7}
            />
        );

        expect(screen.getByText('Currently creating:')).toBeInTheDocument();
        expect(screen.getByText('ai/actors')).toBeInTheDocument();
    });

    it('displays the created count', () => {
        render(
            <ProgressIndicator
                currentFolder="ai/actors"
                createdCount={3}
                totalCount={7}
            />
        );

        expect(screen.getByText('Created 3 of 7 folders')).toBeInTheDocument();
    });

    it('does not display current folder when null', () => {
        render(
            <ProgressIndicator
                currentFolder={null}
                createdCount={0}
                totalCount={7}
            />
        );

        expect(screen.queryByText('Currently creating:')).not.toBeInTheDocument();
    });

    it('shows correct progress bar width', () => {
        const { container } = render(
            <ProgressIndicator
                currentFolder="ai/specs"
                createdCount={5}
                totalCount={10}
            />
        );

        const progressBarFill = container.querySelector('.progress-bar-fill');
        expect(progressBarFill).toHaveStyle({ width: '50%' });
    });

    it('shows 0% progress at start', () => {
        const { container } = render(
            <ProgressIndicator
                currentFolder="ai"
                createdCount={0}
                totalCount={7}
            />
        );

        const progressBarFill = container.querySelector('.progress-bar-fill');
        expect(progressBarFill).toHaveStyle({ width: '0%' });
    });

    it('shows 100% progress when complete', () => {
        const { container } = render(
            <ProgressIndicator
                currentFolder={null}
                createdCount={7}
                totalCount={7}
            />
        );

        const progressBarFill = container.querySelector('.progress-bar-fill');
        expect(progressBarFill).toHaveStyle({ width: '100%' });
    });

    it('renders spinner element', () => {
        const { container } = render(
            <ProgressIndicator
                currentFolder="ai/models"
                createdCount={1}
                totalCount={7}
            />
        );

        const spinner = container.querySelector('.progress-spinner');
        expect(spinner).toBeInTheDocument();
    });

    it('renders progress bar elements', () => {
        const { container } = render(
            <ProgressIndicator
                currentFolder="ai/features"
                createdCount={4}
                totalCount={7}
            />
        );

        const progressBar = container.querySelector('.progress-bar');
        const progressBarFill = container.querySelector('.progress-bar-fill');
        
        expect(progressBar).toBeInTheDocument();
        expect(progressBarFill).toBeInTheDocument();
    });

    it('displays correct message structure', () => {
        const { container } = render(
            <ProgressIndicator
                currentFolder="ai/contexts"
                createdCount={2}
                totalCount={5}
            />
        );

        expect(container.querySelector('.progress-indicator')).toBeInTheDocument();
        expect(container.querySelector('.progress-header')).toBeInTheDocument();
        expect(container.querySelector('.progress-details')).toBeInTheDocument();
        expect(container.querySelector('.progress-bar')).toBeInTheDocument();
    });

    it('handles single folder scenario', () => {
        render(
            <ProgressIndicator
                currentFolder="ai"
                createdCount={0}
                totalCount={1}
            />
        );

        expect(screen.getByText('Created 0 of 1 folders')).toBeInTheDocument();
    });

    it('handles multiple folders in progress', () => {
        render(
            <ProgressIndicator
                currentFolder="ai/sessions"
                createdCount={5}
                totalCount={7}
            />
        );

        expect(screen.getByText('ai/sessions')).toBeInTheDocument();
        expect(screen.getByText('Created 5 of 7 folders')).toBeInTheDocument();
    });

    it('calculates progress percentage correctly for various scenarios', () => {
        const scenarios = [
            { created: 1, total: 7, expectedPercent: (1/7) * 100 },
            { created: 2, total: 7, expectedPercent: (2/7) * 100 },
            { created: 3, total: 7, expectedPercent: (3/7) * 100 },
            { created: 6, total: 7, expectedPercent: (6/7) * 100 }
        ];

        scenarios.forEach(({ created, total, expectedPercent }) => {
            const { container, unmount } = render(
                <ProgressIndicator
                    currentFolder="test"
                    createdCount={created}
                    totalCount={total}
                />
            );

            const progressBarFill = container.querySelector('.progress-bar-fill') as HTMLElement;
            const width = progressBarFill.style.width;
            const actualPercent = parseFloat(width);
            
            expect(actualPercent).toBeCloseTo(expectedPercent, 5);
            unmount();
        });
    });
});

