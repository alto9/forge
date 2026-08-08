export type GitProvider = 'github' | 'gitlab' | 'unknown';

export interface SubmoduleEntry {
    /** Section name in .gitmodules (often matches folder basename). */
    name: string;
    path: string;
    url: string;
    branch: string;
}

export interface SubmoduleView extends SubmoduleEntry {
    provider: GitProvider;
}
