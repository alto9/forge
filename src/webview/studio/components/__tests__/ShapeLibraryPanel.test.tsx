import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShapeLibraryPanel } from '../ShapeLibraryPanel';

describe('ShapeLibraryPanel Component', () => {
  const mockOnDragStart = vi.fn();

  beforeEach(() => {
    mockOnDragStart.mockClear();
  });

  describe('Rendering', () => {
    it('should render the Shape Library header', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      expect(screen.getByText('Shape Library')).toBeInTheDocument();
    });

    it('should render General and AWS categories', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('AWS')).toBeInTheDocument();
    });

    it('should render with both categories expanded by default', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      // General shapes should be visible
      expect(screen.getByText('Rectangle')).toBeInTheDocument();
      expect(screen.getByText('Circle')).toBeInTheDocument();
      expect(screen.getByText('Ellipse')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('General Group')).toBeInTheDocument();

      // AWS shapes should be visible
      expect(screen.getByText('Lambda')).toBeInTheDocument();
      expect(screen.getByText('S3')).toBeInTheDocument();
      expect(screen.getByText('DynamoDB')).toBeInTheDocument();
      expect(screen.getByText('API Gateway')).toBeInTheDocument();
    });

    it('should render all General shapes in General category', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      const generalShapes = ['Rectangle', 'Circle', 'Ellipse', 'Text', 'General Group'];
      generalShapes.forEach((shape) => {
        expect(screen.getByText(shape)).toBeInTheDocument();
      });
    });

    it('should render all AWS shapes in AWS category', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      const awsShapes = [
        'Lambda',
        'S3',
        'DynamoDB',
        'API Gateway',
        'EC2',
        'RDS',
        'CloudFront',
        'VPC',
        'Subnet',
      ];
      awsShapes.forEach((shape) => {
        expect(screen.getByText(shape)).toBeInTheDocument();
      });
    });
  });

  describe('Category Collapse/Expand', () => {
    it('should collapse General category when clicked', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      // Initially, Rectangle should be visible
      expect(screen.getByText('Rectangle')).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(screen.getByText('General'));

      // Rectangle should no longer be visible
      expect(screen.queryByText('Rectangle')).not.toBeInTheDocument();
    });

    it('should collapse AWS category when clicked', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      // Initially, Lambda should be visible
      expect(screen.getByText('Lambda')).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(screen.getByText('AWS'));

      // Lambda should no longer be visible
      expect(screen.queryByText('Lambda')).not.toBeInTheDocument();
    });

    it('should expand a collapsed category when clicked again', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      // Collapse
      fireEvent.click(screen.getByText('General'));
      expect(screen.queryByText('Rectangle')).not.toBeInTheDocument();

      // Expand
      fireEvent.click(screen.getByText('General'));
      expect(screen.getByText('Rectangle')).toBeInTheDocument();
    });

    it('should toggle categories independently', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      // Collapse General
      fireEvent.click(screen.getByText('General'));

      // General shapes should be hidden
      expect(screen.queryByText('Rectangle')).not.toBeInTheDocument();

      // AWS shapes should still be visible
      expect(screen.getByText('Lambda')).toBeInTheDocument();
    });

    it('should support keyboard navigation for category headers', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      const generalHeader = screen.getByText('General').parentElement;

      // Trigger with Enter key
      fireEvent.keyDown(generalHeader!, { key: 'Enter' });
      expect(screen.queryByText('Rectangle')).not.toBeInTheDocument();

      // Trigger with Space key
      fireEvent.keyDown(generalHeader!, { key: ' ' });
      expect(screen.getByText('Rectangle')).toBeInTheDocument();
    });
  });

  describe('Drag Functionality', () => {
    it('should call onDragStart when dragging a shape', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      const rectangleItem = screen.getByText('Rectangle').parentElement;
      fireEvent.dragStart(rectangleItem!);

      expect(mockOnDragStart).toHaveBeenCalledTimes(1);
      expect(mockOnDragStart).toHaveBeenCalledWith(
        expect.any(Object), // event
        'rect', // shapeType (id)
        expect.objectContaining({
          id: 'rect',
          name: 'Rectangle',
          category: 'general',
          type: 'default',
        })
      );
    });

    it('should pass correct shape data for AWS shapes', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      const lambdaItem = screen.getByText('Lambda').parentElement;
      fireEvent.dragStart(lambdaItem!);

      expect(mockOnDragStart).toHaveBeenCalledWith(
        expect.any(Object),
        'lambda',
        expect.objectContaining({
          id: 'lambda',
          name: 'Lambda',
          category: 'aws',
          type: 'aws-lambda',
        })
      );
    });

    it('should make shape items draggable', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      const rectangleItem = screen.getByText('Rectangle').parentElement;
      expect(rectangleItem).toHaveAttribute('draggable', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should have proper region label', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      expect(screen.getByRole('region', { name: 'Shape Library' })).toBeInTheDocument();
    });

    it('should have proper aria-expanded on category headers', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      const generalHeader = screen.getByText('General').parentElement;
      expect(generalHeader).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(generalHeader!);
      expect(generalHeader).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have proper aria-label on shape items', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      const rectangleItem = screen.getByText('Rectangle').parentElement;
      expect(rectangleItem).toHaveAttribute('aria-label', 'Drag Rectangle shape');
    });

    it('should have button role on category headers', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      const generalHeader = screen.getByText('General').parentElement;
      expect(generalHeader).toHaveAttribute('role', 'button');
    });

    it('should have listitem role on shape items', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      const rectangleItem = screen.getByText('Rectangle').parentElement;
      expect(rectangleItem).toHaveAttribute('role', 'listitem');
    });
  });

  describe('VSCode Styling', () => {
    it('should render the panel with proper structure', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      const panel = screen.getByRole('region', { name: 'Shape Library' });
      expect(panel).toBeInTheDocument();
      // Verify inline styles are applied (CSS variables are applied but not resolved in test env)
      expect(panel).toHaveAttribute('style');
    });

    it('should render header with proper structure', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      const header = screen.getByText('Shape Library');
      expect(header.tagName).toBe('H3');
    });

    it('should have panel width of 250px', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      const panel = screen.getByRole('region', { name: 'Shape Library' });
      const style = panel.getAttribute('style');
      expect(style).toContain('width: 250px');
    });

    it('should include VSCode CSS variable references in styles', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      const panel = screen.getByRole('region', { name: 'Shape Library' });
      const style = panel.getAttribute('style');
      // Verify that VSCode CSS variables are referenced in the styles
      expect(style).toContain('--vscode');
    });
  });

  describe('Container Shapes', () => {
    it('should render VPC in AWS category', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      expect(screen.getByText('VPC')).toBeInTheDocument();
    });

    it('should render Subnet in AWS category', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      expect(screen.getByText('Subnet')).toBeInTheDocument();
    });

    it('should render General Group in General category', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      expect(screen.getByText('General Group')).toBeInTheDocument();
    });

    it('should hide VPC when AWS category is collapsed', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      fireEvent.click(screen.getByText('AWS'));

      expect(screen.queryByText('VPC')).not.toBeInTheDocument();
    });

    it('should hide General Group when General category is collapsed', () => {
      render(<ShapeLibraryPanel onDragStart={mockOnDragStart} />);

      fireEvent.click(screen.getByText('General'));

      expect(screen.queryByText('General Group')).not.toBeInTheDocument();
    });
  });
});

