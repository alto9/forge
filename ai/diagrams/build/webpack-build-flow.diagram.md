---
diagram_id: webpack-build-flow
name: Webpack Build Flow
description: Shows how TypeScript and React source files are bundled for the extension
diagram_type: flow
feature_id: []
actor_id: []
---

# Diagram

```json
{
  "nodes": [
    {
      "id": "node_1764553516676_aaiux2r4p",
      "type": "aws-ec2",
      "position": {
        "x": 40,
        "y": 77.6666488647461
      },
      "data": {
        "label": "EC2",
        "classifier": "ec2",
        "properties": {},
        "color": {
          "fill": "#FFF4E6",
          "stroke": "#FF9900"
        },
        "isContainer": false,
        "spec_id": "session-change-tracking"
      },
      "width": 120,
      "height": 100,
      "selected": false,
      "positionAbsolute": {
        "x": 1153.1164240407866,
        "y": -32.79591657230935
      },
      "dragging": false,
      "parentNode": "node_1764553524074_tnqq5mfgc",
      "extent": "parent",
      "zIndex": 1
    },
    {
      "id": "node_1764553524074_tnqq5mfgc",
      "type": "aws-vpc",
      "position": {
        "x": 1113.1164240407866,
        "y": -110.46256543705545
      },
      "data": {
        "label": "VPC",
        "classifier": "vpc",
        "properties": {},
        "color": {
          "fill": "#E8F4F8",
          "stroke": "#1E8900"
        },
        "isContainer": true,
        "spec_id": "cursor-commands-management"
      },
      "style": {
        "width": 400,
        "height": 300
      },
      "width": 400,
      "height": 300,
      "zIndex": 0,
      "selected": false,
      "dragging": false
    },
    {
      "id": "node_1764553542286_v02f8rana",
      "type": "aws-ec2",
      "position": {
        "x": 1559.8622575300767,
        "y": -37.270867254063575
      },
      "data": {
        "label": "EC2",
        "classifier": "ec2",
        "properties": {},
        "color": {
          "fill": "#FFF4E6",
          "stroke": "#FF9900"
        },
        "isContainer": false
      },
      "width": 120,
      "height": 100,
      "selected": false,
      "positionAbsolute": {
        "x": 1559.8622575300767,
        "y": -37.270867254063575
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "node_1764553516676_aaiux2r4p",
      "sourceHandle": "right-source",
      "target": "node_1764553542286_v02f8rana",
      "targetHandle": "left-source",
      "id": "edge_1764556357954",
      "type": "simplebezier",
      "selected": false,
      "style": {
        "stroke": "#f6f6f9"
      },
      "animated": true
    }
  ]
}
```
