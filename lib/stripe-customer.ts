import { supabaseServiceRole as supabase } from './supabase-service-role';
import { SubscriptionStatus, Subscription, Invoice } from './types';

// Get subscription status for a venue
export async function getVenueSubscription(venueId: string): Promise<SubscriptionStatus> {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('venue_id', venueId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription found
        return {
          isActive: false,
          status: 'pending',
        };
      }
      throw error;
    }

    return {
      isActive: subscription.status === 'active' || subscription.status === 'trialing',
      planName: subscription.plan_name,
      currentPrice: subscription.current_price,
      nextBillingDate: subscription.next_billing_date,
      status: subscription.status as 'pending' | 'active' | 'trialing' | 'cancelled' | 'past_due',
    };
  } catch (error: any) {
    console.error('Error fetching venue subscription:', error);
    throw new Error(`Failed to fetch subscription: ${error.message}`);
  }
}

// Get subscription details for a venue
export async function getVenueSubscriptionDetails(venueId: string): Promise<Subscription | null> {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('venue_id', venueId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return subscription;
  } catch (error: any) {
    console.error('Error fetching venue subscription details:', error);
    throw new Error(`Failed to fetch subscription details: ${error.message}`);
  }
}

// Get invoices for a venue
export async function getVenueInvoices(venueId: string): Promise<Invoice[]> {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return invoices || [];
  } catch (error: any) {
    console.error('Error fetching venue invoices:', error);
    throw new Error(`Failed to fetch invoices: ${error.message}`);
  }
}

// Check if a venue has any pending payment links
export async function getVenuePendingPaymentLinks(venueId: string) {
  try {
    const { data: paymentLinks, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('venue_id', venueId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return paymentLinks || [];
  } catch (error: any) {
    console.error('Error fetching pending payment links:', error);
    throw new Error(`Failed to fetch payment links: ${error.message}`);
  }
}

// Update subscription status (used by webhooks)
export async function updateSubscriptionStatus(
  venueId: string, 
  updates: Partial<Subscription>
): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('venue_id', venueId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error updating subscription status:', error);
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
}

// Create or update subscription
export async function upsertSubscription(subscriptionData: Partial<Subscription> & { venue_id: string }): Promise<Subscription> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'venue_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error upserting subscription:', error);
    throw new Error(`Failed to upsert subscription: ${error.message}`);
  }
}

// Get plan display information
export function getPlanDisplayInfo(planName: string) {
  const planInfo = {
    essential: {
      name: 'Essential',
      description: 'Perfect for small independent venues getting started',
      monthlyPrice: 99.99,
      yearlyPrice: 79.99,
      features: [
        'Basic VR tour capture (up to 2,000 sqft)',
        'Standard AI chatbot with core training',
        'Membership pricing & hours information',
        'Basic facilities overview',
        'Mobile-optimised viewing',
        'Simple analytics dashboard',
        'Email support (48hr response)',
        'Single website integration'
      ]
    },
    professional: {
      name: 'Professional',
      description: 'Most popular for growing fitness venues and boutique studios',
      monthlyPrice: 199.99,
      yearlyPrice: 159.99,
      features: [
        'Enhanced VR tour capture (up to 5,000 sqft)',
        'Advanced AI training on all venue data',
        'Class schedules & trainer bios',
        'Equipment specifications & availability',
        'Personalised member recommendations',
        'Lead tracking & qualification',
        'Advanced analytics with conversion metrics',
        'Priority support (24hr response)',
        'Multiple website integrations',
        'Custom branding options'
      ]
    }
  };

  return planInfo[planName as keyof typeof planInfo] || planInfo.essential;
}
