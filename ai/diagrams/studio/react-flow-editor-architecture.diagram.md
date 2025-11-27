---
diagram_id: react-flow-editor-architecture
name: React Flow Diagram Editor Architecture
description: Component structure and data flow for the react-flow diagram editor replacement
diagram_type: component
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
actor_id: []
---

# React Flow Diagram Editor Architecture

```nomnoml
#direction: down
#padding: 10

[ItemProfile Component] -> [ReactFlowDiagramEditor]
[ReactFlowDiagramEditor] contains -> [ShapeLibraryPanel]
[ReactFlowDiagramEditor] contains -> [DiagramCanvas]

[ShapeLibraryPanel] -> [CategorySection: General]
[ShapeLibraryPanel] -> [CategorySection: AWS]

[CategorySection: General] -> [ShapeItem: Rectangle]
[CategorySection: General] -> [ShapeItem: Circle]
[CategorySection: General] -> [ShapeItem: Ellipse]
[CategorySection: General] -> [ShapeItem: Text]
[CategorySection: General] -> [ShapeItem: General Group]

[CategorySection: AWS] -> [ShapeItem: Lambda]
[CategorySection: AWS] -> [ShapeItem: S3]
[CategorySection: AWS] -> [ShapeItem: DynamoDB]
[CategorySection: AWS] -> [ShapeItem: API Gateway]
[CategorySection: AWS] -> [ShapeItem: EC2]
[CategorySection: AWS] -> [ShapeItem: RDS]
[CategorySection: AWS] -> [ShapeItem: VPC Container]
[CategorySection: AWS] -> [ShapeItem: Subnet Container]

[DiagramCanvas] -> [ReactFlow Component]
[ReactFlow Component] -> [Custom Node Types]
[ReactFlow Component] -> [Edge Connections]

[Custom Node Types] -> [AWSLambdaNode]
[Custom Node Types] -> [AWSS3Node]
[Custom Node Types] -> [VPCContainerNode]
[Custom Node Types] -> [SubnetContainerNode]
[Custom Node Types] -> [GeneralGroupNode]

[ReactFlow Component] -> [JSON Diagram Data]
[JSON Diagram Data] -> [File System]

[ShapeItem] drag -> [DiagramCanvas]
[DiagramCanvas] drop -> [New Node Created]

[ReactFlow Component] onChange -> [JSON Serialization]
[JSON Serialization] -> [File Save]
```

