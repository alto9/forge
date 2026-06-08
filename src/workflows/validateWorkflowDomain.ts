import fs from 'fs';
import path from 'path';
import type { WorkflowDiagnostic, WorkflowSchemaValidationResult } from './types';

export const WORKFLOW_GRAPH_VALIDATOR_ID = 'forge.workflow.graph';
export const WORKFLOW_BINDING_VALIDATOR_ID = 'forge.workflow.binding';
export const WORKFLOW_DUPLICATE_ID_VALIDATOR_ID = 'forge.workflow.duplicate_id';
export const WORKFLOW_UNSUPPORTED_VERSION_VALIDATOR_ID = 'forge.workflow.unsupported_version';
export const WORKFLOW_ORPHAN_NODE_CODE = 'graph.orphan_node';

const SUPPORTED_SCHEMA_VERSION_MAJOR = 1;

const FORGE_CATALOG_VALIDATOR_IDS = new Set([
    'forge.workflow.schema',
    'forge.workflow.graph',
    'forge.workflow.binding',
    'forge.workflow.duplicate_id',
    'forge.workflow.unsupported_version',
    'forge.artifact.declared',
    'forge.artifact.exists',
    'forge.artifact.integrity',
    'forge.artifact.schema',
    'forge.envelope.schema',
    'forge.envelope.unsupported_version',
    'forge.envelope.size',
    'forge.domain.exit_criteria',
    'local.forge.refine_issue.exit_criteria',
]);

export interface WorkflowDomainValidationOptions {
    path: string;
    workspaceRoot?: string;
    discoveredWorkflowIds?: string[];
}

interface WorkflowNode {
    node_id?: string;
    type?: string;
    activity_id?: string;
    agent_path?: string;
    skill_path?: string;
    validators?: Array<{ validator_id?: string; type?: string; target?: string }>;
    artifact_ids?: string[];
    retry_policy?: string;
    timeout_policy?: string;
    transitions?: Array<{ to_node_id?: string; condition?: string }>;
}

function readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    return value as Record<string, unknown>;
}

function readNodes(content: Record<string, unknown>): WorkflowNode[] {
    const nodes = content.nodes;
    if (!Array.isArray(nodes)) {
        return [];
    }
    return nodes.filter((node) => node && typeof node === 'object' && !Array.isArray(node)) as WorkflowNode[];
}

function parseSemverMajor(version: string): number | undefined {
    const match = /^(\d+)\./.exec(version.trim());
    if (!match) {
        return undefined;
    }
    return Number.parseInt(match[1], 10);
}

function isKnownValidatorId(validatorId: string): boolean {
    if (FORGE_CATALOG_VALIDATOR_IDS.has(validatorId)) {
        return true;
    }
    return /^local\.[a-z0-9_]+(\.[a-z0-9_]+)*$/i.test(validatorId);
}

function pathExists(workspaceRoot: string | undefined, repoRelativePath: string): boolean {
    if (!workspaceRoot) {
        return true;
    }
    return fs.existsSync(path.join(workspaceRoot, repoRelativePath));
}

function filenameStemFromDefinitionPath(definitionPath: string): string {
    return path.basename(definitionPath, '.json');
}

function aggregateValid(diagnostics: WorkflowDiagnostic[]): boolean {
    return !diagnostics.some((diagnostic) => diagnostic.severity === 'error');
}

function collectReachableNodeIds(
    entryNodeId: string,
    nodesById: Map<string, WorkflowNode>
): Set<string> {
    const reachable = new Set<string>();
    const queue = [entryNodeId];

    while (queue.length > 0) {
        const currentId = queue.shift();
        if (!currentId || reachable.has(currentId)) {
            continue;
        }

        reachable.add(currentId);
        const node = nodesById.get(currentId);
        if (!node?.transitions) {
            continue;
        }

        for (const transition of node.transitions) {
            const targetId = readString(transition.to_node_id);
            if (targetId && nodesById.has(targetId) && !reachable.has(targetId)) {
                queue.push(targetId);
            }
        }
    }

    return reachable;
}

function validateUnsupportedVersion(
    content: Record<string, unknown>,
    diagnostics: WorkflowDiagnostic[]
): void {
    const schemaVersion = readString(content.schema_version);
    if (!schemaVersion) {
        return;
    }

    const major = parseSemverMajor(schemaVersion);
    if (major === undefined || major !== SUPPORTED_SCHEMA_VERSION_MAJOR) {
        diagnostics.push({
            code: 'forge.workflow.unsupported_version',
            severity: 'error',
            path: '/schema_version',
            message: `unsupported schema_version "${schemaVersion}" (supported major: ${SUPPORTED_SCHEMA_VERSION_MAJOR})`,
            validator_id: WORKFLOW_UNSUPPORTED_VERSION_VALIDATOR_ID,
        });
    }
}

function validateDuplicateWorkflowId(
    workflowId: string | undefined,
    definitionPath: string,
    discoveredWorkflowIds: string[] | undefined,
    diagnostics: WorkflowDiagnostic[]
): void {
    if (!workflowId || !discoveredWorkflowIds) {
        return;
    }

    const duplicateCount = discoveredWorkflowIds.filter((id) => id === workflowId).length;
    if (duplicateCount > 1) {
        diagnostics.push({
            code: 'forge.workflow.duplicate_id',
            severity: 'error',
            path: definitionPath,
            message: `duplicate workflow_id "${workflowId}" across discovered workflow definition files`,
            validator_id: WORKFLOW_DUPLICATE_ID_VALIDATOR_ID,
        });
    }
}

function validateGraph(
    content: Record<string, unknown>,
    nodes: WorkflowNode[],
    diagnostics: WorkflowDiagnostic[]
): void {
    const entryNodeId = readString(content.entry_node_id);
    const nodesById = new Map<string, WorkflowNode>();
    const nodeIndexById = new Map<string, number>();

    nodes.forEach((node, index) => {
        const nodeId = readString(node.node_id);
        if (nodeId) {
            nodesById.set(nodeId, node);
            nodeIndexById.set(nodeId, index);
        }
    });

    if (entryNodeId && !nodesById.has(entryNodeId)) {
        diagnostics.push({
            code: 'graph.missing_entry_node',
            severity: 'error',
            path: '/entry_node_id',
            message: `entry_node_id "${entryNodeId}" does not match any node_id in nodes`,
            validator_id: WORKFLOW_GRAPH_VALIDATOR_ID,
        });
        return;
    }

    if (!entryNodeId) {
        return;
    }

    nodes.forEach((node, nodeIndex) => {
        if (!node.transitions) {
            return;
        }

        node.transitions.forEach((transition, transitionIndex) => {
            const targetId = readString(transition.to_node_id);
            if (!targetId) {
                return;
            }

            if (!nodesById.has(targetId)) {
                diagnostics.push({
                    code: 'graph.missing_transition_target',
                    severity: 'error',
                    path: `/nodes/${nodeIndex}/transitions/${transitionIndex}/to_node_id`,
                    message: `transition target "${targetId}" does not match any node_id in nodes`,
                    validator_id: WORKFLOW_GRAPH_VALIDATOR_ID,
                });
            }
        });
    });

    const reachable = collectReachableNodeIds(entryNodeId, nodesById);
    const terminalReachable = [...reachable].some((nodeId) => nodesById.get(nodeId)?.type === 'terminal');

    if (!terminalReachable) {
        diagnostics.push({
            code: 'graph.unreachable_terminal',
            severity: 'error',
            path: '/entry_node_id',
            message: 'no terminal node is reachable from entry_node_id',
            validator_id: WORKFLOW_GRAPH_VALIDATOR_ID,
        });
    }

    for (const [nodeId, nodeIndex] of nodeIndexById) {
        if (!reachable.has(nodeId)) {
            diagnostics.push({
                code: WORKFLOW_ORPHAN_NODE_CODE,
                severity: 'warning',
                path: `/nodes/${nodeIndex}`,
                message: `node "${nodeId}" is not reachable from entry_node_id`,
                validator_id: WORKFLOW_GRAPH_VALIDATOR_ID,
            });
        }
    }
}

function validateBindings(
    content: Record<string, unknown>,
    nodes: WorkflowNode[],
    options: WorkflowDomainValidationOptions,
    diagnostics: WorkflowDiagnostic[]
): void {
    const workflowId = readString(content.workflow_id);
    const filenameStem = filenameStemFromDefinitionPath(options.path);

    if (workflowId && filenameStem !== workflowId) {
        diagnostics.push({
            code: 'binding.filename_stem_mismatch',
            severity: 'error',
            path: options.path,
            message: `filename stem "${filenameStem}" must equal workflow_id "${workflowId}"`,
            validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
        });
    }

    const artifactIds = new Set<string>();
    const artifacts = content.artifacts;
    if (Array.isArray(artifacts)) {
        for (const artifact of artifacts) {
            const record = readRecord(artifact);
            const artifactId = record ? readString(record.artifact_id) : undefined;
            if (artifactId) {
                artifactIds.add(artifactId);
            }
        }
    }

    const retryPolicyIds = new Set<string>();
    const retryPolicies = content.retry_policies;
    if (Array.isArray(retryPolicies)) {
        for (const policy of retryPolicies) {
            const record = readRecord(policy);
            const policyId = record ? readString(record.policy_id) : undefined;
            if (policyId) {
                retryPolicyIds.add(policyId);
            }
        }
    }

    const timeoutPolicyIds = new Set<string>();
    const timeoutPolicies = content.timeout_policies;
    if (Array.isArray(timeoutPolicies)) {
        for (const policy of timeoutPolicies) {
            const record = readRecord(policy);
            const policyId = record ? readString(record.policy_id) : undefined;
            if (policyId) {
                timeoutPolicyIds.add(policyId);
            }
        }
    }

    nodes.forEach((node, nodeIndex) => {
        const nodeType = readString(node.type);

        if (nodeType === 'activity') {
            const activityId = readString(node.activity_id);
            if (!activityId) {
                diagnostics.push({
                    code: 'binding.missing_activity_id',
                    severity: 'error',
                    path: `/nodes/${nodeIndex}/activity_id`,
                    message: 'activity nodes must declare activity_id',
                    validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
                });
            }

            const agentPath = readString(node.agent_path);
            const skillPath = readString(node.skill_path);
            const bindingCount = Number(Boolean(agentPath)) + Number(Boolean(skillPath));

            if (bindingCount !== 1) {
                diagnostics.push({
                    code: 'binding.missing_agent_or_skill_path',
                    severity: 'error',
                    path: `/nodes/${nodeIndex}`,
                    message: 'activity nodes must declare exactly one of agent_path or skill_path',
                    validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
                });
            } else {
                const bindingPath = agentPath ?? skillPath;
                if (bindingPath && !pathExists(options.workspaceRoot, bindingPath)) {
                    diagnostics.push({
                        code: 'binding.unresolved_path',
                        severity: 'error',
                        path: agentPath ? `/nodes/${nodeIndex}/agent_path` : `/nodes/${nodeIndex}/skill_path`,
                        message: `binding path "${bindingPath}" does not resolve in the workspace`,
                        validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
                    });
                }
            }
        }

        if (nodeType === 'validation' && Array.isArray(node.validators)) {
            node.validators.forEach((validator, validatorIndex) => {
                const validatorId = readString(validator.validator_id);
                if (!validatorId) {
                    return;
                }

                if (!isKnownValidatorId(validatorId)) {
                    diagnostics.push({
                        code: 'binding.unknown_validator_id',
                        severity: 'error',
                        path: `/nodes/${nodeIndex}/validators/${validatorIndex}/validator_id`,
                        message: `validator_id "${validatorId}" is not in the catalog and does not match local.* pattern`,
                        validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
                    });
                }
            });
        }

        if (node.retry_policy) {
            const retryPolicy = readString(node.retry_policy);
            if (retryPolicy && !retryPolicyIds.has(retryPolicy)) {
                diagnostics.push({
                    code: 'binding.unresolved_retry_policy',
                    severity: 'error',
                    path: `/nodes/${nodeIndex}/retry_policy`,
                    message: `retry_policy "${retryPolicy}" does not match any declared retry_policies entry`,
                    validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
                });
            }
        }

        if (node.timeout_policy) {
            const timeoutPolicy = readString(node.timeout_policy);
            if (timeoutPolicy && !timeoutPolicyIds.has(timeoutPolicy)) {
                diagnostics.push({
                    code: 'binding.unresolved_timeout_policy',
                    severity: 'error',
                    path: `/nodes/${nodeIndex}/timeout_policy`,
                    message: `timeout_policy "${timeoutPolicy}" does not match any declared timeout_policies entry`,
                    validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
                });
            }
        }

        if (Array.isArray(node.artifact_ids)) {
            node.artifact_ids.forEach((artifactId, artifactIndex) => {
                if (typeof artifactId !== 'string' || artifactId.length === 0) {
                    return;
                }

                if (!artifactIds.has(artifactId)) {
                    diagnostics.push({
                        code: 'binding.unresolved_artifact_id',
                        severity: 'error',
                        path: `/nodes/${nodeIndex}/artifact_ids/${artifactIndex}`,
                        message: `artifact_id "${artifactId}" is not declared in workflow artifacts`,
                        validator_id: 'forge.artifact.declared',
                    });
                }
            });
        }
    });
}

export function validateWorkflowDomain(
    content: unknown,
    options: WorkflowDomainValidationOptions
): WorkflowSchemaValidationResult {
    const record = readRecord(content);
    const workflow_id = record ? readString(record.workflow_id) : undefined;
    const definitionPath = options.path;

    if (!record) {
        return {
            valid: true,
            diagnostics: [],
            workflow_id,
            path: definitionPath,
        };
    }

    const diagnostics: WorkflowDiagnostic[] = [];
    const nodes = readNodes(record);

    validateUnsupportedVersion(record, diagnostics);
    validateDuplicateWorkflowId(workflow_id, definitionPath, options.discoveredWorkflowIds, diagnostics);
    validateGraph(record, nodes, diagnostics);
    validateBindings(record, nodes, options, diagnostics);

    return {
        valid: aggregateValid(diagnostics),
        diagnostics,
        workflow_id,
        path: definitionPath,
    };
}
