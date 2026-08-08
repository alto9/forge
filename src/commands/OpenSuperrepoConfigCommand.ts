import * as vscode from 'vscode';
import { SuperrepoPanel } from '../webview/superrepo/SuperrepoPanel';

export class OpenSuperrepoConfigCommand {
    public static readonly commandId = 'forge.openSuperrepoConfig';

    public static register(
        context: vscode.ExtensionContext,
        output: vscode.OutputChannel
    ): vscode.Disposable {
        return vscode.commands.registerCommand(OpenSuperrepoConfigCommand.commandId, async () => {
            await SuperrepoPanel.show(context, output);
        });
    }
}
