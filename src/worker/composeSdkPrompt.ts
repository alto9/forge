import fs from 'fs';
import path from 'path';
import type { CursorSdkRequestEnvelope } from './activityEnvelope';

function readBindingContent(
    workspaceRoot: string,
    bindingPath: string | undefined
): string | undefined {
    if (!bindingPath) {
        return undefined;
    }

    const absolutePath = path.resolve(workspaceRoot, bindingPath);
    if (!fs.existsSync(absolutePath)) {
        return undefined;
    }

    return fs.readFileSync(absolutePath, 'utf8');
}

export function composeSdkPrompt(
    envelope: CursorSdkRequestEnvelope,
    workspaceRoot: string
): string {
    const sections: string[] = [];

    const bindingPath = envelope.agent_path ?? envelope.skill_path;
    const bindingLabel = envelope.agent_path ? 'Agent' : 'Skill';
    const bindingContent = readBindingContent(workspaceRoot, bindingPath);

    if (bindingPath) {
        sections.push(`## ${bindingLabel} binding`);
        sections.push(`Path: ${bindingPath}`);
        if (bindingContent) {
            sections.push(bindingContent);
        }
    }

    sections.push('## Task');
    sections.push(envelope.prompt.trim());

    if (Object.keys(envelope.inputs).length > 0) {
        sections.push('## Inputs');
        sections.push(JSON.stringify(envelope.inputs, null, 2));
    }

    return sections.join('\n\n');
}
