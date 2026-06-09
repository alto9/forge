import type { ExternalConnectFailureRemediation } from './types';

export interface ClassifiedExternalConnectFailure {
    remediation: ExternalConnectFailureRemediation;
    message: string;
    probeErrorCode?: string;
}

const AUTH_PATTERNS = [
    /unauthenticated/i,
    /permission denied/i,
    /authentication failed/i,
    /invalid api key/i,
    /401/,
    /403/,
    /UNAUTHENTICATED/,
    /PERMISSION_DENIED/,
];

const TLS_PATTERNS = [
    /certificate/i,
    /\btls\b/i,
    /\bssl\b/i,
    /handshake/i,
    /x509/i,
    /CERT_/,
];

const ADDRESS_PATTERNS = [
    /ECONNREFUSED/i,
    /ENOTFOUND/i,
    /ETIMEDOUT/i,
    /EHOSTUNREACH/i,
    /UNAVAILABLE/i,
    /unreachable/i,
    /connect ECONNREFUSED/i,
    /network/i,
    /connection refused/i,
];

function extractProbeErrorCode(error: Error): string | undefined {
    const code = (error as NodeJS.ErrnoException).code;
    if (typeof code === 'string' && code.length > 0) {
        return code;
    }

    const match = error.message.match(/\b([A-Z_]{3,})\b/);
    return match?.[1];
}

export function classifyExternalConnectFailure(error: Error): ClassifiedExternalConnectFailure {
    const message = error.message ?? String(error);
    const probeErrorCode = extractProbeErrorCode(error);

    for (const pattern of AUTH_PATTERNS) {
        if (pattern.test(message)) {
            return {
                remediation: 'auth',
                message: 'External Temporal authentication failed.',
                probeErrorCode,
            };
        }
    }

    for (const pattern of TLS_PATTERNS) {
        if (pattern.test(message)) {
            return {
                remediation: 'tls',
                message: 'External Temporal TLS handshake failed.',
                probeErrorCode,
            };
        }
    }

    for (const pattern of ADDRESS_PATTERNS) {
        if (pattern.test(message)) {
            return {
                remediation: 'address',
                message: 'External Temporal endpoint is unreachable.',
                probeErrorCode,
            };
        }
    }

    return {
        remediation: 'config',
        message: 'External Temporal connection failed.',
        probeErrorCode,
    };
}
