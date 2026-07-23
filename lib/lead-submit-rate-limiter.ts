import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

export async function submitLeadWithRateLimit(params: {
  venueId: string;
  ipAddress: string;
  lead: Record<string, unknown>;
}): Promise<{ accepted: boolean; duplicate: boolean; message?: string; leadId?: string }> {
  const { venueId, ipAddress, lead } = params;
  const { data, error } = await supabase.rpc('submit_chatbot_lead', {
    p_venue_id: venueId,
    p_ip_address: ipAddress || 'unknown',
    p_lead: lead,
  });

  if (error) throw new Error(error.message);
  const result = Array.isArray(data) ? data[0] : data;
  return {
    accepted: Boolean(result?.accepted),
    duplicate: Boolean(result?.duplicate),
    message: result?.message || undefined,
    leadId: result?.lead_id || undefined,
  };
}
