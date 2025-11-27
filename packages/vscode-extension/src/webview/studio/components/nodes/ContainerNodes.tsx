import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

/**
 * Container node data interface for node props
 */
export interface ContainerNodeData {
  label: string;
}

/**
 * Base container styles shared across all container types
 */
const baseContainerStyle: React.CSSProperties = {
  padding: '20px',
  borderRadius: '8px',
  minWidth: '300px',
  minHeight: '200px',
  position: 'relative',
  fontFamily: 'var(--vscode-font-family, sans-serif)',
};

/**
 * Label style for container headers
 */
const labelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  left: '12px',
  fontSize: '12px',
  fontWeight: 'bold',
};

/**
 * VPC Container Node
 * 
 * Displays a Virtual Private Cloud container with AWS dark blue styling.
 * Used to group AWS resources within a VPC boundary.
 */
export const VPCContainerNode: React.FC<NodeProps<ContainerNodeData>> = ({ data }) => {
  return (
    <div
      style={{
        ...baseContainerStyle,
        background: '#f0f0f0',
        border: '3px solid #232F3E',
      }}
      data-testid="vpc-container-node"
    >
      <div style={{ ...labelStyle, color: '#232F3E' }}>VPC: {data.label}</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

/**
 * Subnet Container Node
 * 
 * Displays a Subnet container with distinct styling from VPC.
 * Used to group resources within a subnet, typically nested inside a VPC.
 */
export const SubnetContainerNode: React.FC<NodeProps<ContainerNodeData>> = ({ data }) => {
  return (
    <div
      style={{
        ...baseContainerStyle,
        background: '#e8f4f8',
        border: '2px dashed #1B6B93',
        minWidth: '250px',
        minHeight: '150px',
      }}
      data-testid="subnet-container-node"
    >
      <div style={{ ...labelStyle, color: '#1B6B93' }}>Subnet: {data.label}</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

/**
 * General Group Container Node
 * 
 * Displays a generic container for non-AWS grouping.
 * Used to organize diagram elements into logical groups.
 */
export const GeneralGroupNode: React.FC<NodeProps<ContainerNodeData>> = ({ data }) => {
  return (
    <div
      style={{
        ...baseContainerStyle,
        background: '#fafafa',
        border: '2px solid #888888',
        minWidth: '250px',
        minHeight: '150px',
      }}
      data-testid="general-group-node"
    >
      <div style={{ ...labelStyle, color: '#555555' }}>{data.label}</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

/**
 * Container node types mapping for react-flow registration
 * Use this object when configuring ReactFlow component
 * 
 * @example
 * <ReactFlow nodeTypes={{...containerNodeTypes}} ... />
 */
export const containerNodeTypes = {
  'vpc-container': VPCContainerNode,
  'subnet-container': SubnetContainerNode,
  'general-group': GeneralGroupNode,
};



