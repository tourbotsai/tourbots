/**
 * Helpers for the white-label tour embed "nested shell" strategy.
 *
 * Custom (white-label) tour embed domains serve the embed page, but the
 * Matterport SDK key and the public chatbot route are only authorised for the
 * canonical tourbots host. To keep navigation + chat working on any agency
 * domain without per-domain Matterport registration, the custom-domain page
 * renders a thin shell that nests the canonical tourbots embed in an iframe.
 *
 * These helpers are the single source of truth for deciding whether a given
 * host is "canonical" (render the tour directly) or a custom domain (nest the
 * canonical embed), and for resolving the canonical origin to nest.
 */

const CANONICAL_EMBED_ORIGIN_FALLBACK = 'https://tourbots.ai';

/** Strips any port and lower-cases a host header value. */
function normaliseHost(host: string): string {
  return host.trim().toLowerCase().split(':')[0] || '';
}

function isPrivateLanHost(host: string): boolean {
  if (host.endsWith('.local')) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

/**
 * Canonical hosts render the tour directly (no nesting): the tourbots app
 * itself, Vercel preview deployments, and local/LAN development. Everything
 * else is treated as a white-label custom domain and gets the nested shell.
 */
export function isCanonicalEmbedHost(host: string | null | undefined): boolean {
  if (!host) return true; // No host -> assume canonical (server fetches/direct render).
  const h = normaliseHost(host);
  if (!h) return true;
  if (h === 'localhost' || h === '127.0.0.1') return true;
  if (isPrivateLanHost(h)) return true;
  if (h === 'tourbots.ai' || h.endsWith('.tourbots.ai')) return true;
  if (h.endsWith('.vercel.app')) return true;
  return false;
}

/**
 * The canonical origin to nest for white-label domains. Overridable via
 * NEXT_PUBLIC_CANONICAL_EMBED_ORIGIN (e.g. for staging), defaults to the
 * production tourbots host.
 */
export function getCanonicalEmbedOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_CANONICAL_EMBED_ORIGIN?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  return CANONICAL_EMBED_ORIGIN_FALLBACK;
}
