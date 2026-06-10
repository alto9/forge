import fs from 'fs';
import path from 'path';
import {
    findWorkflowArtifactPath,
    resolveArtifactGlobPaths,
} from '../validation/artifactPathResolution';
import type {
    PendingHumanQuestion,
    PendingHumanQuestionPrompt,
    WorkflowRunProjection,
} from '../temporal/workflowRunProjection';
import type { WorkflowDefinition, WorkflowDefinitionNode } from './types';

const MARKDOWN_BATCH_MAX_PER_SUBMIT = 5;
const ANSWERED_DECISIONS_HEADING = '## Answered decisions';
const NUMBERED_QUESTION_PATTERN = /^\s*(\d+)[.)]\s+(.+?)\s*$/;
const BLOCKER_PATTERN = /\*\*blocker\*\*|\[blocker\]|\(blocker\)/i;

export interface ParsedUserQuestion {
    field_id: string;
    label: string;
    blocker: boolean;
}

export function parseNumberedUserQuestions(markdown: string): ParsedUserQuestion[] {
    const questions: ParsedUserQuestion[] = [];

    for (const line of markdown.split(/\r?\n/)) {
        const match = line.match(NUMBERED_QUESTION_PATTERN);
        if (!match) {
            continue;
        }

        const number = match[1];
        const rawLabel = match[2].trim();
        const blocker = BLOCKER_PATTERN.test(rawLabel);
        const label = rawLabel.replace(BLOCKER_PATTERN, '').replace(/\*\*/g, '').trim();

        questions.push({
            field_id: `q${number}`,
            label: label.length > 0 ? label : rawLabel,
            blocker,
        });
    }

    return questions;
}

export function readAnsweredFieldIds(refinementMarkdown: string): Set<string> {
    const answered = new Set<string>();
    const decisionsIndex = refinementMarkdown.indexOf(ANSWERED_DECISIONS_HEADING);
    if (decisionsIndex === -1) {
        return answered;
    }

    const section = refinementMarkdown.slice(decisionsIndex + ANSWERED_DECISIONS_HEADING.length);
    for (const line of section.split(/\r?\n/)) {
        const headingMatch = line.match(/^###\s+(q\d+)\s*$/i);
        if (headingMatch) {
            answered.add(headingMatch[1].toLowerCase());
        }
    }

    return answered;
}

function resolveArtifactFilePath(
    repositoryRoot: string,
    workflowArtifacts: WorkflowDefinition['artifacts'],
    artifactId: string
): string | undefined {
    const pattern = findWorkflowArtifactPath(workflowArtifacts, artifactId);
    if (!pattern) {
        return undefined;
    }

    const matches = resolveArtifactGlobPaths(repositoryRoot, pattern);
    return matches[0];
}

function resolveArtifactTargets(
    repositoryRoot: string,
    definition: WorkflowDefinition,
    node: WorkflowDefinitionNode
): PendingHumanQuestion['artifact_targets'] {
    if (!node.artifact_ids?.length) {
        return undefined;
    }

    const targets = node.artifact_ids
        .map((artifactId) => {
            const resolvedPath = resolveArtifactFilePath(
                repositoryRoot,
                definition.artifacts,
                artifactId
            );
            if (!resolvedPath) {
                return undefined;
            }

            return {
                artifact_id: artifactId,
                path: resolvedPath,
            };
        })
        .filter((target): target is NonNullable<typeof target> => target !== undefined);

    return targets.length > 0 ? targets : undefined;
}

function resolvePromptArtifactId(node: WorkflowDefinitionNode): string | undefined {
    return node.artifact_ids?.find((artifactId) => artifactId !== 'refinement');
}

function resolvePromptsFromArtifacts(
    repositoryRoot: string,
    definition: WorkflowDefinition,
    node: WorkflowDefinitionNode,
    inputMode: PendingHumanQuestion['input_mode']
): PendingHumanQuestionPrompt[] {
    const promptArtifactId = resolvePromptArtifactId(node);
    if (!promptArtifactId) {
        return [];
    }

    const artifactPath = resolveArtifactFilePath(
        repositoryRoot,
        definition.artifacts,
        promptArtifactId
    );
    if (!artifactPath) {
        return [];
    }

    const absolutePath = path.join(repositoryRoot, artifactPath);
    if (!fs.existsSync(absolutePath)) {
        return [];
    }

    const markdown = fs.readFileSync(absolutePath, 'utf8');
    if (inputMode === 'markdown_batch') {
        const refinementPath = resolveArtifactFilePath(
            repositoryRoot,
            definition.artifacts,
            'refinement'
        );
        const answered = refinementPath
            ? readAnsweredFieldIds(
                  fs.existsSync(path.join(repositoryRoot, refinementPath))
                      ? fs.readFileSync(path.join(repositoryRoot, refinementPath), 'utf8')
                      : ''
              )
            : new Set<string>();

        const parsed = parseNumberedUserQuestions(markdown).filter(
            (question) => !answered.has(question.field_id.toLowerCase())
        );
        const ordered = [...parsed].sort((left, right) => {
            if (left.blocker === right.blocker) {
                return 0;
            }
            return left.blocker ? -1 : 1;
        });

        return ordered.slice(0, MARKDOWN_BATCH_MAX_PER_SUBMIT).map((question) => ({
            field_id: question.field_id,
            label: question.label,
            required: true,
            ...(question.blocker ? { blocker: true } : {}),
        }));
    }

    return parseNumberedUserQuestions(markdown).map((question) => ({
        field_id: question.field_id,
        label: question.label,
        required: true,
        ...(question.blocker ? { blocker: true } : {}),
    }));
}

function resolveSingleTextPrompt(node: WorkflowDefinitionNode): PendingHumanQuestionPrompt[] {
    if (node.description?.trim()) {
        return [
            {
                field_id: 'answer',
                label: node.description.trim(),
                required: true,
            },
        ];
    }

    const questionId = node.question_id ?? node.node_id;
    return [
        {
            field_id: 'answer',
            label: `${node.name} (${questionId})`,
            required: true,
        },
    ];
}

function resolveWaitingHumanQuestionNode(
    definition: WorkflowDefinition,
    projection: WorkflowRunProjection
): WorkflowDefinitionNode | undefined {
    if (!projection.waitingNodeId || projection.terminal) {
        return undefined;
    }

    const node = definition.nodes.find(
        (candidate) => candidate.node_id === projection.waitingNodeId
    );
    if (!node || node.type !== 'human_question') {
        return undefined;
    }

    return node;
}

export function resolvePendingHumanQuestions(
    definition: WorkflowDefinition,
    projection: WorkflowRunProjection,
    repositoryRoot: string
): PendingHumanQuestion[] {
    if (projection.recoveryState !== 'synced' || projection.terminal) {
        return [];
    }

    const node = resolveWaitingHumanQuestionNode(definition, projection);
    if (!node) {
        return [];
    }

    const questionId = node.question_id ?? node.node_id;
    const declaredInputMode = node.input_mode ?? 'single_text';
    const artifactPrompts = resolvePromptsFromArtifacts(
        repositoryRoot,
        definition,
        node,
        declaredInputMode
    );
    const usingArtifactPrompts = artifactPrompts.length > 0;
    const prompts = usingArtifactPrompts ? artifactPrompts : resolveSingleTextPrompt(node);
    const inputMode = usingArtifactPrompts ? declaredInputMode : 'single_text';

    if (prompts.length === 0) {
        return [];
    }

    const artifactTargets = resolveArtifactTargets(repositoryRoot, definition, node)?.filter(
        (target) => target.artifact_id !== resolvePromptArtifactId(node)
    );

    return [
        {
            question_id: questionId,
            node_id: node.node_id,
            node_name: node.name,
            title: node.name,
            input_mode: inputMode,
            prompts,
            ...(artifactTargets && artifactTargets.length > 0
                ? { artifact_targets: artifactTargets }
                : {}),
            ...(inputMode === 'markdown_batch'
                ? {
                      batch_policy: {
                          max_per_submit: MARKDOWN_BATCH_MAX_PER_SUBMIT,
                          blockers_first: true,
                      },
                  }
                : {}),
            ...(node.resume_update ? { resume_update: node.resume_update } : {}),
        },
    ];
}

export function applyPendingHumanQuestionsToProjection(
    definition: WorkflowDefinition,
    projection: WorkflowRunProjection,
    repositoryRoot: string
): WorkflowRunProjection {
    return {
        ...projection,
        pendingHumanQuestions: resolvePendingHumanQuestions(
            definition,
            projection,
            repositoryRoot
        ),
    };
}
