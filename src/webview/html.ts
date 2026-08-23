import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function readMediaHtml(
    extensionUri: vscode.Uri,
    mediaFolder: string,
    webview: vscode.Webview
): string {
    const htmlPath = path.join(extensionUri.fsPath, 'media', mediaFolder, 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    const mediaRoot = vscode.Uri.joinPath(extensionUri, 'media', mediaFolder);
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'styles.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'main.js'));
    const nonce = getNonce();

    html = html
        .replace(/\{\{cspSource\}\}/g, webview.cspSource)
        .replace(/\{\{nonce\}\}/g, nonce)
        .replace(/\{\{stylesUri\}\}/g, styleUri.toString())
        .replace(/\{\{scriptUri\}\}/g, scriptUri.toString());

    return html;
}
