import * as vscode from 'vscode';

/**
 * Modal Copy / Cancel dialog that writes a Cursor agent prompt to the clipboard.
 */
export async function copyPromptDialog(title: string, prompt: string): Promise<boolean> {
    const choice = await vscode.window.showInformationMessage(
        `${title}\n\nThis copies a Cursor prompt to your clipboard. Paste it into Cursor chat to run.`,
        { modal: true },
        'Copy',
        'Cancel'
    );
    if (choice === 'Copy') {
        await vscode.env.clipboard.writeText(prompt);
        void vscode.window.showInformationMessage('Copied to clipboard.');
        return true;
    }
    return false;
}
