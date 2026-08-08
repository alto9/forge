import * as vscode from 'vscode';
import { SuperrepoPanel } from '../webview/superrepo/SuperrepoPanel';

export class InitializeSuperrepoCommand {
    public static readonly commandId = 'forge.initializeSuperrepo';

    public static register(
        context: vscode.ExtensionContext,
        output: vscode.OutputChannel
    ): vscode.Disposable {
        return vscode.commands.registerCommand(InitializeSuperrepoCommand.commandId, async () => {
            await SuperrepoPanel.show(context, output);
        });
    }
}
