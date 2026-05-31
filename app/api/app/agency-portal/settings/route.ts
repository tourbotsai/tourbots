import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateAndGetVenue } from '@/lib/authenticated-venue';
import { ENTITLEMENT_COLUMNS, venueHasAgencyPortal } from '@/lib/billing-entitlements';
import { normaliseDomain } from '@/lib/agency-portal-auth';

// Mirrors the POSIX-safe hostname check on agency_portal_settings.tour_embed_domain
// (sql/67): lowercase, >=2 dot-separated labels, each alphanumeric-bounded.
const TOUR_EMBED_DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

const updateSettingsSchema = z.object({
  is_enabled: z.boolean().optional(),
  agency_name: z.string().trim().max(120).nullable().optional(),
  logo_url: z.string().trim().max(500).nullable().optional(),
  primary_colour: z.string().trim().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).nullable().optional(),
  secondary_colour: z.string().trim().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).nullable().optional(),
  portal_background_colour: z.string().trim().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).nullable().optional(),
  allowed_domains: z.array(z.string().trim().min(1).max(255)).max(100).optional(),
  client_usage_mode: z.enum(['shared', 'allocated']).optional(),
  // White-label tour embed domain (Phase A: store + status only). Accepts a bare
  // host or full URL; normalised + validated below. Null/empty clears it.
  tour_embed_domain: z.string().trim().max(255).nullable().optional(),
});

async function ensureSettingsRow(venueId: string) {
  const { data: existing } = await supabase
    .from('agency_portal_settings')
    .select('id')
    .eq('venue_id', venueId)
    .maybeSingle();

  if (existing) return;

  await supabase
    .from('agency_portal_settings')
    .insert({
      venue_id: venueId,
      is_enabled: false,
      allowed_domains: [],
    });
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId } = authResult;
    await ensureSettingsRow(venueId);

    const [{ data: settings, error: settingsError }, { data: billingRecord, error: billingError }] = await Promise.all([
      supabase
        .from('agency_portal_settings')
        .select('*')
        .eq('venue_id', venueId)
        .single(),
      supabase
        .from('venue_billing_records')
        .select(ENTITLEMENT_COLUMNS)
        .eq('venue_id', venueId)
        .maybeSingle(),
    ]);

    if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 500 });
    }

    if (billingError) {
      return NextResponse.json({ error: billingError.message }, { status: 500 });
    }

    const entitled = venueHasAgencyPortal(billingRecord as any);

    // Agency portal is part of the Agency plan, so it is always active for
    // entitled venues - no manual enable step is required.
    let effectiveSettings = settings;
    if (entitled && settings && !settings.is_enabled) {
      const { data: enabledSettings } = await supabase
        .from('agency_portal_settings')
        .update({ is_enabled: true })
        .eq('venue_id', venueId)
        .select('*')
        .single();
      if (enabledSettings) {
        effectiveSettings = enabledSettings;
      }
    }

    return NextResponse.json({
      settings: effectiveSettings,
      entitlement: {
        entitled,
      },
    });
  } catch (error: any) {
    console.error('Error fetching agency portal settings:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch agency portal settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId } = authResult;
    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map((entry) => entry.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    await ensureSettingsRow(venueId);

    const payload = parsed.data;
    const updatePayload: Record<string, any> = { ...payload };

    // Handle the white-label tour embed domain specially: normalise, validate,
    // and reset the verification lifecycle. Only touched when the key is present,
    // so saving other settings (e.g. branding) never clobbers a connected domain.
    if ('tour_embed_domain' in payload) {
      const raw = payload.tour_embed_domain;
      if (raw === null || raw === undefined || raw.trim() === '') {
        updatePayload.tour_embed_domain = null;
        updatePayload.tour_embed_domain_status = 'unconfigured';
        updatePayload.tour_embed_domain_verified_at = null;
        updatePayload.tour_embed_dns_records = null;
      } else {
        const host = normaliseDomain(raw);
        if (
          host === 'localhost' ||
          host === 'tourbots.ai' ||
          host === 'www.tourbots.ai' ||
          host.endsWith('.tourbots.ai')
        ) {
          return NextResponse.json(
            { error: 'Please use your own domain, not tourbots.ai or localhost.' },
            { status: 400 }
          );
        }
        if (host.length > 253 || !TOUR_EMBED_DOMAIN_REGEX.test(host)) {
          return NextResponse.json(
            { error: 'Enter a valid domain, e.g. tours.youragency.com.' },
            { status: 400 }
          );
        }
        updatePayload.tour_embed_domain = host;
        // Phase A: saving a domain marks it pending (awaiting Vercel/DNS in Phase B).
        updatePayload.tour_embed_domain_status = 'pending';
        updatePayload.tour_embed_domain_verified_at = null;
      }
    }

    const { data: updated, error } = await supabase
      .from('agency_portal_settings')
      .update(updatePayload)
      .eq('venue_id', venueId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating agency portal settings:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update agency portal settings' },
      { status: 500 }
    );
  }
}

