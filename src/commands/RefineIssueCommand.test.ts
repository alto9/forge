import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RefineIssueCommand, REFINE_ISSUE_WORKFLOW_ID } from '../commands/RefineIssueCommand';
import { WorkflowCatalogCommand } from '../commands/WorkflowCatalogCommand';
import { persistAcceptedWorkflowRun } from '../temporal/persistAcceptedWorkflowRun';
import { startWorkflowRun } from '../temporal/startWorkflowRun';
import { getWorkflowRunRecoveryContext } from '../temporal/workflowRunRecoveryService';
import * as vscode from 'vscode';

vi.mock('../temporal/startWorkflowRun', () => ({
    startWorkflowRun: vi.fn(),
}));

vi.mock('../temporal/persistAcceptedWorkflowRun', () => ({
    persistAcceptedWorkflowRun: vi.fn(),
}));

vi.mock('../temporal/workflowRunRecoveryService', () => ({
    getWorkflowRunRecoveryContext: vi.fn(),
}));

vi.mock('../commands/WorkflowCatalogCommand', () => ({
    WorkflowCatalogCommand: {
        resolveRepositoryFolder: vi.fn(),
    },
}));

const mockedStartWorkflowRun = vi.mocked(startWorkflowRun);
const mockedPersistAcceptedWorkflowRun = vi.mocked(persistAcceptedWorkflowRun);
const mockedGetWorkflowRunRecoveryContext = vi.mocked(getWorkflowRunRecoveryContext);
const mockedResolveRepositoryFolder = vi.mocked(WorkflowCatalogCommand.resolveRepositoryFolder);

describe('RefineIssueCommand', () => {
    let tempRoot: string;

    afterEach(() => {
        vi.clearAllMocks();
        if (tempRoot && fs.existsSync(tempRoot)) {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    it('submits run_inputs.issue_ref through the generic start path for a full issue URL', async () => {
        tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-refine-issue-command-'));
        fs.mkdirSync(path.join(tempRoot, '.ai'), { recursive: true });
        fs.writeFileSync(
            path.join(tempRoot, '.ai/project.json'),
            JSON.stringify({ github_url: 'https://github.com/alto9/forge' })
        );

        mockedResolveRepositoryFolder.mockResolvedValue({
            uri: vscode.Uri.file(tempRoot),
            name: 'forge',
            index: 0,
        } as vscode.WorkspaceFolder);

        mockedGetWorkflowRunRecoveryContext.mockReturnValue({
            globalStoragePath: tempRoot,
            windowId: 'window-test',
            indexStore: {} as never,
            log: vi.fn(),
            createRecoveryClient: vi.fn(),
            isReady: () => true,
        });

        mockedStartWorkflowRun.mockResolvedValue({
            ok: true,
            workflowId: 'refine-issue-run',
            runId: 'run-1',
            namespace: 'default',
            taskQueue: 'forge',
            mode: 'managedLocal',
            definitionVersion: '1.0.0',
            repositoryRoot: tempRoot,
            run_inputs: {
                issue_ref: 'https://github.com/alto9/forge/issues/77',
            },
            startedAt: '2026-06-11T12:00:00.000Z',
        });
        mockedPersistAcceptedWorkflowRun.mockReturnValue({
            ok: true,
            indexKey: 'default:refine-issue-run:run-1',
        });

        await RefineIssueCommand.execute(
            {} as vscode.ExtensionContext,
            'https://github.com/alto9/forge/issues/77'
        );

        expect(mockedStartWorkflowRun).toHaveBeenCalledWith(
            expect.objectContaining({
                repositoryRoot: tempRoot,
                workflowId: REFINE_ISSUE_WORKFLOW_ID,
                submittedRunInputs: {
                    issue_ref: 'https://github.com/alto9/forge/issues/77',
                },
            })
        );
        expect(mockedPersistAcceptedWorkflowRun).toHaveBeenCalledWith(
            expect.objectContaining({
                workflow_id: REFINE_ISSUE_WORKFLOW_ID,
            })
        );
    });

    it('shows a diagnostic when repository inference fails for a bare issue number', async () => {
        tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-refine-issue-command-'));

        mockedResolveRepositoryFolder.mockResolvedValue({
            uri: vscode.Uri.file(tempRoot),
            name: 'unknown',
            index: 0,
        } as vscode.WorkspaceFolder);

        await RefineIssueCommand.execute({} as vscode.ExtensionContext, '77');

        expect(mockedStartWorkflowRun).not.toHaveBeenCalled();
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
            expect.stringContaining('Could not infer repository owner/name')
        );
    });

    it('surfaces start-path validation failures without treating them as command parse errors', async () => {
        tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-refine-issue-command-'));
        fs.mkdirSync(path.join(tempRoot, '.ai'), { recursive: true });
        fs.writeFileSync(
            path.join(tempRoot, '.ai/project.json'),
            JSON.stringify({ github_url: 'https://github.com/alto9/forge' })
        );

        mockedResolveRepositoryFolder.mockResolvedValue({
            uri: vscode.Uri.file(tempRoot),
            name: 'forge',
            index: 0,
        } as vscode.WorkspaceFolder);

        mockedGetWorkflowRunRecoveryContext.mockReturnValue({
            globalStoragePath: tempRoot,
            windowId: 'window-test',
            indexStore: {} as never,
            log: vi.fn(),
            createRecoveryClient: vi.fn(),
            isReady: () => true,
        });

        mockedStartWorkflowRun.mockResolvedValue({
            ok: false,
            diagnostics: [
                {
                    code: 'forge.workflow.run_input.required',
                    severity: 'error',
                    path: '/run_inputs/issue_ref',
                    message: 'Required run input "issue_ref" is missing or empty.',
                    validator_id: 'forge.workflow.run_input',
                },
            ],
        });

        await RefineIssueCommand.execute(
            {} as vscode.ExtensionContext,
            'https://github.com/alto9/forge/issues/77'
        );

        expect(mockedStartWorkflowRun).toHaveBeenCalled();
        expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
            'Complete required inputs before starting this workflow.'
        );
    });

    it('normalizes owner/repo#N before calling the generic start path', async () => {
        tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-refine-issue-command-'));
        fs.mkdirSync(path.join(tempRoot, '.ai'), { recursive: true });
        fs.writeFileSync(
            path.join(tempRoot, '.ai/project.json'),
            JSON.stringify({ github_url: 'https://github.com/alto9/forge' })
        );

        mockedResolveRepositoryFolder.mockResolvedValue({
            uri: vscode.Uri.file(tempRoot),
            name: 'forge',
            index: 0,
        } as vscode.WorkspaceFolder);

        mockedGetWorkflowRunRecoveryContext.mockReturnValue({
            globalStoragePath: tempRoot,
            windowId: 'window-test',
            indexStore: {} as never,
            log: vi.fn(),
            createRecoveryClient: vi.fn(),
            isReady: () => true,
        });

        mockedStartWorkflowRun.mockResolvedValue({
            ok: true,
            workflowId: 'refine-issue-run',
            runId: 'run-1',
            namespace: 'default',
            taskQueue: 'forge',
            mode: 'managedLocal',
            definitionVersion: '1.0.0',
            repositoryRoot: tempRoot,
            run_inputs: {
                issue_ref: 'https://github.com/alto9/forge/issues/77',
            },
            startedAt: '2026-06-11T12:00:00.000Z',
        });
        mockedPersistAcceptedWorkflowRun.mockReturnValue({
            ok: true,
            indexKey: 'default:refine-issue-run:run-1',
        });

        await RefineIssueCommand.execute({} as vscode.ExtensionContext, 'alto9/forge#77');

        expect(mockedStartWorkflowRun).toHaveBeenCalledWith(
            expect.objectContaining({
                submittedRunInputs: {
                    issue_ref: 'https://github.com/alto9/forge/issues/77',
                },
            })
        );
    });

    it('surfaces post-start index persistence failures without starting Temporal again', async () => {
        tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-refine-issue-command-'));
        fs.mkdirSync(path.join(tempRoot, '.ai'), { recursive: true });
        fs.writeFileSync(
            path.join(tempRoot, '.ai/project.json'),
            JSON.stringify({ github_url: 'https://github.com/alto9/forge' })
        );

        mockedResolveRepositoryFolder.mockResolvedValue({
            uri: vscode.Uri.file(tempRoot),
            name: 'forge',
            index: 0,
        } as vscode.WorkspaceFolder);

        mockedGetWorkflowRunRecoveryContext.mockReturnValue({
            globalStoragePath: tempRoot,
            windowId: 'window-test',
            indexStore: {} as never,
            log: vi.fn(),
            createRecoveryClient: vi.fn(),
            isReady: () => true,
        });

        mockedStartWorkflowRun.mockResolvedValue({
            ok: true,
            workflowId: 'refine-issue-run',
            runId: 'run-1',
            namespace: 'default',
            taskQueue: 'forge',
            mode: 'managedLocal',
            definitionVersion: '1.0.0',
            repositoryRoot: tempRoot,
            run_inputs: {
                issue_ref: 'https://github.com/alto9/forge/issues/77',
            },
            startedAt: '2026-06-11T12:00:00.000Z',
        });
        mockedPersistAcceptedWorkflowRun.mockReturnValue({
            ok: false,
            diagnostics: [
                {
                    code: 'forge.workflow.run_index.write_failed',
                    severity: 'error',
                    path: 'forge.workflow.run_index',
                    message:
                        'Workflow run started in Temporal, but Forge could not save the local run index. List, graph, cancel, and recovery actions are unavailable until the run is indexed.',
                    validator_id: 'forge.workflow.run_index',
                },
            ],
        });

        await RefineIssueCommand.execute(
            {} as vscode.ExtensionContext,
            'https://github.com/alto9/forge/issues/77'
        );

        expect(mockedStartWorkflowRun).toHaveBeenCalledTimes(1);
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
            expect.stringContaining('could not save the local run index')
        );
    });
});
