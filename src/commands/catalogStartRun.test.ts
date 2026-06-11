import { afterEach, describe, expect, it, vi } from 'vitest';
import { executeCatalogStartRun } from './catalogStartRun';
import { persistAcceptedWorkflowRun } from '../temporal/persistAcceptedWorkflowRun';
import { startWorkflowRun } from '../temporal/startWorkflowRun';
import { presentWorkflowRunStartFailure } from '../temporal/workflowRunStartPresentation';
import * as vscode from 'vscode';

vi.mock('../temporal/startWorkflowRun', () => ({
    startWorkflowRun: vi.fn(),
}));

vi.mock('../temporal/persistAcceptedWorkflowRun', () => ({
    persistAcceptedWorkflowRun: vi.fn(),
}));

vi.mock('../temporal/workflowRunStartPresentation', () => ({
    presentWorkflowRunStartFailure: vi.fn(),
}));

vi.mock('./WorkflowGraphCommand', () => ({
    WorkflowGraphCommand: {
        openGraph: vi.fn(),
        openGraphFromRun: vi.fn(),
    },
}));

const mockedStartWorkflowRun = vi.mocked(startWorkflowRun);
const mockedPersistAcceptedWorkflowRun = vi.mocked(persistAcceptedWorkflowRun);
const mockedPresentWorkflowRunStartFailure = vi.mocked(presentWorkflowRunStartFailure);

describe('executeCatalogStartRun', () => {
    const recoveryContext = {
        globalStoragePath: '/tmp/forge',
        windowId: 'window-test',
        indexStore: {} as never,
        log: vi.fn(),
        createRecoveryClient: vi.fn(),
        isReady: () => true,
    };

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('returns success without VS Code success notifications or graph navigation', async () => {
        mockedStartWorkflowRun.mockResolvedValue({
            ok: true,
            workflowId: 'refine-issue-run',
            runId: 'run-1',
            namespace: 'default',
            taskQueue: 'forge',
            mode: 'managedLocal',
            definitionVersion: '1.0.0',
            repositoryRoot: '/repo/forge',
            run_inputs: {},
            startedAt: '2026-06-11T12:00:00.000Z',
        });
        mockedPersistAcceptedWorkflowRun.mockReturnValue({
            ok: true,
            indexKey: 'default:refine-issue-run:run-1',
        });

        const result = await executeCatalogStartRun({
            repositoryRoot: '/repo/forge',
            workflowId: 'refine-issue',
            runInputs: { issue_ref: 'https://github.com/alto9/forge/issues/77' },
            recoveryContext,
        });

        expect(result).toEqual({ ok: true });
        expect(mockedPersistAcceptedWorkflowRun).toHaveBeenCalledTimes(1);
        expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
    });

    it('returns catalog failure copy without opening the graph monitor', async () => {
        mockedStartWorkflowRun.mockResolvedValue({
            ok: false,
            diagnostics: [
                {
                    code: 'forge.workflow.definition_invalid',
                    severity: 'error',
                    path: 'workflow',
                    message: 'Definition invalid',
                    validator_id: 'forge.workflow.definition',
                },
            ],
        });
        mockedPresentWorkflowRunStartFailure.mockReturnValue({
            catalogMessage: 'Fix validation errors before starting a run.',
            inFlight: false,
        });

        const result = await executeCatalogStartRun({
            repositoryRoot: '/repo/forge',
            workflowId: 'refine-issue',
            runInputs: {},
            recoveryContext,
        });

        expect(result).toEqual({
            ok: false,
            message: 'Fix validation errors before starting a run.',
            inFlight: false,
        });
        expect(mockedPersistAcceptedWorkflowRun).not.toHaveBeenCalled();
        expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
    });

    it('surfaces index persistence failures as catalog errors', async () => {
        mockedStartWorkflowRun.mockResolvedValue({
            ok: true,
            workflowId: 'refine-issue-run',
            runId: 'run-1',
            namespace: 'default',
            taskQueue: 'forge',
            mode: 'managedLocal',
            definitionVersion: '1.0.0',
            repositoryRoot: '/repo/forge',
            run_inputs: {},
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
                        'Workflow run started in Temporal, but Forge could not save the local run index.',
                    validator_id: 'forge.workflow.run_index',
                },
            ],
        });

        const result = await executeCatalogStartRun({
            repositoryRoot: '/repo/forge',
            workflowId: 'refine-issue',
            runInputs: {},
            recoveryContext,
        });

        expect(result.ok).toBe(false);
        expect(result.message).toContain('could not save the local run index');
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(result.message);
        expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
    });
});
