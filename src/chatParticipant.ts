import * as vscode from 'vscode';
import { FORGE_PRODUCT_OWNER_INSTRUCTIONS } from './personas/product-owner';
import { FORGE_ARCHITECT_INSTRUCTIONS } from './personas/architect';
import { FORGE_PLANNER_INSTRUCTIONS } from './personas/planner';
import { FORGE_TECHNICAL_WRITER_INSTRUCTIONS } from './personas/technical-writer';
import { FORGE_ENGINEER_INSTRUCTIONS } from './personas/engineer';
import { FORGE_QUALITY_ASSURANCE_INSTRUCTIONS } from './personas/quality-assurance';
import { FORGE_HELP_INSTRUCTIONS } from './personas/forge-help';

/**
 * Chat participants for Forge that enable direct interaction with Forge
 * through the VSCode Chat interface
 */
export class ForgeChatParticipant {
    private static registerParticipant(
        context: vscode.ExtensionContext,
        id: string,
        handler: (
            request: vscode.ChatRequest,
            context: vscode.ChatContext,
            stream: vscode.ChatResponseStream,
            token: vscode.CancellationToken
        ) => Promise<void>
    ): void {
        const participant = vscode.chat.createChatParticipant(id, handler);
        participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'forge-icon.svg');
        context.subscriptions.push(participant);
    }

    /**
     * Register all Forge personas as chat participants
     */
    static registerAll(context: vscode.ExtensionContext): void {
        this.registerParticipant(context, 'forge.help.participant', this.handleForgeHelpRequest);
        this.registerParticipant(context, 'forge.product-owner.participant', this.handleProductOwnerRequest);
        this.registerParticipant(context, 'forge.architect.participant', this.handleArchitectRequest);
        this.registerParticipant(context, 'forge.planner.participant', this.handlePlannerRequest);
        this.registerParticipant(context, 'forge.technical-writer.participant', this.handleTechnicalWriterRequest);
        this.registerParticipant(context, 'forge.engineer.participant', this.handleEngineerRequest);
        this.registerParticipant(context, 'forge.quality-assurance.participant', this.handleQualityAssuranceRequest);
    }

    /**
     * Legacy method for backward compatibility
     */
    static register(context: vscode.ExtensionContext): void {
        this.registerAll(context);
    }

    private static async handleForgeHelpRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown('# Forge Help\n\n');
        stream.markdown(FORGE_HELP_INSTRUCTIONS);
        stream.markdown('\n\n---\n\n**Ask any Forge workflow question and I will guide your next step.**');
    }

    private static async handleProductOwnerRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown('# Product Owner\n\n');
        stream.markdown(FORGE_PRODUCT_OWNER_INSTRUCTIONS);
        stream.markdown('\n\n---\n\n**Share market/user input and I will update product direction.**');
    }

    private static async handleArchitectRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown('# Architect\n\n');
        stream.markdown(FORGE_ARCHITECT_INSTRUCTIONS);
        stream.markdown('\n\n---\n\n**Share technical direction and I will map required contract updates.**');
    }

    private static async handlePlannerRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown('# Planner\n\n');
        stream.markdown(FORGE_PLANNER_INSTRUCTIONS);
        stream.markdown('\n\n---\n\n**Share roadmap intent or repository context to plan milestone changes.**');
    }

    private static async handleTechnicalWriterRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown('# Technical Writer\n\n');
        stream.markdown(FORGE_TECHNICAL_WRITER_INSTRUCTIONS);
        stream.markdown('\n\n---\n\n**Provide the GitHub issue link to refine.**');
    }

    private static async handleEngineerRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown('# Engineer\n\n');
        stream.markdown(FORGE_ENGINEER_INSTRUCTIONS);
        stream.markdown('\n\n---\n\n**Provide the GitHub issue link to build.**');
    }

    private static async handleQualityAssuranceRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown('# Quality Assurance\n\n');
        stream.markdown(FORGE_QUALITY_ASSURANCE_INSTRUCTIONS);
        stream.markdown('\n\n---\n\n**Provide the pull request link or number to review.**');
    }
}
