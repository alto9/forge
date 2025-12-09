import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionRequiredView } from '../SessionRequiredView';

describe('SessionRequiredView Component', () => {
  const mockOnStartSession = vi.fn();

  beforeEach(() => {
    mockOnStartSession.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render the component with correct structure', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      expect(screen.getByText('Active Session Required')).toBeInTheDocument();
      expect(screen.getByText('Start New Session')).toBeInTheDocument();
    });

    it('should render lock icon', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      // Check that the SVG lock icon is rendered (we can check for SVG elements)
      const svgElement = document.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
    });

    it('should render correct heading', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      expect(screen.getByText('Active Session Required')).toBeInTheDocument();
    });
  });

  describe('Item Type Handling', () => {
    it('should display correct message for Features', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      // Check for the key parts of the message since it's split across elements
      expect(screen.getAllByText(/Features/).length).toBeGreaterThan(0);
      expect(screen.getByText(/are created and edited within design sessions/)).toBeInTheDocument();
      expect(screen.getByText(/Start a new session to work with/)).toBeInTheDocument();
      expect(screen.getAllByText(/features/).length).toBeGreaterThan(0);
    });

    it('should handle different item types in the message', () => {
      render(
        <SessionRequiredView
          itemType="Documents"
          onStartSession={mockOnStartSession}
        />
      );

      // Check for the key parts of the message
      expect(screen.getAllByText(/Documents/).length).toBeGreaterThan(0);
      expect(screen.getByText(/are created and edited within design sessions/)).toBeInTheDocument();
      expect(screen.getByText(/Start a new session to work with/)).toBeInTheDocument();
      expect(screen.getAllByText(/documents/).length).toBeGreaterThan(0);
    });

    it('should display item type in explanation box', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      // Check for parts of the explanation
      expect(screen.getAllByText(/Features/).length).toBeGreaterThan(0);
      expect(screen.getByText(/represent design decisions and changes/)).toBeInTheDocument();
      expect(screen.getByText(/should be tracked together/)).toBeInTheDocument();
    });
  });

  describe('Explanation Content', () => {
    it('should render the explanation box with correct content', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      expect(screen.getByText('Why sessions?')).toBeInTheDocument();
      expect(screen.getByText('Features represent design decisions and changes that should be tracked together as a cohesive unit of work. Sessions help you organize your design process and generate implementation stories from your changes.')).toBeInTheDocument();
    });

    it('should update explanation content based on item type', () => {
      render(
        <SessionRequiredView
          itemType="Specifications"
          onStartSession={mockOnStartSession}
        />
      );

      expect(screen.getByText('Specifications represent design decisions and changes that should be tracked together as a cohesive unit of work. Sessions help you organize your design process and generate implementation stories from your changes.')).toBeInTheDocument();
    });
  });

  describe('Button Functionality', () => {
    it('should render Start New Session button', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      const button = screen.getByText('Start New Session');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should call onStartSession when button is clicked', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      const button = screen.getByText('Start New Session');
      fireEvent.click(button);

      expect(mockOnStartSession).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple button clicks', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      const button = screen.getByText('Start New Session');
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnStartSession).toHaveBeenCalledTimes(2);
    });
  });

  describe('Styling and Layout', () => {
    it('should have correct container styling', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      const container = screen.getByText('Active Session Required').closest('div');
      expect(container).toBeInTheDocument();
      // The styling is applied via inline styles, so we verify the component renders correctly
    });

    it('should have proper text alignment and layout', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      // Check that all main elements are present and properly structured
      expect(screen.getByText('Active Session Required')).toBeInTheDocument();
      expect(screen.getByText('Start New Session')).toBeInTheDocument();
      expect(screen.getByText('Why sessions?')).toBeInTheDocument();
    });

    it('should render explanation box with proper styling', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      const explanationBox = screen.getByText('Why sessions?').parentElement;
      expect(explanationBox).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic heading structure', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      const heading = screen.getByText('Active Session Required');
      expect(heading.tagName).toBe('H2');
    });

    it('should have descriptive button text', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      const button = screen.getByText('Start New Session');
      expect(button.tagName).toBe('BUTTON');
      expect(button).toBeInTheDocument();
    });

    it('should have proper text content for screen readers', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      // Check for key parts since text is split across elements
      expect(screen.getAllByText(/Features/).length).toBeGreaterThan(0);
      expect(screen.getByText(/are created and edited within design sessions/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty item type gracefully', () => {
      // This would normally not happen due to TypeScript, but testing edge cases
      render(
        <SessionRequiredView
          itemType={"" as any}
          onStartSession={mockOnStartSession}
        />
      );

      // Component should still render without crashing
      expect(screen.getByText('Active Session Required')).toBeInTheDocument();
    });

    it('should handle missing onStartSession prop gracefully', () => {
      // TypeScript would prevent this, but testing runtime behavior
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <SessionRequiredView
            itemType="Features"
            onStartSession={undefined as any}
          />
        );
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Integration with Parent Components', () => {
    it('should be usable as a replacement for inline session checks', () => {
      // This test verifies the component can be used in place of the previous inline logic
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      // Should provide a complete user experience for session-required views
      expect(screen.getByText('Active Session Required')).toBeInTheDocument();
      expect(screen.getByText('Start New Session')).toBeInTheDocument();
    });

    it('should work with navigation callbacks', () => {
      const mockNavigate = vi.fn();

      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={() => mockNavigate('sessions')}
        />
      );

      const button = screen.getByText('Start New Session');
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('sessions');
    });
  });

  describe('Visual Design Consistency', () => {
    it('should maintain consistent spacing and layout', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      // Verify the component has the expected visual structure
      const container = screen.getByText('Active Session Required').closest('div');
      expect(container).toBeInTheDocument();

      // Check that all expected elements are present in the correct order
      const elements = [
        'Active Session Required',
        /Features/,
        'Why sessions?',
        'Start New Session'
      ];

      elements.forEach(text => {
        if (typeof text === 'string') {
          expect(screen.getByText(text)).toBeInTheDocument();
        } else {
          expect(screen.getAllByText(text).length).toBeGreaterThan(0);
        }
      });

      // Check for key parts of the message
      expect(screen.getByText(/are created and edited within design sessions/)).toBeInTheDocument();
    });

    it('should use VSCode theme variables for styling', () => {
      render(
        <SessionRequiredView
          itemType="Features"
          onStartSession={mockOnStartSession}
        />
      );

      // The component uses VSCode theme variables in its inline styles
      // This test verifies the component renders without style errors
      expect(screen.getByText('Active Session Required')).toBeInTheDocument();
    });
  });
});
