import { Agent, CursorAgentError, type Run, type RunResult } from '@cursor/sdk';
import { Context, heartbeat } from '@temporalio/activity';
import path from 'path';
import type {
    CursorSdkResponseEnvelope,
    ExecuteCursorSdkAgentActivityInput,
} from './activityEnvelope';
import { composeSdkPrompt } from './composeSdkPrompt';
import { createCursorActivityLogger, type CursorActivityLogger } from './cursorActivityLog';
import { disposeSdkAgent } from './disposeSdkAgent';
import {
    buildCancelledResponse,
    buildExecutionFailureResponse,
    buildMissingApiKeyResponse,
    buildResponseShell,
    buildStartupFailureResponse,
    buildSuccessResponse,
} from './mapSdkOutcome';
import { resolveCursorApiKeyFromEnv } from './resolveCursorApiKey';

const HEARTBEAT_INTERVAL_MS = 15_000;

export interface ExecuteCursorSdkAgentActivityDeps {
    createAgent?: typeof Agent.create;
    log?: CursorActivityLogger;
}

async function waitForRunCompletion(
    run: Run,
    cancellationSignal: AbortSignal
): Promise<{ result: RunResult; cancelled: boolean; lateCompletionDiscarded: boolean }> {
    let cancelled = false;
    let lateCompletionDiscarded = false;

    const onAbort = () => {
        cancelled = true;
        if (run.supports('cancel')) {
            void run.cancel().catch(() => undefined);
        }
    };

    if (cancellationSignal.aborted) {
        onAbort();
    } else {
        cancellationSignal.addEventListener('abort', onAbort, { once: true });
    }

    const heartbeatTimer = setInterval(() => {
        heartbeat({ cursor_run_id: run.id });
    }, HEARTBEAT_INTERVAL_MS);

    try {
        heartbeat({ cursor_run_id: run.id });

        const result = await run.wait();

        if (cancelled) {
            lateCompletionDiscarded = true;
            return {
                result,
                cancelled: true,
                lateCompletionDiscarded,
            };
        }

        if (result.status === 'cancelled') {
            return {
                result,
                cancelled: true,
                lateCompletionDiscarded: false,
            };
        }

        return {
            result,
            cancelled: false,
            lateCompletionDiscarded: false,
        };
    } finally {
        clearInterval(heartbeatTimer);
        cancellationSignal.removeEventListener('abort', onAbort);
    }
}

export async function executeCursorSdkAgentActivity(
    input: ExecuteCursorSdkAgentActivityInput,
    deps: ExecuteCursorSdkAgentActivityDeps = {}
): Promise<CursorSdkResponseEnvelope> {
    const createAgent = deps.createAgent ?? Agent.create;
    const activityLogger = createCursorActivityLogger(deps.log);
    const { envelope } = input;
    const workspaceRoot = path.resolve(input.workspaceRoot);

    const apiKey = resolveCursorApiKeyFromEnv();
    if (!apiKey) {
        const response = buildMissingApiKeyResponse(envelope);
        activityLogger.logResponseEnvelope(response);
        return response;
    }

    const prompt = composeSdkPrompt(envelope, workspaceRoot);
    const model = envelope.model ? { id: envelope.model } : { id: 'composer-2.5' };

    let agent: Awaited<ReturnType<typeof Agent.create>> | undefined;

    try {
        agent = await createAgent({
            apiKey,
            model,
            local: {
                cwd: workspaceRoot,
                settingSources: [],
            },
        });

        const run = await agent.send(prompt);
        const shell = buildResponseShell(envelope, agent.agentId, run.id);

        const { result, cancelled, lateCompletionDiscarded } = await waitForRunCompletion(
            run,
            Context.current().cancellationSignal
        );

        if (lateCompletionDiscarded) {
            activityLogger.logMetadata({
                activity_id: envelope.activity_id,
                node_id: envelope.node_id,
                cursor_agent_id: agent.agentId,
                cursor_run_id: run.id,
                event: 'late_completion_discarded',
            });
        }

        if (cancelled || result.status === 'cancelled') {
            const response = buildCancelledResponse(shell);
            activityLogger.logResponseEnvelope(response);
            return response;
        }

        if (result.status === 'error') {
            const response = buildExecutionFailureResponse(shell, result, false);
            activityLogger.logResponseEnvelope(response);
            return response;
        }

        const response = buildSuccessResponse(shell, result, envelope.output_type);
        activityLogger.logResponseEnvelope(response);
        return response;
    } catch (error) {
        if (error instanceof CursorAgentError) {
            const response = buildStartupFailureResponse(
                buildResponseShell(envelope, agent?.agentId ?? 'unavailable', 'unavailable'),
                error.message,
                error.isRetryable
            );
            activityLogger.logResponseEnvelope(response);
            return response;
        }

        throw error;
    } finally {
        await disposeSdkAgent(agent);
    }
}
