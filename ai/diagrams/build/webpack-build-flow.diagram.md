---
diagram_id: webpack-build-flow
name: Webpack Build Flow
description: Shows how TypeScript and React source files are bundled for the extension
diagram_type: flow
feature_id: []
spec_id:
  - webpack
actor_id: []
---

# Diagram

```json
{
  "nodes": [
    {
      "id": "node_1764519515946_dj25h86i4",
      "type": "aws-vpc",
      "position": {
        "x": 460.07125802516157,
        "y": 43.11295793940934
      },
      "data": {
        "label": "VPC",
        "classifier": "vpc",
        "properties": {},
        "color": {
          "fill": "#E8F4F8",
          "stroke": "#1E8900"
        },
        "isContainer": true
      },
      "style": {
        "width": 1516,
        "height": 833
      },
      "width": 1516,
      "height": 833,
      "selected": false,
      "positionAbsolute": {
        "x": 460.07125802516157,
        "y": 43.11295793940934
      },
      "dragging": false,
      "resizing": false
    },
    {
      "id": "node_1764519642523_tetdcvyba",
      "type": "aws-subnet",
      "position": {
        "x": 12.35135087735648,
        "y": 75.32784910975084
      },
      "data": {
        "label": "Subnet",
        "classifier": "subnet",
        "properties": {},
        "color": {
          "fill": "#E6F2E6",
          "stroke": "#147D64"
        },
        "isContainer": true
      },
      "style": {
        "width": 1495,
        "height": 735
      },
      "width": 1495,
      "height": 735,
      "parentNode": "node_1764519515946_dj25h86i4",
      "extent": "parent",
      "selected": false,
      "positionAbsolute": {
        "x": 472.42260890251805,
        "y": 118.44080704916018
      },
      "dragging": false,
      "resizing": false
    },
    {
      "id": "node_1764519657940_ugxxf3swo",
      "type": "aws-security-group",
      "position": {
        "x": 20,
        "y": 87.99999999999994
      },
      "data": {
        "label": "Security Group",
        "classifier": "security-group",
        "properties": {},
        "color": {
          "fill": "#FFEBEE",
          "stroke": "#DD2C00"
        },
        "isContainer": true
      },
      "style": {
        "width": 464,
        "height": 376
      },
      "width": 464,
      "height": 376,
      "parentNode": "node_1764519642523_tetdcvyba",
      "extent": "parent",
      "selected": false,
      "positionAbsolute": {
        "x": 492.42260890251805,
        "y": 206.44080704916013
      },
      "dragging": false,
      "resizing": false
    },
    {
      "id": "node_1764519666709_i564gpbg8",
      "type": "aws-security-group",
      "position": {
        "x": 501.9999999999998,
        "y": 87.99999999999994
      },
      "data": {
        "label": "Security Group",
        "classifier": "security-group",
        "properties": {},
        "color": {
          "fill": "#FFEBEE",
          "stroke": "#DD2C00"
        },
        "isContainer": true
      },
      "style": {
        "width": 488,
        "height": 374
      },
      "width": 488,
      "height": 374,
      "parentNode": "node_1764519642523_tetdcvyba",
      "extent": "parent",
      "selected": false,
      "positionAbsolute": {
        "x": 974.4226089025178,
        "y": 206.44080704916013
      },
      "dragging": false,
      "resizing": false
    },
    {
      "id": "node_1764519676837_ace056vce",
      "type": "aws-lambda",
      "position": {
        "x": 24,
        "y": 88
      },
      "data": {
        "label": "TestLambda",
        "classifier": "lambda",
        "properties": {},
        "color": {
          "fill": "#FFF4E6",
          "stroke": "#FF9900"
        },
        "isContainer": false
      },
      "parentNode": "node_1764519657940_ugxxf3swo",
      "extent": "parent",
      "width": 120,
      "height": 100,
      "selected": false,
      "positionAbsolute": {
        "x": 516.422608902518,
        "y": 294.4408070491601
      },
      "dragging": false
    }
  ],
  "edges": []
}
```
