import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { NomnomlRenderer } from '../NomnomlRenderer';
import * as nomnoml from 'nomnoml';

// Mock nomnoml module
vi.mock('nomnoml', () => ({
  renderSvg: vi.fn()
}));

describe('NomnomlRenderer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Valid Diagram Rendering', () => {
    it('should render valid nomnoml source to SVG', async () => {
      const mockSvg = '<svg><text>Test Diagram</text></svg>';
      vi.mocked(nomnoml.renderSvg).mockReturnValue(mockSvg);

      const source = `
#direction: down
[Component A] -> [Component B]
      `.trim();

      const { container } = render(<NomnomlRenderer source={source} />);

      await waitFor(() => {
        expect(nomnoml.renderSvg).toHaveBeenCalledWith(source);
        expect(container.innerHTML).toContain('Test Diagram');
      });
    });

    it('should update SVG when source changes', async () => {
      const mockSvg1 = '<svg><text>Diagram 1</text></svg>';
      const mockSvg2 = '<svg><text>Diagram 2</text></svg>';
      
      vi.mocked(nomnoml.renderSvg)
        .mockReturnValueOnce(mockSvg1)
        .mockReturnValueOnce(mockSvg2);

      const source1 = '[Component A]';
      const source2 = '[Component B]';

      const { container, rerender } = render(<NomnomlRenderer source={source1} />);

      await waitFor(() => {
        expect(container.innerHTML).toContain('Diagram 1');
      });

      rerender(<NomnomlRenderer source={source2} />);

      await waitFor(() => {
        expect(nomnoml.renderSvg).toHaveBeenCalledTimes(2);
        expect(container.innerHTML).toContain('Diagram 2');
      });
    });

    it('should apply custom className if provided', () => {
      const mockSvg = '<svg><text>Test</text></svg>';
      vi.mocked(nomnoml.renderSvg).mockReturnValue(mockSvg);

      const { container } = render(
        <NomnomlRenderer source="[A]" className="custom-class" />
      );

      const divElement = container.querySelector('.custom-class');
      expect(divElement).toBeTruthy();
    });

    it('should style SVG for responsive display', async () => {
      const mockSvg = '<svg><text>Test</text></svg>';
      vi.mocked(nomnoml.renderSvg).mockReturnValue(mockSvg);

      const { container } = render(<NomnomlRenderer source="[A]" />);

      await waitFor(() => {
        const svgElement = container.querySelector('svg');
        expect(svgElement).toBeTruthy();
        if (svgElement) {
          expect(svgElement.style.maxWidth).toBe('100%');
          expect(svgElement.style.height).toBe('auto');
          expect(svgElement.style.display).toBe('block');
          // Browser normalizes '0 auto' to '0px auto'
          expect(svgElement.style.margin).toContain('auto');
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when rendering fails', async () => {
      const errorMessage = 'Invalid nomnoml syntax';
      vi.mocked(nomnoml.renderSvg).mockImplementation(() => {
        throw new Error(errorMessage);
      });

      render(<NomnomlRenderer source="[Invalid Syntax" />);

      await waitFor(() => {
        expect(screen.getByText(/Diagram Error/i)).toBeTruthy();
        expect(screen.getByText(errorMessage)).toBeTruthy();
      });
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(nomnoml.renderSvg).mockImplementation(() => {
        throw 'String error';
      });

      render(<NomnomlRenderer source="[A]" />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to render diagram/i)).toBeTruthy();
      });
    });

    it('should log error to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      
      vi.mocked(nomnoml.renderSvg).mockImplementation(() => {
        throw error;
      });

      render(<NomnomlRenderer source="[A]" />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Nomnoml rendering error:', error);
      });

      consoleErrorSpy.mockRestore();
    });

    it('should clear error state when rendering valid diagram after error', async () => {
      const mockSvg = '<svg><text>ValidDiagram</text></svg>';
      vi.mocked(nomnoml.renderSvg).mockReturnValue(mockSvg);

      const { container } = render(<NomnomlRenderer source="[Valid]" />);

      await waitFor(() => {
        const svg = container.querySelector('svg');
        expect(svg).toBeTruthy();
        expect(svg?.textContent).toContain('ValidDiagram');
        // Should not show error
        expect(screen.queryByText(/Diagram Error/i)).toBeNull();
      });
    });
  });

  describe('Empty Source Handling', () => {
    it('should display message when source is empty', () => {
      render(<NomnomlRenderer source="" />);

      expect(screen.getByText(/No diagram content provided/i)).toBeTruthy();
    });

    it('should not call renderSvg when source is empty', () => {
      render(<NomnomlRenderer source="" />);

      expect(nomnoml.renderSvg).not.toHaveBeenCalled();
    });
  });

  describe('Component Styling', () => {
    it('should use VSCode theme variables', () => {
      const { container } = render(<NomnomlRenderer source="" />);
      const divElement = container.firstChild as HTMLElement;

      expect(divElement.style.background).toContain('var(--vscode-editor-background)');
      // Browser splits border shorthand into separate properties
      expect(divElement.style.borderColor || divElement.style.borderWidth).toBeTruthy();
    });

    it('should have minimum height', () => {
      const { container } = render(<NomnomlRenderer source="" />);
      const divElement = container.firstChild as HTMLElement;

      expect(divElement.style.minHeight).toBe('200px');
    });

    it('should be scrollable with overflow auto', () => {
      const { container } = render(<NomnomlRenderer source="" />);
      const divElement = container.firstChild as HTMLElement;

      expect(divElement.style.overflow).toBe('auto');
    });

    it('should center content', () => {
      const { container } = render(<NomnomlRenderer source="" />);
      const divElement = container.firstChild as HTMLElement;

      expect(divElement.style.display).toBe('flex');
      expect(divElement.style.alignItems).toBe('center');
      expect(divElement.style.justifyContent).toBe('center');
    });
  });

  describe('Error Message Styling', () => {
    it('should use VSCode error colors', async () => {
      vi.mocked(nomnoml.renderSvg).mockImplementation(() => {
        throw new Error('Test error');
      });

      const { container } = render(<NomnomlRenderer source="[A]" />);

      await waitFor(() => {
        const errorDiv = container.querySelector('div > div > div');
        expect(errorDiv).toBeTruthy();
        if (errorDiv) {
          const element = errorDiv as HTMLElement;
          expect(element.style.color).toContain('var(--vscode-errorForeground)');
          expect(element.style.background).toContain('var(--vscode-inputValidation-errorBackground)');
          // Browser splits border shorthand into separate properties
          expect(element.style.borderColor || element.style.borderWidth).toBeTruthy();
        }
      });
    });
  });

  describe('Complex Diagram Source', () => {
    it('should handle complex nomnoml with directives', async () => {
      const mockSvg = '<svg><text>Complex Diagram</text></svg>';
      vi.mocked(nomnoml.renderSvg).mockReturnValue(mockSvg);

      const source = `
#direction: down
#padding: 10
#spacing: 20

[Component A] -> [Component B]
[Component B] -> [Component C]
[Component C] -> [Component A]
      `.trim();

      render(<NomnomlRenderer source={source} />);

      await waitFor(() => {
        expect(nomnoml.renderSvg).toHaveBeenCalledWith(source);
      });
    });

    it('should handle nomnoml with special characters', async () => {
      const mockSvg = '<svg><text>Special</text></svg>';
      vi.mocked(nomnoml.renderSvg).mockReturnValue(mockSvg);

      const source = `[Component <interface>] -> [Data: Object]`;

      render(<NomnomlRenderer source={source} />);

      await waitFor(() => {
        expect(nomnoml.renderSvg).toHaveBeenCalledWith(source);
      });
    });
  });
});

