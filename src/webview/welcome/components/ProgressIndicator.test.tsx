import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressIndicator } from './ProgressIndicator';

describe('ProgressIndicator', () => {
    it('renders the component with initializing message', () => {
        render(
            <ProgressIndicator
                currentItem="ai/actors"
                currentItemType="folder"
                createdCount={2}
                totalCount={7}
            />
        );

        expect(screen.getByText('Initializing project...')).toBeInTheDocument();
    });

    it('displays the current folder being created', () => {
        render(
            <ProgressIndicator
                currentItem="ai/actors"
                currentItemType="folder"
                createdCount={2}
                totalCount={7}
            />
        );

        expect(screen.getByText('ai/actors')).toBeInTheDocument();
    });

    it('displays creating folder message', () => {
        render(
            <ProgressIndicator
                currentItem="ai/actors"
                currentItemType="folder"
                createdCount={3}
                totalCount={7}
            />
        );

        expect(screen.getByText(/Creating folder:/)).toBeInTheDocument();
    });

    it('displays creating command file message', () => {
        render(
            <ProgressIndicator
                currentItem=".cursor/commands/forge-build.md"
                currentItemType="file"
                createdCount={3}
                totalCount={7}
            />
        );

        expect(screen.getByText(/Creating command file:/)).toBeInTheDocument();
    });

    it('does not display current item when null', () => {
        render(
            <ProgressIndicator
                currentItem={null}
                currentItemType={null}
                createdCount={0}
                totalCount={7}
            />
        );

        expect(screen.queryByText(/Creating/)).not.toBeInTheDocument();
    });

    it('shows correct progress bar width', () => {
        const { container } = render(
            <ProgressIndicator
                currentItem="ai/specs"
                currentItemType="folder"
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
                currentItem="ai"
                currentItemType="folder"
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
                currentItem={null}
                currentItemType={null}
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
                currentItem="ai/models"
                currentItemType="folder"
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
                currentItem="ai/features"
                currentItemType="folder"
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
                currentItem="ai/specs"
                currentItemType="folder"
                createdCount={2}
                totalCount={5}
            />
        );

        expect(container.querySelector('.progress-indicator')).toBeInTheDocument();
        expect(container.querySelector('.progress-header')).toBeInTheDocument();
        expect(container.querySelector('.progress-details')).toBeInTheDocument();
        expect(container.querySelector('.progress-bar')).toBeInTheDocument();
    });

    it('handles single item scenario', () => {
        render(
            <ProgressIndicator
                currentItem="ai"
                currentItemType="folder"
                createdCount={0}
                totalCount={1}
            />
        );

        expect(screen.getByText(/Completed 0 of 1 item/)).toBeInTheDocument();
    });

    it('handles multiple items in progress', () => {
        render(
            <ProgressIndicator
                currentItem="ai/sessions"
                currentItemType="folder"
                createdCount={5}
                totalCount={7}
            />
        );

        expect(screen.getByText('ai/sessions')).toBeInTheDocument();
        expect(screen.getByText(/Completed 5 of 7 items/)).toBeInTheDocument();
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
                    currentItem="test"
                    currentItemType="folder"
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
