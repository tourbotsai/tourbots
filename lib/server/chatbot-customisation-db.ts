import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { ChatbotCustomisation } from '@/lib/types';
import { ENTITLEMENT_COLUMNS, venueHasAgencyPortal } from '@/lib/billing-entitlements';

/**
 * Agency-plan venues are white-label by default: the "Powered by TourBots"
 * branding must never appear on their tours, embeds or portal. The toggle is
 * hidden from them in the UI, so we enforce it at the data layer too. This is
 * the single chokepoint for all customisation writes (creation seed + edits),
 * which keeps the stored value correct across every render surface.
 */
async function isAgencyVenue(venueId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('venue_billing_records')
    .select(ENTITLEMENT_COLUMNS)
    .eq('venue_id', venueId)
    .maybeSingle();
  if (error) return false;
  return venueHasAgencyPortal(data as any);
}

export async function getChatbotCustomisation(
  venueId: string,
  chatbotType: 'tour',
  tourId?: string | null
): Promise<ChatbotCustomisation | null> {
  let query = supabase
    .from('chatbot_customisations')
    .select('*')
    .eq('venue_id', venueId)
    .eq('chatbot_type', chatbotType);

  if (tourId) {
    query = query.eq('tour_id', tourId);
  } else {
    query = query.is('tour_id', null);
  }

  const { data, error } = await query.single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

export async function upsertChatbotCustomisation(
  venueId: string,
  chatbotType: 'tour',
  tourId: string,
  customisation: Partial<Omit<ChatbotCustomisation, 'id' | 'venue_id' | 'chatbot_type' | 'created_at' | 'updated_at'>>
): Promise<ChatbotCustomisation> {
  // White-label is standard on the agency plan: never persist the branding as
  // visible for an agency venue, regardless of what the caller supplies.
  const brandingOverride = (await isAgencyVenue(venueId))
    ? { show_powered_by: false, mobile_show_powered_by: false }
    : {};

  const { data, error } = await supabase
    .from('chatbot_customisations')
    .upsert(
      {
        venue_id: venueId,
        tour_id: tourId,
        chatbot_type: chatbotType,
        ...customisation,
        ...brandingOverride,
      },
      {
        onConflict: 'venue_id,tour_id,chatbot_type',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getVenueChatbotCustomisations(
  venueId: string
): Promise<ChatbotCustomisation[]> {
  const { data, error } = await supabase
    .from('chatbot_customisations')
    .select('*')
    .eq('venue_id', venueId)
    .order('chatbot_type');

  if (error) throw error;
  return data || [];
}

export async function deleteChatbotCustomisation(
  venueId: string,
  chatbotType: 'tour',
  tourId: string
): Promise<void> {
  const { error } = await supabase
    .from('chatbot_customisations')
    .delete()
    .eq('venue_id', venueId)
    .eq('chatbot_type', chatbotType)
    .eq('tour_id', tourId);

  if (error) throw error;
}
