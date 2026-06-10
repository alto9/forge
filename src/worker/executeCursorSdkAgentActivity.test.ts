import { CursorAgentError } from '@cursor/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CursorSdkRequestEnvelope } from './activityEnvelope';
import { executeCursorSdkAgentActivity } from './executeCursorSdkAgentActivity';

const heartbeatMock = vi.fn();
const cancellationController = new AbortController();

vi.mock('@temporalio/activity', () => ({
    heartbeat: (...args: unknown[]) => heartbeatMock(...args),
    Context: {
        current: () => ({
            cancellationSignal: cancellationController.signal,
        }),
    },
}));

describe('executeCursorSdkAgentActivity', () => {
    const envelope: CursorSdkRequestEnvelope = {
        envelope_version: '1.0.0',
        activity_id: 'forge.test.activity',
        node_id: 'node-1',
        workflow_run_id: 'run-1',
        agent_path: '.cursor/agents/engineer.md',
        prompt: 'Implement issue #46.',
        inputs: { issueNumber: 46 },
        output_type: 'markdown',
    };

    beforeEach(() => {
        heartbeatMock.mockReset();
        delete process.env.CURSOR_API_KEY;
    });

    it('returns startup failure envelope when API key is missing', async () => {
        const response = await executeCursorSdkAgentActivity(
            {
                envelope,
                workspaceRoot: '/tmp/workspace',
            },
            { log: () => undefined }
        );

        expect(response.status).toBe('error');
        expect(response.failure_class).toBe('startup');
        expect(response.diagnostics?.[0]?.code).toBe('cursor_api_key_missing');
    });

    it('returns finished envelope on successful SDK run', async () => {
        process.env.CURSOR_API_KEY = 'cursor_test_key';

        const createAgent = vi.fn(async () => ({
            agentId: 'agent-123',
            send: vi.fn(async () => ({
                id: 'run-456',
                supports: () => true,
                wait: vi.fn(async () => ({
                    id: 'run-456',
                    status: 'finished',
                    result: '# Done',
                })),
            })),
            close: vi.fn(),
            [Symbol.asyncDispose]: vi.fn(async () => undefined),
        }));

        const response = await executeCursorSdkAgentActivity(
            {
                envelope,
                workspaceRoot: '/tmp/workspace',
            },
            {
                createAgent,
                log: () => undefined,
            }
        );

        expect(createAgent).toHaveBeenCalledWith(
            expect.objectContaining({
                apiKey: 'cursor_test_key',
                local: {
                    cwd: '/tmp/workspace',
                    settingSources: [],
                },
            })
        );
        expect(response.status).toBe('finished');
        expect(response.cursor_agent_id).toBe('agent-123');
        expect(response.cursor_run_id).toBe('run-456');
        expect(response.structured_payload).toBe('# Done');
        expect(heartbeatMock).toHaveBeenCalledWith({ cursor_run_id: 'run-456' });
    });

    it('maps CursorAgentError to startup failure envelope', async () => {
        process.env.CURSOR_API_KEY = 'cursor_test_key';

        const createAgent = vi.fn(async () => {
            throw new CursorAgentError('auth failed', { isRetryable: true });
        });

        const response = await executeCursorSdkAgentActivity(
            {
                envelope,
                workspaceRoot: '/tmp/workspace',
            },
            {
                createAgent,
                log: () => undefined,
            }
        );

        expect(response.status).toBe('error');
        expect(response.failure_class).toBe('startup');
        expect(response.retryable).toBe(true);
        expect(response.diagnostics?.[0]?.message).toBe('auth failed');
    });

    it('returns cancelled envelope when SDK run is cancelled', async () => {
        process.env.CURSOR_API_KEY = 'cursor_test_key';

        const createAgent = vi.fn(async () => ({
            agentId: 'agent-123',
            send: vi.fn(async () => ({
                id: 'run-456',
                supports: () => true,
                wait: vi.fn(async () => ({
                    id: 'run-456',
                    status: 'cancelled',
                })),
            })),
            close: vi.fn(),
            [Symbol.asyncDispose]: vi.fn(async () => undefined),
        }));

        const response = await executeCursorSdkAgentActivity(
            {
                envelope,
                workspaceRoot: '/tmp/workspace',
            },
            {
                createAgent,
                log: () => undefined,
            }
        );

        expect(response.status).toBe('cancelled');
        expect(response.failure_class).toBe('cancelled');
        expect(response.retryable).toBe(false);
    });
});
