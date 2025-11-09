import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InitializationDialog } from './InitializationDialog';
import { FolderStatus } from '../types';

describe('InitializationDialog', () => {
    const mockFolders: FolderStatus[] = [
        { path: 'ai/actors', exists: false, description: 'Actor definitions' },
        { path: 'ai/features', exists: false, description: 'Feature definitions' },
        { path: 'ai/models', exists: true, description: 'Data models' },
        { path: 'ai/specs', exists: false, description: 'Technical specs' }
    ];

    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the dialog with title', () => {
        render(
            <InitializationDialog
                folders={mockFolders}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.getByText('Initialize Forge Project')).toBeInTheDocument();
    });

    it('shows only missing folders', () => {
        render(
            <InitializationDialog
                folders={mockFolders}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        // Should show missing folders
        expect(screen.getByText('ai/actors')).toBeInTheDocument();
        expect(screen.getByText('ai/features')).toBeInTheDocument();
        expect(screen.getByText('ai/specs')).toBeInTheDocument();

        // Should not show existing folders
        expect(screen.queryByText('ai/models')).not.toBeInTheDocument();
    });

    it('displays folder descriptions', () => {
        render(
            <InitializationDialog
                folders={mockFolders}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.getByText('Actor definitions')).toBeInTheDocument();
        expect(screen.getByText('Feature definitions')).toBeInTheDocument();
        expect(screen.getByText('Technical specs')).toBeInTheDocument();
    });

    it('calls onConfirm when Confirm button is clicked', () => {
        render(
            <InitializationDialog
                folders={mockFolders}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        const confirmButton = screen.getByText('Confirm');
        fireEvent.click(confirmButton);

        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when Cancel button is clicked', () => {
        render(
            <InitializationDialog
                folders={mockFolders}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when backdrop is clicked', () => {
        render(
            <InitializationDialog
                folders={mockFolders}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        const backdrop = document.querySelector('.dialog-backdrop');
        fireEvent.click(backdrop!);

        expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('disables Confirm button when no folders are missing', () => {
        const allExistingFolders: FolderStatus[] = [
            { path: 'ai/actors', exists: true, description: 'Actor definitions' },
            { path: 'ai/features', exists: true, description: 'Feature definitions' }
        ];

        render(
            <InitializationDialog
                folders={allExistingFolders}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        const confirmButton = screen.getByText('Confirm');
        expect(confirmButton).toBeDisabled();
    });

    it('shows info message when no folders are missing', () => {
        const allExistingFolders: FolderStatus[] = [
            { path: 'ai/actors', exists: true, description: 'Actor definitions' }
        ];

        render(
            <InitializationDialog
                folders={allExistingFolders}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.getByText('All required folders already exist.')).toBeInTheDocument();
    });

    it('renders backdrop with correct className', () => {
        render(
            <InitializationDialog
                folders={mockFolders}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        const backdrop = document.querySelector('.dialog-backdrop');
        expect(backdrop).toBeInTheDocument();
    });

    it('renders dialog container with correct className', () => {
        render(
            <InitializationDialog
                folders={mockFolders}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        const dialogContainer = document.querySelector('.dialog-container');
        expect(dialogContainer).toBeInTheDocument();
    });

    it('displays folder icon for each missing folder', () => {
        render(
            <InitializationDialog
                folders={mockFolders}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        const folderIcons = document.querySelectorAll('.dialog-folder-icon');
        // Should have 3 icons for 3 missing folders
        expect(folderIcons.length).toBe(3);
    });
});

