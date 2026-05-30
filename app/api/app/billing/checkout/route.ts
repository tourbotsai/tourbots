import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { getUserWithVenue } from '@/lib/user-service';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { notifyOpsAlert, recordApi5xxEvent } from '@/lib/ops-monitoring';
import { ENTITLEMENT_COLUMNS, effectivePlanCode } from '@/lib/billing-entitlements';

initAdmin();
const auth = getAuth();

const checkoutSchema = z.object({
  action: z.enum(['upgrade_plan', 'buy_addon']),
  planCode: z.string().optional(),
  addonCode: z.string().optional(),
  quantity: z.number().int().min(1).max(100).optional(),
});

const ADDON_CODES = [
  'extra_space',
  'message_block',
  'white_label',
  'agency_extra_space',
  'agency_message_block',
] as const;

// Core add-ons scale the Pro allowance; agency add-ons scale the Agency pool.
const AGENCY_ADDON_CODES = ['agency_extra_space', 'agency_message_block'];
const SINGLE_QUANTITY_ADDON_CODES = ['white_label'];

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }
  return new Stripe(secretKey);
}

function getBaseUrl() {
  // Local development uses sandbox Stripe and localhost callbacks.
  if (process.env.STRIPE_MODE === 'development') {
    return 'http://localhost:3000';
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return 'https://tourbots.ai';
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    return `https://${baseUrl}`;
  }
  return baseUrl;
}

function getStripeMode() {
  return process.env.STRIPE_MODE === 'development' ? 'sandbox' : 'live';
}

async function authenticateAndGetVenue(request: NextRequest): Promise<{ userId: string; venueId: string; userEmail: string } | NextResponse> {
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

    return {
      userId: userWithVenue.id,
      venueId: userWithVenue.venue_id,
      userEmail: userWithVenue.email,
    };
  } catch (error) {
    console.error('Billing checkout auth error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;
    const { userId, venueId, userEmail } = authResult;

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const { action, planCode, addonCode } = parsed.data;
    const quantity = parsed.data.quantity || 1;
    const stripe = getStripe();
    const baseUrl = getBaseUrl();
    const stripeMode = getStripeMode();

    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name')
      .eq('id', venueId)
      .single();

    if (venueError || !venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    // Reuse the venue's existing Stripe customer so the plan and every add-on
    // live under one customer. This keeps all invoices resolvable, lets add-on
    // state/cancellation be read back, and lets the customer portal manage
    // everything in one place. Only fall back to customer_email for the very
    // first checkout when no customer exists yet.
    let existingCustomerId: string | null = null;
    const { data: billingForCustomer } = await supabase
      .from('venue_billing_records')
      .select('stripe_customer_id')
      .eq('venue_id', venueId)
      .maybeSingle();
    existingCustomerId = billingForCustomer?.stripe_customer_id || null;
    if (!existingCustomerId) {
      const { data: subForCustomer } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('venue_id', venueId)
        .maybeSingle();
      existingCustomerId = subForCustomer?.stripe_customer_id || null;
    }
    const customerField: Stripe.Checkout.SessionCreateParams = existingCustomerId
      ? { customer: existingCustomerId }
      : { customer_email: userEmail };

    let session: Stripe.Checkout.Session;
    let savedPlanName = 'unknown';

    if (action === 'upgrade_plan') {
      // Checkout is for acquiring a paid plan from free (no card on file yet).
      // Switching between paid plans (pro <-> agency) is handled by the
      // /api/app/billing/switch-plan endpoint (Stripe subscription update).
      if (planCode !== 'pro' && planCode !== 'agency') {
        return NextResponse.json({ error: 'Only pro or agency plan upgrades are supported in app checkout.' }, { status: 400 });
      }
      const targetPlan = planCode;

      const { data: plan, error: planError } = await supabase
        .from('billing_plans')
        .select('*')
        .eq('code', targetPlan)
        .single();

      if (planError || !plan) {
        return NextResponse.json({ error: `${targetPlan} plan is not configured.` }, { status: 400 });
      }

      const priceId = stripeMode === 'live' ? plan.stripe_price_monthly_live : plan.stripe_price_monthly_sandbox;
      if (!priceId) {
        return NextResponse.json({ error: `Missing Stripe price ID for ${targetPlan} plan in ${stripeMode} mode.` }, { status: 400 });
      }

      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        ...customerField,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          billing_action: 'upgrade_plan',
          venue_id: venueId,
          plan_name: targetPlan,
          billing_cycle: 'monthly',
          requested_by_user_id: userId,
        },
        subscription_data: {
          metadata: {
            billing_action: 'upgrade_plan',
            venue_id: venueId,
            plan_name: targetPlan,
            requested_by_user_id: userId,
          },
        },
        success_url: `${baseUrl}/app/settings?billing_success=1`,
        cancel_url: `${baseUrl}/app/settings?billing_cancelled=1`,
        allow_promotion_codes: true,
      });

      savedPlanName = targetPlan;
    } else {
      if (!addonCode || !ADDON_CODES.includes(addonCode as typeof ADDON_CODES[number])) {
        return NextResponse.json({ error: 'Valid addon code is required.' }, { status: 400 });
      }

      // Add-ons are plan-scoped: core add-ons require Pro, agency add-ons require Agency.
      const requiredPlan = AGENCY_ADDON_CODES.includes(addonCode) ? 'agency' : 'pro';
      const { data: billingRecord } = await supabase
        .from('venue_billing_records')
        .select(ENTITLEMENT_COLUMNS)
        .eq('venue_id', venueId)
        .maybeSingle();

      if (effectivePlanCode(billingRecord as any) !== requiredPlan) {
        return NextResponse.json(
          {
            error:
              requiredPlan === 'agency'
                ? 'Agency add-ons require an active Agency plan.'
                : 'Core add-ons require an active Pro plan.',
          },
          { status: 403 }
        );
      }

      const { data: addon, error: addonError } = await supabase
        .from('billing_addons')
        .select('*')
        .eq('code', addonCode)
        .single();

      if (addonError || !addon) {
        return NextResponse.json({ error: 'Addon is not configured.' }, { status: 400 });
      }

      const normalizedQuantity = SINGLE_QUANTITY_ADDON_CODES.includes(addonCode) ? 1 : quantity;
      const addonPriceId = stripeMode === 'live' ? addon.stripe_price_monthly_live : addon.stripe_price_monthly_sandbox;
      if (!addonPriceId) {
        return NextResponse.json(
          { error: `Missing Stripe monthly add-on price ID for ${addonCode} in ${stripeMode} mode.` },
          { status: 400 }
        );
      }

      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        ...customerField,
        line_items: [
          {
            price: addonPriceId,
            quantity: normalizedQuantity,
          },
        ],
        metadata: {
          billing_action: 'buy_addon',
          venue_id: venueId,
          plan_name: addonCode,
          addon_code: addonCode,
          addon_quantity: String(normalizedQuantity),
          requested_by_user_id: userId,
        },
        subscription_data: {
          metadata: {
            billing_action: 'buy_addon',
            venue_id: venueId,
            plan_name: addonCode,
            addon_code: addonCode,
            addon_quantity: String(normalizedQuantity),
            requested_by_user_id: userId,
          },
        },
        success_url: `${baseUrl}/app/settings?billing_success=1`,
        cancel_url: `${baseUrl}/app/settings?billing_cancelled=1`,
        allow_promotion_codes: true,
      });

      savedPlanName = addonCode;
    }

    const { error: linkError } = await supabase
      .from('payment_links')
      .insert({
        venue_id: venueId,
        stripe_payment_link_id: session.id,
        stripe_payment_link_url: session.url,
        stripe_checkout_session_id: session.id,
        plan_name: savedPlanName,
        custom_price: null,
        customer_email: userEmail,
        created_by: userId,
        status: 'pending',
      });

    if (linkError) {
      console.error('Failed to persist app checkout record:', linkError);
      await notifyOpsAlert({
        level: 'warning',
        category: 'billing_error',
        title: 'Billing checkout persistence warning',
        message: 'Checkout session created but payment_links insert failed.',
        details: {
          venueId,
          userId,
          sessionId: session.id,
          error: linkError.message,
        },
      });
    }

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      mode: session.mode,
    });
  } catch (error: any) {
    console.error('Error creating app billing checkout session:', error);
    await recordApi5xxEvent({
      route: '/api/app/billing/checkout',
      method: 'POST',
      statusCode: 500,
      errorMessage: error.message || 'Failed to create checkout session',
      context: { source: 'billing_checkout' },
      alertCategory: 'billing_error',
    });
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
