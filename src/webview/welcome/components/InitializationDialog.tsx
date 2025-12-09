import React from 'react';
import { FolderStatus, CommandStatus } from '../types';

interface InitializationDialogProps {
    folders: FolderStatus[];
    commands: CommandStatus[];
    onConfirm: () => void;
    onCancel: () => void;
}

export function InitializationDialog({ folders, commands, onConfirm, onCancel }: InitializationDialogProps) {
    const missingFolders = folders.filter(f => !f.exists);
    const invalidCommands = commands.filter(c => !c.exists || !c.valid);
    const totalItems = missingFolders.length + invalidCommands.length;

    return (
        <>
            <div className="dialog-backdrop" onClick={onCancel} />
            <div className="dialog-container">
                <div className="dialog-header">
                    <h2 className="dialog-title">Initialize Forge Project</h2>
                </div>
                <div className="dialog-content">
                    {totalItems > 0 ? (
                        <>
                            <p className="dialog-message">
                                The following items will be created or updated in your project:
                            </p>
                            <div className="dialog-folder-list">
                                {missingFolders.map((folder, index) => (
                                    <div key={`folder-${index}`} className="dialog-folder-item">
                                        <div className="dialog-folder-icon">📁</div>
                                        <div className="dialog-folder-info">
                                            <div className="dialog-folder-path">{folder.path}</div>
                                            <div className="dialog-folder-description">{folder.description}</div>
                                        </div>
                                    </div>
                                ))}
                                {invalidCommands.map((command, index) => (
                                    <div key={`command-${index}`} className="dialog-folder-item">
                                        <div className="dialog-folder-icon">📄</div>
                                        <div className="dialog-folder-info">
                                            <div className="dialog-folder-path">{command.path}</div>
                                            <div className="dialog-folder-description">
                                                {command.description}
                                                {command.exists && !command.valid && ' (will be updated)'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="dialog-info">All required folders and command files are already valid.</p>
                    )}
                </div>
                <div className="dialog-actions">
                    <button 
                        className="btn btn-secondary" 
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={onConfirm}
                        disabled={totalItems === 0}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </>
    );
}

