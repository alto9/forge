import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import {
  AWSLambdaNode,
  AWSS3Node,
  AWSDynamoDBNode,
  AWSAPIGatewayNode,
  AWSEC2Node,
  AWSRDSNode,
  AWSCloudFrontNode,
  awsNodeTypes,
} from '../AWSServiceNodes';

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

describe('AWS Service Nodes', () => {
  describe('AWSLambdaNode', () => {
    it('should render with label', () => {
      render(
        <ReactFlowWrapper>
          <AWSLambdaNode {...createMockNodeProps('My Lambda')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('My Lambda')).toBeInTheDocument();
    });

    it('should have testid for identification', () => {
      render(
        <ReactFlowWrapper>
          <AWSLambdaNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByTestId('aws-lambda-node')).toBeInTheDocument();
    });

    it('should display Lambda icon placeholder', () => {
      render(
        <ReactFlowWrapper>
          <AWSLambdaNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('λ')).toBeInTheDocument();
    });
  });

  describe('AWSS3Node', () => {
    it('should render with label', () => {
      render(
        <ReactFlowWrapper>
          <AWSS3Node {...createMockNodeProps('My Bucket')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('My Bucket')).toBeInTheDocument();
    });

    it('should have testid for identification', () => {
      render(
        <ReactFlowWrapper>
          <AWSS3Node {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByTestId('aws-s3-node')).toBeInTheDocument();
    });

    it('should display S3 icon placeholder', () => {
      render(
        <ReactFlowWrapper>
          <AWSS3Node {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('S3')).toBeInTheDocument();
    });
  });

  describe('AWSDynamoDBNode', () => {
    it('should render with label', () => {
      render(
        <ReactFlowWrapper>
          <AWSDynamoDBNode {...createMockNodeProps('UsersTable')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('UsersTable')).toBeInTheDocument();
    });

    it('should have testid for identification', () => {
      render(
        <ReactFlowWrapper>
          <AWSDynamoDBNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByTestId('aws-dynamodb-node')).toBeInTheDocument();
    });

    it('should display DynamoDB icon placeholder', () => {
      render(
        <ReactFlowWrapper>
          <AWSDynamoDBNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('DB')).toBeInTheDocument();
    });
  });

  describe('AWSAPIGatewayNode', () => {
    it('should render with label', () => {
      render(
        <ReactFlowWrapper>
          <AWSAPIGatewayNode {...createMockNodeProps('REST API')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('REST API')).toBeInTheDocument();
    });

    it('should have testid for identification', () => {
      render(
        <ReactFlowWrapper>
          <AWSAPIGatewayNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByTestId('aws-apigateway-node')).toBeInTheDocument();
    });

    it('should display API Gateway icon placeholder', () => {
      render(
        <ReactFlowWrapper>
          <AWSAPIGatewayNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('API')).toBeInTheDocument();
    });
  });

  describe('AWSEC2Node', () => {
    it('should render with label', () => {
      render(
        <ReactFlowWrapper>
          <AWSEC2Node {...createMockNodeProps('Web Server')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('Web Server')).toBeInTheDocument();
    });

    it('should have testid for identification', () => {
      render(
        <ReactFlowWrapper>
          <AWSEC2Node {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByTestId('aws-ec2-node')).toBeInTheDocument();
    });

    it('should display EC2 icon placeholder', () => {
      render(
        <ReactFlowWrapper>
          <AWSEC2Node {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('EC2')).toBeInTheDocument();
    });
  });

  describe('AWSRDSNode', () => {
    it('should render with label', () => {
      render(
        <ReactFlowWrapper>
          <AWSRDSNode {...createMockNodeProps('PostgreSQL')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    });

    it('should have testid for identification', () => {
      render(
        <ReactFlowWrapper>
          <AWSRDSNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByTestId('aws-rds-node')).toBeInTheDocument();
    });

    it('should display RDS icon placeholder', () => {
      render(
        <ReactFlowWrapper>
          <AWSRDSNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('RDS')).toBeInTheDocument();
    });
  });

  describe('AWSCloudFrontNode', () => {
    it('should render with label', () => {
      render(
        <ReactFlowWrapper>
          <AWSCloudFrontNode {...createMockNodeProps('CDN Distribution')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('CDN Distribution')).toBeInTheDocument();
    });

    it('should have testid for identification', () => {
      render(
        <ReactFlowWrapper>
          <AWSCloudFrontNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByTestId('aws-cloudfront-node')).toBeInTheDocument();
    });

    it('should display CloudFront icon placeholder', () => {
      render(
        <ReactFlowWrapper>
          <AWSCloudFrontNode {...createMockNodeProps('Test')} />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('CF')).toBeInTheDocument();
    });
  });

  describe('awsNodeTypes', () => {
    it('should contain all AWS node type mappings', () => {
      expect(awsNodeTypes).toHaveProperty('aws-lambda');
      expect(awsNodeTypes).toHaveProperty('aws-s3');
      expect(awsNodeTypes).toHaveProperty('aws-dynamodb');
      expect(awsNodeTypes).toHaveProperty('aws-apigateway');
      expect(awsNodeTypes).toHaveProperty('aws-ec2');
      expect(awsNodeTypes).toHaveProperty('aws-rds');
      expect(awsNodeTypes).toHaveProperty('aws-cloudfront');
    });

    it('should map to correct components', () => {
      expect(awsNodeTypes['aws-lambda']).toBe(AWSLambdaNode);
      expect(awsNodeTypes['aws-s3']).toBe(AWSS3Node);
      expect(awsNodeTypes['aws-dynamodb']).toBe(AWSDynamoDBNode);
      expect(awsNodeTypes['aws-apigateway']).toBe(AWSAPIGatewayNode);
      expect(awsNodeTypes['aws-ec2']).toBe(AWSEC2Node);
      expect(awsNodeTypes['aws-rds']).toBe(AWSRDSNode);
      expect(awsNodeTypes['aws-cloudfront']).toBe(AWSCloudFrontNode);
    });

    it('should have exactly 7 node types', () => {
      expect(Object.keys(awsNodeTypes)).toHaveLength(7);
    });
  });
});



