export type FieldDisplay = 'text' | 'tags' | 'list' | 'cards' | 'metricPairs';

export interface FieldAction {
    id: string;
    label: string;
}

export interface DocField {
    key: string;
    label: string;
    display: FieldDisplay;
    action: FieldAction;
}

export interface DocTab {
    id: string;
    label: string;
    /** Memory doc key under product/, or null for placeholder tabs */
    docKey: string | null;
    alert: string;
    fields: DocField[];
    placeholder?: string;
}

export const PRODUCT_OWNER_TABS: DocTab[] = [
    {
        id: 'brief',
        label: 'Brief',
        docKey: 'brief',
        alert:
            "Your product brief is the anchor for every PO ritual — grooming, refinement, and roadmap review all trace back to what you're building, who it's for, and what success looks like. Use the section actions to draft or refresh each field with the agent when intent shifts or memory drifts from the board.",
        fields: [
            { key: 'product_name', label: 'Product Name', display: 'text', action: { id: 'brief.defineProductName', label: 'Define Product Name' } },
            { key: 'product_description', label: 'Product Description', display: 'text', action: { id: 'brief.defineProductDescription', label: 'Define Description' } },
            { key: 'problem', label: 'Problem', display: 'text', action: { id: 'brief.analyzeProblem', label: 'Analyze Problem' } },
            { key: 'audience', label: 'Audience', display: 'tags', action: { id: 'brief.refreshAudience', label: 'Refresh Audience' } },
            { key: 'goals', label: 'Goals', display: 'tags', action: { id: 'brief.updateGoals', label: 'Update Goals' } },
            { key: 'non_goals', label: 'Non-Goals', display: 'tags', action: { id: 'brief.setNonGoals', label: 'Set Non-Goals' } },
            { key: 'success_metrics', label: 'Success Metrics', display: 'metricPairs', action: { id: 'brief.setTargets', label: 'Set Targets' } },
            { key: 'current_focus', label: 'Current Focus', display: 'text', action: { id: 'brief.setFocus', label: 'Set Focus' } },
        ],
    },
    {
        id: 'competitive',
        label: 'Competitive',
        docKey: 'competitive',
        alert:
            'Competitive analysis keeps positioning honest against real alternatives — what buyers might choose instead, where you win, where you lose, and what to watch. Use section actions to populate fields after a scan, stakeholder conversation, or when a market move changes your bet.',
        fields: [
            { key: 'alternatives', label: 'Alternatives', display: 'tags', action: { id: 'competitive.scanAlternatives', label: 'Scan Alternatives' } },
            { key: 'where_we_win', label: 'Where We Win', display: 'tags', action: { id: 'competitive.updateWins', label: 'Update Wins' } },
            { key: 'where_we_lose', label: 'Where We Lose', display: 'tags', action: { id: 'competitive.updateLosses', label: 'Update Losses' } },
            { key: 'watch_list', label: 'Watch List', display: 'tags', action: { id: 'competitive.updateWatchList', label: 'Update Watch List' } },
            { key: 'implications', label: 'Implications', display: 'list', action: { id: 'competitive.deriveImplications', label: 'Derive Implications' } },
        ],
    },
    {
        id: 'personas',
        label: 'Personas',
        docKey: 'personas',
        alert:
            'Personas turn brief audience segments into people with jobs to be done — who you build for, what they need, and who you explicitly exclude. Use section actions to refresh detail from discovery, dogfooding, or feedback without rewriting brief goals.',
        fields: [
            { key: 'primary', label: 'Primary', display: 'cards', action: { id: 'personas.refreshPersonas', label: 'Refresh Personas' } },
            { key: 'jobs_to_be_done', label: 'Jobs To Be Done', display: 'list', action: { id: 'personas.updateJobs', label: 'Update Jobs' } },
            { key: 'not_for', label: 'Not For', display: 'tags', action: { id: 'personas.setExclusions', label: 'Set Exclusions' } },
        ],
    },
    {
        id: 'experiments',
        label: 'Experiments',
        docKey: 'experiments',
        alert:
            "Experiments track active bets — hypotheses you're running now, ideas on deck, and conclusions that should move roadmap or non-goals. Use section actions to propose, review, or conclude bets as grooming and retro surface new evidence.",
        fields: [
            { key: 'active', label: 'Active', display: 'cards', action: { id: 'experiments.reviewActive', label: 'Review Active' } },
            { key: 'proposed', label: 'Proposed', display: 'cards', action: { id: 'experiments.proposeBet', label: 'Propose Bet' } },
            { key: 'concluded', label: 'Concluded', display: 'cards', action: { id: 'experiments.concludeBet', label: 'Conclude Bet' } },
        ],
    },
    {
        id: 'insights',
        label: 'Insights',
        docKey: 'insights',
        alert:
            "Insights distill what you're hearing into themes, open questions, evidence, and backlog implications — the connective tissue between feedback and Ready tickets. Use section actions to synthesize signal after triage, support requests, or a refinement pass-back.",
        fields: [
            { key: 'themes', label: 'Themes', display: 'list', action: { id: 'insights.synthesizeThemes', label: 'Synthesize Themes' } },
            { key: 'open_questions', label: 'Open Questions', display: 'list', action: { id: 'insights.captureQuestions', label: 'Capture Questions' } },
            { key: 'evidence', label: 'Evidence', display: 'list', action: { id: 'insights.addEvidence', label: 'Add Evidence' } },
            { key: 'implications', label: 'Implications', display: 'list', action: { id: 'insights.deriveImplications', label: 'Derive Implications' } },
        ],
    },
    {
        id: 'metrics',
        label: 'Metrics',
        docKey: 'metrics',
        alert:
            'Metrics is the scoreboard for brief success — which outcomes you track, what "good" looks like, and the current read before the next review. Use section actions to refresh targets and narrative when board state or ritual output changes.',
        fields: [
            { key: 'primary', label: 'Primary', display: 'list', action: { id: 'metrics.setPrimary', label: 'Set Primary' } },
            { key: 'supporting', label: 'Supporting', display: 'list', action: { id: 'metrics.addSupporting', label: 'Add Supporting' } },
            { key: 'targets', label: 'Targets', display: 'metricPairs', action: { id: 'metrics.setTargets', label: 'Set Targets' } },
            { key: 'current_read', label: 'Current Read', display: 'text', action: { id: 'metrics.refreshRead', label: 'Refresh Read' } },
        ],
    },
    {
        id: 'features',
        label: 'Features',
        docKey: null,
        alert: 'Feature specs live under product/specs/. Full spec browser coming soon.',
        fields: [],
        placeholder: 'Feature specs live under product/specs/. Full spec browser coming soon.',
    },
];

export const PRODUCT_OWNER_ROLE_ID = 'product-owner';
export const PRODUCT_OWNER_LABEL = 'Product Owner';
