import * as vscode from 'vscode';
import {
    clearExternalApiKey,
    hasStoredExternalApiKey,
    storeExternalApiKey,
} from '../temporal/externalCredentials';

export class SetTemporalApiKeyCommand {
    static async execute(context: vscode.ExtensionContext): Promise<void> {
        const apiKey = await vscode.window.showInputBox({
            title: 'Forge: Set Temporal API Key',
            prompt: 'Enter the API key for your external Temporal endpoint.',
            password: true,
            ignoreFocusOut: true,
            placeHolder: 'Temporal Cloud or API-key-secured cluster key',
            validateInput: (value) => {
                if (!value.trim()) {
                    return 'API key cannot be empty.';
                }
                return undefined;
            },
        });

        if (apiKey === undefined) {
            return;
        }

        await storeExternalApiKey(context.secrets, apiKey);
        void vscode.window.showInformationMessage(
            'Forge stored the Temporal API key in VS Code SecretStorage.'
        );
    }
}

export class ClearTemporalApiKeyCommand {
    static async execute(context: vscode.ExtensionContext): Promise<void> {
        const hasStoredKey = await hasStoredExternalApiKey(context.secrets);
        if (!hasStoredKey) {
            void vscode.window.showInformationMessage(
                'No Temporal API key is stored in VS Code SecretStorage.'
            );
            return;
        }

        const action = await vscode.window.showWarningMessage(
            'Clear the stored Temporal API key from VS Code SecretStorage?',
            { modal: true },
            'Clear API key'
        );

        if (action !== 'Clear API key') {
            return;
        }

        await clearExternalApiKey(context.secrets);
        void vscode.window.showInformationMessage('Forge cleared the stored Temporal API key.');
    }
}
