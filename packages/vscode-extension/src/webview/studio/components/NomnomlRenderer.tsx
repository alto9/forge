import React, { useEffect, useRef, useState } from 'react';
import * as nomnoml from 'nomnoml';

interface NomnomlRendererProps {
  source: string;
  className?: string;
}

/**
 * NomnomlRenderer component
 * 
 * Renders nomnoml diagram source code into SVG diagrams for display in Forge Studio.
 * Automatically updates when source changes and handles errors gracefully.
 */
export const NomnomlRenderer: React.FC<NomnomlRendererProps> = ({ source, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !source.trim()) {
      return;
    }

    try {
      // Clear any previous error
      setError(null);

      // Render the nomnoml diagram to SVG
      const svg = nomnoml.renderSvg(source);

      // Clear the container and insert the new SVG
      containerRef.current.innerHTML = '';
      containerRef.current.innerHTML = svg;

      // Style the SVG for responsive display
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.maxWidth = '100%';
        svgElement.style.height = 'auto';
        svgElement.style.display = 'block';
        svgElement.style.margin = '0 auto';
      }
    } catch (err) {
      // Handle rendering errors gracefully
      const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram';
      setError(errorMessage);
      console.error('Nomnoml rendering error:', err);
    }
  }, [source]);

  const containerStyle: React.CSSProperties = {
    padding: '16px',
    background: 'var(--vscode-editor-background)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '4px',
    overflow: 'auto',
    minHeight: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const errorStyle: React.CSSProperties = {
    color: 'var(--vscode-errorForeground)',
    padding: '8px',
    background: 'var(--vscode-inputValidation-errorBackground)',
    border: '1px solid var(--vscode-inputValidation-errorBorder)',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'var(--vscode-font-family)',
  };

  if (error) {
    return (
      <div style={containerStyle} className={className}>
        <div style={errorStyle}>
          <strong>Diagram Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!source.trim()) {
    return (
      <div style={containerStyle} className={className}>
        <div style={{ 
          color: 'var(--vscode-descriptionForeground)', 
          fontSize: '12px',
          fontStyle: 'italic'
        }}>
          No diagram content provided
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      style={containerStyle}
      className={className}
    />
  );
};

