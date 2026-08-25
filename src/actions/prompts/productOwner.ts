export interface PromptContext {
    submodulePath: string;
    memoryRoot: string;
}

export interface ActionPrompt {
    id: string;
    title: string;
    /** Template with {submodulePath} and {memoryRoot} placeholders. */
    template: string;
}

function expand(template: string, ctx: PromptContext): string {
    return template
        .replaceAll('{submodulePath}', ctx.submodulePath)
        .replaceAll('{memoryRoot}', ctx.memoryRoot);
}

const PROPOSE_HITL =
    'Propose-only — wait for HITL approve all before writing. After approval, commit and push memory document changes to the memory-repo main branch.';

const PROMPTS: ActionPrompt[] = [
    // Brief
    {
        id: 'brief.defineProductName',
        title: 'Define Product Name',
        template: [
            'As Product Owner, update the `product_name` field in `product/brief.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: problem-framing.',
            'Read the current brief.md. Propose a frontmatter-only edit for `product_name` — a short official product name suitable for the sidebar and dashboard header (e.g. "RiffSync"). Leave other fields alone.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'brief.defineProductDescription',
        title: 'Define Description',
        template: [
            'As Product Owner, update the `product_description` field in `product/brief.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: problem-framing.',
            'Read the current brief.md. Propose a frontmatter-only edit for `product_description` — a short product description (what it is, for whom). Leave other fields alone.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'brief.analyzeProblem',
        title: 'Analyze Problem',
        template: [
            'As Product Owner, update `problem` in `product/brief.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: problem-framing, decision-hygiene.',
            'Read brief.md and board context. Propose a frontmatter-only edit for `problem`.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'brief.refreshAudience',
        title: 'Refresh Audience',
        template: [
            'As Product Owner, refresh `audience[]` in `product/brief.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: discovery, stakeholder-alignment.',
            'Keep segments short — detail belongs in personas.md. Propose frontmatter-only edits.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'brief.updateGoals',
        title: 'Update Goals',
        template: [
            'As Product Owner, update `goals[]` in `product/brief.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: scope-control, roadmapping.',
            'Align with roadmap.md horizons. Propose frontmatter-only edits.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'brief.setNonGoals',
        title: 'Set Non-Goals',
        template: [
            'As Product Owner, update `non_goals[]` in `product/brief.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: scope-control.',
            'Propose frontmatter-only edits.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'brief.setTargets',
        title: 'Set Targets',
        template: [
            'As Product Owner, update `success_metrics[]` in `product/brief.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: outcome-definition.',
            'Targets live in brief; current read lives in metrics.md — do not duplicate. Propose frontmatter-only edits.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'brief.setFocus',
        title: 'Set Focus',
        template: [
            'As Product Owner, update `current_focus` in `product/brief.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: roadmapping, prioritization.',
            'Propose a frontmatter-only edit.',
            PROPOSE_HITL,
        ].join(' '),
    },
    // Competitive
    {
        id: 'competitive.scanAlternatives',
        title: 'Scan Alternatives',
        template: [
            '/forge.competitive-scan — prioritize updating `alternatives[]` in `product/competitive.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Agent: Product Owner. Skills: discovery, feedback-synthesis.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'competitive.updateWins',
        title: 'Update Wins',
        template: [
            'As Product Owner, update `where_we_win[]` in `product/competitive.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Read competitive.md and brief.md. Skills: discovery, feedback-synthesis.',
            'Propose frontmatter-only edits.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'competitive.updateLosses',
        title: 'Update Losses',
        template: [
            'As Product Owner, update `where_we_lose[]` in `product/competitive.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: discovery, feedback-synthesis.',
            'Propose frontmatter-only edits.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'competitive.updateWatchList',
        title: 'Update Watch List',
        template: [
            'As Product Owner, update `watch_list[]` in `product/competitive.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Remove entries that no longer matter. Skills: discovery.',
            'Propose frontmatter-only edits.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'competitive.deriveImplications',
        title: 'Derive Implications',
        template: [
            '/forge.competitive-scan — focus on rewriting `implications[]` in `product/competitive.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Propose brief.md / roadmap.md edits only if a real bet moves.',
            PROPOSE_HITL,
        ].join(' '),
    },
    // Personas
    {
        id: 'personas.refreshPersonas',
        title: 'Refresh Personas',
        template: [
            '/forge.discovery — focus on `primary[]` in `product/personas.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Delete personas you are not designing for.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'personas.updateJobs',
        title: 'Update Jobs',
        template: [
            'As Product Owner, update `jobs_to_be_done[]` in `product/personas.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: discovery, problem-framing.',
            'Propose frontmatter-only edits.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'personas.setExclusions',
        title: 'Set Exclusions',
        template: [
            'As Product Owner, update `not_for[]` in `product/personas.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: scope-control.',
            'Propose frontmatter-only edits.',
            PROPOSE_HITL,
        ].join(' '),
    },
    // Experiments
    {
        id: 'experiments.reviewActive',
        title: 'Review Active',
        template: [
            '/forge.metrics-review — review `active[]` bets in `product/experiments.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Stop dead bets; move to concluded when appropriate.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'experiments.proposeBet',
        title: 'Propose Bet',
        template: [
            'As Product Owner, add a new entry to `proposed[]` in `product/experiments.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: discovery, outcome-definition.',
            'Include hypothesis and success criteria.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'experiments.concludeBet',
        title: 'Conclude Bet',
        template: [
            'As Product Owner, move a bet from `active[]` to `concluded[]` in `product/experiments.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: decision-hygiene, outcome-definition.',
            'Propose frontmatter-only edits.',
            PROPOSE_HITL,
        ].join(' '),
    },
    // Insights
    {
        id: 'insights.synthesizeThemes',
        title: 'Synthesize Themes',
        template: [
            '/forge.feedback-triage — prioritize rewriting `themes[]` in `product/insights.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: feedback-synthesis.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'insights.captureQuestions',
        title: 'Capture Questions',
        template: [
            '/forge.feedback-triage — update `open_questions[]` in `product/insights.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Remove answered questions.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'insights.addEvidence',
        title: 'Add Evidence',
        template: [
            '/forge.feedback-triage — update `evidence[]` in `product/insights.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'No raw thread dumps.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'insights.deriveImplications',
        title: 'Derive Implications',
        template: [
            '/forge.feedback-triage — rewrite `implications[]` in `product/insights.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Drop implications that no longer drive action.',
            PROPOSE_HITL,
        ].join(' '),
    },
    // Metrics
    {
        id: 'metrics.setPrimary',
        title: 'Set Primary',
        template: [
            'As Product Owner, update `primary[]` in `product/metrics.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: outcome-definition.',
            'Propose frontmatter-only edits.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'metrics.addSupporting',
        title: 'Add Supporting',
        template: [
            'As Product Owner, update `supporting[]` in `product/metrics.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: outcome-definition.',
            'Propose frontmatter-only edits.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'metrics.setTargets',
        title: 'Set Targets',
        template: [
            'As Product Owner, update `targets[]` in `product/metrics.md` for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Skills: outcome-definition.',
            'Propose frontmatter-only edits.',
            PROPOSE_HITL,
        ].join(' '),
    },
    {
        id: 'metrics.refreshRead',
        title: 'Refresh Read',
        template: [
            '/forge.metrics-review for submodule `{submodulePath}` (memory root: `{memoryRoot}`).',
            'Update `current_read` in product/metrics.md; update targets only if the target itself changed.',
            PROPOSE_HITL,
        ].join(' '),
    },
    // Blocked sidebar
    {
        id: 'sidebar.initProject',
        title: 'Initialize Project',
        template: [
            '/forge.init-project for this workspace.',
            'Set up `.ai/memory`, forge.json, and seed product memory docs',
            'for submodule `{submodulePath}` (when known; otherwise resolve from the open workspace).',
            PROPOSE_HITL,
        ].join(' '),
    },
];

const BY_ID = new Map(PROMPTS.map((p) => [p.id, p]));

export function getActionPrompt(id: string): ActionPrompt | undefined {
    return BY_ID.get(id);
}

export function listActionPromptIds(): string[] {
    return PROMPTS.map((p) => p.id);
}

export function buildActionPrompt(id: string, ctx: PromptContext): string | undefined {
    const entry = BY_ID.get(id);
    if (!entry) {
        return undefined;
    }
    return expand(entry.template, ctx);
}

export function getActionTitle(id: string): string {
    return BY_ID.get(id)?.title ?? id;
}
