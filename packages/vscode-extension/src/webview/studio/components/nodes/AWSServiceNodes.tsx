import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

/**
 * AWS node data interface for node props
 */
export interface AWSNodeData {
  label: string;
}

/**
 * Common styles for AWS service nodes
 */
const baseNodeStyle: React.CSSProperties = {
  padding: '10px',
  background: 'white',
  border: '2px solid #FF9900',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minWidth: '120px',
  fontSize: '12px',
  fontFamily: 'var(--vscode-font-family, sans-serif)',
};

/**
 * Service icon placeholder component
 * Displays service abbreviation when actual icon is not available
 */
interface ServiceIconProps {
  abbrev: string;
  bgColor?: string;
}

const ServiceIcon: React.FC<ServiceIconProps> = ({ abbrev, bgColor = '#FF9900' }) => (
  <div
    style={{
      width: '24px',
      height: '24px',
      borderRadius: '4px',
      background: bgColor,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: 'bold',
    }}
    aria-hidden="true"
  >
    {abbrev}
  </div>
);

/**
 * AWS Lambda Node
 * Displays Lambda function in diagrams with orange AWS styling
 */
export const AWSLambdaNode: React.FC<NodeProps<AWSNodeData>> = ({ data }) => {
  return (
    <div style={baseNodeStyle} data-testid="aws-lambda-node">
      <ServiceIcon abbrev="λ" bgColor="#FF9900" />
      <span>{data.label}</span>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

/**
 * AWS S3 Node
 * Displays S3 bucket in diagrams with green styling
 */
export const AWSS3Node: React.FC<NodeProps<AWSNodeData>> = ({ data }) => {
  return (
    <div style={{ ...baseNodeStyle, borderColor: '#569A31' }} data-testid="aws-s3-node">
      <ServiceIcon abbrev="S3" bgColor="#569A31" />
      <span>{data.label}</span>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

/**
 * AWS DynamoDB Node
 * Displays DynamoDB table in diagrams with blue styling
 */
export const AWSDynamoDBNode: React.FC<NodeProps<AWSNodeData>> = ({ data }) => {
  return (
    <div style={{ ...baseNodeStyle, borderColor: '#4053D6' }} data-testid="aws-dynamodb-node">
      <ServiceIcon abbrev="DB" bgColor="#4053D6" />
      <span>{data.label}</span>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

/**
 * AWS API Gateway Node
 * Displays API Gateway in diagrams with purple styling
 */
export const AWSAPIGatewayNode: React.FC<NodeProps<AWSNodeData>> = ({ data }) => {
  return (
    <div style={{ ...baseNodeStyle, borderColor: '#A166FF' }} data-testid="aws-apigateway-node">
      <ServiceIcon abbrev="API" bgColor="#A166FF" />
      <span>{data.label}</span>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

/**
 * AWS EC2 Node
 * Displays EC2 instance in diagrams with orange styling
 */
export const AWSEC2Node: React.FC<NodeProps<AWSNodeData>> = ({ data }) => {
  return (
    <div style={{ ...baseNodeStyle, borderColor: '#FF9900' }} data-testid="aws-ec2-node">
      <ServiceIcon abbrev="EC2" bgColor="#FF9900" />
      <span>{data.label}</span>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

/**
 * AWS RDS Node
 * Displays RDS database in diagrams with blue styling
 */
export const AWSRDSNode: React.FC<NodeProps<AWSNodeData>> = ({ data }) => {
  return (
    <div style={{ ...baseNodeStyle, borderColor: '#4053D6' }} data-testid="aws-rds-node">
      <ServiceIcon abbrev="RDS" bgColor="#4053D6" />
      <span>{data.label}</span>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

/**
 * AWS CloudFront Node
 * Displays CloudFront distribution in diagrams with purple styling
 */
export const AWSCloudFrontNode: React.FC<NodeProps<AWSNodeData>> = ({ data }) => {
  return (
    <div style={{ ...baseNodeStyle, borderColor: '#8C4FFF' }} data-testid="aws-cloudfront-node">
      <ServiceIcon abbrev="CF" bgColor="#8C4FFF" />
      <span>{data.label}</span>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

/**
 * Node types mapping for react-flow registration
 * Use this object when configuring ReactFlow component
 * 
 * @example
 * <ReactFlow nodeTypes={awsNodeTypes} ... />
 */
export const awsNodeTypes = {
  'aws-lambda': AWSLambdaNode,
  'aws-s3': AWSS3Node,
  'aws-dynamodb': AWSDynamoDBNode,
  'aws-apigateway': AWSAPIGatewayNode,
  'aws-ec2': AWSEC2Node,
  'aws-rds': AWSRDSNode,
  'aws-cloudfront': AWSCloudFrontNode,
};



