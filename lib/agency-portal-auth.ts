import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

export const AGENCY_SESSION_COOKIE = 'tb_agency_session';
export const AGENCY_CSRF_COOKIE = 'tb_agency_csrf';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function buildCookieConfig(httpOnly: boolean) {
  return {
    httpOnly,
    secure: isProduction(),
    sameSite: (isProduction() ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

export function verifyStoredPassword(password: string, passwordHash: string): boolean {
  const [algorithm, salt, expectedHash] = passwordHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !expectedHash) return false;

  const computedHash = scryptSync(password, salt, 64).toString('hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const computedBuffer = Buffer.from(computedHash, 'hex');

  if (expectedBuffer.length !== computedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, computedBuffer);
}

export function setAgencyAuthCookies(
  response: NextResponse,
  sessionToken: string,
  csrfToken: string
) {
  response.cookies.set(AGENCY_SESSION_COOKIE, sessionToken, buildCookieConfig(true));
  response.cookies.set(AGENCY_CSRF_COOKIE, csrfToken, buildCookieConfig(false));
}

export function clearAgencyAuthCookies(response: NextResponse) {
  response.cookies.set(AGENCY_SESSION_COOKIE, '', {
    ...buildCookieConfig(true),
    maxAge: 0,
  });
  response.cookies.set(AGENCY_CSRF_COOKIE, '', {
    ...buildCookieConfig(false),
    maxAge: 0,
  });
}

function parseHostFromUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function normaliseDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
}

export function getRequestDomainCandidates(request: NextRequest): string[] {
  const candidates = new Set<string>();
  const originHost = parseHostFromUrl(request.headers.get('origin'));
  const refererHost = parseHostFromUrl(request.headers.get('referer'));

  // Never trust client-provided custom headers for allowlist checks.
  // Only parse browser-managed Origin/Referer values.
  if (originHost) candidates.add(originHost);
  if (refererHost) candidates.add(refererHost);

  return Array.from(candidates).filter(Boolean);
}

export function isAllowedDomain(allowedDomains: string[] = [], requestDomains: string[] = []): boolean {
  const normalisedAllowed = allowedDomains.map(normaliseDomain).filter(Boolean);
  const normalisedRequest = requestDomains.map(normaliseDomain).filter(Boolean);
  const isInternalTourBotsDomain = normalisedRequest.some(
    (domain) =>
      domain === 'localhost' ||
      domain === 'tourbots.ai' ||
      domain === 'www.tourbots.ai'
  );
  if (isInternalTourBotsDomain) return true;

  if (normalisedAllowed.length === 0) return false;

  return normalisedRequest.some((domain) =>
    normalisedAllowed.some((allowed) => domain === allowed || domain.endsWith(`.${allowed}`))
  );
}

export async function getAgencyPortalVenueSettings(venueId: string): Promise<{
  is_enabled: boolean;
  allowed_domains: string[];
  addon_agency_portal: boolean | null;
} | null> {
  const [{ data, error }, { data: billingData, error: billingError }] = await Promise.all([
    supabase
      .from('agency_portal_settings')
      .select('is_enabled, allowed_domains')
      .eq('venue_id', venueId)
      .maybeSingle(),
    supabase
      .from('venue_billing_records')
      .select('addon_agency_portal')
      .eq('venue_id', venueId)
      .maybeSingle(),
  ]);

  if (error) return null;
  if (!data) return null;
  return {
    is_enabled: Boolean(data.is_enabled),
    allowed_domains: Array.isArray(data.allowed_domains) ? data.allowed_domains : [],
    addon_agency_portal: billingError ? null : Boolean(billingData?.addon_agency_portal),
  };
}

export async function validatePortalVenueAccess(
  request: NextRequest,
  venueId: string
): Promise<NextResponse | null> {
  const settings = await getAgencyPortalVenueSettings(venueId);
  if (!settings?.is_enabled) {
    return NextResponse.json({ error: 'Agency portal is disabled for this account.' }, { status: 403 });
  }
  if (settings.addon_agency_portal === false) {
    return NextResponse.json({ error: 'Agency portal add-on is not active.' }, { status: 403 });
  }

  const requestDomains = getRequestDomainCandidates(request);
  if (!isAllowedDomain(settings.allowed_domains, requestDomains)) {
    return NextResponse.json({ error: 'Domain is not allowed for this portal.' }, { status: 403 });
  }

  return null;
}

export interface AgencyPortalSessionContext {
  sessionId: string;
  shareId: string;
  shareSlug: string;
  venueId: string;
  tourId: string;
  csrfTokenHash: string | null;
  enabledModules: {
    tour?: boolean;
    settings?: boolean;
    customisation?: boolean;
    analytics?: boolean;
  };
  user: {
    id: string;
    email: string;
    displayName: string | null;
    isActive: boolean;
  };
}

export async function resolveAgencyPortalSession(
  request: NextRequest,
  requestedShareSlug?: string
): Promise<AgencyPortalSessionContext | null> {
  const rawSessionToken = request.cookies.get(AGENCY_SESSION_COOKIE)?.value;
  if (!rawSessionToken) return null;

  const sessionTokenHash = hashToken(rawSessionToken);
  const { data: session, error: sessionError } = await supabase
    .from('agency_portal_sessions')
    .select('id, share_id, user_id, venue_id, csrf_token_hash')
    .eq('session_token_hash', sessionTokenHash)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (sessionError || !session) return null;

  const [{ data: shareRecord, error: shareError }, { data: userRecord, error: userError }] = await Promise.all([
    supabase
      .from('agency_portal_shares')
      .select('tour_id, share_slug, enabled_modules, is_active')
      .eq('id', session.share_id)
      .maybeSingle(),
    supabase
      .from('agency_portal_users')
      .select('id, email, display_name, is_active')
      .eq('id', session.user_id)
      .maybeSingle(),
  ]);

  if (shareError || userError) return null;
  if (!shareRecord || !userRecord) return null;
  if (!shareRecord.is_active || !userRecord.is_active) return null;
  if (requestedShareSlug && shareRecord.share_slug !== requestedShareSlug) return null;

  await supabase
    .from('agency_portal_sessions')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', session.id);

  return {
    sessionId: session.id,
    shareId: session.share_id,
    shareSlug: shareRecord.share_slug,
    venueId: session.venue_id,
    tourId: shareRecord.tour_id,
    csrfTokenHash: session.csrf_token_hash,
    enabledModules: shareRecord.enabled_modules || {},
    user: {
      id: userRecord.id,
      email: userRecord.email,
      displayName: userRecord.display_name,
      isActive: userRecord.is_active,
    },
  };
}

export async function requireAgencyPortalSession(
  request: NextRequest,
  options?: {
    shareSlug?: string;
    requiredModule?: 'tour' | 'settings' | 'customisation' | 'analytics';
    requireCsrf?: boolean;
  }
): Promise<AgencyPortalSessionContext | NextResponse> {
  const context = await resolveAgencyPortalSession(request, options?.shareSlug);
  if (!context) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const portalAccessError = await validatePortalVenueAccess(request, context.venueId);
  if (portalAccessError) return portalAccessError;

  if (options?.requiredModule && context.enabledModules?.[options.requiredModule] === false) {
    return NextResponse.json({ error: `Module "${options.requiredModule}" is disabled for this share.` }, { status: 403 });
  }

  if (options?.requireCsrf) {
    const csrfHeader = request.headers.get('x-csrf-token');
    const csrfCookie = request.cookies.get(AGENCY_CSRF_COOKIE)?.value;
    const csrfHashValid =
      Boolean(csrfHeader) &&
      Boolean(context.csrfTokenHash) &&
      hashToken(csrfHeader || '') === context.csrfTokenHash;
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie || !csrfHashValid) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }
  }

  return context;
}

