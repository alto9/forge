import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { ActorNode, ActorNodeData } from '../ActorNode';
import type { NodeProps } from 'reactflow';

// Wrapper component to provide ReactFlow context
const ReactFlowWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
);

// Mock NodeProps for testing
const createMockNodeProps = (data: Partial<ActorNodeData> = {}): NodeProps<ActorNodeData> => ({
  id: 'test-actor-node',
  data: { 
    label: 'Test Actor',
    actor_id: 'test-actor',
    actorType: 'human',
    ...data 
  },
  type: 'actor',
  xPos: 0,
  yPos: 0,
  selected: false,
  zIndex: 0,
  isConnectable: true,
  dragging: false,
});

describe('ActorNode', () => {
  describe('Rendering', () => {
    it('should render with label', () => {
      render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps({ label: 'Developer' })} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('Developer')).toBeInTheDocument();
    });

    it('should render actor type badge', () => {
      render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps({ actorType: 'human' })} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('human')).toBeInTheDocument();
    });

    it('should default actorType to system', () => {
      render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps({ actorType: undefined })} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('system')).toBeInTheDocument();
    });

    it('should render silhouette icon SVG', () => {
      const { container } = render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps()} />
        </ReactFlowWrapper>
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });
  });

  describe('Actor Types', () => {
    it('should render human actor type correctly', () => {
      render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps({ actorType: 'human' })} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('human')).toBeInTheDocument();
    });

    it('should render system actor type correctly', () => {
      render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps({ actorType: 'system' })} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('system')).toBeInTheDocument();
    });

    it('should render external actor type correctly', () => {
      render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps({ actorType: 'external' })} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('external')).toBeInTheDocument();
    });
  });

  describe('Visual Appearance', () => {
    it('should have circular silhouette icon container', () => {
      const { container } = render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps()} />
        </ReactFlowWrapper>
      );

      // Find the icon container (48px circular div)
      const iconContainer = container.querySelector('div > div > div > div:first-child');
      expect(iconContainer).toBeInTheDocument();
      const style = iconContainer?.getAttribute('style');
      expect(style).toContain('border-radius: 50%');
      expect(style).toContain('width: 48px');
      expect(style).toContain('height: 48px');
    });

    it('should have minimum dimensions', () => {
      const { container } = render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps()} />
        </ReactFlowWrapper>
      );

      const nodeDiv = container.querySelector('div');
      const style = nodeDiv?.getAttribute('style');
      expect(style).toContain('min-width: 80px');
      expect(style).toContain('min-height: 100px');
    });

    it('should have proper styling structure', () => {
      const { container } = render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps()} />
        </ReactFlowWrapper>
      );

      // Verify the actor-node div exists with the expected class
      const nodeDiv = container.querySelector('.actor-node');
      expect(nodeDiv).toBeTruthy();
      
      // Verify it has inline styles (CSS variables are defined in source but may not render in test env)
      const style = nodeDiv?.getAttribute('style');
      expect(style).toBeTruthy();
      expect(style).toContain('position: relative');
    });
  });

  describe('Connection Handles', () => {
    it('should have connection handles on all four sides', () => {
      const { container } = render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps()} />
        </ReactFlowWrapper>
      );

      // Check for handles - they have class "react-flow__handle"
      const handles = container.querySelectorAll('.react-flow__handle');
      // 8 handles total: source and target on each of 4 sides
      expect(handles.length).toBe(8);
    });

    it('should have handles with correct data attributes', () => {
      const { container } = render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps()} />
        </ReactFlowWrapper>
      );

      // React Flow handles have data-handleid attributes
      const handles = container.querySelectorAll('.react-flow__handle');
      
      // Should have 8 handles total (source + target on each of 4 sides)
      expect(handles.length).toBe(8);
      
      // Verify we have the expected handle IDs
      const handleIds = Array.from(handles).map(h => h.getAttribute('data-handleid'));
      expect(handleIds).toContain('top-source');
      expect(handleIds).toContain('top-target');
      expect(handleIds).toContain('bottom-source');
      expect(handleIds).toContain('bottom-target');
    });
  });

  describe('Selection State', () => {
    it('should show different border when selected', () => {
      const { container, rerender } = render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps()} />
        </ReactFlowWrapper>
      );

      const unselectedStyle = container.querySelector('div')?.getAttribute('style');

      rerender(
        <ReactFlowWrapper>
          <ActorNode {...{ ...createMockNodeProps(), selected: true }} />
        </ReactFlowWrapper>
      );

      const selectedStyle = container.querySelector('div')?.getAttribute('style');
      
      // Border should change when selected
      expect(unselectedStyle).not.toEqual(selectedStyle);
      expect(selectedStyle).toContain('var(--vscode-focusBorder');
    });

    it('should show box shadow when selected', () => {
      const { container } = render(
        <ReactFlowWrapper>
          <ActorNode {...{ ...createMockNodeProps(), selected: true }} />
        </ReactFlowWrapper>
      );

      const style = container.querySelector('div')?.getAttribute('style');
      expect(style).toContain('box-shadow');
      expect(style).not.toContain('box-shadow: none');
    });
  });

  describe('Label Editing', () => {
    it('should show label in non-editing state', () => {
      render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps({ label: 'API Server' })} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('API Server')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should switch to edit mode on double-click', () => {
      render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps({ label: 'API Server' })} />
        </ReactFlowWrapper>
      );

      const labelElement = screen.getByText('API Server');
      fireEvent.doubleClick(labelElement);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('API Server');
    });

    it('should have input with correct styling in edit mode', () => {
      render(
        <ReactFlowWrapper>
          <ActorNode {...createMockNodeProps({ label: 'API Server' })} />
        </ReactFlowWrapper>
      );

      const labelElement = screen.getByText('API Server');
      fireEvent.doubleClick(labelElement);

      const input = screen.getByRole('textbox');
      const style = input.getAttribute('style');
      expect(style).toContain('text-align: center');
    });
  });

  describe('ActorNodeData Interface', () => {
    it('should accept required label field', () => {
      const data: ActorNodeData = {
        label: 'Test'
      };
      expect(data.label).toBe('Test');
    });

    it('should accept optional actor_id field', () => {
      const data: ActorNodeData = {
        label: 'Test',
        actor_id: 'test-id'
      };
      expect(data.actor_id).toBe('test-id');
    });

    it('should accept optional actorType field', () => {
      const data: ActorNodeData = {
        label: 'Test',
        actorType: 'external'
      };
      expect(data.actorType).toBe('external');
    });
  });
});

