import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { getCurrentMessageCreditPeriod } from '@/lib/billing-period';

export interface ClientAllocationResult {
  /** Whether per-client allocation enforcement applies to this venue/tour. */
  enforced: boolean;
  allowed: boolean;
  used: number;
  /** Monthly allocation for this client (0 when none set). */
  allocation: number;
  remaining: number;
  /** ISO timestamp for when the allocation next refreshes. */
  resetAt: string;
  message: string;
}

/**
 * Checks an individual agency-portal client's monthly message allocation.
 *
 * Only applies when the venue is an agency operating in `allocated` usage mode.
 * In that mode each client (one agency_portal_shares row per tour) has a fixed
 * monthly slice of the agency pool; when the slice is used up that client's
 * chatbot stops while other clients keep working. Usage is counted live against
 * the current calendar-month window, matching the billing pool reset.
 *
 * When the venue is not an allocated agency, or the tour has no matching share,
 * this returns `enforced: false, allowed: true` so callers can treat it as a
 * no-op layered on top of the venue-wide pool check.
 */
export async function checkClientAllocationUsage(
  venueId: string,
  tourId: string | null | undefined
): Promise<ClientAllocationResult> {
  const { resetAt } = getCurrentMessageCreditPeriod();

  const notEnforced: ClientAllocationResult = {
    enforced: false,
    allowed: true,
    used: 0,
    allocation: 0,
    remaining: 0,
    resetAt,
    message: 'No per-client allocation in effect.',
  };

  try {
    if (!tourId) return notEnforced;

    const { data: settings } = await supabase
      .from('agency_portal_settings')
      .select('client_usage_mode')
      .eq('venue_id', venueId)
      .maybeSingle();

    if (!settings || settings.client_usage_mode !== 'allocated') {
      return notEnforced;
    }

    // Find the client share for this tour. Without a share the tour is not a
    // portal client, so the venue-wide pool check alone governs it.
    const { data: share } = await supabase
      .from('agency_portal_shares')
      .select('message_credit_allocation')
      .eq('venue_id', venueId)
      .eq('tour_id', tourId)
      .maybeSingle();

    if (!share) return notEnforced;

    const allocation = Number(share.message_credit_allocation || 0);

    const { periodStart } = getCurrentMessageCreditPeriod();
    const { count: usedCount, error: usageError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('tour_id', tourId)
      .eq('chatbot_type', 'tour')
      .eq('message_type', 'visitor')
      .gte('created_at', periodStart);

    if (usageError) {
      console.error('Error checking client allocation usage:', usageError);
      // Fail closed for an allocated client to avoid overspending the pool.
      return {
        enforced: true,
        allowed: false,
        used: 0,
        allocation,
        remaining: 0,
        resetAt,
        message: 'Allocation usage could not be verified. Chat has been temporarily paused.',
      };
    }

    const used = Number(usedCount || 0);
    const remaining = Math.max(0, allocation - used);
    const allowed = used < allocation;

    return {
      enforced: true,
      allowed,
      used,
      allocation,
      remaining,
      resetAt,
      message: allowed
        ? 'Client allocation available.'
        : `This space has reached its monthly message allowance (${used.toLocaleString('en-GB')}/${allocation.toLocaleString('en-GB')}).`,
    };
  } catch (error) {
    console.error('Exception checking client allocation usage:', error);
    return {
      enforced: true,
      allowed: false,
      used: 0,
      allocation: 0,
      remaining: 0,
      resetAt,
      message: 'Allocation check failed. Chat has been temporarily paused.',
    };
  }
}
