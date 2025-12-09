import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import {
  VPCContainerNode,
  SubnetContainerNode,
  GeneralGroupNode,
  containerNodeTypes,
} from '../ContainerNodes';

// Wrapper component to provide ReactFlow context
const ReactFlowWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
);

// Mock NodeProps for testing
const createMockNodeProps = (label: string) => ({
  id: 'test-node',
  data: { label },
  type: 'test',
  xPos: 0,
  yPos: 0,
  selected: false,
  zIndex: 0,
  isConnectable: true,
  dragging: false,
});

describe('Container Nodes', () => {
  describe('VPCContainerNode', () => {
    it('should render with label', () => {
      render(
        <ReactFlowWrapper>
          <VPCContainerNode {...createMockNodeProps('Production VPC')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('VPC: Production VPC')).toBeInTheDocument();
    });

    it('should have testid for identification', () => {
      render(
        <ReactFlowWrapper>
          <VPCContainerNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByTestId('vpc-container-node')).toBeInTheDocument();
    });

    it('should display VPC prefix in label', () => {
      render(
        <ReactFlowWrapper>
          <VPCContainerNode {...createMockNodeProps('My Network')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText(/^VPC:/)).toBeInTheDocument();
    });

    it('should have minimum dimensions', () => {
      render(
        <ReactFlowWrapper>
          <VPCContainerNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      const node = screen.getByTestId('vpc-container-node');
      const style = node.getAttribute('style');
      expect(style).toContain('min-width: 300px');
      expect(style).toContain('min-height: 200px');
    });
  });

  describe('SubnetContainerNode', () => {
    it('should render with label', () => {
      render(
        <ReactFlowWrapper>
          <SubnetContainerNode {...createMockNodeProps('Private Subnet')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('Subnet: Private Subnet')).toBeInTheDocument();
    });

    it('should have testid for identification', () => {
      render(
        <ReactFlowWrapper>
          <SubnetContainerNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByTestId('subnet-container-node')).toBeInTheDocument();
    });

    it('should display Subnet prefix in label', () => {
      render(
        <ReactFlowWrapper>
          <SubnetContainerNode {...createMockNodeProps('Public')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText(/^Subnet:/)).toBeInTheDocument();
    });

    it('should have dashed border style', () => {
      render(
        <ReactFlowWrapper>
          <SubnetContainerNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      const node = screen.getByTestId('subnet-container-node');
      const style = node.getAttribute('style');
      expect(style).toContain('dashed');
    });

    it('should have different minimum dimensions than VPC', () => {
      render(
        <ReactFlowWrapper>
          <SubnetContainerNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      const node = screen.getByTestId('subnet-container-node');
      const style = node.getAttribute('style');
      expect(style).toContain('min-width: 250px');
      expect(style).toContain('min-height: 150px');
    });
  });

  describe('GeneralGroupNode', () => {
    it('should render with label', () => {
      render(
        <ReactFlowWrapper>
          <GeneralGroupNode {...createMockNodeProps('Backend Services')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('Backend Services')).toBeInTheDocument();
    });

    it('should have testid for identification', () => {
      render(
        <ReactFlowWrapper>
          <GeneralGroupNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByTestId('general-group-node')).toBeInTheDocument();
    });

    it('should display label without prefix', () => {
      render(
        <ReactFlowWrapper>
          <GeneralGroupNode {...createMockNodeProps('API Layer')} />
        </ReactFlowWrapper>
      );

      // Should just have the label, no prefix
      expect(screen.getByText('API Layer')).toBeInTheDocument();
      expect(screen.queryByText(/^VPC:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Subnet:/)).not.toBeInTheDocument();
    });

    it('should have neutral styling', () => {
      render(
        <ReactFlowWrapper>
          <GeneralGroupNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      const node = screen.getByTestId('general-group-node');
      const style = node.getAttribute('style');
      expect(style).toContain('#888888'); // Neutral gray border
    });
  });

  describe('containerNodeTypes', () => {
    it('should contain all container node type mappings', () => {
      expect(containerNodeTypes).toHaveProperty('vpc-container');
      expect(containerNodeTypes).toHaveProperty('subnet-container');
      expect(containerNodeTypes).toHaveProperty('general-group');
    });

    it('should map to correct components', () => {
      expect(containerNodeTypes['vpc-container']).toBe(VPCContainerNode);
      expect(containerNodeTypes['subnet-container']).toBe(SubnetContainerNode);
      expect(containerNodeTypes['general-group']).toBe(GeneralGroupNode);
    });

    it('should have exactly 3 container types', () => {
      expect(Object.keys(containerNodeTypes)).toHaveLength(3);
    });
  });

  describe('Visual distinction', () => {
    it('should have different background colors for each container type', () => {
      const { rerender } = render(
        <ReactFlowWrapper>
          <VPCContainerNode {...createMockNodeProps('VPC')} />
        </ReactFlowWrapper>
      );
      const vpcStyle = screen.getByTestId('vpc-container-node').getAttribute('style');

      rerender(
        <ReactFlowWrapper>
          <SubnetContainerNode {...createMockNodeProps('Subnet')} />
        </ReactFlowWrapper>
      );
      const subnetStyle = screen.getByTestId('subnet-container-node').getAttribute('style');

      rerender(
        <ReactFlowWrapper>
          <GeneralGroupNode {...createMockNodeProps('Group')} />
        </ReactFlowWrapper>
      );
      const groupStyle = screen.getByTestId('general-group-node').getAttribute('style');

      // Each should have different background colors
      expect(vpcStyle).toContain('#f0f0f0');
      expect(subnetStyle).toContain('#e8f4f8');
      expect(groupStyle).toContain('#fafafa');
    });

    it('should have different border colors for each container type', () => {
      const { rerender } = render(
        <ReactFlowWrapper>
          <VPCContainerNode {...createMockNodeProps('VPC')} />
        </ReactFlowWrapper>
      );
      const vpcStyle = screen.getByTestId('vpc-container-node').getAttribute('style');

      rerender(
        <ReactFlowWrapper>
          <SubnetContainerNode {...createMockNodeProps('Subnet')} />
        </ReactFlowWrapper>
      );
      const subnetStyle = screen.getByTestId('subnet-container-node').getAttribute('style');

      rerender(
        <ReactFlowWrapper>
          <GeneralGroupNode {...createMockNodeProps('Group')} />
        </ReactFlowWrapper>
      );
      const groupStyle = screen.getByTestId('general-group-node').getAttribute('style');

      // Each should have different border colors
      expect(vpcStyle).toContain('#232F3E'); // AWS dark blue
      expect(subnetStyle).toContain('#1B6B93'); // Distinct blue
      expect(groupStyle).toContain('#888888'); // Neutral gray
    });
  });
});



