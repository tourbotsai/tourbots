import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { getUserWithVenue } from '@/lib/user-service';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { notifyOpsAlert, recordApi5xxEvent } from '@/lib/ops-monitoring';

initAdmin();
const auth = getAuth();

const checkoutSchema = z.object({
  action: z.enum(['upgrade_plan', 'buy_addon']),
  planCode: z.string().optional(),
  addonCode: z.string().optional(),
  quantity: z.number().int().min(1).max(100).optional(),
});

const ADDON_CODES = ['extra_space', 'message_block', 'white_label', 'agency_portal'] as const;

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

    let session: Stripe.Checkout.Session;
    let savedPlanName = 'unknown';

    if (action === 'upgrade_plan') {
      if (planCode !== 'pro') {
        return NextResponse.json({ error: 'Only pro plan upgrades are supported in app checkout.' }, { status: 400 });
      }

      const { data: plan, error: planError } = await supabase
        .from('billing_plans')
        .select('*')
        .eq('code', 'pro')
        .single();

      if (planError || !plan) {
        return NextResponse.json({ error: 'Pro plan is not configured.' }, { status: 400 });
      }

      const priceId = stripeMode === 'live' ? plan.stripe_price_monthly_live : plan.stripe_price_monthly_sandbox;
      if (!priceId) {
        return NextResponse.json({ error: `Missing Stripe price ID for Pro plan in ${stripeMode} mode.` }, { status: 400 });
      }

      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: userEmail,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          billing_action: 'upgrade_plan',
          venue_id: venueId,
          plan_name: 'pro',
          billing_cycle: 'monthly',
          requested_by_user_id: userId,
        },
        subscription_data: {
          metadata: {
            billing_action: 'upgrade_plan',
            venue_id: venueId,
            plan_name: 'pro',
            requested_by_user_id: userId,
          },
        },
        success_url: `${baseUrl}/app/settings?billing_success=1`,
        cancel_url: `${baseUrl}/app/settings?billing_cancelled=1`,
        allow_promotion_codes: true,
      });

      savedPlanName = 'pro';
    } else {
      if (!addonCode || !ADDON_CODES.includes(addonCode as typeof ADDON_CODES[number])) {
        return NextResponse.json({ error: 'Valid addon code is required.' }, { status: 400 });
      }

      const { data: addon, error: addonError } = await supabase
        .from('billing_addons')
        .select('*')
        .eq('code', addonCode)
        .single();

      if (addonError || !addon) {
        return NextResponse.json({ error: 'Addon is not configured.' }, { status: 400 });
      }

      const normalizedQuantity = ['white_label', 'agency_portal'].includes(addonCode) ? 1 : quantity;
      const addonPriceId = stripeMode === 'live' ? addon.stripe_price_monthly_live : addon.stripe_price_monthly_sandbox;
      if (!addonPriceId) {
        return NextResponse.json(
          { error: `Missing Stripe monthly add-on price ID for ${addonCode} in ${stripeMode} mode.` },
          { status: 400 }
        );
      }

      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: userEmail,
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
