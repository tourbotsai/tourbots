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