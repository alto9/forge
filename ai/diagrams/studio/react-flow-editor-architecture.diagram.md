---
diagram_id: react-flow-editor-architecture
name: React Flow Diagram Editor Architecture
description: Component structure and data flow for the react-flow diagram editor replacement
diagram_type: component
feature_id: [react-flow-diagram-editor]
actor_id: []
---

# React Flow Diagram Editor Architecture

```json
{
  "nodes": [
    {
      "id": "diagram-editor",
      "type": "general-container",
      "position": { "x": 50, "y": 50 },
      "data": {
        "label": "DiagramEditor Component",
        "classifier": "container",
        "isContainer": true,
        "spec_id": "react-flow-diagram-implementation"
      },
      "style": { "width": 850, "height": 500 }
    },
    {
      "id": "shape-library",
      "type": "general-box",
      "position": { "x": 20, "y": 60 },
      "data": {
        "label": "ShapeLibrary Panel",
        "classifier": "box",
        "spec_id": "react-flow-diagram-implementation"
      },
      "parentNode": "diagram-editor",
      "extent": "parent"
    },
    {
      "id": "actors-section",
      "type": "general-box",
      "position": { "x": 20, "y": 140 },
      "data": {
        "label": "Actors Section",
        "classifier": "box",
        "spec_id": "react-flow-diagram-implementation"
      },
      "parentNode": "diagram-editor",
      "extent": "parent"
    },
    {
      "id": "properties-panel",
      "type": "general-box",
      "position": { "x": 20, "y": 220 },
      "data": {
        "label": "PropertiesPanel (Top)",
        "classifier": "box",
        "spec_id": "react-flow-diagram-implementation"
      },
      "parentNode": "diagram-editor",
      "extent": "parent"
    },
    {
      "id": "react-flow",
      "type": "general-box",
      "position": { "x": 250, "y": 60 },
      "data": {
        "label": "ReactFlow Canvas",
        "classifier": "box",
        "spec_id": "react-flow-diagram-implementation"
      },
      "parentNode": "diagram-editor",
      "extent": "parent"
    },
    {
      "id": "node-types",
      "type": "general-box",
      "position": { "x": 250, "y": 200 },
      "data": {
        "label": "Custom Node Types",
        "classifier": "box",
        "spec_id": "react-flow-diagram-implementation"
      },
      "parentNode": "diagram-editor",
      "extent": "parent"
    },
    {
      "id": "aws-nodes",
      "type": "general-box",
      "position": { "x": 250, "y": 280 },
      "data": {
        "label": "AWS Service Nodes",
        "classifier": "box",
        "spec_id": "react-flow-diagram-implementation"
      },
      "parentNode": "diagram-editor",
      "extent": "parent"
    },
    {
      "id": "general-nodes",
      "type": "general-box",
      "position": { "x": 250, "y": 360 },
      "data": {
        "label": "General Shape Nodes",
        "classifier": "box",
        "spec_id": "react-flow-diagram-implementation"
      },
      "parentNode": "diagram-editor",
      "extent": "parent"
    },
    {
      "id": "actor-nodes",
      "type": "general-box",
      "position": { "x": 500, "y": 200 },
      "data": {
        "label": "Actor Nodes",
        "classifier": "box",
        "spec_id": "react-flow-diagram-implementation"
      },
      "parentNode": "diagram-editor",
      "extent": "parent"
    },
    {
      "id": "container-nodes",
      "type": "general-box",
      "position": { "x": 500, "y": 280 },
      "data": {
        "label": "Container Nodes (VPC, etc)",
        "classifier": "box",
        "spec_id": "react-flow-diagram-implementation"
      },
      "parentNode": "diagram-editor",
      "extent": "parent"
    },
    {
      "id": "json-data",
      "type": "general-box",
      "position": { "x": 500, "y": 360 },
      "data": {
        "label": "JSON Diagram Data",
        "classifier": "box",
        "spec_id": "react-flow-diagram-implementation"
      },
      "parentNode": "diagram-editor",
      "extent": "parent"
    },
    {
      "id": "filesystem",
      "type": "general-box",
      "position": { "x": 350, "y": 600 },
      "data": {
        "label": "Diagram File (*.diagram.md)",
        "classifier": "box"
      }
    },
    {
      "id": "actors-filesystem",
      "type": "general-box",
      "position": { "x": 100, "y": 600 },
      "data": {
        "label": "Actor Files (ai/actors/)",
        "classifier": "box"
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "shape-library",
      "target": "react-flow",
      "label": "Drag & Drop",
      "animated": true
    },
    {
      "id": "e2",
      "source": "react-flow",
      "target": "properties-panel",
      "label": "Selection",
      "animated": true
    },
    {
      "id": "e3",
      "source": "react-flow",
      "target": "json-data",
      "label": "onChange"
    },
    {
      "id": "e4",
      "source": "json-data",
      "target": "filesystem",
      "label": "Save"
    },
    {
      "id": "e5",
      "source": "node-types",
      "target": "aws-nodes"
    },
    {
      "id": "e6",
      "source": "node-types",
      "target": "general-nodes"
    },
    {
      "id": "e7",
      "source": "node-types",
      "target": "container-nodes"
    },
    {
      "id": "e8",
      "source": "node-types",
      "target": "actor-nodes"
    },
    {
      "id": "e9",
      "source": "actors-section",
      "target": "react-flow",
      "label": "Drag Actor",
      "animated": true
    },
    {
      "id": "e10",
      "source": "actors-filesystem",
      "target": "actors-section",
      "label": "Load Actors"
    }
  ]
}
```
