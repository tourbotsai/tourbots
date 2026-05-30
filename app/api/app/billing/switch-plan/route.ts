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

// Switching between paid plans (pro <-> agency) on the existing main subscription.
// Free -> paid is handled by /api/app/billing/checkout; paid -> free by cancellation.
const switchPlanSchema = z.object({
  planCode: z.enum(['pro', 'agency']),
});

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }
  return new Stripe(secretKey);
}

function getStripeMode() {
  return process.env.STRIPE_MODE === 'development' ? 'sandbox' : 'live';
}

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
    console.error('Billing switch-plan auth error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;
    const { userId, venueId } = authResult;

    const body = await request.json();
    const parsed = switchPlanSchema.safeParse(body);
    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const targetPlan = parsed.data.planCode;
    const stripe = getStripe();
    const stripeMode = getStripeMode();

    const { data: record, error: recordError } = await supabase
      .from('venue_billing_records')
      .select('plan_code, billing_status, stripe_customer_id, stripe_subscription_id')
      .eq('venue_id', venueId)
      .maybeSingle();

    if (recordError) throw recordError;

    const currentPlan = record?.plan_code || 'free';
    if (currentPlan !== 'pro' && currentPlan !== 'agency') {
      return NextResponse.json(
        { error: 'Plan switching is only available between paid plans. Use checkout to start a paid plan.' },
        { status: 400 }
      );
    }
    if (currentPlan === targetPlan) {
      return NextResponse.json({ error: `You are already on the ${targetPlan} plan.` }, { status: 400 });
    }
    if (!record?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found to switch. Please contact support.' },
        { status: 400 }
      );
    }

    const { data: plan, error: planError } = await supabase
      .from('billing_plans')
      .select('stripe_price_monthly_live, stripe_price_monthly_sandbox')
      .eq('code', targetPlan)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: `${targetPlan} plan is not configured.` }, { status: 400 });
    }

    const targetPriceId = stripeMode === 'live' ? plan.stripe_price_monthly_live : plan.stripe_price_monthly_sandbox;
    if (!targetPriceId) {
      return NextResponse.json(
        { error: `Missing Stripe price ID for ${targetPlan} plan in ${stripeMode} mode.` },
        { status: 400 }
      );
    }

    // Swap the price on the existing main subscription item, with proration.
    const subscription = await stripe.subscriptions.retrieve(record.stripe_subscription_id);
    const mainItem = subscription.items.data[0];
    if (!mainItem) {
      return NextResponse.json({ error: 'Subscription has no items to update.' }, { status: 400 });
    }

    await stripe.subscriptions.update(record.stripe_subscription_id, {
      items: [{ id: mainItem.id, price: targetPriceId }],
      proration_behavior: 'create_prorations',
      cancel_at_period_end: false,
      metadata: {
        ...subscription.metadata,
        billing_action: 'upgrade_plan',
        venue_id: venueId,
        plan_name: targetPlan,
        requested_by_user_id: userId,
      },
    });

    // Keep the Stripe customer metadata aligned so subsequent webhooks map correctly.
    if (record.stripe_customer_id) {
      try {
        await stripe.customers.update(record.stripe_customer_id, {
          metadata: { venue_id: venueId, plan_name: targetPlan, billing_cycle: 'monthly' },
        });
      } catch (error) {
        console.error('Failed to update customer metadata on plan switch:', error);
      }
    }

    // Reflect the change immediately; the subscription.updated webhook reconciles too.
    const { data: updatedRecord, error: updateError } = await supabase
      .from('venue_billing_records')
      .update({ plan_code: targetPlan, billing_status: 'active' })
      .eq('venue_id', venueId)
      .select('*')
      .single();

    if (updateError) throw updateError;

    await supabase
      .from('subscriptions')
      .update({ plan_name: targetPlan, updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', record.stripe_subscription_id);

    await supabase
      .from('venue_billing_events')
      .insert({
        venue_id: venueId,
        event_type: 'plan_switched_by_user',
        event_source: 'app',
        event_payload: {
          from_plan: currentPlan,
          to_plan: targetPlan,
          changed_by_user_id: userId,
        },
      });

    return NextResponse.json({ success: true, billingRecord: updatedRecord });
  } catch (error: any) {
    console.error('Error switching plan:', error);
    await recordApi5xxEvent({
      route: '/api/app/billing/switch-plan',
      method: 'POST',
      statusCode: 500,
      errorMessage: error.message || 'Failed to switch plan',
      context: { source: 'billing_switch_plan' },
      alertCategory: 'billing_error',
    });
    return NextResponse.json({ error: error.message || 'Failed to switch plan' }, { status: 500 });
  }
}
