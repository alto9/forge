import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
    GitProvider,
    HostToWebview,
    ProgressEvent,
    ProgressStage,
    SubmoduleRow,
    WebviewToHost
} from './types';

function detectProvider(url: string): GitProvider {
    const normalized = url.trim().toLowerCase();
    if (!normalized) {
        return 'unknown';
    }
    if (normalized.includes('github.com') || normalized.includes('github.')) {
        return 'github';
    }
    if (normalized.includes('gitlab.com') || normalized.includes('gitlab.')) {
        return 'gitlab';
    }
    return 'unknown';
}

declare function acquireVsCodeApi(): {
    postMessage(message: WebviewToHost): void;
};

const vscode = acquireVsCodeApi();

const STAGES: ProgressStage[] = ['submodules', 'worktrees', 'configuration', 'harness'];

function newId(): string {
    return `row-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyRow(): SubmoduleRow {
    return {
        id: newId(),
        name: '',
        path: '',
        url: '',
        branch: 'main',
        provider: 'unknown'
    };
}

export function App(): React.ReactElement {
    const [repoRoot, setRepoRoot] = useState('');
    const [worktreesPath, setWorktreesPath] = useState('.worktrees');
    const [rows, setRows] = useState<SubmoduleRow[]>([]);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState<Partial<Record<ProgressStage, ProgressEvent>>>({});
    const [resultMessage, setResultMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handler = (event: MessageEvent<HostToWebview>) => {
            const msg = event.data;
            if (!msg || typeof msg !== 'object') {
                return;
            }
            switch (msg.type) {
                case 'init':
                    setRepoRoot(msg.repoRoot);
                    setWorktreesPath(msg.worktreesPath);
                    setRows(msg.submodules.length ? msg.submodules : []);
                    setProgress({});
                    setResultMessage(null);
                    setError(null);
                    setBusy(false);
                    break;
                case 'progress':
                    setProgress((prev) => ({ ...prev, [msg.event.stage]: msg.event }));
                    break;
                case 'applyResult':
                    setBusy(false);
                    if (msg.ok) {
                        setResultMessage('Superrepo initialized successfully.');
                        setError(null);
                    } else {
                        setError(msg.error || 'Initialization failed.');
                    }
                    break;
                case 'error':
                    setBusy(false);
                    setError(msg.message);
                    break;
                default:
                    break;
            }
        };
        window.addEventListener('message', handler);
        vscode.postMessage({ type: 'ready' });
        return () => window.removeEventListener('message', handler);
    }, []);

    const updateRow = useCallback((id: string, patch: Partial<SubmoduleRow>) => {
        setRows((prev) =>
            prev.map((r) => {
                if (r.id !== id) {
                    return r;
                }
                const next = { ...r, ...patch };
                if (patch.url !== undefined) {
                    next.provider = detectProvider(patch.url);
                }
                return next;
            })
        );
    }, []);

    const removeRow = useCallback((id: string) => {
        setRows((prev) => prev.filter((r) => r.id !== id));
    }, []);

    const addRow = useCallback(() => {
        setRows((prev) => [...prev, emptyRow()]);
    }, []);

    const canApply = useMemo(() => {
        if (busy) {
            return false;
        }
        if (!worktreesPath.trim()) {
            return false;
        }
        for (const row of rows) {
            if (!row.path.trim() || !row.url.trim()) {
                return false;
            }
        }
        return true;
    }, [busy, rows, worktreesPath]);

    const onApply = () => {
        setBusy(true);
        setError(null);
        setResultMessage(null);
        setProgress({});
        vscode.postMessage({
            type: 'apply',
            worktreesPath: worktreesPath.trim(),
            submodules: rows.map((r) => ({
                name: r.name.trim() || r.path.trim().split('/').pop() || r.path.trim(),
                path: r.path.trim().replace(/\\/g, '/'),
                url: r.url.trim(),
                branch: r.branch.trim() || 'main'
            }))
        });
    };

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <h1 style={styles.title}>Initialize Superrepo</h1>
                <p style={styles.muted}>
                    Configure git submodules, a central worktrees folder, and install the Forge
                    harness into <code>.cursor/</code>.
                </p>
            </header>

            <section style={styles.section}>
                <label style={styles.label}>Superrepo root</label>
                <div style={styles.row}>
                    <input style={styles.input} value={repoRoot} readOnly />
                    <button
                        style={styles.secondaryBtn}
                        disabled={busy}
                        onClick={() => vscode.postMessage({ type: 'pickFolder' })}
                    >
                        Change…
                    </button>
                </div>
            </section>

            <section style={styles.section}>
                <label style={styles.label}>Worktrees folder</label>
                <input
                    style={styles.input}
                    value={worktreesPath}
                    disabled={busy}
                    onChange={(e) => setWorktreesPath(e.target.value)}
                    placeholder=".worktrees"
                />
                <p style={styles.hint}>
                    Disposable contracts/build/review worktrees are created under this path.
                </p>
            </section>

            <section style={styles.section}>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.h2}>Submodules</h2>
                    <button style={styles.secondaryBtn} disabled={busy} onClick={addRow}>
                        Add submodule
                    </button>
                </div>
                {rows.length === 0 ? (
                    <p style={styles.muted}>
                        No submodules yet. Add a remote, name, and target folder to get started.
                    </p>
                ) : (
                    <div style={styles.table}>
                        <div style={styles.tableHead}>
                            <span>Name</span>
                            <span>Path</span>
                            <span>Remote URL</span>
                            <span>Branch</span>
                            <span>Provider</span>
                            <span />
                        </div>
                        {rows.map((row) => (
                            <div key={row.id} style={styles.tableRow}>
                                <input
                                    style={styles.cellInput}
                                    value={row.name}
                                    disabled={busy}
                                    placeholder="name"
                                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                                />
                                <input
                                    style={styles.cellInput}
                                    value={row.path}
                                    disabled={busy}
                                    placeholder="path/to/repo"
                                    onChange={(e) => updateRow(row.id, { path: e.target.value })}
                                />
                                <input
                                    style={styles.cellInput}
                                    value={row.url}
                                    disabled={busy}
                                    placeholder="git@github.com:org/repo.git"
                                    onChange={(e) => updateRow(row.id, { url: e.target.value })}
                                />
                                <input
                                    style={styles.cellInput}
                                    value={row.branch}
                                    disabled={busy}
                                    placeholder="main"
                                    onChange={(e) => updateRow(row.id, { branch: e.target.value })}
                                />
                                <span style={styles.provider}>{row.provider}</span>
                                <button
                                    style={styles.dangerBtn}
                                    disabled={busy}
                                    onClick={() => removeRow(row.id)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section style={styles.section}>
                <h2 style={styles.h2}>Progress</h2>
                <ul style={styles.progressList}>
                    {STAGES.map((stage) => {
                        const ev = progress[stage];
                        const status = ev?.status ?? 'pending';
                        return (
                            <li key={stage} style={styles.progressItem}>
                                <strong style={{ textTransform: 'capitalize' }}>{stage}</strong>
                                <span style={styles.muted}>
                                    {status === 'pending' ? 'waiting' : `${status}: ${ev?.message || ''}`}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </section>

            {error ? <p style={styles.error}>{error}</p> : null}
            {resultMessage ? <p style={styles.success}>{resultMessage}</p> : null}

            <footer style={styles.footer}>
                <button
                    style={styles.secondaryBtn}
                    disabled={busy}
                    onClick={() => vscode.postMessage({ type: 'cancel' })}
                >
                    Cancel
                </button>
                <button style={styles.primaryBtn} disabled={!canApply} onClick={onApply}>
                    {busy ? 'Working…' : 'Initialize Super-Repo'}
                </button>
            </footer>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        fontFamily: 'var(--vscode-font-family)',
        color: 'var(--vscode-foreground)',
        padding: '16px 20px 32px',
        maxWidth: 1100,
        margin: '0 auto'
    },
    header: { marginBottom: 20 },
    title: { fontSize: 20, fontWeight: 600, margin: '0 0 8px' },
    h2: { fontSize: 14, fontWeight: 600, margin: 0 },
    muted: { opacity: 0.8, fontSize: 12, margin: '4px 0 0' },
    hint: { opacity: 0.7, fontSize: 11, margin: '6px 0 0' },
    section: { marginBottom: 22 },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    label: { display: 'block', fontSize: 12, marginBottom: 6, opacity: 0.9 },
    row: { display: 'flex', gap: 8 },
    input: {
        flex: 1,
        width: '100%',
        background: 'var(--vscode-input-background)',
        color: 'var(--vscode-input-foreground)',
        border: '1px solid var(--vscode-input-border, transparent)',
        padding: '6px 8px',
        borderRadius: 2
    },
    table: { display: 'flex', flexDirection: 'column', gap: 6 },
    tableHead: {
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr 1.8fr 0.7fr 0.7fr auto',
        gap: 6,
        fontSize: 11,
        opacity: 0.7,
        padding: '0 2px'
    },
    tableRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr 1.8fr 0.7fr 0.7fr auto',
        gap: 6,
        alignItems: 'center'
    },
    cellInput: {
        background: 'var(--vscode-input-background)',
        color: 'var(--vscode-input-foreground)',
        border: '1px solid var(--vscode-input-border, transparent)',
        padding: '5px 6px',
        borderRadius: 2,
        fontSize: 12
    },
    provider: { fontSize: 11, opacity: 0.8 },
    progressList: { listStyle: 'none', padding: 0, margin: '8px 0 0' },
    progressItem: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '6px 0',
        borderBottom: '1px solid var(--vscode-widget-border, rgba(127,127,127,0.3))',
        fontSize: 12
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 16
    },
    primaryBtn: {
        background: 'var(--vscode-button-background)',
        color: 'var(--vscode-button-foreground)',
        border: 'none',
        padding: '8px 14px',
        cursor: 'pointer',
        borderRadius: 2
    },
    secondaryBtn: {
        background: 'var(--vscode-button-secondaryBackground)',
        color: 'var(--vscode-button-secondaryForeground)',
        border: 'none',
        padding: '8px 12px',
        cursor: 'pointer',
        borderRadius: 2
    },
    dangerBtn: {
        background: 'transparent',
        color: 'var(--vscode-errorForeground)',
        border: '1px solid var(--vscode-errorForeground)',
        padding: '4px 8px',
        cursor: 'pointer',
        borderRadius: 2,
        fontSize: 11
    },
    error: { color: 'var(--vscode-errorForeground)', fontSize: 13 },
    success: { color: 'var(--vscode-testing-iconPassed, #3fb950)', fontSize: 13 }
};
