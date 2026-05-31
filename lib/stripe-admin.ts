import Stripe from 'stripe';
import { supabaseServiceRole as supabase } from './supabase-service-role';
import { PaymentLinkRequest, PaymentLinkResponse, StripePrice } from './types';

// Lazy Stripe initialization
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(secretKey);
}

function normalizePlanCode(planName: string): string {
  if (planName === 'essential' || planName === 'professional') {
    return 'pro';
  }
  return planName;
}

// Normalise a recurring price to a monthly pence amount.
function normaliseRecurringToMonthlyPence(
  unitAmount: number,
  quantity: number,
  interval: Stripe.Price.Recurring.Interval,
  intervalCount: number
): number {
  const base = unitAmount * quantity;
  const count = intervalCount || 1;
  switch (interval) {
    case 'year':
      return base / (12 * count);
    case 'month':
      return base / count;
    case 'week':
      return (base * 52) / 12 / count;
    case 'day':
      return (base * 365) / 12 / count;
    default:
      return base;
  }
}

/**
 * True recurring monthly revenue (MRR) pulled straight from Stripe, for full
 * parity with the Stripe dashboard. Sums the monthly-normalised recurring
 * amount of every live subscription (plans AND add-ons, since add-ons are their
 * own subscriptions). Cancelled subscriptions drop out automatically because we
 * only list `active` status. GBP only. Returns pounds.
 */
export async function getStripeRecurringMonthlyRevenueGbp(): Promise<number> {
  const stripe = getStripe();
  let totalPence = 0;
  let startingAfter: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const page = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const sub of page.data) {
      // Stripe excludes subscriptions scheduled to cancel from MRR (they are
      // treated as already churning), so exclude them here for full parity.
      if (sub.cancel_at_period_end) continue;

      // Discounts (coupons) reduce MRR; capture a percent-off factor if present.
      const percentOff = (sub as any).discount?.coupon?.percent_off as number | undefined;
      const discountFactor = percentOff ? 1 - percentOff / 100 : 1;

      for (const item of sub.items.data) {
        const price = item.price;
        if (!price?.recurring) continue;
        if (price.currency && price.currency.toLowerCase() !== 'gbp') continue;

        const monthly = normaliseRecurringToMonthlyPence(
          price.unit_amount ?? 0,
          item.quantity ?? 1,
          price.recurring.interval,
          price.recurring.interval_count || 1
        );
        totalPence += monthly * discountFactor;
      }
    }

    hasMore = page.has_more;
    startingAfter = page.data.length > 0 ? page.data[page.data.length - 1].id : undefined;
  }

  return totalPence / 100;
}

const ADMIN_ACTIVE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid'];

export interface AdminPaymentsAddon {
  code: string;
  name: string;
  quantity: number;
  amount: number; // monthly GBP
  status: 'active' | 'cancelling';
  nextPayment: string | null;
  accessEndsAt: string | null;
}

export interface AdminPaymentsAccount {
  venueId: string;
  name: string;
  email: string | null;
  slug: string | null;
  planCode: string;
  planAmount: number; // monthly GBP
  planStatus: string; // active | cancelling | past_due | trialing | free
  nextBilling: string | null;
  accessEndsAt: string | null;
  addons: AdminPaymentsAddon[];
  monthlyTotal: number; // monthly GBP, recurring (excludes cancelling)
  hasStripeSubscription: boolean;
}

export interface AdminPaymentsOverview {
  mrrGbp: number;
  kpis: {
    payingAccounts: number;
    proAccounts: number;
    agencyAccounts: number;
    totalAccounts: number;
  };
  accounts: AdminPaymentsAccount[];
}

/**
 * Per-account payments overview with real Stripe figures. Lists every Stripe
 * subscription once, groups them by customer, and maps customers to venues via
 * venue_billing_records. Each account row exposes the plan, its add-ons, the
 * true recurring monthly total, billing dates and cancel status — so the admin
 * payments overview matches Stripe exactly (including accounts whose add-ons or
 * plans are scheduled to cancel).
 */
export async function getAdminPaymentsOverview(): Promise<AdminPaymentsOverview> {
  const stripe = getStripe();

  const [{ data: billingRecords }, { data: addonCatalog }] = await Promise.all([
    supabase
      .from('venue_billing_records')
      .select(`
        venue_id,
        plan_code,
        override_plan_code,
        billing_override_enabled,
        billing_status,
        stripe_customer_id,
        venues ( id, name, email, slug )
      `),
    supabase.from('billing_addons').select('code, name'),
  ]);

  const addonNameByCode = new Map<string, string>(
    (addonCatalog || []).map((addon: any) => [addon.code, addon.name])
  );

  // Group Stripe subscriptions by customer in a single paginated pass.
  interface CustomerBucket {
    plan?: { amount: number; status: string; cancelAtPeriodEnd: boolean; periodEnd: number | null; code: string | null };
    addons: AdminPaymentsAddon[];
  }
  const buckets = new Map<string, CustomerBucket>();

  let startingAfter: string | undefined;
  let hasMore = true;
  while (hasMore) {
    const page = await stripe.subscriptions.list({
      status: 'all',
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const sub of page.data) {
      if (!ADMIN_ACTIVE_STATUSES.includes(sub.status)) continue;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
      if (!customerId) continue;

      const cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
      const item = sub.items?.data?.[0];
      const periodEnd =
        ((item as any)?.current_period_end as number | undefined) ??
        ((sub as any).current_period_end as number | undefined) ??
        null;

      // Monthly-normalised GBP amount across the subscription's recurring items.
      let monthlyPence = 0;
      for (const lineItem of sub.items.data) {
        const price = lineItem.price;
        if (!price?.recurring) continue;
        if (price.currency && price.currency.toLowerCase() !== 'gbp') continue;
        monthlyPence += normaliseRecurringToMonthlyPence(
          price.unit_amount ?? 0,
          lineItem.quantity ?? 1,
          price.recurring.interval,
          price.recurring.interval_count || 1
        );
      }
      const monthly = monthlyPence / 100;

      const bucket = buckets.get(customerId) || { addons: [] };
      const billingAction = (sub.metadata?.billing_action || '').toLowerCase();

      if (billingAction === 'buy_addon') {
        const code = sub.metadata?.addon_code || sub.metadata?.plan_name || 'addon';
        bucket.addons.push({
          code,
          name: addonNameByCode.get(code) || code,
          quantity: Number(item?.quantity ?? sub.metadata?.addon_quantity ?? 1) || 1,
          amount: monthly,
          status: cancelAtPeriodEnd ? 'cancelling' : 'active',
          nextPayment: !cancelAtPeriodEnd && periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          accessEndsAt: cancelAtPeriodEnd && periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        });
      } else {
        // Plan subscription. If a customer somehow has more than one, keep the
        // higher-value (most recent paid) one.
        if (!bucket.plan || monthly > bucket.plan.amount) {
          bucket.plan = {
            amount: monthly,
            status: cancelAtPeriodEnd ? 'cancelling' : sub.status,
            cancelAtPeriodEnd,
            periodEnd,
            code: sub.metadata?.plan_name || null,
          };
        }
      }

      buckets.set(customerId, bucket);
    }

    hasMore = page.has_more;
    startingAfter = page.data.length > 0 ? page.data[page.data.length - 1].id : undefined;
  }

  const accounts: AdminPaymentsAccount[] = (billingRecords || [])
    .filter((record: any) => record.venues?.id)
    .map((record: any) => {
      const planCode = record.billing_override_enabled && record.override_plan_code
        ? record.override_plan_code
        : record.plan_code || 'free';
      const bucket = record.stripe_customer_id ? buckets.get(record.stripe_customer_id) : undefined;
      const plan = bucket?.plan;
      const addons = bucket?.addons || [];

      const planAmount = plan?.amount || 0;
      const planNextBilling = plan && !plan.cancelAtPeriodEnd && plan.periodEnd
        ? new Date(plan.periodEnd * 1000).toISOString()
        : null;
      const planAccessEndsAt = plan && plan.cancelAtPeriodEnd && plan.periodEnd
        ? new Date(plan.periodEnd * 1000).toISOString()
        : null;

      // Recurring monthly total excludes anything scheduled to cancel.
      const planRecurring = plan && !plan.cancelAtPeriodEnd ? planAmount : 0;
      const addonRecurring = addons
        .filter((addon) => addon.status !== 'cancelling')
        .reduce((sum, addon) => sum + addon.amount, 0);

      return {
        venueId: record.venues.id,
        name: record.venues.name || 'Unnamed account',
        email: record.venues.email || null,
        slug: record.venues.slug || null,
        planCode,
        planAmount,
        planStatus: plan?.status || (planCode === 'free' ? 'free' : record.billing_status || 'free'),
        nextBilling: planNextBilling,
        accessEndsAt: planAccessEndsAt,
        addons,
        monthlyTotal: planRecurring + addonRecurring,
        hasStripeSubscription: Boolean(plan) || addons.length > 0,
      };
    });

  const paying = accounts.filter((account) => account.planCode !== 'free' && account.monthlyTotal > 0);
  const proAccounts = accounts.filter((account) => account.planCode === 'pro').length;
  const agencyAccounts = accounts.filter((account) => account.planCode === 'agency').length;

  // Headline MRR is the sum of every account's recurring monthly total — i.e.
  // the same live Stripe figure, grouped, so it reconciles with the rows below.
  const mrrGbp = accounts.reduce((sum, account) => sum + account.monthlyTotal, 0);

  return {
    mrrGbp,
    kpis: {
      payingAccounts: paying.length,
      proAccounts,
      agencyAccounts,
      totalAccounts: accounts.length,
    },
    accounts,
  };
}

function isMissingTableError(error: any, tableName: string): boolean {
  if (!error) return false;
  return error.code === 'PGRST205' && String(error.message || '').includes(`public.${tableName}`);
}

async function getBillingPlanPriceId(planCode: string, billingCycle: 'monthly' | 'yearly'): Promise<string> {
  const mode = process.env.STRIPE_MODE === 'development' ? 'sandbox' : 'live';
  const normalizedPlanCode = normalizePlanCode(planCode);

  const { data: planRow, error } = await supabase
    .from('billing_plans')
    .select('*')
    .eq('code', normalizedPlanCode)
    .single();

  if (error || !planRow) {
    throw new Error(`Billing plan not found for code: ${normalizedPlanCode}`);
  }

  const monthlyPriceId = mode === 'live'
    ? planRow.stripe_price_monthly_live
    : planRow.stripe_price_monthly_sandbox;
  const yearlyPriceId = mode === 'live'
    ? planRow.stripe_price_yearly_live
    : planRow.stripe_price_yearly_sandbox;

  const selectedPriceId = billingCycle === 'yearly' ? yearlyPriceId : monthlyPriceId;

  if (!selectedPriceId) {
    throw new Error(
      `No Stripe ${billingCycle} price ID configured for plan '${normalizedPlanCode}' in ${mode} mode.`
    );
  }

  return selectedPriceId;
}

// Create a payment link for a venue subscription
export async function createPaymentLink({
  venueId,
  customerEmail,
  planName,
  customPrice,
  billingCycle = 'monthly', // Default to monthly
  createdBy,
}: PaymentLinkRequest): Promise<PaymentLinkResponse> {
  try {
    const stripe = getStripe();
    const normalizedPlanCode = normalizePlanCode(planName);
    
    // Get venue details
    const { data: venueRow, error: venueFetchError } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single();

    if (venueFetchError || !venueRow) {
      throw new Error('Venue not found');
    }

    // Prepare line items
    const lineItems: Stripe.PaymentLinkCreateParams.LineItem[] = [];

    if (customPrice) {
      // Custom pricing - treat customPrice as monthly amount
      const unitAmount = billingCycle === 'yearly' 
        ? Math.round(customPrice * 12 * 100) // Yearly: monthly amount × 12 months, converted to pence
        : Math.round(customPrice * 100); // Monthly: just convert to pence
        
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `Custom ${normalizedPlanCode.toUpperCase()} Plan - ${venueRow.name}`,
            description: `Custom ${billingCycle} subscription for ${venueRow.name} (${billingCycle === 'yearly' ? '£' + customPrice.toFixed(2) + '/month × 12' : '£' + customPrice.toFixed(2) + '/month'})`,
          },
          unit_amount: unitAmount,
          recurring: {
            interval: billingCycle === 'yearly' ? 'year' : 'month',
          },
        },
        quantity: 1,
      } as any); // Stripe types are complex, using any for price_data
    } else {
      // Predefined plan pricing from billing_plans table
      if (normalizedPlanCode === 'free') {
        throw new Error('Free plan does not require a payment link.');
      }
      const priceId = await getBillingPlanPriceId(normalizedPlanCode, billingCycle);
      lineItems.push({
        price: priceId,
        quantity: 1,
      });
    }

    // Create payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: lineItems,
      metadata: {
        venue_id: venueId,
        plan_name: normalizedPlanCode,
        customer_email: customerEmail,
        billing_cycle: billingCycle,
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://tourbots.ai'}/subscription-success`,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
    });

    // Save payment link to database
    const { data: savedLink, error: saveError } = await supabase
      .from('payment_links')
      .insert({
        venue_id: venueId,
        stripe_payment_link_id: paymentLink.id,
        stripe_payment_link_url: paymentLink.url,
        plan_name: normalizedPlanCode,
        custom_price: customPrice,
        customer_email: customerEmail,
        created_by: createdBy || '00000000-0000-0000-0000-000000000000', // Use provided createdBy or fallback
        status: 'pending',
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save payment link:', saveError);
      // Don't throw here, payment link was created successfully
    }

    return {
      paymentLink: paymentLink.url,
      linkId: savedLink?.id || paymentLink.id,
      expiresAt: (paymentLink as any).expires_at ? new Date((paymentLink as any).expires_at * 1000).toISOString() : undefined,
    };
  } catch (error: any) {
    console.error('Error creating payment link:', error);
    throw new Error(`Failed to create payment link: ${error.message}`);
  }
}

// Get all payment links for admin dashboard
export async function getPaymentLinks() {
  try {
    const { data, error } = await supabase
      .from('payment_links')
      .select(`
        *,
        venues (
          id,
          name,
          slug,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      if (isMissingTableError(error, 'payment_links')) {
        return [];
      }
      throw error;
    }

    return (data || []).map((row: any) => ({
      ...row,
      // Keep backwards compatibility with older UI fields.
      stripe_url: row.stripe_url || row.stripe_payment_link_url || null,
    }));
  } catch (error: any) {
    console.error('Error fetching payment links:', error);
    throw new Error(`Failed to fetch payment links: ${error.message}`);
  }
}

// Get all subscriptions for admin dashboard
export async function getSubscriptions() {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        venues (
          id,
          name,
          slug,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      if (isMissingTableError(error, 'subscriptions')) {
        const [{ data: billingRows, error: billingError }, { data: plans }] = await Promise.all([
          supabase
            .from('venue_billing_records')
            .select(`
              venue_id,
              plan_code,
              override_plan_code,
              billing_override_enabled,
              billing_status,
              updated_at,
              created_at,
              venues (
                id,
                name,
                slug,
                email,
                phone
              )
            `),
          supabase
            .from('billing_plans')
            .select('code, monthly_price_gbp')
            .eq('is_active', true),
        ]);

        if (billingError) throw billingError;

        const planPriceByCode = new Map<string, number>(
          (plans || []).map((plan: any) => [plan.code, Number(plan.monthly_price_gbp || 0)])
        );

        return (billingRows || []).map((row: any) => {
          const resolvedPlanCode =
            row?.billing_override_enabled && row?.override_plan_code
              ? row.override_plan_code
              : (row?.plan_code || 'free');
          const amountPence = Math.round((planPriceByCode.get(resolvedPlanCode) || 0) * 100);

          return {
            id: `billing-${row.venue_id}`,
            venue_id: row.venue_id,
            customer_email: row.venues?.email || null,
            plan_name: resolvedPlanCode,
            amount: amountPence,
            status: row.billing_status || 'active',
            current_period_start: row.created_at || row.updated_at || new Date().toISOString(),
            current_period_end: row.updated_at || row.created_at || new Date().toISOString(),
            stripe_subscription_url: null,
            created_at: row.created_at || row.updated_at || new Date().toISOString(),
            venues: row.venues || null,
          };
        });
      }
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    throw new Error(`Failed to fetch subscriptions: ${error.message}`);
  }
}

// Update payment link status
export async function updatePaymentLinkStatus(linkId: string, status: 'pending' | 'paid' | 'expired') {
  try {
    const { data, error } = await supabase
      .from('payment_links')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', linkId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error updating payment link status:', error);
    throw new Error(`Failed to update payment link status: ${error.message}`);
  }
}

// Get Stripe customer portal URL
export async function createCustomerPortalSession(customerId: string, returnUrl?: string) {
  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://tourbots.ai'}/app/settings`,
    });

    return session.url;
  } catch (error: any) {
    console.error('Error creating customer portal session:', error);
    throw new Error(`Failed to create customer portal session: ${error.message}`);
  }
}

// Get plan configuration
export function getPlanConfig(planName: 'free' | 'pro' | 'essential' | 'professional') {
  return { code: normalizePlanCode(planName) };
}

export function getAllPlanConfigs() {
  return [];
}