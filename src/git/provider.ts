import type { GitProvider } from './types';

/**
 * Infer hosting provider from a git remote URL.
 */
export function detectProviderFromUrl(url: string): GitProvider {
    const normalized = url.trim().toLowerCase();
    if (!normalized) {
        return 'unknown';
    }
    if (
        normalized.includes('github.com') ||
        normalized.includes('github.') ||
        /^git@github\./.test(normalized)
    ) {
        return 'github';
    }
    if (
        normalized.includes('gitlab.com') ||
        normalized.includes('gitlab.') ||
        /^git@gitlab\./.test(normalized)
    ) {
        return 'gitlab';
    }
    return 'unknown';
}
