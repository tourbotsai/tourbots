import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

const updateVenueBillingSchema = z.object({
  plan_code: z.string().optional(),
  billing_status: z.enum(['free', 'active', 'past_due', 'cancelled', 'trialing']).optional(),
  billing_override_enabled: z.boolean().optional(),
  override_plan_code: z.string().nullable().optional(),
  addon_extra_spaces: z.number().int().min(0).optional(),
  addon_message_blocks: z.number().int().min(0).optional(),
  addon_white_label: z.boolean().optional(),
  effective_space_limit: z.number().int().min(0).nullable().optional(),
  effective_message_limit: z.number().int().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
});

async function ensureVenueBillingRecord(venueId: string) {
  const { data: existing } = await supabase
    .from('venue_billing_records')
    .select('id')
    .eq('venue_id', venueId)
    .maybeSingle();

  if (existing) return;

  await supabase
    .from('venue_billing_records')
    .insert({
      venue_id: venueId,
      plan_code: 'free',
      billing_status: 'free',
    });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { venueId: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const parsed = updateVenueBillingSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    await ensureVenueBillingRecord(params.venueId);

    const updates = parsed.data;

    const { data: updatedRecord, error: updateError } = await supabase
      .from('venue_billing_records')
      .update(updates)
      .eq('venue_id', params.venueId)
      .select('*')
      .single();

    if (updateError) throw updateError;

    await supabase
      .from('venue_billing_events')
      .insert({
        venue_id: params.venueId,
        event_type: 'admin_billing_update',
        event_source: 'admin',
        event_payload: updates,
      });

    return NextResponse.json({
      success: true,
      billingRecord: updatedRecord,
    });
  } catch (error: any) {
    console.error('Error updating admin venue billing:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update venue billing' },
      { status: 500 }
    );
  }
}
