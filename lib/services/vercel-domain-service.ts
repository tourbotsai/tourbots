/**
 * Thin wrapper over the Vercel Domains API for the agency white-label tour embed
 * domain feature. Uses raw `fetch` (no SDK dependency).
 *
 * Env vars (see docs/features/AgencyTourEmbedDomain.md §0 + §2):
 *   - VERCEL_TOKEN      (required) — API token scoped to the tourbots project's scope.
 *   - VERCEL_PROJECT_ID (required) — the tourbots project id.
 *   - VERCEL_TEAM_ID    (OPTIONAL) — only set once the project lives under a Pro Team.
 *     When set we append `&teamId=...`; when unset we omit it. Setting it while the
 *     project is still personal-scoped causes 404s, so it is treated as optional.
 *
 * Every function fails soft: if the env is not configured it returns a clear
 * `not_configured` result so the Phase A store-only behaviour still works.
 */

const VERCEL_API = 'https://api.vercel.com';

export interface VercelVerificationRecord {
  type: string;
  domain: string;
  value: string;
  reason?: string;
}

export interface DnsRecord {
  type: 'CNAME' | 'A' | 'TXT';
  name: string;
  value: string;
}

export interface AddDomainResult {
  ok: boolean;
  verified: boolean;
  verification: VercelVerificationRecord[];
  error?: string;
  errorCode?: string;
}

export interface DomainConfigResult {
  ok: boolean;
  misconfigured: boolean;
  error?: string;
}

export interface VerifyDomainResult {
  ok: boolean;
  verified: boolean;
  verification: VercelVerificationRecord[];
  error?: string;
}

export interface RemoveDomainResult {
  ok: boolean;
  error?: string;
}

function vercelEnv() {
  return {
    token: process.env.VERCEL_TOKEN,
    projectId: process.env.VERCEL_PROJECT_ID,
    teamId: process.env.VERCEL_TEAM_ID, // optional — see file header.
  };
}

export function isVercelConfigured(): boolean {
  const { token, projectId } = vercelEnv();
  return Boolean(token && projectId);
}

/** `?teamId=...` only when the team id is present; otherwise an empty string. */
function teamQuery(): string {
  const { teamId } = vercelEnv();
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
}

async function vercelFetch(
  path: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  const { token } = vercelEnv();
  const res = await fetch(`${VERCEL_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    // Never cache Vercel control-plane calls.
    cache: 'no-store',
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

/**
 * Static DNS records the agency must add. Subdomains use a CNAME to Vercel; apex
 * domains use the Vercel A record. TXT ownership challenges (when required) are
 * merged in separately from the `verification[]` array via `buildDnsRecords`.
 */
export function getRequiredDnsRecords(host: string): DnsRecord[] {
  const labels = host.split('.');
  const isApex = labels.length <= 2;
  if (isApex) {
    return [{ type: 'A', name: '@', value: '76.76.21.21' }];
  }
  const name = labels.slice(0, labels.length - 2).join('.');
  return [{ type: 'CNAME', name: name || '@', value: 'cname.vercel-dns.com' }];
}

/**
 * Combines the static record(s) with any ownership-proof TXT records returned by
 * Vercel. Stored as `tour_embed_dns_records` so the UI can render the table
 * without re-calling the API.
 */
export function buildDnsRecords(
  host: string,
  verification: VercelVerificationRecord[] = []
): DnsRecord[] {
  const records = getRequiredDnsRecords(host);
  for (const entry of verification) {
    if (entry?.type && entry?.value) {
      records.push({
        type: (entry.type.toUpperCase() as DnsRecord['type']) || 'TXT',
        name: entry.domain || host,
        value: entry.value,
      });
    }
  }
  return records;
}

export async function addProjectDomain(host: string): Promise<AddDomainResult> {
  if (!isVercelConfigured()) {
    return { ok: false, verified: false, verification: [], error: 'Domain hosting is not configured.', errorCode: 'not_configured' };
  }
  const { projectId } = vercelEnv();
  try {
    const { ok, data } = await vercelFetch(`/v10/projects/${projectId}/domains${teamQuery()}`, {
      method: 'POST',
      body: JSON.stringify({ name: host }),
    });
    if (!ok) {
      return {
        ok: false,
        verified: false,
        verification: [],
        error: data?.error?.message || 'Failed to add domain to Vercel.',
        errorCode: data?.error?.code,
      };
    }
    return {
      ok: true,
      verified: Boolean(data?.verified),
      verification: Array.isArray(data?.verification) ? data.verification : [],
    };
  } catch (error: any) {
    console.error('Vercel addProjectDomain error:', error);
    return { ok: false, verified: false, verification: [], error: 'Could not reach Vercel.', errorCode: 'network_error' };
  }
}

export async function getDomainConfig(host: string): Promise<DomainConfigResult> {
  if (!isVercelConfigured()) {
    return { ok: false, misconfigured: true, error: 'not_configured' };
  }
  try {
    const { ok, data } = await vercelFetch(`/v6/domains/${host}/config${teamQuery()}`, { method: 'GET' });
    if (!ok) {
      return { ok: false, misconfigured: true, error: data?.error?.message || 'Failed to read domain config.' };
    }
    return { ok: true, misconfigured: Boolean(data?.misconfigured) };
  } catch (error: any) {
    console.error('Vercel getDomainConfig error:', error);
    return { ok: false, misconfigured: true, error: 'Could not reach Vercel.' };
  }
}

export async function verifyProjectDomain(host: string): Promise<VerifyDomainResult> {
  if (!isVercelConfigured()) {
    return { ok: false, verified: false, verification: [], error: 'not_configured' };
  }
  const { projectId } = vercelEnv();
  try {
    const { ok, data } = await vercelFetch(`/v9/projects/${projectId}/domains/${host}/verify${teamQuery()}`, {
      method: 'POST',
    });
    if (!ok) {
      return { ok: false, verified: false, verification: [], error: data?.error?.message || 'Failed to verify domain.' };
    }
    return {
      ok: true,
      verified: Boolean(data?.verified),
      verification: Array.isArray(data?.verification) ? data.verification : [],
    };
  } catch (error: any) {
    console.error('Vercel verifyProjectDomain error:', error);
    return { ok: false, verified: false, verification: [], error: 'Could not reach Vercel.' };
  }
}

export async function removeProjectDomain(host: string): Promise<RemoveDomainResult> {
  if (!isVercelConfigured()) {
    return { ok: false, error: 'not_configured' };
  }
  const { projectId } = vercelEnv();
  try {
    const { ok, status, data } = await vercelFetch(`/v9/projects/${projectId}/domains/${host}${teamQuery()}`, {
      method: 'DELETE',
    });
    // 404 = already removed; treat as success so disconnect is idempotent.
    if (!ok && status !== 404) {
      return { ok: false, error: data?.error?.message || 'Failed to remove domain.' };
    }
    return { ok: true };
  } catch (error: any) {
    console.error('Vercel removeProjectDomain error:', error);
    return { ok: false, error: 'Could not reach Vercel.' };
  }
}
