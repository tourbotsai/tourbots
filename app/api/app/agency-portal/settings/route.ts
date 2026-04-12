import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateAndGetVenue } from '@/lib/authenticated-venue';

const updateSettingsSchema = z.object({
  is_enabled: z.boolean().optional(),
  agency_name: z.string().trim().max(120).nullable().optional(),
  logo_url: z.string().trim().max(500).nullable().optional(),
  primary_colour: z.string().trim().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).nullable().optional(),
  secondary_colour: z.string().trim().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).nullable().optional(),
  allowed_domains: z.array(z.string().trim().min(1).max(255)).max(100).optional(),
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
        .select('addon_agency_portal')
        .eq('venue_id', venueId)
        .maybeSingle(),
    ]);

    if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 500 });
    }

    if (billingError) {
      return NextResponse.json({ error: billingError.message }, { status: 500 });
    }

    return NextResponse.json({
      settings,
      entitlement: {
        addon_agency_portal: Boolean(billingRecord?.addon_agency_portal),
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
    const { data: updated, error } = await supabase
      .from('agency_portal_settings')
      .update({
        ...payload,
      })
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

