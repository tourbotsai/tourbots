import { supabaseServiceRole as supabase } from './supabase-service-role';
import { UserSubscriptionStatus, BillingAccessControl } from './types';
import { createPaymentLink } from './stripe-admin';

/**
 * Check if a user has access to platform features based on their subscription status
 */
export async function checkUserSubscriptionStatus(venueId: string): Promise<UserSubscriptionStatus> {
  try {
    // Get venue details (including in_setup flag)
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('in_setup')
      .eq('id', venueId)
      .single();

    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('venue_id', venueId)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subError);
    }

    // Check for pending payment links
    const { data: pendingLinks, error: linkError } = await supabase
      .from('payment_links')
      .select('*')
      .eq('venue_id', venueId)
      .eq('status', 'pending')
      .limit(1);

    if (linkError) {
      console.error('Error fetching payment links:', linkError);
    }

    // NEW: Check if in setup mode
    const inSetupMode = venue?.in_setup || false;

    // NEW: Check if subscription is trialing
    const isTrialing = subscription?.status === 'trialing' || subscription?.is_trial === true;
    
    // Calculate trial days remaining
    let trialDaysRemaining: number | undefined;
    if (isTrialing && subscription?.trial_end_date) {
      const trialEnd = new Date(subscription.trial_end_date);
      const now = new Date();
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      trialDaysRemaining = Math.max(0, daysRemaining);
    }

    const hasActiveSubscription = 
      subscription && 
      (subscription.status === 'active' || subscription.status === 'trialing');
    
    const hasPendingPayment = pendingLinks && pendingLinks.length > 0;
    const subscriptionStatus = subscription?.status || 'pending';

    // NEW: Grant access if in setup mode OR has active subscription
    const canAccessFeatures = inSetupMode || !!hasActiveSubscription;

    return {
      hasActiveSubscription: !!hasActiveSubscription,
      subscriptionStatus: subscriptionStatus as any,
      planType: subscription?.plan_name || null,
      canAccessFeatures,
      pendingPaymentRequired: !hasActiveSubscription && !hasPendingPayment && !inSetupMode,
      inSetupMode, // NEW
      isTrialing, // NEW
      trialEndsAt: subscription?.trial_end_date,
      trialDaysRemaining, // NEW
      blockedReason: !canAccessFeatures ? 'No active subscription or setup mode' : undefined,
    };
  } catch (error: any) {
    console.error('Error checking subscription status:', error);
    return {
      hasActiveSubscription: false,
      subscriptionStatus: 'pending',
      planType: null,
      canAccessFeatures: false,
      pendingPaymentRequired: true,
      inSetupMode: false,
      isTrialing: false,
      blockedReason: 'Error checking subscription status',
    };
  }
}

/**
 * Determine what features a user can access based on their subscription
 */
export async function getBillingAccessControl(venueId: string): Promise<BillingAccessControl> {
  const subscriptionStatus = await checkUserSubscriptionStatus(venueId);
  
  // NEW: Grant access if in setup mode OR has active subscription
  if (subscriptionStatus.canAccessFeatures) {
    return {
      canAccessDashboard: true,
      canAccessTours: true,
      canAccessChatbots: true,
      canAccessLeads: true,
      canAccessAnalytics: true,
      canAccessSettings: true,
      featuresBlocked: [],
      requiresPayment: false,
    };
  }

  // User doesn't have access - show blocked features
  const featuresBlocked = [
    'Virtual Tours',
    'AI Chatbots',
    'Lead Management',
    'Analytics Dashboard',
    'Custom Branding',
  ];

  return {
    canAccessDashboard: false,
    canAccessTours: false,
    canAccessChatbots: false,
    canAccessLeads: false,
    canAccessAnalytics: false,
    canAccessSettings: true, // Always allow settings access
    featuresBlocked,
    requiresPayment: true,
  };
}

/**
 * Create a payment link for a new user registration
 */
export async function createRegistrationPaymentLink(
  venueId: string,
  customerEmail: string,
  planName: 'essential' | 'professional' = 'essential'
): Promise<string | null> {
  try {
    // Call the admin function directly since this runs server-side
    const result = await createPaymentLink({
      venueId,
      customerEmail,
      planName,
      billingCycle: 'monthly', // Default to monthly for new registrations
      createdBy: 'system',
    });

    return result.paymentLink;
  } catch (error: any) {
    console.error('Error creating registration payment link:', error);
    return null;
  }
}

/**
 * Block access to features for users without active subscriptions
 */
export async function enforceSubscriptionAccess(venueId: string): Promise<{
  allowed: boolean;
  redirectTo?: string;
  message?: string;
}> {
  const accessControl = await getBillingAccessControl(venueId);

  if (!accessControl.requiresPayment) {
    return { allowed: true };
  }

  return {
    allowed: false,
    redirectTo: '/app/settings?tab=billing',
    message: 'Please complete your subscription payment to access this feature.',
  };
}

/**
 * Get user-friendly subscription status message
 */
export function getSubscriptionStatusMessage(status: UserSubscriptionStatus): {
  title: string;
  message: string;
  actionRequired: boolean;
} {
  switch (status.subscriptionStatus) {
    case 'active':
      return {
        title: 'Subscription Active',
        message: `Your ${status.planType} plan is active and all features are available.`,
        actionRequired: false,
      };
    case 'pending':
      return {
        title: 'Payment Required',
        message: 'Please complete your payment to activate your subscription and access all features.',
        actionRequired: true,
      };
    case 'past_due':
      return {
        title: 'Payment Overdue',
        message: 'Your payment is overdue. Please update your payment method to continue using the platform.',
        actionRequired: true,
      };
    case 'cancelled':
      return {
        title: 'Subscription Cancelled',
        message: 'Your subscription has been cancelled. Reactivate to continue using the platform.',
        actionRequired: true,
      };
    default:
      return {
        title: 'Subscription Required',
        message: 'Please set up your subscription to access the platform.',
        actionRequired: true,
      };
  }
} 