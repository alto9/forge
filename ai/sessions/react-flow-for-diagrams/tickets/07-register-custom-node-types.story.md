---
story_id: register-custom-node-types
session_id: react-flow-for-diagrams
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
status: completed
priority: high
estimated_minutes: 15
---

# Register Custom Node Types with ReactFlow

## Objective
Register all custom node types (AWS services and containers) with react-flow so they render correctly when diagram data includes these node types.

## Context
React-flow needs to know about custom node types to render them. We need to create a node types object and pass it to the ReactFlow component.

## Implementation Steps
1. Create new file `packages/vscode-extension/src/webview/studio/components/nodes/nodeTypes.ts`
2. Import all AWS service node components from `AWSServiceNodes.tsx`
3. Import all container node components from `ContainerNodes.tsx`
4. Create `nodeTypes` object mapping:
   - `'aws-lambda'` → `AWSLambdaNode`
   - `'aws-s3'` → `AWSS3Node`
   - `'aws-dynamodb'` → `AWSDynamoDBNode`
   - `'aws-apigateway'` → `AWSAPIGatewayNode`
   - `'aws-ec2'` → `AWSEC2Node`
   - `'aws-rds'` → `AWSRDSNode`
   - `'aws-cloudfront'` → `AWSCloudFrontNode`
   - `'vpc-container'` → `VPCContainerNode`
   - `'subnet-container'` → `SubnetContainerNode`
   - `'general-group'` → `GeneralGroupNode`
5. Export `nodeTypes` object
6. In `ReactFlowDiagramEditor.tsx`:
   - Import `nodeTypes` from `nodeTypes.ts`
   - Pass `nodeTypes={nodeTypes}` prop to ReactFlow component

## Files Affected
- `packages/vscode-extension/src/webview/studio/components/nodes/nodeTypes.ts` - New file with node type mappings
- `packages/vscode-extension/src/webview/studio/components/ReactFlowDiagramEditor.tsx` - Add nodeTypes prop

## Acceptance Criteria
- [ ] All AWS service node types are registered
- [ ] All container node types are registered
- [ ] Node types object is properly exported
- [ ] ReactFlow component receives nodeTypes prop
- [ ] Custom nodes render correctly when diagram data includes them
- [ ] Default node type still works for basic shapes

## Dependencies
- create-custom-aws-node-types
- create-custom-container-node-types
- create-reactflow-diagram-editor-component

