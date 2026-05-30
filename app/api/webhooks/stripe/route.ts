import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import {
  claimWebhookForProcessing,
  markWebhookFailed,
  markWebhookProcessed,
  recordApi5xxEvent,
} from '@/lib/ops-monitoring';

// Tell Next.js to NOT parse the body - we need raw body for Stripe signature verification
export const runtime = 'nodejs';

// Lazy Stripe initialization
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(secretKey);
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
// Add-on subscription codes (capacity scaling). Agency is a plan tier, not an
// add-on, so it is not listed here. Add-ons always cascade with the main plan.
const ADDON_CODES = new Set([
  'extra_space',
  'message_block',
  'white_label',
  'agency_extra_space',
  'agency_message_block',
]);

function mapStripePlanToBillingPlan(planName?: string | null): string {
  if (!planName) return 'pro';
  if (planName === 'essential' || planName === 'professional') return 'pro';
  if (planName === 'agency') return 'agency';
  return planName;
}

function mapStripeStatusToBillingStatus(status: Stripe.Subscription.Status): 'active' | 'trialing' | 'past_due' | 'cancelled' {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
      return 'cancelled';
    default:
      console.warn(`Unknown Stripe subscription status "${status}", defaulting to cancelled`);
      return 'cancelled';
  }
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

async function applyAddonPurchase(venueId: string, addonCode: string, quantity: number) {
  const safeQuantity = Math.max(1, quantity || 1);

  const { error: addonApplyError } = await supabase.rpc('apply_billing_addon_purchase', {
    p_venue_id: venueId,
    p_addon_code: addonCode,
    p_quantity: safeQuantity,
  });

  if (addonApplyError) {
    throw addonApplyError;
  }

  await supabase
    .from('venue_billing_events')
    .insert({
      venue_id: venueId,
      event_type: 'addon_purchase_applied',
      event_source: 'stripe_webhook',
      event_payload: {
        addon_code: addonCode,
        quantity: safeQuantity,
      },
    });
}

async function persistInvoiceRecord(invoicePayload: {
  venue_id: string;
  stripe_invoice_id: string;
  amount_paid: number;
  currency: string;
  status: 'paid' | 'failed' | 'pending';
  invoice_pdf?: string | null;
  billing_reason?: string | null;
}) {
  const { error: upsertError } = await supabase
    .from('invoices')
    .upsert(invoicePayload, { onConflict: 'stripe_invoice_id' });

  if (!upsertError) {
    return;
  }

  // Fallback for databases that do not yet have the unique index required by ON CONFLICT.
  const onConflictNotSupported =
    upsertError.code === '42P10' ||
    String(upsertError.message || '').toLowerCase().includes('no unique or exclusion constraint');
  if (onConflictNotSupported) {
    const { error: insertError } = await supabase
      .from('invoices')
      .insert(invoicePayload);
    if (!insertError) {
      return;
    }
    console.error('Failed to insert invoice record after upsert fallback:', insertError);
    return;
  }

  console.error('Failed to upsert invoice record:', upsertError);
}

// Downgrade a venue to free and strip its add-ons when the main plan (pro or
// agency) subscription ends. All add-ons are scoped to a paid plan, so they
// cascade-cancel here; their own subscriptions are cancelled in parallel via
// syncAddonSubscriptionCancellationForCustomer.
async function clearVenueAddonsForCancellation(
  venueId: string,
  stripeCustomerId?: string | null
) {
  const update: Record<string, unknown> = {
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
  };

  const { error: resetError } = await supabase
    .from('venue_billing_records')
    .update(update)
    .eq('venue_id', venueId);

  if (resetError) {
    console.error('Failed to clear add-ons after cancellation:', resetError);
  }
}

// Clear a single add-on from a venue's billing record when its own Stripe
// subscription ends. Capacity add-ons are decremented by the cancelled
// quantity; feature add-ons are switched off.
async function applyAddonCancellation(venueId: string, addonCode: string, quantity: number) {
  const safeQuantity = Math.max(1, quantity || 1);

  const { error: cancelApplyError } = await supabase.rpc('apply_billing_addon_cancellation', {
    p_venue_id: venueId,
    p_addon_code: addonCode,
    p_quantity: safeQuantity,
  });

  if (cancelApplyError) {
    console.error('Failed to apply add-on cancellation:', addonCode, cancelApplyError);
    return;
  }

  await supabase
    .from('venue_billing_events')
    .insert({
      venue_id: venueId,
      event_type: 'addon_cancellation_applied',
      event_source: 'stripe_webhook',
      event_payload: {
        addon_code: addonCode,
        quantity: safeQuantity,
      },
    });
}

async function resolveVenueIdByStripeCustomer(customerId?: string | null): Promise<string | null> {
  if (!customerId) return null;
  const { data } = await supabase
    .from('venue_billing_records')
    .select('venue_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return data?.venue_id || null;
}

// Resolve a venue from the Stripe customer's metadata.venue_id (set at checkout).
async function resolveVenueIdFromStripeCustomer(customerId?: string | null): Promise<string | null> {
  if (!customerId) return null;
  try {
    const stripe = getStripe();
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer || (customer as any).deleted) return null;
    return (customer as any).metadata?.venue_id || null;
  } catch (error) {
    console.error('Failed to resolve venue from Stripe customer metadata:', error);
    return null;
  }
}

function isAddonCode(value?: string | null) {
  return Boolean(value && ADDON_CODES.has(value));
}

// Cascade the main plan's cancel-at-period-end scheduling onto every add-on
// subscription for the customer, so add-ons end alongside the plan they extend.
async function syncAddonSubscriptionCancellationForCustomer(
  customerId: string,
  shouldCancelAtPeriodEnd: boolean
) {
  const stripe = getStripe();
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

      try {
        await stripe.subscriptions.update(sub.id, {
          cancel_at_period_end: shouldCancelAtPeriodEnd,
        });
      } catch (error) {
        console.error('Failed syncing add-on subscription cancellation state:', sub.id, error);
      }
    }

    hasMore = page.has_more;
    startingAfter = page.data.length > 0 ? page.data[page.data.length - 1].id : undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('No stripe-signature header found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }
    
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not set');
      await recordApi5xxEvent({
        route: '/api/webhooks/stripe',
        method: 'POST',
        statusCode: 500,
        errorMessage: 'Webhook secret not configured',
        context: { source: 'stripe_webhook_bootstrap' },
        alertCategory: 'webhook_error',
      });
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error: any) {
      console.error('Webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`✅ Received webhook event: ${event.type}`);
    const claimed = await claimWebhookForProcessing({
      provider: 'stripe',
      eventId: event.id,
      eventType: event.type,
    });

    if (!claimed) {
      console.log(`↩️ Duplicate Stripe webhook ignored (already processing or processed): ${event.id}`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    try {
      switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

      await markWebhookProcessed({
        provider: 'stripe',
        eventId: event.id,
        httpStatus: 200,
      });
      return NextResponse.json({ received: true });
    } catch (error: any) {
      console.error('❌ Error processing webhook:', error);
      await markWebhookFailed({
        provider: 'stripe',
        eventId: event.id,
        eventType: event.type,
        errorMessage: error?.message || 'Webhook processing failed',
        httpStatus: 500,
      });
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Error in webhook route:', error);
    await recordApi5xxEvent({
      route: '/api/webhooks/stripe',
      method: 'POST',
      statusCode: 500,
      errorMessage: error?.message || 'Webhook route failed',
      context: { source: 'stripe_webhook_route' },
      alertCategory: 'webhook_error',
    });
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout completed:', session.id);
  
  if (!session.metadata?.venue_id) {
    console.error('No venue_id in checkout session metadata');
    return;
  }

  if (session.metadata?.billing_action === 'buy_addon' && session.metadata.venue_id && session.metadata.addon_code) {
    try {
      await applyAddonPurchase(
        session.metadata.venue_id,
        session.metadata.addon_code,
        parseInt(session.metadata.addon_quantity || '1', 10)
      );
      console.log(
        'Applied add-on purchase:',
        session.metadata.addon_code,
        session.metadata.addon_quantity,
        'for venue',
        session.metadata.venue_id
      );
    } catch (addonError) {
      console.error('Failed applying add-on purchase from checkout completed:', addonError);
    }
  }

  // Store venue info in Stripe customer metadata for later subscription webhook use
  if (session.customer && session.metadata.venue_id && session.metadata.plan_name) {
    try {
      const stripe = getStripe();
      await stripe.customers.update(session.customer as string, {
        metadata: {
          venue_id: session.metadata.venue_id,
          plan_name: session.metadata.plan_name,
          billing_cycle: session.metadata.billing_cycle || 'monthly',
        }
      });
      console.log('Updated Stripe customer metadata with venue info');
    } catch (error) {
      console.error('Failed to update customer metadata:', error);
    }
  }

  // Only update payment link status for one-time payments, not subscriptions
  // For subscriptions, let handleSubscriptionCreated handle the status update
  if (session.mode === 'payment') {
    const stripe = getStripe();
    let receiptUrl: string | null = null;
    try {
      if (session.payment_intent) {
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string, {
          expand: ['latest_charge'],
        });
        const latestCharge = (paymentIntent as any).latest_charge;
        if (latestCharge && typeof latestCharge === 'object') {
          receiptUrl = latestCharge.receipt_url || null;
        }
      }
    } catch (receiptError) {
      console.error('Failed to retrieve add-on receipt URL from payment intent:', receiptError);
    }

    // Persist one-off add-on charges into invoices table so they appear in billing history.
    if (session.metadata?.venue_id) {
      await persistInvoiceRecord({
        venue_id: session.metadata.venue_id,
        stripe_invoice_id: session.id,
        amount_paid: (session.amount_total || 0) / 100,
        currency: session.currency || 'gbp',
        status: 'paid',
        invoice_pdf: receiptUrl,
        billing_reason: 'addon_purchase',
      });
    }

    // One-time payment - update status immediately
    await supabase
      .from('payment_links')
      .update({ status: 'paid' })
      .eq('venue_id', session.metadata.venue_id)
      .eq('status', 'pending');
  }
  
  // If this checkout created a subscription, it will be handled by subscription.created event
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing subscription created:', subscription.id);
  
  const stripe = getStripe();
  let venueId: string | null = null;
  let planName: string | null = null;
  let billingCycle: string = 'monthly';
  
  // STRATEGY 0: Prefer direct subscription metadata when available.
  if (subscription.metadata?.venue_id) {
    const metadataAddonCode = subscription.metadata.addon_code || subscription.metadata.plan_name;
    venueId = subscription.metadata.venue_id;
    if (subscription.metadata.billing_action === 'buy_addon' && isAddonCode(metadataAddonCode)) {
      planName = metadataAddonCode;
    } else {
      planName = subscription.metadata.plan_name || null;
    }
    billingCycle = subscription.metadata.billing_cycle || 'monthly';
    console.log('✅ Found venue info from subscription metadata');
  }

  // STRATEGY 1: Try to get venue_id from the subscription's latest invoice's payment intent metadata
  // This is more reliable as it comes directly from the checkout session
  // Try to get the latest invoice to find checkout session
  if (subscription.latest_invoice) {
    try {
      const invoice = typeof subscription.latest_invoice === 'string' 
        ? await stripe.invoices.retrieve(subscription.latest_invoice, { expand: ['payment_intent'] })
        : subscription.latest_invoice;
      
      const paymentIntentId = (invoice as any).payment_intent;
      if (paymentIntentId) {
        const paymentIntent = typeof paymentIntentId === 'string'
          ? await stripe.paymentIntents.retrieve(paymentIntentId)
          : paymentIntentId;
        
        if (paymentIntent.metadata?.venue_id) {
          venueId = paymentIntent.metadata.venue_id;
          planName = paymentIntent.metadata.plan_name || 'professional';
          billingCycle = paymentIntent.metadata.billing_cycle || 'monthly';
          console.log('✅ Found venue info from payment intent metadata');
        }
      }
    } catch (error) {
      console.log('Could not retrieve invoice/payment intent, trying customer metadata...');
    }
  }
  
  // STRATEGY 2: Fall back to customer metadata (if checkout.session.completed already ran)
  if (!venueId) {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (!customer || customer.deleted) {
      console.error('❌ Customer not found for subscription:', subscription.id);
      return;
    }

    const customerMetadata = (customer as any).metadata;
    if (customerMetadata?.venue_id) {
      venueId = customerMetadata.venue_id;
      planName = customerMetadata.plan_name || 'professional';
      billingCycle = customerMetadata.billing_cycle || 'monthly';
      console.log('✅ Found venue info from customer metadata');
    }
  }
  
  // STRATEGY 3: If still no venue_id, check payment_links table for this customer
  if (!venueId) {
    console.log('⏳ No metadata found, searching payment_links by customer email...');
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (customer && !customer.deleted && (customer as any).email) {
      const { data: paymentLink } = await supabase
        .from('payment_links')
        .select('venue_id, plan_name')
        .eq('customer_email', (customer as any).email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (paymentLink) {
        venueId = paymentLink.venue_id;
        planName = paymentLink.plan_name;
        console.log('✅ Found venue info from payment_links table');
      }
    }
  }
  
  if (!venueId || !planName) {
    console.error('❌ Could not find venue_id or plan_name for subscription:', subscription.id);
    console.error('Subscription customer:', subscription.customer);
    return;
  }

  console.log('Found venue info from customer metadata - Venue:', venueId, 'Plan:', planName);

  const isAddonSubscription = isAddonCode(planName);

  // NEW: Determine if this is a trial subscription
  const isTrial = subscription.status === 'trialing';
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
  const trialStart = isTrial ? new Date().toISOString() : null;
  
  // Calculate trial period days
  let trialPeriodDays: number | null = null;
  if (isTrial && subscription.trial_end) {
    const trialEndDate = new Date(subscription.trial_end * 1000);
    const now = new Date();
    trialPeriodDays = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Create subscription directly using metadata info
  try {
    // Handle next billing date safely. In newer Stripe API versions
    // current_period_end moved from the subscription to the subscription item,
    // so fall back to the item when the top-level field is absent.
    const periodEndUnix =
      (subscription as any).current_period_end ||
      (subscription.items?.data?.[0] as any)?.current_period_end ||
      null;
    let nextBillingDate: string | null = null;
    if (periodEndUnix) {
      try {
        nextBillingDate = new Date(periodEndUnix * 1000).toISOString();
      } catch (dateError) {
        console.error('Invalid current_period_end:', periodEndUnix);
        // Calculate next billing date manually based on billing cycle
        const now = new Date();
        nextBillingDate = billingCycle === 'yearly' 
          ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    console.log('Creating subscription with data:', {
      venue_id: venueId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      plan_name: planName,
      next_billing_date: nextBillingDate,
      is_trial: isTrial,
      trial_period_days: trialPeriodDays,
    });

    if (!isAddonSubscription) {
      // Resolve the first invoice up front. A paid invoice is the reliable
      // signal that the subscription is active, independent of the (possibly
      // transient 'incomplete') status on the created event or event ordering.
      let firstInvoice: Stripe.Invoice | null = null;
      try {
        if (subscription.latest_invoice) {
          firstInvoice = typeof subscription.latest_invoice === 'string'
            ? await stripe.invoices.retrieve(subscription.latest_invoice)
            : subscription.latest_invoice;
        }
      } catch (invoiceLookupError) {
        console.error('Could not retrieve latest invoice:', invoiceLookupError);
      }
      const invoicePaid = Boolean(
        firstInvoice && (firstInvoice.status === 'paid' || (firstInvoice.amount_paid ?? 0) > 0)
      );

      const resolvedSubscriptionStatus = isTrial
        ? 'trialing'
        : invoicePaid
          ? 'active'
          : mapStripeStatusToSubscriptionStatus(subscription.status);
      const resolvedBillingStatus = isTrial
        ? 'trialing'
        : invoicePaid
          ? 'active'
          : mapStripeStatusToBillingStatus(subscription.status);

      await supabase
        .from('subscriptions')
        .upsert({
          venue_id: venueId,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          plan_name: planName,
          status: resolvedSubscriptionStatus,
          current_price: subscription.items.data[0].price.unit_amount! / 100,
          billing_cycle: subscription.items.data[0].price.recurring?.interval === 'year' ? 'yearly' : 'monthly',
          next_billing_date: nextBillingDate,
          cancel_at_period_end: subscription.cancel_at_period_end,
          cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          is_trial: isTrial,
          trial_period_days: trialPeriodDays,
          trial_end_date: trialEnd,
          trial_started_at: trialStart,
        }, { onConflict: 'venue_id' });

      console.log('Successfully created subscription in Supabase for venue:', venueId);

      const mappedPlanCode = mapStripePlanToBillingPlan(planName);

      await supabase
        .from('venue_billing_records')
        .upsert(
          {
            venue_id: venueId,
            plan_code: mappedPlanCode,
            billing_status: resolvedBillingStatus,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
          },
          { onConflict: 'venue_id' }
        );

      // Persist the first invoice straight away. The invoice.payment_succeeded
      // event uses a newer API shape (no top-level invoice.subscription) and can
      // also arrive before this row exists, so we record it here where the venue
      // is already known. persistInvoiceRecord upserts, so this won't duplicate.
      if (firstInvoice?.id && invoicePaid) {
        try {
          await persistInvoiceRecord({
            venue_id: venueId,
            stripe_invoice_id: firstInvoice.id,
            amount_paid: (firstInvoice.amount_paid || 0) / 100,
            currency: firstInvoice.currency || 'gbp',
            status: 'paid',
            invoice_pdf: firstInvoice.invoice_pdf,
            billing_reason: firstInvoice.billing_reason,
          });
        } catch (invoiceError) {
          console.error('Failed to persist initial subscription invoice:', invoiceError);
        }
      }
    } else {
      // Add-on subscriptions do not change the main plan, but we still need the
      // Stripe customer recorded on the venue so invoices, add-on status, and
      // add-on cancellation can be resolved (especially for free accounts that
      // only hold a standalone feature add-on).
      await supabase
        .from('venue_billing_records')
        .update({ stripe_customer_id: subscription.customer as string })
        .eq('venue_id', venueId)
        .is('stripe_customer_id', null);

      // Persist the add-on's first invoice here too, where the venue is known.
      // Add-on subscriptions are not tracked in the subscriptions table, so the
      // invoice.payment_succeeded handler can otherwise struggle to resolve the
      // venue (especially under event-ordering races). Upsert dedupes.
      try {
        if (subscription.latest_invoice) {
          const addonInvoice = typeof subscription.latest_invoice === 'string'
            ? await stripe.invoices.retrieve(subscription.latest_invoice)
            : subscription.latest_invoice;
          if (addonInvoice?.id && (addonInvoice.status === 'paid' || (addonInvoice.amount_paid ?? 0) > 0)) {
            await persistInvoiceRecord({
              venue_id: venueId,
              stripe_invoice_id: addonInvoice.id,
              amount_paid: (addonInvoice.amount_paid || 0) / 100,
              currency: addonInvoice.currency || 'gbp',
              status: 'paid',
              invoice_pdf: addonInvoice.invoice_pdf,
              billing_reason: addonInvoice.billing_reason,
            });
          }
        }
      } catch (addonInvoiceError) {
        console.error('Failed to persist add-on invoice:', addonInvoiceError);
      }
    }

    // Update payment link status to paid for checkout session created from app.
    await supabase
      .from('payment_links')
      .update({ status: 'paid' })
      .eq('venue_id', venueId)
      .in('status', ['pending']);
      
    console.log('Updated payment link status to paid for venue:', venueId);
    
    if (!isAddonSubscription) {
      // Disable setup mode when main plan subscription is created.
      await supabase
        .from('venues')
        .update({ in_setup: false })
        .eq('id', venueId);
      console.log('Disabled setup mode for venue:', venueId);
    }
    
  } catch (error) {
    console.error('Failed to create subscription:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription updated:', subscription.id);
  
  try {
    // Check if subscription transitioned from trialing to active
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('status, is_trial')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    const wasTrialing = existingSubscription?.status === 'trialing' || existingSubscription?.is_trial;
    const isNowActive = subscription.status === 'active';

    // Update subscription
    const updateData: any = {
      status: mapStripeStatusToSubscriptionStatus(subscription.status),
      // Keep is_trial true if it was previously a trial (don't set to false when converting)
      is_trial: existingSubscription?.is_trial || subscription.status === 'trialing',
      current_price: subscription.items.data[0].price.unit_amount! / 100,
      billing_cycle: subscription.items.data[0].price.recurring?.interval === 'year' ? 'yearly' : 'monthly',
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    };

    // Handle next billing date safely. current_period_end moved to the
    // subscription item in newer Stripe API versions; fall back to it.
    const updatedPeriodEndUnix =
      (subscription as any).current_period_end ||
      (subscription.items?.data?.[0] as any)?.current_period_end ||
      null;
    if (updatedPeriodEndUnix) {
      updateData.next_billing_date = new Date(updatedPeriodEndUnix * 1000).toISOString();
    }

    // Handle trial end date
    if (subscription.trial_end) {
      updateData.trial_end_date = new Date(subscription.trial_end * 1000).toISOString();
    }

    await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', subscription.id);

    // If trial converted to active, log it
    if (wasTrialing && isNowActive) {
      console.log('Trial converted to paid subscription:', subscription.id);
      // Setup mode should be automatically disabled by database trigger
    }

    const { data: venueSubscription } = await supabase
      .from('subscriptions')
      .select('venue_id, plan_name')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (venueSubscription?.venue_id) {
      const isCancelled = subscription.status === 'canceled';
      if (isCancelled) {
        await clearVenueAddonsForCancellation(venueSubscription.venue_id, subscription.customer as string);
      } else {
        // Prefer the Stripe subscription metadata's plan_name (set atomically by
        // checkout and the in-app plan switch) over the DB row, which can be
        // momentarily stale during a pro<->agency switch. Ignore add-on codes.
        const metadataPlanName = subscription.metadata?.plan_name;
        const resolvedPlanName =
          metadataPlanName && !isAddonCode(metadataPlanName)
            ? metadataPlanName
            : venueSubscription.plan_name;

        // Keep the subscriptions row's plan_name in sync so future reads agree.
        if (resolvedPlanName && resolvedPlanName !== venueSubscription.plan_name) {
          await supabase
            .from('subscriptions')
            .update({ plan_name: resolvedPlanName, updated_at: new Date().toISOString() })
            .eq('stripe_subscription_id', subscription.id);
        }

        await supabase
          .from('venue_billing_records')
          .upsert(
            {
              venue_id: venueSubscription.venue_id,
              plan_code: mapStripePlanToBillingPlan(resolvedPlanName),
              billing_status: mapStripeStatusToBillingStatus(subscription.status),
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
            },
            { onConflict: 'venue_id' }
          );

        // Keep add-on subscriptions in sync with main plan cancellation scheduling.
        await syncAddonSubscriptionCancellationForCustomer(
          subscription.customer as string,
          subscription.cancel_at_period_end
        );
      }
    }

  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deleted:', subscription.id);

  const metadata = subscription.metadata || {};
  const billingAction = (metadata.billing_action || '').toLowerCase();
  const isAddonSubscription = billingAction === 'buy_addon';
  const addonCode = metadata.addon_code || metadata.plan_name || null;
  const customerId = subscription.customer as string;

  // Keep the main subscription row (if any) up to date. Add-on subscriptions are
  // not tracked in the subscriptions table, so this is a no-op for them.
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancel_at_period_end: false,
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  // Resolve the venue: prefer subscription metadata, then the main subscription
  // row, then the billing record mapped to the Stripe customer.
  let venueId: string | null = metadata.venue_id || null;
  if (!venueId) {
    const { data: venueSubscription } = await supabase
      .from('subscriptions')
      .select('venue_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();
    venueId = venueSubscription?.venue_id || null;
  }
  if (!venueId) {
    venueId = await resolveVenueIdByStripeCustomer(customerId);
  }

  if (!venueId) {
    console.warn('Could not resolve venue for deleted subscription:', subscription.id);
    return;
  }

  // An individual add-on subscription ended: clear only that add-on so other
  // add-ons and the main plan are untouched.
  if (isAddonSubscription && isAddonCode(addonCode)) {
    const cancelledQuantity = parseInt(metadata.addon_quantity || '1', 10) || 1;
    await applyAddonCancellation(venueId, addonCode as string, cancelledQuantity);
    return;
  }

  // The main plan subscription (pro or agency) ended: downgrade to free and
  // clear all add-ons. Add-on subscriptions are cancelled in parallel by the
  // cancellation flow / cron reconcile, then their own deleted events decrement.
  await clearVenueAddonsForCancellation(venueId, customerId);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment succeeded:', invoice.id);

  if (!invoice.id) return;

  // The Stripe API version in use no longer exposes a top-level
  // invoice.subscription; subscription invoices reference it under
  // invoice.parent.subscription_details.subscription instead.
  const invoiceSubscriptionId: string | null =
    (invoice as any).subscription ||
    (invoice as any).parent?.subscription_details?.subscription ||
    null;

  // Resolve the venue: subscription row, then billing record by customer, then
  // Stripe customer metadata (covers standalone add-on invoices on any plan).
  let venueId: string | null = null;
  if (invoiceSubscriptionId) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('venue_id')
      .eq('stripe_subscription_id', invoiceSubscriptionId)
      .maybeSingle();
    venueId = subscription?.venue_id || null;
  }
  if (!venueId && invoice.customer) {
    const { data: billingRecord } = await supabase
      .from('venue_billing_records')
      .select('venue_id')
      .eq('stripe_customer_id', invoice.customer as string)
      .maybeSingle();
    venueId = billingRecord?.venue_id || null;
  }
  if (!venueId && invoice.customer) {
    venueId = await resolveVenueIdFromStripeCustomer(invoice.customer as string);
  }

  if (!venueId) {
    console.warn('Could not resolve venue for paid invoice:', invoice.id);
    return;
  }

  await persistInvoiceRecord({
    venue_id: venueId,
    stripe_invoice_id: invoice.id,
    amount_paid: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: 'paid',
    invoice_pdf: invoice.invoice_pdf,
    billing_reason: invoice.billing_reason,
  });

  // A paid invoice for the main subscription means it is active. This covers
  // the incomplete -> active transition when no subscription.updated event
  // arrives. Add-on subscriptions are not tracked in the subscriptions table,
  // so this update is a no-op for them and won't touch billing_status.
  if (invoiceSubscriptionId) {
    const { data: mainSub } = await supabase
      .from('subscriptions')
      .select('venue_id, status')
      .eq('stripe_subscription_id', invoiceSubscriptionId)
      .maybeSingle();

    if (mainSub?.venue_id && mainSub.status !== 'cancelled') {
      await supabase
        .from('subscriptions')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', invoiceSubscriptionId);

      await supabase
        .from('venue_billing_records')
        .update({ billing_status: 'active' })
        .eq('venue_id', mainSub.venue_id)
        .neq('billing_status', 'cancelled');
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment failed:', invoice.id);
  
  if (!(invoice as any).subscription) return;
  if (!invoice.id) return;

  // Update subscription status to past_due
  await supabase
    .from('subscriptions')
    .update({ 
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', (invoice as any).subscription);

  const { data: subscriptionVenue } = await supabase
    .from('subscriptions')
    .select('venue_id')
    .eq('stripe_subscription_id', (invoice as any).subscription)
    .single();

  if (subscriptionVenue?.venue_id) {
    await supabase
      .from('venue_billing_records')
      .update({ billing_status: 'past_due' })
      .eq('venue_id', subscriptionVenue.venue_id);
  }

  // Save failed invoice record
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('venue_id')
    .eq('stripe_subscription_id', (invoice as any).subscription)
    .single();

  let venueId: string | null = subscription?.venue_id || null;
  if (!venueId && invoice.customer) {
    const { data: billingRecord } = await supabase
      .from('venue_billing_records')
      .select('venue_id')
      .eq('stripe_customer_id', invoice.customer as string)
      .single();
    venueId = billingRecord?.venue_id || null;
  }

  if (venueId) {
    await persistInvoiceRecord({
        venue_id: venueId,
        stripe_invoice_id: invoice.id,
        amount_paid: 0,
        currency: invoice.currency,
        status: 'failed',
        billing_reason: invoice.billing_reason,
      });
  }
} 