import React from 'react';

interface ProgressIndicatorProps {
    currentItem: string | null;
    currentItemType: 'folder' | 'file' | null;
    createdCount: number;
    totalCount: number;
}

export function ProgressIndicator({ currentItem, currentItemType, createdCount, totalCount }: ProgressIndicatorProps) {
    const itemTypeLabel = currentItemType === 'file' ? 'command file' : 'folder';
    const pluralLabel = totalCount === 1 ? 'item' : 'items';
    
    return (
        <div className="progress-indicator">
            <div className="progress-header">
                <div className="progress-spinner"></div>
                <h3 className="progress-title">Initializing project...</h3>
            </div>
            <div className="progress-details">
                {currentItem && (
                    <div className="progress-current">
                        {currentItemType === 'file' ? '📄' : '📁'} Creating {itemTypeLabel}: <strong>{currentItem}</strong>
                    </div>
                )}
                <div className="progress-count">
                    Completed {createdCount} of {totalCount} {pluralLabel}
                </div>
            </div>
            <div className="progress-bar">
                <div 
                    className="progress-bar-fill" 
                    style={{ width: `${(createdCount / totalCount) * 100}%` }}
                />
            </div>
        </div>
    );
}

