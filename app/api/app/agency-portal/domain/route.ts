import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateAndGetVenue, getScopedVenueId } from '@/lib/authenticated-venue';
import { ENTITLEMENT_COLUMNS, venueHasAgencyPortal } from '@/lib/billing-entitlements';
import { normaliseDomain } from '@/lib/agency-portal-auth';
import {
  addProjectDomain,
  getDomainConfig,
  verifyProjectDomain,
  removeProjectDomain,
  buildDnsRecords,
  isVercelConfigured,
  DnsRecord,
} from '@/lib/services/vercel-domain-service';

// Mirrors the POSIX-safe hostname check on agency_portal_settings.tour_embed_domain
// (sql/67) and the settings route.
const TOUR_EMBED_DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('connect'), domain: z.string().trim().min(1).max(255) }),
  z.object({ action: z.literal('check') }),
  z.object({ action: z.literal('disconnect') }),
]);

interface DomainState {
  tour_embed_domain: string | null;
  tour_embed_domain_status: string;
  tour_embed_domain_verified_at: string | null;
  tour_embed_dns_records: DnsRecord[] | null;
}

/** Ensures the caller owns an entitled (Agency-plan) venue. Platform admins may
 * target another venue by passing its id. */
async function requireEntitledVenue(
  request: NextRequest,
  requestedVenueId?: string | null
): Promise<{ venueId: string } | NextResponse> {
  const authResult = await authenticateAndGetVenue(request);
  if (authResult instanceof NextResponse) return authResult;
  const scopedVenueId = getScopedVenueId(authResult, requestedVenueId);
  if (scopedVenueId instanceof NextResponse) return scopedVenueId;
  const venueId = scopedVenueId;

  const { data: billingRecord, error: billingError } = await supabase
    .from('venue_billing_records')
    .select(ENTITLEMENT_COLUMNS)
    .eq('venue_id', venueId)
    .maybeSingle();

  if (billingError) {
    return NextResponse.json({ error: billingError.message }, { status: 500 });
  }
  if (!venueHasAgencyPortal(billingRecord as any)) {
    return NextResponse.json({ error: 'Agency plan is not active for this account.' }, { status: 403 });
  }
  return { venueId };
}

function validateHost(raw: string): { host?: string; error?: string } {
  const host = normaliseDomain(raw);
  if (
    host === 'localhost' ||
    host === 'tourbots.ai' ||
    host === 'www.tourbots.ai' ||
    host.endsWith('.tourbots.ai')
  ) {
    return { error: 'Please use your own domain, not tourbots.ai or localhost.' };
  }
  if (host.length > 253 || !TOUR_EMBED_DOMAIN_REGEX.test(host)) {
    return { error: 'Enter a valid domain, e.g. tours.youragency.com.' };
  }
  return { host };
}

async function loadState(venueId: string): Promise<DomainState | null> {
  const { data } = await supabase
    .from('agency_portal_settings')
    .select('tour_embed_domain, tour_embed_domain_status, tour_embed_domain_verified_at, tour_embed_dns_records')
    .eq('venue_id', venueId)
    .maybeSingle();
  if (!data) return null;
  return data as DomainState;
}

async function persistState(venueId: string, patch: Partial<DomainState>): Promise<DomainState | null> {
  const { data, error } = await supabase
    .from('agency_portal_settings')
    .update(patch)
    .eq('venue_id', venueId)
    .select('tour_embed_domain, tour_embed_domain_status, tour_embed_domain_verified_at, tour_embed_dns_records')
    .single();
  if (error) throw new Error(error.message);
  return data as DomainState;
}

function stateResponse(state: DomainState | null) {
  return NextResponse.json(stateResponseBody(state));
}

export async function GET(request: NextRequest) {
  try {
    const requestedVenueId = new URL(request.url).searchParams.get('venueId');
    const auth = await requireEntitledVenue(request, requestedVenueId);
    if (auth instanceof NextResponse) return auth;
    const state = await loadState(auth.venueId);
    return stateResponse(state);
  } catch (error: any) {
    console.error('Error fetching tour embed domain:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch domain.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const auth = await requireEntitledVenue(request, body?.venueId);
    if (auth instanceof NextResponse) return auth;
    const { venueId } = auth;

    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      const messages = parsed.error.errors.map((entry) => entry.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${messages}` }, { status: 400 });
    }

    if (!isVercelConfigured()) {
      return NextResponse.json(
        { error: 'Custom domains are not available yet. Please try again later.' },
        { status: 503 }
      );
    }

    const action = parsed.data.action;

    // ---- connect -----------------------------------------------------------
    if (action === 'connect') {
      const { host, error } = validateHost(parsed.data.domain);
      if (!host) {
        return NextResponse.json({ error }, { status: 400 });
      }

      const add = await addProjectDomain(host);
      if (!add.ok) {
        // Store the attempt so the agency sees the failure + can retry.
        const failed = await persistState(venueId, {
          tour_embed_domain: host,
          tour_embed_domain_status: 'failed',
          tour_embed_domain_verified_at: null,
          tour_embed_dns_records: null,
        });
        return NextResponse.json(
          { ...stateResponseBody(failed), error: add.error || 'Failed to connect domain.' },
          { status: 400 }
        );
      }

      const dnsRecords = buildDnsRecords(host, add.verification);
      let status: DomainState['tour_embed_domain_status'] = 'verifying';
      let verifiedAt: string | null = null;

      if (add.verified) {
        const config = await getDomainConfig(host);
        if (config.ok && !config.misconfigured) {
          status = 'verified';
          verifiedAt = new Date().toISOString();
        }
      }

      const state = await persistState(venueId, {
        tour_embed_domain: host,
        tour_embed_domain_status: status,
        tour_embed_domain_verified_at: verifiedAt,
        tour_embed_dns_records: dnsRecords,
      });
      return stateResponse(state);
    }

    // ---- disconnect --------------------------------------------------------
    if (action === 'disconnect') {
      const current = await loadState(venueId);
      const host = current?.tour_embed_domain;
      if (host) {
        await removeProjectDomain(host);
      }
      const state = await persistState(venueId, {
        tour_embed_domain: null,
        tour_embed_domain_status: 'unconfigured',
        tour_embed_domain_verified_at: null,
        tour_embed_dns_records: null,
      });
      return stateResponse(state);
    }

    // ---- check -------------------------------------------------------------
    const current = await loadState(venueId);
    const host = current?.tour_embed_domain;
    if (!host) {
      return NextResponse.json({ error: 'No domain is connected to check.' }, { status: 400 });
    }

    const verifyRes = await verifyProjectDomain(host);
    const config = await getDomainConfig(host);

    // A check should never *downgrade* a connected domain to "failed": while the
    // agency is still adding DNS, Vercel returns not-verified / not-ok from the
    // verify endpoint, which is expected. We only promote to "verified" when both
    // ownership is proven AND DNS is configured; otherwise we stay "verifying".
    const ownershipOk = verifyRes.ok && verifyRes.verified;
    const dnsOk = config.ok && !config.misconfigured;

    let status: DomainState['tour_embed_domain_status'];
    let verifiedAt: string | null = null;
    // Keep the existing records; only refresh if the verify call returned a new
    // ownership challenge, so the agency never loses the records to copy.
    let dnsRecords: DnsRecord[] = (current?.tour_embed_dns_records as DnsRecord[]) || buildDnsRecords(host);
    if (verifyRes.verification && verifyRes.verification.length > 0) {
      dnsRecords = buildDnsRecords(host, verifyRes.verification);
    }

    if (ownershipOk && dnsOk) {
      status = 'verified';
      verifiedAt = new Date().toISOString();
    } else {
      status = 'verifying';
    }

    const state = await persistState(venueId, {
      tour_embed_domain_status: status,
      tour_embed_domain_verified_at: verifiedAt,
      tour_embed_dns_records: dnsRecords,
    });
    return stateResponse(state);
  } catch (error: any) {
    console.error('Error updating tour embed domain:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update domain.' }, { status: 500 });
  }
}

// Small helper so the failed-connect path can reuse the same response shape.
function stateResponseBody(state: DomainState | null) {
  return {
    configured: isVercelConfigured(),
    domain: state?.tour_embed_domain || null,
    status: state?.tour_embed_domain_status || 'unconfigured',
    verifiedAt: state?.tour_embed_domain_verified_at || null,
    dnsRecords: state?.tour_embed_dns_records || [],
  };
}
