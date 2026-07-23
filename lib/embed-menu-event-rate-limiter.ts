import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

/**
 * Atomically rate-limits and writes public menu analytics events. The database
 * function performs both operations in a single transaction so concurrent
 * requests cannot pass a separate count check before inserting.
 */
export async function recordMenuEventWithRateLimit(params: {
  embedId: string;
  venueId: string;
  tourId?: string | null;
  eventType: 'menu_opened' | 'menu_closed' | 'menu_item_clicked' | 'menu_ai_prompt_sent';
  menuStyle?: 'modal' | 'drawer' | 'icon' | null;
  triggerSource?: string | null;
  itemId?: string | null;
  itemLabel?: string | null;
  itemType?: string | null;
  actionType?: string | null;
  targetRef?: string | null;
  domain?: string | null;
  pageUrl?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress: string;
}): Promise<{ allowed: boolean; message?: string }> {
  const { venueId, ipAddress, ...event } = params;
  const { data, error } = await supabase.rpc('record_embed_menu_event', {
    p_venue_id: venueId,
    p_ip_address: ipAddress || 'unknown',
    p_event: {
      embed_id: event.embedId,
      tour_id: event.tourId || null,
      event_type: event.eventType,
      menu_style: event.menuStyle || null,
      trigger_source: event.triggerSource || null,
      item_id: event.itemId || null,
      item_label: event.itemLabel || null,
      item_type: event.itemType || null,
      action_type: event.actionType || null,
      target_ref: event.targetRef || null,
      domain: event.domain || null,
      page_url: event.pageUrl || null,
      user_agent: event.userAgent || null,
      metadata: event.metadata || {},
    },
  });

  if (error) throw new Error(error.message);
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.accepted) {
    return { allowed: false, message: result?.message || 'Rate limit exceeded' };
  }
  return { allowed: true };
}
