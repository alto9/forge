import * as vscode from 'vscode';
import YAML from 'yaml';

export interface FeatureSetIndex {
    name: string;
    description?: string;
    background?: string;
}

export class YamlIO {
    static async readYaml<T = any>(uri: vscode.Uri): Promise<T> {
        const bytes = await vscode.workspace.fs.readFile(uri);
        const text = Buffer.from(bytes).toString('utf-8');
        return YAML.parse(text) as T;
    }

    static async writeYaml(uri: vscode.Uri, data: unknown): Promise<void> {
        const text = YAML.stringify(data);
        const enc = new TextEncoder();
        await vscode.workspace.fs.writeFile(uri, enc.encode(text));
    }
}



