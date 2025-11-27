import { describe, it, expect } from 'vitest';
import { nodeTypes } from '../nodeTypes';
import {
  AWSLambdaNode,
  AWSS3Node,
  AWSDynamoDBNode,
  AWSAPIGatewayNode,
  AWSEC2Node,
  AWSRDSNode,
  AWSCloudFrontNode,
} from '../AWSServiceNodes';
import {
  VPCContainerNode,
  SubnetContainerNode,
  GeneralGroupNode,
} from '../ContainerNodes';

describe('nodeTypes', () => {
  describe('AWS Service Node Types', () => {
    it('should include aws-lambda node type', () => {
      expect(nodeTypes).toHaveProperty('aws-lambda');
      expect(nodeTypes['aws-lambda']).toBe(AWSLambdaNode);
    });

    it('should include aws-s3 node type', () => {
      expect(nodeTypes).toHaveProperty('aws-s3');
      expect(nodeTypes['aws-s3']).toBe(AWSS3Node);
    });

    it('should include aws-dynamodb node type', () => {
      expect(nodeTypes).toHaveProperty('aws-dynamodb');
      expect(nodeTypes['aws-dynamodb']).toBe(AWSDynamoDBNode);
    });

    it('should include aws-apigateway node type', () => {
      expect(nodeTypes).toHaveProperty('aws-apigateway');
      expect(nodeTypes['aws-apigateway']).toBe(AWSAPIGatewayNode);
    });

    it('should include aws-ec2 node type', () => {
      expect(nodeTypes).toHaveProperty('aws-ec2');
      expect(nodeTypes['aws-ec2']).toBe(AWSEC2Node);
    });

    it('should include aws-rds node type', () => {
      expect(nodeTypes).toHaveProperty('aws-rds');
      expect(nodeTypes['aws-rds']).toBe(AWSRDSNode);
    });

    it('should include aws-cloudfront node type', () => {
      expect(nodeTypes).toHaveProperty('aws-cloudfront');
      expect(nodeTypes['aws-cloudfront']).toBe(AWSCloudFrontNode);
    });
  });

  describe('Container Node Types', () => {
    it('should include vpc-container node type', () => {
      expect(nodeTypes).toHaveProperty('vpc-container');
      expect(nodeTypes['vpc-container']).toBe(VPCContainerNode);
    });

    it('should include subnet-container node type', () => {
      expect(nodeTypes).toHaveProperty('subnet-container');
      expect(nodeTypes['subnet-container']).toBe(SubnetContainerNode);
    });

    it('should include general-group node type', () => {
      expect(nodeTypes).toHaveProperty('general-group');
      expect(nodeTypes['general-group']).toBe(GeneralGroupNode);
    });
  });

  describe('Combined Node Types', () => {
    it('should have exactly 10 node types', () => {
      expect(Object.keys(nodeTypes)).toHaveLength(10);
    });

    it('should have all expected node type keys', () => {
      const expectedKeys = [
        'aws-lambda',
        'aws-s3',
        'aws-dynamodb',
        'aws-apigateway',
        'aws-ec2',
        'aws-rds',
        'aws-cloudfront',
        'vpc-container',
        'subnet-container',
        'general-group',
      ];

      expectedKeys.forEach((key) => {
        expect(nodeTypes).toHaveProperty(key);
      });
    });

    it('should have all values as functions (React components)', () => {
      Object.values(nodeTypes).forEach((component) => {
        expect(typeof component).toBe('function');
      });
    });
  });
});



