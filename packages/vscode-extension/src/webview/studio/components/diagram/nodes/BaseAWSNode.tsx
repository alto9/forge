import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from 'reactflow';
import { AWSServiceConfig } from '../aws-service-registry';

export interface AWSNodeData {
    label: string;
    classifier: string;
    properties: Record<string, any>;
    serviceConfig: AWSServiceConfig;
}

export interface BaseAWSNodeProps extends NodeProps<AWSNodeData> {
    data: AWSNodeData;
    serviceConfig: AWSServiceConfig;
}

export const BaseAWSNode: React.FC<BaseAWSNodeProps> = ({ data, serviceConfig, selected, id }) => {
    const { label, properties = {} } = data;
    const [imageError, setImageError] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editLabel, setEditLabel] = useState(label);
    const inputRef = useRef<HTMLInputElement>(null);
    const { setNodes } = useReactFlow();

    useEffect(() => {
        setEditLabel(label);
    }, [label]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleLabelUpdate = () => {
        setIsEditing(false);
        if (editLabel !== label && editLabel.trim()) {

            setNodes((nds) =>
                nds.map((node) =>
                    node.id === id ? { ...node, data: { ...node.data, label: editLabel } } : node
                )
            );
        } else {
            setEditLabel(label);
        }
    };

    return (
        <div style={{
            position: 'relative',
            background: 'white',
            border: `2px solid ${selected ? '#1a73e8' : serviceConfig.color.stroke}`,
            borderRadius: '8px',
            padding: '16px',
            minWidth: '120px',
            minHeight: '100px',
            boxShadow: selected ? '0 0 10px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s ease'
        }}
        >
            {/* Node Resizer */}
            <NodeResizer
                minWidth={120}
                minHeight={100}
                isVisible={selected}
                lineStyle={{ border: '2px solid #1a73e8' }}
                handleStyle={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#1a73e8',
                    border: '2px solid white'
                }}
            />

            {/* Connection Handles */}
            <Handle
                type="target"
                position={Position.Top}
                style={{
                    background: serviceConfig.color.fill,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white'
                }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: serviceConfig.color.fill,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white'
                }}
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{
                    background: serviceConfig.color.fill,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white'
                }}
            />
            <Handle
                type="source"
                position={Position.Left}
                style={{
                    background: serviceConfig.color.fill,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white'
                }}
            />

            {/* Vertical Layout */}
            <div
                style={{
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}
            >
                {!imageError ? (
                    <img
                        src={serviceConfig.icon}
                        alt={serviceConfig.displayName}
                        style={{ width: '48px', height: '48px', display: 'block' }}
                        onError={(e) => {
                            setImageError(true);
                        }}
                    />
                ) : (
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        background: serviceConfig.color.fill,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px',
                        fontWeight: 'bold'
                    }}>
                        {serviceConfig.displayName.charAt(0)}
                    </div>
                )}
            </div>

            {/* Service Type (small) */}
            <div
                style={{
                    fontSize: '10px',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 600,
                    textAlign: 'center'
                }}
            >
                {serviceConfig.displayName}
            </div>

            {/* User Label (editable) */}
            <div>
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={handleLabelUpdate}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.currentTarget.blur();
                        } else if (e.key === 'Escape') {
                            setEditLabel(label);
                            setIsEditing(false);
                        }
                    }}
                    style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        textAlign: 'center',
                        border: '1px solid #1a73e8',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        outline: 'none',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <div
                    style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#333',
                        textAlign: 'center',
                        cursor: 'text',
                        padding: '4px',
                        minHeight: '22px',
                        wordBreak: 'break-word'
                    }}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                    }}
                >
                    {label}
                </div>
            )}
        </div>

        {/* Properties */}
        {Object.keys(properties).length > 0 && (
            <div
                style={{
                    fontSize: '11px',
                    color: '#666',
                    borderTop: '1px solid #e0e0e0',
                    paddingTop: '8px',
                    maringTop: '4px'
                }}
            >
                {Object.entries(properties).slice(0, 3).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600 }}>{key}:</span>{' '}
                        <span>{String(value)}</span>
                    </div>
                ))}

                {Object.keys(properties).length > 3 && (
                    <div style={{ color: '#999', fontStyle: 'italic' }}>
                        +{Object.keys(properties).length - 3} more
                    </div>
                )}
            </div>
        )}
    </div>
);
};