/**
 * Resolves parent page domain for embedded tour analytics (views, moves).
 * Mirrors logic in tour-embed-client view tracking: only external hostnames qualify.
 */
export function getTourEmbedParentTrackingContext(): { domain: string; pageUrl: string | null } | null {
  if (typeof window === 'undefined') return null;

  const blocked = (host: string) =>
    host === 'venuetours.ai' ||
    host === 'www.venuetours.ai' ||
    host === 'tourbots.ai' ||
    host === 'www.tourbots.ai';

  const urlParams = new URLSearchParams(window.location.search);
  const parentDomain = urlParams.get('domain');
  const parentPageUrl = urlParams.get('pageUrl');

  let finalDomain: string | null = parentDomain;
  let finalPageUrl: string | null = parentPageUrl;

  if (parentDomain && !blocked(parentDomain)) {
    finalDomain = parentDomain;
    finalPageUrl = parentPageUrl;
  } else if (document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      finalDomain = referrerUrl.hostname;
      finalPageUrl = document.referrer;
    } catch {
      /* ignore */
    }
  }

  if (!finalDomain || blocked(finalDomain)) return null;

  return { domain: finalDomain, pageUrl: finalPageUrl };
}
