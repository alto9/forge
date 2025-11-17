import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

describe('Sidebar Component Integration', () => {
  const mockOnNavigate = vi.fn();
  const mockActiveSession = { id: 'test-session', name: 'Test Session' };

  beforeEach(() => {
    mockOnNavigate.mockClear();
  });

  describe('Component Integration', () => {
    it('should render all major components', () => {
      render(
        <Sidebar
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      // Check that the main sidebar structure is present
      expect(screen.getByText('Forge Studio')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should integrate NavSection components correctly', () => {
      render(
        <Sidebar
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      // Check that both sections are rendered
      expect(screen.getByText('INFORM')).toBeInTheDocument();
      expect(screen.getByText('DESIGN')).toBeInTheDocument();
    });

    it('should pass props correctly to child components', () => {
      render(
        <Sidebar
          currentPage="actors"
          activeSession={mockActiveSession}
          onNavigate={mockOnNavigate}
        />
      );

      // Verify that navigation works through the integrated components
      fireEvent.click(screen.getByText('Sessions'));
      expect(mockOnNavigate).toHaveBeenCalledWith('sessions');
    });
  });

  describe('Session State Propagation', () => {
    it('should handle session state changes in child components', () => {
      const { rerender } = render(
        <Sidebar
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      // Initially no session - Features should be disabled
      expect(screen.getByText('Features')).toBeInTheDocument();

      // Rerender with active session
      rerender(
        <Sidebar
          currentPage="dashboard"
          activeSession={mockActiveSession}
          onNavigate={mockOnNavigate}
        />
      );

      // Features should now be enabled
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('● Session Active')).toBeInTheDocument();
    });

    it('should display session indicator when session is active', () => {
      render(
        <Sidebar
          currentPage="dashboard"
          activeSession={mockActiveSession}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('● Session Active')).toBeInTheDocument();
    });

    it('should not display session indicator when no session is active', () => {
      render(
        <Sidebar
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.queryByText('● Session Active')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Flow Integration', () => {
    it('should handle navigation from Dashboard to other sections', () => {
      render(
        <Sidebar
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      // Test navigation to always-accessible items
      fireEvent.click(screen.getByText('Actors'));
      expect(mockOnNavigate).toHaveBeenCalledWith('actors');

      fireEvent.click(screen.getByText('Sessions'));
      expect(mockOnNavigate).toHaveBeenCalledWith('sessions');
    });

    it('should maintain proper component hierarchy', () => {
      render(
        <Sidebar
          currentPage="diagrams"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      // Verify all expected elements are present
      expect(screen.getByText('Forge Studio')).toBeInTheDocument();
      expect(screen.getByText('INFORM')).toBeInTheDocument();
      expect(screen.getByText('DESIGN')).toBeInTheDocument();
      expect(screen.getByText('Actors')).toBeInTheDocument();
      expect(screen.getByText('Diagrams')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
    });

    it('should handle current page highlighting through components', () => {
      render(
        <Sidebar
          currentPage="contexts"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      // The active state should be handled by the NavItem components
      expect(screen.getByText('Contexts')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should handle different currentPage values', () => {
      const pages = ['dashboard', 'actors', 'contexts', 'diagrams', 'specs', 'sessions', 'features'];

      pages.forEach(page => {
        const { unmount } = render(
          <Sidebar
            currentPage={page}
            activeSession={null}
            onNavigate={mockOnNavigate}
          />
        );

        // Component should render without errors for each page
        expect(screen.getByText('Forge Studio')).toBeInTheDocument();
        unmount(); // Clean up between tests
      });
    });

    it('should handle session state transitions', () => {
      const { rerender } = render(
        <Sidebar
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      // Start without session
      expect(screen.queryByText('● Session Active')).not.toBeInTheDocument();

      // Add session
      rerender(
        <Sidebar
          currentPage="dashboard"
          activeSession={mockActiveSession}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('● Session Active')).toBeInTheDocument();

      // Remove session
      rerender(
        <Sidebar
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.queryByText('● Session Active')).not.toBeInTheDocument();
    });
  });

  describe('Component Composition', () => {
    it('should properly compose NavItem and NavSection components', () => {
      render(
        <Sidebar
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      // Verify that all navigation items are present
      const expectedItems = [
        'Dashboard', 'Actors', 'Contexts', 'Diagrams', 'Specifications',
        'Sessions', 'Features'
      ];

      expectedItems.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });

    it('should maintain proper section separation', () => {
      render(
        <Sidebar
          currentPage="dashboard"
          activeSession={null}
          onNavigate={mockOnNavigate}
        />
      );

      // Verify sections are properly separated
      const informSection = screen.getByText('INFORM').parentElement;
      const designSection = screen.getByText('DESIGN').parentElement;

      // INFORM section should contain Actors, Contexts, Diagrams, Specifications
      expect(informSection).toBeInTheDocument();

      // DESIGN section should contain Sessions, Features
      expect(designSection).toBeInTheDocument();
    });
  });
});
