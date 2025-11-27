import { awsNodeTypes } from './AWSServiceNodes';
import { containerNodeTypes } from './ContainerNodes';

/**
 * Combined node types for react-flow registration.
 * 
 * This object maps node type strings to their corresponding React components.
 * Pass this to the ReactFlow component's nodeTypes prop to enable rendering
 * of custom AWS service nodes and container nodes.
 * 
 * @example
 * <ReactFlow nodeTypes={nodeTypes} ... />
 * 
 * Node types included:
 * - AWS Services: aws-lambda, aws-s3, aws-dynamodb, aws-apigateway, aws-ec2, aws-rds, aws-cloudfront
 * - Containers: vpc-container, subnet-container, general-group
 * - Default: React Flow's built-in default node type still works for basic shapes
 */
export const nodeTypes = {
  ...awsNodeTypes,
  ...containerNodeTypes,
};



