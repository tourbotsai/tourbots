import Stripe from 'stripe';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { getCurrentMessageCreditPeriod } from '@/lib/billing-period';

const ACTIVE_STRIPE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid'];

export interface AddonSubscriptionState {
  active: boolean;
  cancelAtPeriodEnd: boolean;
  accessEndsAt: string | null;
}

export interface AddonSubscriptionDetail {
  id: string;
  code: string;
  quantity: number;
  amount: number;
  status: 'active' | 'cancelling';
  startedAt: string | null;
  nextPayment: string | null;
  cancelAtPeriodEnd: boolean;
  accessEndsAt: string | null;
}

export interface VenueBillingOverview {
  plans: any[];
  addons: any[];
  billingRecord: any;
  activePlan: any | null;
  limits: {
    baseSpaces: number;
    baseMessages: number;
    totalSpaces: number;
    totalMessages: number;
  };
  addonSubscriptions: Record<string, AddonSubscriptionState>;
  addonSubscriptionList: AddonSubscriptionDetail[];
  messageUsage: {
    used: number;
    limit: number;
    resetAt: string;
  };
}

// Summarise the venue's add-on subscriptions straight from Stripe so the UI can
// show an accurate per-add-on status (active vs cancelling) on any plan,
// including free venues that only hold a standalone feature add-on. Returns both
// an aggregated per-code state map and a per-subscription detail list (so the
// same add-on bought on different days shows as separate rows).
async function getAddonSubscriptionData(
  stripeCustomerId?: string | null
): Promise<{ states: Record<string, AddonSubscriptionState>; list: AddonSubscriptionDetail[] }> {
  const states: Record<string, AddonSubscriptionState> = {};
  const list: AddonSubscriptionDetail[] = [];
  if (!stripeCustomerId) return { states, list };

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return { states, list };

  try {
    const stripe = new Stripe(secretKey);
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const page = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'all',
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      for (const sub of page.data) {
        const billingAction = (sub.metadata?.billing_action || '').toLowerCase();
        if (billingAction !== 'buy_addon') continue;
        if (!ACTIVE_STRIPE_STATUSES.includes(sub.status)) continue;

        const code = sub.metadata?.addon_code || sub.metadata?.plan_name || '';
        if (!code) continue;

        const item = sub.items?.data?.[0];
        const periodEnd =
          ((item as any)?.current_period_end as number | undefined) ||
          ((sub as any).current_period_end as number | undefined);
        const cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
        const quantity = Number(item?.quantity ?? sub.metadata?.addon_quantity ?? 1) || 1;
        const unitAmount = (item?.price?.unit_amount ?? 0) / 100;
        const accessEndsAt =
          cancelAtPeriodEnd && periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

        list.push({
          id: sub.id,
          code,
          quantity,
          amount: unitAmount * quantity,
          status: cancelAtPeriodEnd ? 'cancelling' : 'active',
          startedAt: sub.start_date
            ? new Date(sub.start_date * 1000).toISOString()
            : new Date(sub.created * 1000).toISOString(),
          nextPayment: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          cancelAtPeriodEnd,
          accessEndsAt,
        });

        const existing = states[code];
        states[code] = {
          active: true,
          // If any subscription for this add-on is not cancelling, treat it as active.
          cancelAtPeriodEnd: existing ? existing.cancelAtPeriodEnd && cancelAtPeriodEnd : cancelAtPeriodEnd,
          accessEndsAt: accessEndsAt || existing?.accessEndsAt || null,
        };
      }

      hasMore = page.has_more;
      startingAfter = page.data.length > 0 ? page.data[page.data.length - 1].id : undefined;
    }

    // Stable, predictable order: oldest purchase first.
    list.sort((a, b) => (a.startedAt || '').localeCompare(b.startedAt || ''));
  } catch (error) {
    console.error('Failed to load add-on subscription data from Stripe:', error);
  }

  return { states, list };
}

export async function ensureVenueBillingRecord(venueId: string) {
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

/**
 * Assemble the full billing overview for a venue: plan/add-on catalogues, the
 * venue's DB billing record, derived limits, message-credit usage, and the
 * live Stripe add-on subscription data. This is the single source of truth
 * shared by the user billing page and the admin account billing view, so both
 * stay aligned with Stripe.
 */
export async function getVenueBillingOverview(venueId: string): Promise<VenueBillingOverview> {
  await ensureVenueBillingRecord(venueId);

  const [{ data: plans, error: plansError }, { data: addons, error: addonsError }, { data: record, error: recordError }] =
    await Promise.all([
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
  const { states: addonSubscriptions, list: addonSubscriptionList } =
    await getAddonSubscriptionData(record?.stripe_customer_id);

  // Monthly message-credit usage: tour visitor messages since the start of the
  // current calendar month, matching the billing enforcement service.
  const { periodStart: messageCreditPeriodStart, resetAt: messageCreditsResetAt } =
    getCurrentMessageCreditPeriod();
  const { count: messageCreditsUsedCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venueId)
    .eq('chatbot_type', 'tour')
    .eq('message_type', 'visitor')
    .gte('created_at', messageCreditPeriodStart);

  return {
    plans: plans || [],
    addons: addons || [],
    billingRecord: record,
    activePlan,
    limits,
    addonSubscriptions,
    addonSubscriptionList,
    messageUsage: {
      used: Number(messageCreditsUsedCount || 0),
      limit: limits.totalMessages,
      resetAt: messageCreditsResetAt,
    },
  };
}
