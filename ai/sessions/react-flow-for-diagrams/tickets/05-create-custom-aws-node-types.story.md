---
story_id: create-custom-aws-node-types
session_id: react-flow-for-diagrams
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
status: completed
priority: medium
estimated_minutes: 20
---

# Create Custom AWS Service Node Types

## Objective
Create custom react-flow node types for AWS services (Lambda, S3, DynamoDB, etc.) that display with official AWS icons and proper styling.

## Context
AWS service nodes need to be visually distinct and recognizable. They should display AWS service icons and follow AWS branding guidelines where appropriate.

## Implementation Steps
1. Create new file `packages/vscode-extension/src/webview/studio/components/nodes/AWSServiceNodes.tsx`
2. Import React, Handle, Position from react-flow
3. Create `AWSLambdaNode` component:
   - Accepts `data` prop with label
   - Displays Lambda icon (placeholder or SVG)
   - Shows service name/label
   - Includes Handle components for connections (source: Right, target: Left)
   - Uses appropriate AWS orange color (#FF9900) for border
4. Create similar components for:
   - `AWSS3Node`
   - `AWSDynamoDBNode`
   - `AWSAPIGatewayNode`
   - `AWSEC2Node`
   - `AWSRDSNode`
   - `AWSCloudFrontNode`
5. Each node should:
   - Display service icon (16-24px)
   - Show service name
   - Have proper padding and spacing
   - Include connection handles
   - Use consistent styling
6. Export all node components
7. Create node types object mapping node type strings to components

## Files Affected
- `packages/vscode-extension/src/webview/studio/components/nodes/AWSServiceNodes.tsx` - New file with AWS node components

## Acceptance Criteria
- [ ] All AWS service node types are created
- [ ] Each node displays with icon and label
- [ ] Nodes have proper connection handles
- [ ] Nodes use consistent styling
- [ ] Node components are properly exported
- [ ] Node type mapping object is created for react-flow registration

## Dependencies
- create-reactflow-diagram-editor-component (for understanding node structure)

## Notes
- AWS icons can be placeholders initially (SVG assets can be added later)
- Icon paths should be relative to assets directory structure

