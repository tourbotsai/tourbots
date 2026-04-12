import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import { initAdmin } from '@/lib/firebase-admin';
import { getUserWithVenue } from '@/lib/user-service';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

initAdmin();
const auth = getAuth();

const updateBillingSchema = z.object({
  action: z.enum(['select_plan']),
  planCode: z.string().min(1),
});

async function authenticateAndGetVenue(request: NextRequest): Promise<{ userId: string; venueId: string } | NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorisation header required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);
    const userWithVenue = await getUserWithVenue(decodedToken.uid);

    if (!userWithVenue) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userWithVenue.venue_id) {
      return NextResponse.json({ error: 'User not associated with a venue' }, { status: 403 });
    }

    return { userId: userWithVenue.id, venueId: userWithVenue.venue_id };
  } catch (error) {
    console.error('Billing auth error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

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

function deriveLimits(record: any, activePlan: any) {
  const planCode = activePlan?.code || record?.plan_code || 'free';
  const baseSpacesFromPlan = Number(activePlan?.included_spaces || 0);
  const baseSpaces = Math.max(baseSpacesFromPlan, planCode === 'free' ? 1 : 0);
  const baseMessages = activePlan?.included_messages || 0;
  const extraSpaces = record.addon_extra_spaces || 0;
  const messageBlocks = record.addon_message_blocks || 0;

  const totalSpaces = record.effective_space_limit ?? (baseSpaces + extraSpaces);
  // Each extra space includes +1,000 message credits.
  const totalMessages = record.effective_message_limit ?? (baseMessages + (extraSpaces * 1000) + (messageBlocks * 1000));

  return {
    baseSpaces,
    baseMessages,
    totalSpaces,
    totalMessages,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId } = authResult;

    await ensureVenueBillingRecord(venueId);

    const [{ data: plans, error: plansError }, { data: addons, error: addonsError }, { data: record, error: recordError }] = await Promise.all([
      supabase
        .from('billing_plans')
        .select('*')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('billing_addons')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('venue_billing_records')
        .select('*')
        .eq('venue_id', venueId)
        .single(),
    ]);

    if (plansError) throw plansError;
    if (addonsError) throw addonsError;
    if (recordError) throw recordError;

    const activePlanCode = record.billing_override_enabled && record.override_plan_code
      ? record.override_plan_code
      : record.plan_code;
    const activePlan = (plans || []).find((plan: any) => plan.code === activePlanCode) || null;
    const limits = deriveLimits(record, activePlan);

    return NextResponse.json({
      plans: plans || [],
      addons: addons || [],
      billingRecord: record,
      activePlan,
      limits,
    });
  } catch (error: any) {
    console.error('Error fetching app billing data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch billing data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { userId, venueId } = authResult;
    const body = await request.json();
    const parsed = updateBillingSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const { planCode } = parsed.data;

    if (!['free', 'pro'].includes(planCode)) {
      return NextResponse.json(
        { error: 'Only free and pro are selectable from app billing.' },
        { status: 400 }
      );
    }

    await ensureVenueBillingRecord(venueId);

    const billingStatus = planCode === 'free' ? 'free' : 'active';

    const { data: updatedRecord, error: updateError } = await supabase
      .from('venue_billing_records')
      .update({
        plan_code: planCode,
        billing_status: billingStatus,
      })
      .eq('venue_id', venueId)
      .select('*')
      .single();

    if (updateError) throw updateError;

    await supabase
      .from('venue_billing_events')
      .insert({
        venue_id: venueId,
        event_type: 'plan_changed_by_user',
        event_source: 'app',
        event_payload: {
          plan_code: planCode,
          changed_by_user_id: userId,
        },
      });

    return NextResponse.json({
      success: true,
      billingRecord: updatedRecord,
    });
  } catch (error: any) {
    console.error('Error updating app billing data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update billing data' },
      { status: 500 }
    );
  }
}
