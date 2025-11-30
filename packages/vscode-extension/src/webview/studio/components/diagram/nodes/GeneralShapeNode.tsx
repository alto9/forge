import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from 'reactflow';
import { GeneralShapeConfig } from '../general-shapes-registry';

export interface GeneralShapeNodeData {
    label: string;
    classifier: string;
    properties: Record<string, any>;
    textLocation: 'top' | 'bottom' | 'left' | 'right';
}

export interface GeneralShapeNodeProps extends NodeProps<GeneralShapeNodeData> {
    shapeConfig: GeneralShapeConfig;
}

export const GeneralShapeNode: React.FC<GeneralShapeNodeProps> = ({ data, shapeConfig, selected, id }) => {
    const { label, properties = {} } = data;
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
        <div
            style={{
                position: 'relative',
                background: 'white',
                border: `2px solid ${selected ? '#1a73e8' : shapeConfig.color.stroke}`,
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
                    background: shapeConfig.color.fill,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white'
                }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: shapeConfig.color.fill,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white'
                }}
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{
                    background: shapeConfig.color.fill,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white'
                }}
            />
            <Handle
                type="source"
                position={Position.Left}
                style={{
                    background: shapeConfig.color.fill,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white'
                }}
            />
            {/* Vertical Layout */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}}>
                {/* Icon/Color Box */}
                <div
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        background: shapeConfig.color.fill,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                >
                    {shapeConfig.icon ? (
                        <img
                            src={shapeConfig.icon}
                            alt={shapeConfig.displayName}
                            style={{ width: '32px', height: '32px' }}
                        />
                    ) : (
                        <div style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: shapeConfig.color.stroke
                        }}
                        > 
                        {shapeConfig.displayName.charAt(0)}
                        </div>
                    )}
            </div>

            {/* Shape Type */}
            <div
                style={{
                    fontSize: '10px',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 600,
                    textAlign: 'center'
                }}
            >{shapeConfig.displayName}</div>
            {/* User Label (editable) */}
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
                        padding: '4x 8px',
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
                <div style={{ fontSize: '11px', color: '#666', borderTop: '1px solid #e0e0e0', paddingTop: '8px', marginTop: '4px' }}>
                    {Object.entries(properties).slice(0, 2).map(([key, value]) => (
                        <div key={key} style={{ marginBottom: '2px' }}>
                            <span style={{ fontWeight: 600 }}>{key}:</span>{' '}
                            <span>{String(value)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* DropZone Indicator */}
            <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', color: '#999', fontSize: '11px', fontStyle: 'italic', pointerEvents: 'none' }}>
                Drop nodes here
            </div>
        </div>
    );
};