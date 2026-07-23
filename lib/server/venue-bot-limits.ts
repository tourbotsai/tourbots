import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

/**
 * Billing “bot” = one active primary tour OR one website chatbot config.
 * Shared by tour create, website chatbot create, Agency add-client, and UI usage.
 */
export async function getVenueBotLimit(venueId: string): Promise<number> {
  const { data: billingRecord } = await supabase
    .from('venue_billing_records')
    .select('*')
    .eq('venue_id', venueId)
    .maybeSingle();

  const planCode =
    billingRecord?.billing_override_enabled && billingRecord?.override_plan_code
      ? billingRecord.override_plan_code
      : billingRecord?.plan_code || 'free';

  const { data: planRow } = await supabase
    .from('billing_plans')
    .select('included_bots')
    .eq('code', planCode)
    .maybeSingle();

  const baseBotsFromPlan = Number(planRow?.included_bots || 0);
  const baseBots = Math.max(baseBotsFromPlan, planCode === 'free' ? 1 : 0);
  const extraBots = Number(billingRecord?.addon_extra_bots || 0);

  const totalBots = Number(
    billingRecord?.effective_bot_limit ?? baseBots + extraBots
  );

  return Math.max(totalBots, 1);
}

export async function countPrimaryTours(venueId: string): Promise<number> {
  const { count, error } = await supabase
    .from('tours')
    .select('id', { count: 'exact', head: true })
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .or('tour_type.eq.primary,tour_type.is.null');

  if (error) {
    console.error('countPrimaryTours error:', error);
    return 0;
  }
  return count || 0;
}

export async function countWebsiteChatbots(venueId: string): Promise<number> {
  const { count, error } = await supabase
    .from('chatbot_configs')
    .select('id', { count: 'exact', head: true })
    .eq('venue_id', venueId)
    .eq('chatbot_type', 'website');

  if (error) {
    console.error('countWebsiteChatbots error:', error);
    return 0;
  }
  return count || 0;
}

/** Bots used = active primary tours + website chatbot configs. */
export async function countBotsUsed(venueId: string): Promise<number> {
  const [primaryTours, websiteBots] = await Promise.all([
    countPrimaryTours(venueId),
    countWebsiteChatbots(venueId),
  ]);
  return primaryTours + websiteBots;
}

export async function assertBotAvailable(venueId: string): Promise<
  | { ok: true; used: number; limit: number }
  | { ok: false; used: number; limit: number; error: string }
> {
  const [limit, used] = await Promise.all([
    getVenueBotLimit(venueId),
    countBotsUsed(venueId),
  ]);

  if (used >= limit) {
    return {
      ok: false,
      used,
      limit,
      error: `Bot limit reached (${used}/${limit}). Upgrade your plan or purchase extra bot add-ons to add another tour or website chatbot.`,
    };
  }

  return { ok: true, used, limit };
}
