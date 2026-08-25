import * as vscode from 'vscode';

const COPY_PROMPT_DETAIL =
    'This copies a Cursor prompt to your clipboard. Paste it into Cursor chat to run. ' +
    'After you approve changes, the agent should commit and push memory document updates to the memory-repo main branch.';

/**
 * Modal Copy / Cancel dialog that writes a Cursor agent prompt to the clipboard.
 */
export async function copyPromptDialog(title: string, prompt: string): Promise<boolean> {
    const choice = await vscode.window.showInformationMessage(
        `${title}\n\n${COPY_PROMPT_DETAIL}`,
        { modal: true },
        { title: 'Copy' },
        { title: 'Cancel', isCloseAffordance: true }
    );
    if (choice?.title === 'Copy') {
        await vscode.env.clipboard.writeText(prompt);
        void vscode.window.showInformationMessage('Copied to clipboard.');
        return true;
    }
    return false;
}
