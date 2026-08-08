export type GitProvider = 'github' | 'gitlab' | 'unknown';

export interface SubmoduleRow {
    id: string;
    name: string;
    path: string;
    url: string;
    branch: string;
    provider: GitProvider;
}

export type ProgressStage = 'submodules' | 'worktrees' | 'configuration' | 'harness';

export interface ProgressEvent {
    stage: ProgressStage;
    status: 'running' | 'done' | 'error';
    message: string;
}

export type HostToWebview =
    | { type: 'init'; repoRoot: string; worktreesPath: string; submodules: SubmoduleRow[] }
    | { type: 'progress'; event: ProgressEvent }
    | { type: 'applyResult'; ok: boolean; error?: string; completedStages: ProgressStage[] }
    | { type: 'error'; message: string };

export type WebviewToHost =
    | { type: 'ready' }
    | {
          type: 'apply';
          submodules: Array<{ name: string; path: string; url: string; branch: string }>;
          worktreesPath: string;
      }
    | { type: 'pickFolder' }
    | { type: 'cancel' };
