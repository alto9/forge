import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from 'reactflow';

export interface ActorNodeData {
    label: string;
    actor_id?: string;
    actorType?: string;  // 'human' | 'system' | 'external'
}

export const ActorNode: React.FC<NodeProps<ActorNodeData>> = ({ data, selected, id }) => {
    const { label, actorType = 'system' } = data;
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

    // Color based on actor type
    const getActorColor = () => {
        switch (actorType) {
            case 'human':
                return '#6b7280'; // Gray
            case 'external':
                return '#9333ea'; // Purple
            case 'system':
            default:
                return '#3b82f6'; // Blue
        }
    };

    const actorColor = getActorColor();
    const handleStyle = {
        background: actorColor,
        width: '10px',
        height: '10px',
        border: '2px solid white'
    };

    return (
        <div
            className="actor-node"
            style={{
                position: 'relative',
                background: 'var(--vscode-editor-background, white)',
                border: `2px solid ${selected ? 'var(--vscode-focusBorder, #1a73e8)' : actorColor}`,
                borderRadius: '8px',
                padding: '16px',
                minWidth: '80px',
                minHeight: '100px',
                boxSizing: 'border-box',
                boxShadow: selected ? '0 0 10px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease',
                pointerEvents: 'all'
            }}
        >
            {/* Node Resizer */}
            <NodeResizer
                minWidth={80}
                minHeight={100}
                maxWidth={400}
                maxHeight={400}
                isVisible={selected}
                keepAspectRatio={false}
                lineStyle={{ border: '2px solid var(--vscode-focusBorder, #1a73e8)' }}
                handleStyle={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--vscode-focusBorder, #1a73e8)',
                    border: '2px solid white'
                }}
            />

            {/* Connection Handles - All four sides */}
            {/* Top Handles */}
            <Handle
                type="target"
                position={Position.Top}
                id="top-target"
                style={handleStyle}
            />
            <Handle
                type="source"
                position={Position.Top}
                id="top-source"
                style={handleStyle}
            />
            
            {/* Bottom Handles */}
            <Handle
                type="target"
                position={Position.Bottom}
                id="bottom-target"
                style={handleStyle}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-source"
                style={handleStyle}
            />
            
            {/* Right Handles */}
            <Handle
                type="target"
                position={Position.Right}
                id="right-target"
                style={handleStyle}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="right-source"
                style={handleStyle}
            />
            
            {/* Left Handles */}
            <Handle
                type="target"
                position={Position.Left}
                id="left-target"
                style={handleStyle}
            />
            <Handle
                type="source"
                position={Position.Left}
                id="left-source"
                style={handleStyle}
            />

            {/* Vertical Layout */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                {/* Silhouette Icon */}
                <div
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: actorColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                </div>

                {/* Actor Type Badge */}
                <div
                    style={{
                        fontSize: '10px',
                        color: actorColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: 600,
                        textAlign: 'center'
                    }}
                >
                    {actorType}
                </div>

                {/* Actor Name (editable) */}
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
                            fontSize: '12px',
                            fontWeight: 500,
                            textAlign: 'center',
                            border: '1px solid var(--vscode-focusBorder, #1a73e8)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            outline: 'none',
                            width: '100%',
                            boxSizing: 'border-box',
                            background: 'var(--vscode-input-background, white)',
                            color: 'var(--vscode-input-foreground, #333)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div
                        style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'var(--vscode-foreground, #333)',
                            textAlign: 'center',
                            cursor: 'text',
                            padding: '4px',
                            minHeight: '20px',
                            wordBreak: 'break-word',
                            maxWidth: '100%'
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
    );
};

