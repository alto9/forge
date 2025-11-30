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
    const [imageError, setImageError] = useState(false);
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
            background: `linear-gradient(135deg, ${backgroundColor} 0%, ${borderColor} 100%)`,
            border: `2px solid ${borderColor}`,
            borderRadius: '12px',
            padding: '16px',
            boxShadow: selected ? '0 0 10px rgba(0,0,0,0.1)' : 'none',
            position: 'relative'
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        >
            {/* Node Resizer */}
            <NodeResizer
                minWidth={300}
                minHeight={200}
                isVisible={selected}
                lineStyle={{ border: `2px solid ${borderColor}` }}
                handleStyle={{
                    width: '10px',
                    height: '10px',
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
                    background: backgroundColor,
                    width: '12px',
                    height: '12px',
                    border: '2px solid white'
                }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: borderColor,
                    width: '12px',
                    height: '12px',
                    border: '2px solid white'
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
            {serviceConfig && (
                <div 
                    style={{
                        width: '24px',
                        height: '24px',
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
                        style={{ width: '24px', height: '24px', display: 'block' }}
                        onError={(e) => setImageError(true)}
                        />
                    ) : (
                        <div style={{ 
                                width: '24px', 
                                height: '24px', 
                                borderRadius: '4px',
                                background: serviceConfig.color.fill,
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold' 
                            }}
                        >
                            {serviceConfig.displayName.charAt(0)}
                        </div>
                    )}
                    </div>
                )}

                <div style={{flex:1}}>
                    <div
                        style={{
                            fontSize: '9px',
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontWeight: 600,
                            textAlign: 'center'
                        }}
                    >
                        {serviceConfig.displayName || 'Container'}
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
                                fontSize: '13px',
                                fontWeight: 700,
                                textAlign: 'center',
                                border: '1px solid #1a73e8',
                                borderRadius: '3px',
                                padding: '2px 4px',
                                outline: 'none',
                                width: '100%'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <div
                            style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#333',
                                cursor: 'text'
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