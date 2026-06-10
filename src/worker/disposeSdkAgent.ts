import type { SDKAgent } from '@cursor/sdk';

export async function disposeSdkAgent(agent: SDKAgent | undefined): Promise<void> {
    if (!agent) {
        return;
    }

    if (typeof agent[Symbol.asyncDispose] === 'function') {
        await agent[Symbol.asyncDispose]();
        return;
    }

    agent.close();
}
