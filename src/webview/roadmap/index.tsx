import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { RoadmapIssueRow } from '../../github/roadmapTypes';

const ALL_REPOS = '__all__';

/** Static copy so the header never disagrees with the Repository filter. */
const ROADMAP_INTRO =
    'Issues on this GitHub Project board whose Status is not Done. Use Repository to focus one repo or show all.';

type RoadmapWebviewPayload = {
    primaryRepo: string;
    projectTitle: string;
    issues: RoadmapIssueRow[];
};

type GroupMode = 'sprint' | 'milestone';

function groupKey(row: RoadmapIssueRow, mode: GroupMode): string {
    if (mode === 'sprint') {
        return row.sprint?.trim() || 'No sprint';
    }
    return row.milestoneTitle?.trim() || 'No milestone';
}

function groupIssues(rows: RoadmapIssueRow[], mode: GroupMode): Map<string, RoadmapIssueRow[]> {
    const map = new Map<string, RoadmapIssueRow[]>();
    const sorted = [...rows].sort((a, b) => {
        const repoCmp = a.repositoryNameWithOwner.localeCompare(b.repositoryNameWithOwner);
        if (repoCmp !== 0) {
            return repoCmp;
        }
        return a.number - b.number;
    });
    for (const row of sorted) {
        const key = groupKey(row, mode);
        const list = map.get(key);
        if (list) {
            list.push(row);
        } else {
            map.set(key, [row]);
        }
    }
    return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

function canonicalPrimaryRepo(issues: RoadmapIssueRow[], primaryRepo: string): string | undefined {
    const found = issues.find(
        (i) => i.repositoryNameWithOwner.toLowerCase() === primaryRepo.toLowerCase()
    );
    return found?.repositoryNameWithOwner;
}

function repositoryChoices(issues: RoadmapIssueRow[], primaryRepo: string): string[] {
    const fromData = [...new Set(issues.map((i) => i.repositoryNameWithOwner))];
    const lowers = new Set(fromData.map((r) => r.toLowerCase()));
    if (!lowers.has(primaryRepo.toLowerCase())) {
        fromData.push(primaryRepo);
    }
    return fromData.sort((a, b) => a.localeCompare(b));
}

const shell: React.CSSProperties = {
    fontFamily:
        'var(--vscode-font-family), system-ui, -apple-system, Segoe UI, sans-serif',
    fontSize: 'var(--vscode-font-size, 13px)',
    color: 'var(--vscode-foreground)',
    background: 'var(--vscode-editor-background)',
    padding: '12px 16px',
    boxSizing: 'border-box',
    minHeight: '100vh'
};

const heading: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 600,
    margin: '0 0 4px 0'
};

const sub: React.CSSProperties = {
    opacity: 0.85,
    margin: '0 0 16px 0',
    fontSize: '12px'
};

const controlsRow: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '12px 16px',
    marginBottom: '16px'
};

const table: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px'
};

const th: React.CSSProperties = {
    textAlign: 'left',
    padding: '6px 8px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    fontWeight: 600
};

const td: React.CSSProperties = {
    padding: '6px 8px',
    borderBottom: '1px solid var(--vscode-widget-border, rgba(128,128,128,0.2))',
    verticalAlign: 'top'
};

const groupHeader: React.CSSProperties = {
    padding: '12px 8px 6px',
    fontWeight: 600,
    fontSize: '12px',
    color: 'var(--vscode-descriptionForeground)'
};

const selectStyle: React.CSSProperties = {
    minWidth: '220px',
    maxWidth: '100%',
    padding: '4px 8px',
    fontSize: '12px',
    color: 'var(--vscode-foreground)',
    background: 'var(--vscode-dropdown-background)',
    border: '1px solid var(--vscode-dropdown-border)'
};

function App() {
    const [model, setModel] = useState<RoadmapWebviewPayload | null>(null);
    const [mode, setMode] = useState<GroupMode>('sprint');
    const [repoFilter, setRepoFilter] = useState<string>(ALL_REPOS);

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            const data = event.data;
            if (data?.type === 'init' && data.payload) {
                const m = data.payload as RoadmapWebviewPayload;
                setModel(m);
                const canonical = canonicalPrimaryRepo(m.issues, m.primaryRepo);
                setRepoFilter(canonical ?? ALL_REPOS);
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    const repoChoicesList = useMemo(() => {
        if (!model) {
            return [];
        }
        return repositoryChoices(model.issues, model.primaryRepo);
    }, [model]);

    /** Option value that matches a real <option> (canonical casing from GitHub). */
    const repositorySelectValue = useMemo(() => {
        if (repoFilter === ALL_REPOS) {
            return ALL_REPOS;
        }
        const exact = repoChoicesList.find(
            (r) => r.toLowerCase() === repoFilter.toLowerCase()
        );
        return exact ?? repoFilter;
    }, [repoFilter, repoChoicesList]);

    const visibleIssues = useMemo(() => {
        if (!model?.issues.length) {
            return [];
        }
        if (repoFilter === ALL_REPOS) {
            return model.issues;
        }
        return model.issues.filter(
            (r) => r.repositoryNameWithOwner.toLowerCase() === repoFilter.toLowerCase()
        );
    }, [model, repoFilter]);

    const grouped = useMemo(() => {
        if (!visibleIssues.length) {
            return new Map<string, RoadmapIssueRow[]>();
        }
        return groupIssues(visibleIssues, mode);
    }, [visibleIssues, mode]);

    const showRepoColumn = repoFilter === ALL_REPOS;

    if (!model) {
        return (
            <div style={shell}>
                <p style={{ margin: 0 }}>Loading roadmap…</p>
            </div>
        );
    }

    if (model.issues.length === 0) {
        return (
            <div style={shell}>
                <h1 style={heading}>{model.projectTitle}</h1>
                <p style={sub}>{ROADMAP_INTRO}</p>
                <p>No incomplete issues (Status is not Done) on this project.</p>
            </div>
        );
    }

    if (visibleIssues.length === 0) {
        return (
            <div style={shell}>
                <h1 style={heading}>{model.projectTitle}</h1>
                <p style={sub}>{ROADMAP_INTRO}</p>
                <div style={controlsRow}>
                    <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        Repository
                        <select
                            style={selectStyle}
                            value={repositorySelectValue}
                            onChange={(e) => setRepoFilter(e.target.value)}
                        >
                            <option value={ALL_REPOS}>All repositories</option>
                            {repoChoicesList.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <p>
                    No incomplete issues for the selected repository
                    {repoFilter !== ALL_REPOS ? ` (${repoFilter})` : ''}. Choose &quot;All
                    repositories&quot; or another repo.
                </p>
            </div>
        );
    }

    return (
        <div style={shell}>
            <h1 style={heading}>{model.projectTitle}</h1>
            <p style={sub}>{ROADMAP_INTRO}</p>
            <div style={controlsRow}>
                <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Repository
                    <select
                        style={selectStyle}
                        value={repositorySelectValue}
                        onChange={(e) => setRepoFilter(e.target.value)}
                    >
                        <option value={ALL_REPOS}>All repositories</option>
                        {repoChoicesList.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </label>
                <span style={{ fontSize: '12px' }}>Group by:</span>
                <label style={{ cursor: 'pointer' }}>
                    <input
                        type="radio"
                        name="grp"
                        checked={mode === 'sprint'}
                        onChange={() => setMode('sprint')}
                    />{' '}
                    Sprint
                </label>
                <label style={{ cursor: 'pointer' }}>
                    <input
                        type="radio"
                        name="grp"
                        checked={mode === 'milestone'}
                        onChange={() => setMode('milestone')}
                    />{' '}
                    Milestone
                </label>
            </div>
            {[...grouped.entries()].map(([groupName, rows]) => (
                <section key={groupName}>
                    <div style={groupHeader}>{groupName}</div>
                    <table style={table}>
                        <thead>
                            <tr>
                                {showRepoColumn ? <th style={th}>Repository</th> : null}
                                <th style={th}>#</th>
                                <th style={th}>Title</th>
                                <th style={th}>Status</th>
                                {mode === 'sprint' ? (
                                    <th style={th}>Milestone</th>
                                ) : (
                                    <th style={th}>Sprint</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.projectItemId}>
                                    {showRepoColumn ? (
                                        <td style={td}>{row.repositoryNameWithOwner}</td>
                                    ) : null}
                                    <td style={td}>{row.number}</td>
                                    <td style={td}>
                                        <a
                                            href={row.htmlUrl}
                                            style={{ color: 'var(--vscode-textLink-foreground)' }}
                                        >
                                            {row.title}
                                        </a>
                                    </td>
                                    <td style={td}>{row.status ?? '—'}</td>
                                    <td style={td}>
                                        {mode === 'sprint'
                                            ? row.milestoneTitle ?? '—'
                                            : row.sprint ?? '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            ))}
        </div>
    );
}

const el = document.getElementById('root');
if (el) {
    const root = createRoot(el);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
