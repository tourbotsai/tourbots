import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

export interface BillingMessageUsageResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  planCode: string;
  message: string;
}

/**
 * Checks venue-level message credit allowance for tour chatbot usage.
 * Message allowance is derived from:
 * - active plan included messages
 * - +1,000 per extra space add-on
 * - +1,000 per message block add-on
 * unless an effective_message_limit override is set.
 */
export async function checkBillingMessageUsage(venueId: string): Promise<BillingMessageUsageResult> {
  try {
    const { data: billingRecord } = await supabase
      .from('venue_billing_records')
      .select('*')
      .eq('venue_id', venueId)
      .maybeSingle();

    const planCode = (billingRecord?.billing_override_enabled && billingRecord?.override_plan_code)
      ? billingRecord.override_plan_code
      : (billingRecord?.plan_code || 'free');

    const { data: planRow } = await supabase
      .from('billing_plans')
      .select('included_messages')
      .eq('code', planCode)
      .maybeSingle();

    const baseMessages = Number(planRow?.included_messages || 0);
    const extraSpaces = Number(billingRecord?.addon_extra_spaces || 0);
    const messageBlocks = Number(billingRecord?.addon_message_blocks || 0);

    const totalMessageLimit = Number(
      billingRecord?.effective_message_limit ??
      (baseMessages + (extraSpaces * 1000) + (messageBlocks * 1000))
    );

    const { count: usedCount, error: usageError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('chatbot_type', 'tour')
      .eq('message_type', 'visitor');

    if (usageError) {
      console.error('Error checking billing message usage:', usageError);
      // Fail closed if usage cannot be computed to avoid unbounded spend.
      return {
        allowed: false,
        used: 0,
        limit: totalMessageLimit,
        remaining: 0,
        planCode,
        message: 'Billing usage could not be verified. Chat has been temporarily paused to prevent unbounded usage.',
      };
    }

    const used = Number(usedCount || 0);
    const remaining = Math.max(0, totalMessageLimit - used);
    const allowed = used < totalMessageLimit;

    console.log(
      `📦 Billing usage check for venue ${venueId}: messages ${used}/${totalMessageLimit} (remaining ${remaining}) | plan ${planCode} | allowed=${allowed}`
    );

    return {
      allowed,
      used,
      limit: totalMessageLimit,
      remaining,
      planCode,
      message: allowed
        ? 'Billing message allowance available.'
        : `Message credit limit reached (${used.toLocaleString('en-GB')}/${totalMessageLimit.toLocaleString('en-GB')}).`,
    };
  } catch (error) {
    console.error('Exception checking billing message usage:', error);
    // Fail closed on unexpected errors to avoid unbounded spend.
    return {
      allowed: false,
      used: 0,
      limit: 0,
      remaining: 0,
      planCode: 'unknown',
      message: 'Billing usage check failed. Chat has been temporarily paused to prevent unbounded usage.',
    };
  }
}
