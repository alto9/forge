import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from 'reactflow';
import { getServicesConfig } from '../aws-service-registry';

export interface ContainerNodeData {
    label: string;
    classifier: string;
    properties: Record<string, any>;
    isContainer: boolean;
}

export const ContainerNode: React.FC<NodeProps<ContainerNodeData>> = ({
    data,
    selected,
    id
}) => {
    const { label, classifier, properties = {} } = data;
    const serviceConfig = classifier ? getServicesConfig(classifier) : null;
    const [isEditing, setIsEditing] = useState(false);
    const [editLabel, setEditLabel] = useState(label);
    const inputRef = useRef<HTMLInputElement>(null);
    const { setNodes } = useReactFlow();

    const backgroundColor = serviceConfig?.color?.fill || '#E3F2FD';
    const borderColor = serviceConfig?.color?.stroke || '#90CAF9';

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

    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
    }, []);

    return (
        <div
        style={{
            width: '100%',
            height: '100%',
            minWidth: '400px',
            minHeight: '300px',
            backgroundColor: 'transparent',
            border: `2px solid ${borderColor}`,
            borderRadius: '12px',
            padding: '16px',
            boxShadow: selected ? '0 0 10px rgba(0,0,0,0.1)' : 'none',
            position: 'relative',
            boxSizing: 'border-box',
            overflow: 'visible',
            pointerEvents: 'all'
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        >
            {/* Background layer - positioned behind content but doesn't block edges */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(135deg, ${backgroundColor}CC 0%, ${borderColor}CC 100%)`,
                borderRadius: '10px',
                zIndex: -1,
                pointerEvents: 'none'
            }} />
            {/* Node Resizer */}
            <NodeResizer
                minWidth={400}
                minHeight={300}
                maxWidth={2000}
                maxHeight={2000}
                isVisible={selected}
                keepAspectRatio={false}
                lineStyle={{ border: `2px solid ${borderColor}` }}
                handleStyle={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#1a73e8',
                    border: '2px solid white'
                }}
            />

            {/* Connection Handles - Hidden and disabled by default, only active when selected */}
            {/* Top Handles */}
            <Handle
                type="target"
                position={Position.Top}
                id="top-target"
                isConnectable={selected}
                style={{
                    background: backgroundColor,
                    width: '12px',
                    height: '12px',
                    border: '2px solid white',
                    opacity: selected ? 1 : 0
                }}
            />
            <Handle
                type="source"
                position={Position.Top}
                id="top-source"
                isConnectable={selected}
                style={{
                    background: backgroundColor,
                    width: '12px',
                    height: '12px',
                    border: '2px solid white',
                    opacity: selected ? 1 : 0
                }}
            />
            
            {/* Bottom Handles */}
            <Handle
                type="target"
                position={Position.Bottom}
                id="bottom-target"
                isConnectable={selected}
                style={{
                    background: borderColor,
                    width: '12px',
                    height: '12px',
                    border: '2px solid white',
                    opacity: selected ? 1 : 0
                }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-source"
                isConnectable={selected}
                style={{
                    background: borderColor,
                    width: '12px',
                    height: '12px',
                    border: '2px solid white',
                    opacity: selected ? 1 : 0
                }}
            />
            
            {/* Right Handles */}
            <Handle
                type="target"
                position={Position.Right}
                id="right-target"
                isConnectable={selected}
                style={{
                    background: borderColor,
                    width: '12px',
                    height: '12px',
                    border: '2px solid white',
                    opacity: selected ? 1 : 0
                }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="right-source"
                isConnectable={selected}
                style={{
                    background: borderColor,
                    width: '12px',
                    height: '12px',
                    border: '2px solid white',
                    opacity: selected ? 1 : 0
                }}
            />
            
            {/* Left Handles */}
            <Handle
                type="target"
                position={Position.Left}
                id="left-target"
                isConnectable={selected}
                style={{
                    background: borderColor,
                    width: '12px',
                    height: '12px',
                    border: '2px solid white',
                    opacity: selected ? 1 : 0
                }}
            />
            <Handle
                type="source"
                position={Position.Left}
                id="left-source"
                isConnectable={selected}
                style={{
                    background: borderColor,
                    width: '12px',
                    height: '12px',
                    border: '2px solid white',
                    opacity: selected ? 1 : 0
                }}
            />
            {/* Header */}
            <div 
                style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    right: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 1
                }}
            >
                <div style={{flex:1}}>
                    <div
                        style={{
                            fontSize: '10px',
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontWeight: 600,
                            textAlign: 'center',
                            marginBottom: '4px'
                        }}
                    >
                        {serviceConfig?.displayName || 'Container'}
                    </div>
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
                                fontWeight: 700,
                                textAlign: 'center',
                                border: '1px solid #1a73e8',
                                borderRadius: '3px',
                                padding: '4px 8px',
                                outline: 'none',
                                width: '100%'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <div
                            style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#333',
                                cursor: 'text',
                                textAlign: 'center'
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
            </div>

            {/* Properties */}
            {Object.keys(properties).length > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: '60px',
                        left: '8px',
                        right: '8px',
                        background: 'white',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: '#666',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        zIndex: 1
                    }}
                >
                {Object.entries(properties).slice(0, 2).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600 }}>{key}:</span>{' '}
                        <span>{String(value)}</span>
                    </div>
                ))}
                </div>
            )}
            
            {/* DropZone Indicator */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#999',
                    fontSize: '11px',
                    fontStyle: 'italic',
                    pointerEvents: 'none'
                }}
            >
                Drop nodes here
            </div>
        </div>
    );
};