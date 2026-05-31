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

const ADDON_ACTIVE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid'];

// Add-ons are scoped to the plan they extend (core add-ons -> Pro, agency
// add-ons -> Agency), so when the main plan changes they cannot carry across.
// Cancel every add-on subscription for the customer immediately with a proration
// credit, mirroring the prorated main-plan swap. Their own subscription.deleted
// webhooks then clear the matching counters on the billing record.
async function cancelOutgoingAddonSubscriptions(
  stripe: Stripe,
  customerId: string
): Promise<{ cancelledCount: number; addonCodes: string[] }> {
  let hasMore = true;
  let startingAfter: string | undefined;
  let cancelledCount = 0;
  const addonCodes: string[] = [];

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
      if (!ADDON_ACTIVE_STATUSES.includes(sub.status)) continue;

      try {
        await stripe.subscriptions.cancel(sub.id, { prorate: true });
        cancelledCount += 1;
        const code = sub.metadata?.addon_code || sub.metadata?.plan_name;
        if (code) addonCodes.push(code);
      } catch (error) {
        console.error('Failed to cancel add-on subscription during plan switch:', sub.id, error);
      }
    }

    hasMore = page.has_more;
    startingAfter = page.data.length > 0 ? page.data[page.data.length - 1].id : undefined;
  }

  return { cancelledCount, addonCodes };
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

    // pro -> agency is an upgrade; agency -> pro is a downgrade. Label the action
    // by direction so billing events and analytics read correctly.
    const isUpgrade = currentPlan === 'pro' && targetPlan === 'agency';
    const billingActionLabel = isUpgrade ? 'upgrade_plan' : 'downgrade_plan';

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
        billing_action: billingActionLabel,
        venue_id: venueId,
        plan_name: targetPlan,
        requested_by_user_id: userId,
      },
    });

    // Cancel the outgoing plan's add-on subscriptions — they cannot carry across
    // a plan change — with a proration credit, so the customer is never billed
    // for orphaned add-ons after the switch.
    const { cancelledCount: cancelledAddonCount, addonCodes: cancelledAddonCodes } =
      await cancelOutgoingAddonSubscriptions(stripe, record.stripe_customer_id || (subscription.customer as string));

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

    // Reflect the change immediately; the subscription.updated webhook reconciles
    // too. Zero the add-on counters here so limits/UI reflect the cleared add-ons
    // straight away — the add-on subscriptions' own deleted webhooks decrement the
    // same counters, but the RPC floors at 0 so this stays idempotent.
    const { data: updatedRecord, error: updateError } = await supabase
      .from('venue_billing_records')
      .update({
        plan_code: targetPlan,
        billing_status: 'active',
        addon_extra_spaces: 0,
        addon_message_blocks: 0,
        addon_white_label: false,
      })
      .eq('venue_id', venueId)
      .select('*')
      .single();

    if (updateError) throw updateError;

    await supabase
      .from('subscriptions')
      .update({ plan_name: targetPlan, updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', record.stripe_subscription_id);

    // White-label (the "Powered by TourBots" branding) is plan-scoped: Agency
    // always hides it; Pro shows it unless the white-label add-on is held — and
    // the cascade above already cancelled every add-on. The embed render trusts
    // the stored customisation value (write-time chokepoint), so a plan switch
    // must backfill existing customisations or branding would be stale: agency
    // upgrades would keep showing branding, and agency->pro would leak free
    // white-label. Mirror the chokepoint here for both directions.
    const showPoweredBy = targetPlan !== 'agency';
    const { error: brandingError } = await supabase
      .from('chatbot_customisations')
      .update({ show_powered_by: showPoweredBy, mobile_show_powered_by: showPoweredBy })
      .eq('venue_id', venueId);
    if (brandingError) {
      console.error('Failed to backfill branding visibility on plan switch:', brandingError);
    }

    await supabase
      .from('venue_billing_events')
      .insert({
        venue_id: venueId,
        event_type: 'plan_switched_by_user',
        event_source: 'app',
        event_payload: {
          from_plan: currentPlan,
          to_plan: targetPlan,
          direction: isUpgrade ? 'upgrade' : 'downgrade',
          cancelled_addon_count: cancelledAddonCount,
          cancelled_addon_codes: cancelledAddonCodes,
          branding_show_powered_by: showPoweredBy,
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
