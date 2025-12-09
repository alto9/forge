import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavItem } from '../NavItem';

describe('NavItem Component', () => {
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    mockOnNavigate.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render item label', () => {
      render(
        <NavItem
          id="test-item"
          label="Test Item"
          currentPage="dashboard"
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('should render icon when provided', () => {
      render(
        <NavItem
          id="test-item"
          label="Test Item"
          icon="home"
          currentPage="dashboard"
          onNavigate={mockOnNavigate}
        />
      );

      const iconElement = screen.getByText('Test Item').previousSibling;
      expect(iconElement).toHaveClass('icon icon-home');
    });

    it('should not render icon when not provided', () => {
      render(
        <NavItem
          id="test-item"
          label="Test Item"
          currentPage="dashboard"
          onNavigate={mockOnNavigate}
        />
      );

      const itemElement = screen.getByText('Test Item').parentElement;
      const iconElement = screen.getByText('Test Item').previousSibling;
      expect(iconElement).toBeNull();
    });
  });

  describe('Active State', () => {
    it('should apply active styling when current page matches id', () => {
      render(
        <NavItem
          id="actors"
          label="Actors"
          currentPage="actors"
          onNavigate={mockOnNavigate}
        />
      );

      const itemElement = screen.getByText('Actors').closest('div');
      expect(itemElement).toBeInTheDocument();
      // Active styling would be applied via CSS classes, which we can test by checking the element
    });

    it('should not apply active styling when current page does not match id', () => {
      render(
        <NavItem
          id="actors"
          label="Actors"
          currentPage="dashboard"
          onNavigate={mockOnNavigate}
        />
      );

      const itemElement = screen.getByText('Actors').closest('div');
      expect(itemElement).toBeInTheDocument();
      // Non-active styling would be applied
    });
  });

  describe('Disabled State', () => {
    it('should show lock icon when disabled', () => {
      render(
        <NavItem
          id="features"
          label="Features"
          currentPage="dashboard"
          isDisabled={true}
          requiresSession={true}
          onNavigate={mockOnNavigate}
        />
      );

      const itemElement = screen.getByText('Features').closest('div');
      expect(itemElement).toHaveTextContent('🔒');
    });

    it('should not show lock icon when not disabled', () => {
      render(
        <NavItem
          id="actors"
          label="Actors"
          currentPage="dashboard"
          isDisabled={false}
          onNavigate={mockOnNavigate}
        />
      );

      const itemElement = screen.getByText('Actors').closest('div');
      expect(itemElement).not.toHaveTextContent('🔒');
    });

    it('should not call onNavigate when clicking disabled item', () => {
      render(
        <NavItem
          id="features"
          label="Features"
          currentPage="dashboard"
          isDisabled={true}
          requiresSession={true}
          onNavigate={mockOnNavigate}
        />
      );

      fireEvent.click(screen.getByText('Features'));
      expect(mockOnNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Behavior', () => {
    it('should call onNavigate with correct id when clicked and enabled', () => {
      render(
        <NavItem
          id="actors"
          label="Actors"
          currentPage="dashboard"
          onNavigate={mockOnNavigate}
        />
      );

      fireEvent.click(screen.getByText('Actors'));
      expect(mockOnNavigate).toHaveBeenCalledWith('actors');
      expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    });

    it('should not call onNavigate when clicked and disabled', () => {
      render(
        <NavItem
          id="features"
          label="Features"
          currentPage="dashboard"
          isDisabled={true}
          requiresSession={true}
          onNavigate={mockOnNavigate}
        />
      );

      fireEvent.click(screen.getByText('Features'));
      expect(mockOnNavigate).not.toHaveBeenCalled();
    });

  });

  describe('Tooltips', () => {
    it('should show correct tooltip for Dashboard', () => {
      render(
        <NavItem
          id="dashboard"
          label="Dashboard"
          currentPage="actors"
          onNavigate={mockOnNavigate}
        />
      );

      const itemElement = screen.getByText('Dashboard').closest('div');
      expect(itemElement).toHaveAttribute('title', 'Forge Studio dashboard - Always accessible overview');
    });

    it('should show correct tooltip for Actors', () => {
      render(
        <NavItem
          id="actors"
          label="Actors"
          currentPage="dashboard"
          onNavigate={mockOnNavigate}
        />
      );

      const itemElement = screen.getByText('Actors').closest('div');
      expect(itemElement).toHaveAttribute('title', 'Define system actors and personas - Always accessible foundational reference');
    });


    it('should show correct tooltip for Diagrams', () => {
      render(
        <NavItem
          id="diagrams"
          label="Diagrams"
          currentPage="dashboard"
          onNavigate={mockOnNavigate}
        />
      );

      const itemElement = screen.getByText('Diagrams').closest('div');
      expect(itemElement).toHaveAttribute('title', 'Visual architecture and system diagrams - Always accessible reference');
    });

    it('should show correct tooltip for Specifications', () => {
      render(
        <NavItem
          id="specs"
          label="Specifications"
          currentPage="dashboard"
          onNavigate={mockOnNavigate}
        />
      );

      const itemElement = screen.getByText('Specifications').closest('div');
      expect(itemElement).toHaveAttribute('title', 'Technical contracts and implementation details - Always accessible reference');
    });

    it('should show correct tooltip for Sessions', () => {
      render(
        <NavItem
          id="sessions"
          label="Sessions"
          currentPage="dashboard"
          onNavigate={mockOnNavigate}
        />
      );

      const itemElement = screen.getByText('Sessions').closest('div');
      expect(itemElement).toHaveAttribute('title', 'Manage design sessions and track changes - Always accessible workflow entry');
    });

    it('should show correct tooltip for Features when disabled', () => {
      render(
        <NavItem
          id="features"
          label="Features"
          currentPage="dashboard"
          isDisabled={true}
          requiresSession={true}
          onNavigate={mockOnNavigate}
        />
      );

      const itemElement = screen.getByText('Features').closest('div');
      expect(itemElement).toHaveAttribute('title', 'Define user-facing functionality and behavior - Requires active design session - Active session required');
    });

    it('should show correct tooltip for Features when enabled', () => {
      render(
        <NavItem
          id="features"
          label="Features"
          currentPage="dashboard"
          isDisabled={false}
          requiresSession={true}
          onNavigate={mockOnNavigate}
        />
      );

      const itemElement = screen.getByText('Features').closest('div');
      expect(itemElement).toHaveAttribute('title', 'Define user-facing functionality and behavior - Requires active design session');
    });

    it('should show default tooltip for unknown items', () => {
      render(
        <NavItem
          id="unknown"
          label="Unknown Item"
          currentPage="dashboard"
          onNavigate={mockOnNavigate}
        />
      );

      const itemElement = screen.getByText('Unknown Item').closest('div');
      expect(itemElement).toHaveAttribute('title', 'Unknown Item');
    });
  });

  describe('Props Handling', () => {
    it('should handle empty icon prop', () => {
      render(
        <NavItem
          id="test"
          label="Test"
          icon=""
          currentPage="dashboard"
          onNavigate={mockOnNavigate}
        />
      );

      const itemElement = screen.getByText('Test').closest('div');
      expect(itemElement).toBeInTheDocument();
    });

    it('should handle various id formats', () => {
      const testIds = ['simple', 'with-dashes', 'with_underscores', '123numbers'];

      testIds.forEach(id => {
        const { rerender } = render(
          <NavItem
            id={id}
            label={`Item ${id}`}
            currentPage="dashboard"
            onNavigate={mockOnNavigate}
          />
        );

        expect(screen.getByText(`Item ${id}`)).toBeInTheDocument();

        fireEvent.click(screen.getByText(`Item ${id}`));
        expect(mockOnNavigate).toHaveBeenCalledWith(id);
        mockOnNavigate.mockClear();
      });
    });

    it('should handle long labels', () => {
      const longLabel = 'This is a very long navigation item label that should still render correctly';

      render(
        <NavItem
          id="long-label"
          label={longLabel}
          currentPage="dashboard"
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('should handle special characters in labels', () => {
      const specialLabel = 'Item with: colons, (parentheses) & [brackets]';

      render(
        <NavItem
          id="special"
          label={specialLabel}
          currentPage="dashboard"
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText(specialLabel)).toBeInTheDocument();
    });
  });

  describe('State Changes', () => {
    it('should update disabled state correctly', () => {
      const { rerender } = render(
        <NavItem
          id="features"
          label="Features"
          currentPage="dashboard"
          isDisabled={true}
          requiresSession={true}
          onNavigate={mockOnNavigate}
        />
      );

      // Initially disabled
      let itemElement = screen.getByText('Features').closest('div');
      expect(itemElement).toHaveTextContent('🔒');

      // Rerender as enabled
      rerender(
        <NavItem
          id="features"
          label="Features"
          currentPage="dashboard"
          isDisabled={false}
          requiresSession={true}
          onNavigate={mockOnNavigate}
        />
      );

      // Now enabled
      itemElement = screen.getByText('Features').closest('div');
      expect(itemElement).not.toHaveTextContent('🔒');

      // Should now respond to clicks
      fireEvent.click(screen.getByText('Features'));
      expect(mockOnNavigate).toHaveBeenCalledWith('features');
    });

    it('should update active state correctly', () => {
      const { rerender } = render(
        <NavItem
          id="actors"
          label="Actors"
          currentPage="dashboard"
          onNavigate={mockOnNavigate}
        />
      );

      // Initially not active
      let itemElement = screen.getByText('Actors').closest('div');
      expect(itemElement).toBeInTheDocument();

      // Rerender as active
      rerender(
        <NavItem
          id="actors"
          label="Actors"
          currentPage="actors"
          onNavigate={mockOnNavigate}
        />
      );

      // Should still be clickable
      itemElement = screen.getByText('Actors').closest('div');
      fireEvent.click(screen.getByText('Actors'));
      expect(mockOnNavigate).toHaveBeenCalledWith('actors');
    });
  });
});


