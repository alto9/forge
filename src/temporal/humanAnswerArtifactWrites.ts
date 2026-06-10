import fs from 'fs';
import path from 'path';
import type { PendingHumanQuestion } from './workflowRunProjection';

const ANSWERED_DECISIONS_HEADING = '## Answered decisions';

export function appendRefinementAnswers(
    repositoryRoot: string,
    refinementRelativePath: string,
    answers: Record<string, string>
): void {
    const absolutePath = path.join(repositoryRoot, refinementRelativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

    const existing = fs.existsSync(absolutePath)
        ? fs.readFileSync(absolutePath, 'utf8')
        : '';
    const sections: string[] = [];

    for (const [fieldId, answer] of Object.entries(answers)) {
        if (answer.trim().length === 0) {
            continue;
        }
        sections.push(`### ${fieldId}\n${answer.trim()}\n`);
    }

    if (sections.length === 0) {
        return;
    }

    let nextContent = existing;
    if (!nextContent.includes(ANSWERED_DECISIONS_HEADING)) {
        nextContent = nextContent.trimEnd();
        nextContent =
            nextContent.length > 0
                ? `${nextContent}\n\n${ANSWERED_DECISIONS_HEADING}\n\n`
                : `${ANSWERED_DECISIONS_HEADING}\n\n`;
    } else if (!nextContent.endsWith('\n')) {
        nextContent += '\n';
    }

    fs.writeFileSync(absolutePath, `${nextContent}${sections.join('\n')}`, 'utf8');
}

export function writeHumanAnswerArtifactTargets(
    repositoryRoot: string,
    pendingQuestion: PendingHumanQuestion,
    answers: Record<string, string>
): void {
    for (const target of pendingQuestion.artifact_targets ?? []) {
        if (target.artifact_id === 'refinement') {
            appendRefinementAnswers(repositoryRoot, target.path, answers);
        }
    }
}
