import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { finishCronRun, startCronRun } from '@/lib/ops-monitoring';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }
  return new Stripe(secretKey);
}

function validateCronSecret(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { success: false, error: 'CRON_SECRET is not configured' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

function mapStripeStatusToSubscriptionStatus(
  status: Stripe.Subscription.Status
): 'pending' | 'active' | 'trialing' | 'cancelled' | 'past_due' {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'incomplete':
      return 'pending';
    case 'canceled':
    case 'incomplete_expired':
    case 'paused':
      return 'cancelled';
    default:
      return 'pending';
  }
}

async function syncAddonSubscriptionCancellationForCustomer(
  stripe: Stripe,
  customerId: string,
  shouldCancelAtPeriodEnd: boolean
) {
  let hasMore = true;
  let startingAfter: string | undefined;

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
      if (!['active', 'trialing', 'past_due', 'unpaid'].includes(sub.status)) continue;
      if (sub.cancel_at_period_end === shouldCancelAtPeriodEnd) continue;

      await stripe.subscriptions.update(sub.id, {
        cancel_at_period_end: shouldCancelAtPeriodEnd,
      });
    }

    hasMore = page.has_more;
    startingAfter = page.data.length > 0 ? page.data[page.data.length - 1].id : undefined;
  }
}

async function clearVenueAddonsForCancellation(venueId: string, stripeCustomerId?: string | null) {
  await supabase
    .from('venue_billing_records')
    .update({
      plan_code: 'free',
      billing_status: 'cancelled',
      addon_extra_spaces: 0,
      addon_message_blocks: 0,
      addon_white_label: false,
      addon_agency_portal: false,
      effective_space_limit: null,
      effective_message_limit: null,
      stripe_customer_id: stripeCustomerId || null,
      stripe_subscription_id: null,
    })
    .eq('venue_id', venueId);
}

async function reconcileStripeCancellationState() {
  const stripe = getStripe();
  const nowIso = new Date().toISOString();

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('id, venue_id, stripe_subscription_id, stripe_customer_id, cancel_at_period_end, cancel_at, status')
    .not('stripe_subscription_id', 'is', null)
    .or(`cancel_at_period_end.eq.true,status.eq.active,status.eq.trialing,status.eq.past_due,status.eq.cancelled`);

  if (error) {
    throw new Error(`Failed to fetch subscriptions for reconciliation: ${error.message}`);
  }

  let processed = 0;
  let updated = 0;
  let cancelledAndCleared = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of subscriptions || []) {
    processed += 1;
    const stripeSubscriptionId = row.stripe_subscription_id as string | null;
    if (!stripeSubscriptionId) continue;

    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      const mappedStatus = mapStripeStatusToSubscriptionStatus(stripeSubscription.status);
      const cancelAt = stripeSubscription.cancel_at
        ? new Date(stripeSubscription.cancel_at * 1000).toISOString()
        : null;
      const canceledAt = stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
        : null;
      const nextBillingDate = (stripeSubscription as any).current_period_end
        ? new Date((stripeSubscription as any).current_period_end * 1000).toISOString()
        : null;

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: mappedStatus,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          cancel_at: cancelAt,
          canceled_at: canceledAt,
          next_billing_date: nextBillingDate,
          updated_at: nowIso,
        })
        .eq('id', row.id);

      if (updateError) {
        throw new Error(`Failed updating subscription ${stripeSubscriptionId}: ${updateError.message}`);
      }
      updated += 1;

      const customerId = (stripeSubscription.customer as string) || (row.stripe_customer_id as string | null);
      if (customerId) {
        await syncAddonSubscriptionCancellationForCustomer(
          stripe,
          customerId,
          stripeSubscription.cancel_at_period_end
        );
      }

      const isFullyCancelled = stripeSubscription.status === 'canceled';
      if (isFullyCancelled) {
        await clearVenueAddonsForCancellation(
          row.venue_id as string,
          (row.stripe_customer_id as string | null) || (stripeSubscription.customer as string)
        );
        cancelledAndCleared += 1;
      }
    } catch (reconcileError: any) {
      failed += 1;
      const reason = reconcileError?.message || String(reconcileError);
      errors.push(`${stripeSubscriptionId}: ${reason}`);
    }
  }

  return {
    processed,
    updated,
    cancelledAndCleared,
    failed,
    errors: errors.slice(0, 20),
  };
}

async function handleCron(request: NextRequest, method: 'GET' | 'POST', triggerSource: 'vercel_cron' | 'manual') {
  const startedAt = Date.now();
  let runId: string | null = null;
  const route = '/api/cron/reconcile-stripe-cancellation-state';

  try {
    const authError = validateCronSecret(request);
    if (authError) return authError;

    runId = await startCronRun({
      jobName: 'reconcile-stripe-cancellation-state',
      triggerSource,
      context: { path: route, method },
    });

    const result = await reconcileStripeCancellationState();
    await finishCronRun(runId, {
      status: result.failed > 0 ? 'partial' : 'success',
      startedAt,
      processedCount: result.processed,
      successCount: result.updated,
      failedCount: result.failed,
      route,
      method,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    await finishCronRun(runId, {
      status: 'failed',
      startedAt,
      errorMessage: error.message || 'Failed to reconcile Stripe cancellation state',
      route,
      method,
    });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reconcile Stripe cancellation state' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleCron(request, 'GET', 'vercel_cron');
}

export async function POST(request: NextRequest) {
  return handleCron(request, 'POST', 'manual');
}
