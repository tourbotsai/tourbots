import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { getUserWithVenue } from '@/lib/user-service';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { recordApi5xxEvent } from '@/lib/ops-monitoring';

initAdmin();
const auth = getAuth();

const cancelAddonSchema = z.object({
  addonCode: z.enum([
    'extra_space',
    'message_block',
    'white_label',
    'agency_extra_space',
    'agency_message_block',
  ]),
});

const ACTIVE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid'];

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }
  return new Stripe(secretKey);
}

async function authenticateAndGetVenue(
  request: NextRequest
): Promise<{ userId: string; venueId: string } | NextResponse> {
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
    console.error('Cancel add-on auth error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;
    const { userId, venueId } = authResult;

    const body = await request.json();
    const parsed = cancelAddonSchema.safeParse(body);
    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const { addonCode } = parsed.data;

    const { data: billingRecord } = await supabase
      .from('venue_billing_records')
      .select('stripe_customer_id')
      .eq('venue_id', venueId)
      .maybeSingle();

    const customerId = billingRecord?.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json(
        { error: 'No active billing customer found for this venue.' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Find every active add-on subscription matching this code for the customer
    // and schedule it to cancel at the end of the current billing period so the
    // venue keeps access until it has been paid for.
    let hasMore = true;
    let startingAfter: string | undefined;
    let scheduledCount = 0;
    let earliestPeriodEnd: number | null = null;

    while (hasMore) {
      const page = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      for (const sub of page.data) {
        const billingAction = (sub.metadata?.billing_action || '').toLowerCase();
        if (billingAction !== 'buy_addon') continue;
        const subAddonCode = sub.metadata?.addon_code || sub.metadata?.plan_name || '';
        if (subAddonCode !== addonCode) continue;
        if (!ACTIVE_STATUSES.includes(sub.status)) continue;

        const periodEnd = (sub as any).current_period_end as number | undefined;
        if (periodEnd && (earliestPeriodEnd === null || periodEnd < earliestPeriodEnd)) {
          earliestPeriodEnd = periodEnd;
        }

        if (sub.cancel_at_period_end) {
          scheduledCount += 1;
          continue;
        }

        try {
          await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
          scheduledCount += 1;
        } catch (error) {
          console.error('Failed to schedule add-on cancellation:', sub.id, error);
        }
      }

      hasMore = page.has_more;
      startingAfter = page.data.length > 0 ? page.data[page.data.length - 1].id : undefined;
    }

    if (scheduledCount === 0) {
      return NextResponse.json(
        { error: 'No active subscription found for this add-on.' },
        { status: 404 }
      );
    }

    await supabase
      .from('venue_billing_events')
      .insert({
        venue_id: venueId,
        event_type: 'addon_cancellation_scheduled',
        event_source: 'app',
        event_payload: {
          addon_code: addonCode,
          subscriptions_scheduled: scheduledCount,
          requested_by_user_id: userId,
        },
      });

    return NextResponse.json({
      success: true,
      addonCode,
      scheduledCount,
      accessEndsAt: earliestPeriodEnd ? new Date(earliestPeriodEnd * 1000).toISOString() : null,
    });
  } catch (error: any) {
    console.error('Error cancelling add-on:', error);
    await recordApi5xxEvent({
      route: '/api/app/billing/cancel-addon',
      method: 'POST',
      statusCode: 500,
      errorMessage: error.message || 'Failed to cancel add-on',
      context: { source: 'billing_cancel_addon' },
      alertCategory: 'billing_error',
    });
    return NextResponse.json(
      { error: error.message || 'Failed to cancel add-on' },
      { status: 500 }
    );
  }
}
