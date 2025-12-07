import React, { useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onUpdateNode: (nodeId: string, updates: Partial<Node['data']>) => void;
  onUpdateEdge: (edgeId: string, updates: Partial<Edge>) => void;
  availableSpecs?: Array<{ id: string; name: string }>;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  availableSpecs = []
}) => {
  const [localData, setLocalData] = useState<any>(null);

  useEffect(() => {
    if (selectedNode) {
      setLocalData({ ...selectedNode.data });
    } else if (selectedEdge) {
      setLocalData({ ...selectedEdge });
    } else {
      setLocalData(null);
    }
  }, [selectedNode, selectedEdge]);

  // Always render the container to maintain consistent layout
  return (
    <div style={{
      width: '100%',
      minHeight: '48px',
      background: 'var(--vscode-editor-background)',
      borderBottom: '1px solid var(--vscode-panel-border)',
    }}>
      {/* Node Properties Panel */}
      {selectedNode && localData && (
        <NodePropertiesPanel
          node={selectedNode}
          localData={localData}
          setLocalData={setLocalData}
          onUpdate={onUpdateNode}
          availableSpecs={availableSpecs}
        />
      )}

      {/* Edge Properties Panel */}
      {selectedEdge && localData && !selectedNode && (
        <EdgePropertiesPanel
          edge={selectedEdge}
          localData={localData}
          setLocalData={setLocalData}
          onUpdate={onUpdateEdge}
        />
      )}

      {/* Empty state - show hint when nothing selected */}
      {!selectedNode && !selectedEdge && (
        <div style={{
          padding: '12px 16px',
          fontSize: '12px',
          color: 'var(--vscode-descriptionForeground)',
          fontStyle: 'italic'
        }}>
          Select a node or edge to view properties
        </div>
      )}
    </div>
  );
};

// Helper function to get badge text based on node type
const getNodeTypeBadge = (localData: any, nodeType: string): string => {
  if (nodeType === 'actor') {
    return 'Actor';
  }
  return localData.classifier || 'Node';
};

// Node-specific properties
const NodePropertiesPanel: React.FC<{
  node: Node;
  localData: any;
  setLocalData: (data: any) => void;
  onUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  availableSpecs: Array<{ id: string; name: string }>;
}> = ({ node, localData, setLocalData, onUpdate, availableSpecs }) => {
  
  const handleChange = (key: string, value: any) => {
    const updated = { ...localData, [key]: value };
    setLocalData(updated);
    onUpdate(node.id, updated);
  };

  const isActorNode = node.type === 'actor';

  return (
    <div style={{
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap'
    }}>
      {/* Node Type Badge */}
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        padding: '4px 8px',
        background: isActorNode ? '#6b7280' : 'var(--vscode-badge-background)',
        color: isActorNode ? 'white' : 'var(--vscode-badge-foreground)',
        borderRadius: '3px'
      }}>
        {getNodeTypeBadge(localData, node.type)}
      </div>

      {/* Name Field */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
        <label style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--vscode-foreground)',
          whiteSpace: 'nowrap'
        }}>
          Name:
        </label>
        <input
          type="text"
          value={localData.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder="Enter name..."
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: '3px',
            background: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)',
            outline: 'none',
            minWidth: '150px'
          }}
        />
      </div>

      {/* Spec Linking - Not shown for actor nodes */}
      {!isActorNode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '250px', flex: 1 }}>
          <label style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--vscode-foreground)',
            whiteSpace: 'nowrap'
          }}>
            Spec:
          </label>
          <select
            value={localData.spec_id || ''}
            onChange={(e) => handleChange('spec_id', e.target.value || undefined)}
            style={{
              flex: 1,
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid var(--vscode-input-border)',
              borderRadius: '3px',
              background: 'var(--vscode-input-background)',
              color: 'var(--vscode-input-foreground)',
              outline: 'none',
              minWidth: '200px'
            }}
          >
            <option value="">-- No Spec --</option>
            {availableSpecs.map(spec => (
              <option key={spec.id} value={spec.id}>
                {spec.name}
              </option>
            ))}
          </select>
          {localData.spec_id && (
            <span style={{
              fontSize: '11px',
              color: 'var(--vscode-charts-green)',
              whiteSpace: 'nowrap'
            }}>
              ✓ Linked
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Edge-specific properties
const EdgePropertiesPanel: React.FC<{
  edge: Edge;
  localData: any;
  setLocalData: (data: any) => void;
  onUpdate: (edgeId: string, updates: Partial<Edge>) => void;
}> = ({ edge, localData, setLocalData, onUpdate }) => {
  
  const handleChange = (key: string, value: any) => {
    const updated = { ...localData, [key]: value };
    setLocalData(updated);
    onUpdate(edge.id, updated);
  };

  const handleStyleChange = (styleKey: string, styleValue: any) => {
    const updated = {
      ...localData,
      style: {
        ...localData.style,
        [styleKey]: styleValue
      }
    };
    setLocalData(updated);
    onUpdate(edge.id, updated);
  };

  return (
    <div style={{
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap'
    }}>
      {/* Edge Type Badge */}
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        padding: '4px 8px',
        background: 'var(--vscode-badge-background)',
        color: 'var(--vscode-badge-foreground)',
        borderRadius: '3px'
      }}>
        Edge
      </div>

      {/* Label Field */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
        <label style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--vscode-foreground)',
          whiteSpace: 'nowrap'
        }}>
          Label:
        </label>
        <input
          type="text"
          value={localData.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder="Enter label..."
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: '3px',
            background: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)',
            outline: 'none',
            minWidth: '120px'
          }}
        />
      </div>

      {/* Edge Type */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--vscode-foreground)',
          whiteSpace: 'nowrap'
        }}>
          Type:
        </label>
        <select
          value={localData.type || 'default'}
          onChange={(e) => handleChange('type', e.target.value)}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: '3px',
            background: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)',
            outline: 'none'
          }}
        >
          <option value="default">Default</option>
          <option value="straight">Straight</option>
          <option value="step">Step</option>
          <option value="smoothstep">Smooth Step</option>
          <option value="simplebezier">Bezier</option>
        </select>
      </div>

      {/* Stroke Color */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--vscode-foreground)',
          whiteSpace: 'nowrap'
        }}>
          Color:
        </label>
        <input
          type="color"
          value={localData.style?.stroke || '#b1b1b7'}
          onChange={(e) => handleStyleChange('stroke', e.target.value)}
          style={{
            width: '40px',
            height: '24px',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Stroke Width */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--vscode-foreground)',
          whiteSpace: 'nowrap'
        }}>
          Width:
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={localData.style?.strokeWidth || 2}
          onChange={(e) => handleStyleChange('strokeWidth', parseInt(e.target.value))}
          style={{
            width: '60px',
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: '3px',
            background: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)',
            outline: 'none'
          }}
        />
      </div>

      {/* Animated Checkbox */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: 'var(--vscode-foreground)',
        cursor: 'pointer'
      }}>
        <input
          type="checkbox"
          checked={localData.animated || false}
          onChange={(e) => handleChange('animated', e.target.checked)}
        />
        Animated
      </label>
    </div>
  );
};



