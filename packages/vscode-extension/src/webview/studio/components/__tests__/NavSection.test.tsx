import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavSection } from '../NavSection';

describe('NavSection Component', () => {
  const mockOnNavigate = vi.fn();
  const mockActiveSession = { id: 'test-session', name: 'Test Session' };

  const defaultItems = [
    { id: 'actors', label: 'Actors', alwaysEnabled: true },
    { id: 'contexts', label: 'Contexts', alwaysEnabled: true },
    { id: 'features', label: 'Features', requiresSession: true },
  ];

  beforeEach(() => {
    mockOnNavigate.mockClear();
  });

  describe('Section Header', () => {
    it('should render section header with correct title', () => {
      render(
        <NavSection
          title="INFORM"
          items={defaultItems}
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('INFORM')).toBeInTheDocument();
    });

    it('should render section header with different titles', () => {
      render(
        <NavSection
          title="DESIGN"
          items={defaultItems}
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('DESIGN')).toBeInTheDocument();
    });
  });

  describe('Item Rendering', () => {
    it('should render all navigation items', () => {
      render(
        <NavSection
          title="INFORM"
          items={defaultItems}
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Actors')).toBeInTheDocument();
      expect(screen.getByText('Contexts')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
    });

    it('should render items with correct labels', () => {
      const customItems = [
        { id: 'test1', label: 'Test Item 1', alwaysEnabled: true },
        { id: 'test2', label: 'Test Item 2', alwaysEnabled: true },
      ];

      render(
        <NavSection
          title="Test Section"
          items={customItems}
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    });
  });

  describe('Session-Dependent Behavior', () => {
    it('should show lock icon for session-required items when no session is active', () => {
      render(
        <NavSection
          title="DESIGN"
          items={defaultItems}
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      // Features should have lock icon (requires session)
      const featuresItem = screen.getByText('Features').closest('div')?.parentElement;
      expect(featuresItem).toHaveTextContent('🔒');

      // Actors and Contexts should not have lock icon (always enabled)
      const actorsItem = screen.getByText('Actors').closest('div')?.parentElement;
      const contextsItem = screen.getByText('Contexts').closest('div')?.parentElement;
      expect(actorsItem).not.toHaveTextContent('🔒');
      expect(contextsItem).not.toHaveTextContent('🔒');
    });

    it('should not show lock icon for session-required items when session is active', () => {
      render(
        <NavSection
          title="DESIGN"
          items={defaultItems}
          currentPage="dashboard"
          activeSession={mockActiveSession}
          onNavigate={mockOnNavigate}
        />
      );

      // Features should not have lock icon when session is active
      const featuresItem = screen.getByText('Features').closest('div');
      expect(featuresItem).not.toHaveTextContent('🔒');
    });

    it('should handle items with alwaysEnabled property', () => {
      const mixedItems = [
        { id: 'item1', label: 'Always Enabled', alwaysEnabled: true },
        { id: 'item2', label: 'Session Required', requiresSession: true },
        { id: 'item3', label: 'Default Item' },
      ];

      render(
        <NavSection
          title="Mixed Section"
          items={mixedItems}
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      // Only session-required item should have lock icon
      const item1 = screen.getByText('Always Enabled').closest('div')?.parentElement;
      const item2 = screen.getByText('Session Required').closest('div')?.parentElement;
      const item3 = screen.getByText('Default Item').closest('div')?.parentElement;

      expect(item1).not.toHaveTextContent('🔒');
      expect(item2).toHaveTextContent('🔒');
      expect(item3).not.toHaveTextContent('🔒');
    });
  });

  describe('Navigation Behavior', () => {
    it('should call onNavigate when clicking enabled items', () => {
      render(
        <NavSection
          title="INFORM"
          items={defaultItems}
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      // Click on Actors (always enabled)
      fireEvent.click(screen.getByText('Actors'));
      expect(mockOnNavigate).toHaveBeenCalledWith('actors');

      // Click on Contexts (always enabled)
      fireEvent.click(screen.getByText('Contexts'));
      expect(mockOnNavigate).toHaveBeenCalledWith('contexts');
    });

    it('should not call onNavigate when clicking disabled items', () => {
      render(
        <NavSection
          title="DESIGN"
          items={defaultItems}
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      // Click on Features (disabled without session)
      fireEvent.click(screen.getByText('Features'));
      expect(mockOnNavigate).not.toHaveBeenCalledWith('features');
    });

    it('should call onNavigate when clicking session-required items with active session', () => {
      render(
        <NavSection
          title="DESIGN"
          items={defaultItems}
          currentPage="dashboard"
          activeSession={mockActiveSession}
          onNavigate={mockOnNavigate}
        />
      );

      // Click on Features (enabled with session)
      fireEvent.click(screen.getByText('Features'));
      expect(mockOnNavigate).toHaveBeenCalledWith('features');
    });
  });

  describe('Tooltips', () => {
    it('should show correct tooltip for Actors', () => {
      render(
        <NavSection
          title="INFORM"
          items={[{ id: 'actors', label: 'Actors', alwaysEnabled: true }]}
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      const actorsItem = screen.getByText('Actors').closest('div')?.parentElement;
      expect(actorsItem).toHaveAttribute('title', 'Define system actors and personas - Always accessible foundational reference');
    });

    it('should show correct tooltip for Contexts', () => {
      render(
        <NavSection
          title="INFORM"
          items={[{ id: 'contexts', label: 'Contexts', alwaysEnabled: true }]}
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      const contextsItem = screen.getByText('Contexts').closest('div')?.parentElement;
      expect(contextsItem).toHaveAttribute('title', 'Provide technical guidance and best practices - Always accessible reference');
    });

    it('should show correct tooltip for Features when disabled', () => {
      render(
        <NavSection
          title="DESIGN"
          items={[{ id: 'features', label: 'Features', requiresSession: true }]}
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      const featuresItem = screen.getByText('Features').closest('div')?.parentElement;
      expect(featuresItem).toHaveAttribute('title', 'Browse features anytime, edit during design sessions - Active session required');
    });

    it('should show correct tooltip for Features when enabled', () => {
      render(
        <NavSection
          title="DESIGN"
          items={[{ id: 'features', label: 'Features', requiresSession: true }]}
          currentPage="dashboard"
          activeSession={mockActiveSession}
          onNavigate={mockOnNavigate}
        />
      );

      const featuresItem = screen.getByText('Features').closest('div')?.parentElement;
      expect(featuresItem).toHaveAttribute('title', 'Browse features anytime, edit during design sessions');
    });

    it('should show default tooltip for unknown items', () => {
      render(
        <NavSection
          title="Test"
          items={[{ id: 'unknown', label: 'Unknown Item', alwaysEnabled: true }]}
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      const unknownItem = screen.getByText('Unknown Item').closest('div')?.parentElement;
      expect(unknownItem).toHaveAttribute('title', 'Unknown Item');
    });
  });

  describe('Empty Items', () => {
    it('should handle empty items array', () => {
      render(
        <NavSection
          title="Empty Section"
          items={[]}
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Empty Section')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should pass correct props to navigation handler', () => {
      const items = [
        { id: 'test-page', label: 'Test Page', alwaysEnabled: true },
      ];

      render(
        <NavSection
          title="Test Section"
          items={items}
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      fireEvent.click(screen.getByText('Test Page'));
      expect(mockOnNavigate).toHaveBeenCalledWith('test-page');
      expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    });

    it('should handle session state changes', () => {
      const { rerender } = render(
        <NavSection
          title="DESIGN"
          items={defaultItems}
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      // Initially disabled
      let featuresItem = screen.getByText('Features').closest('div')?.parentElement;
      expect(featuresItem).toHaveTextContent('🔒');

      // Rerender with active session
      rerender(
        <NavSection
          title="DESIGN"
          items={defaultItems}
          currentPage="dashboard"
          activeSession={mockActiveSession}
          onNavigate={mockOnNavigate}
        />
      );

      // Now enabled
      featuresItem = screen.getByText('Features').closest('div')?.parentElement;
      expect(featuresItem).not.toHaveTextContent('🔒');
    });
  });
});
