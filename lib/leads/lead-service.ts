import { supabase } from '../supabase';
import { Lead, LeadActivity, LeadAnalytics } from '../types';
import { PostgrestError } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NewLeadNotificationEmail } from '@/components/emails/NewLeadNotificationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface LeadFilters {
  status?: string[];
  chatbot_type?: string[];
  interest_level?: string[];
  date_from?: string;
  date_to?: string;
  search?: string;
  lead_score_min?: number;
  lead_score_max?: number;
}

export interface LeadListResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
}

// Helper function to get venue owner's email
async function getVenueOwnerEmail(venueId: string): Promise<string | null> {
  const { data: venueRow, error: venueError } = await supabase
    .from('venues')
    .select('owner_id, name')
    .eq('id', venueId)
    .single();

  if (venueError || !venueRow || !venueRow.owner_id) {
    console.error('Error fetching venue or owner ID:', venueError);
    return null;
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email')
    .eq('id', venueRow.owner_id)
    .single();

  if (userError || !user) {
    console.error('Error fetching venue owner email:', userError);
    return null;
  }

  return user.email;
}

// Helper function to get venue display name
async function getVenueDisplayName(venueId: string): Promise<string> {
  const { data, error } = await supabase
    .from('venues')
    .select('name')
    .eq('id', venueId)
    .single();
  
  if (error || !data) {
    console.error('Error fetching venue name:', error);
    return 'Your venue';
  }

  return data.name;
}

// Create a new lead
export async function createLead(leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead | null> {
  try {
    console.log('Creating new lead:', leadData);

    const { data: newLead, error } = await supabase
      .from('leads')
      .insert([{
        ...leadData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      throw error;
    }

    console.log('Lead created successfully:', newLead);
    return newLead;
  } catch (error) {
    console.error('Error in createLead:', error);
    throw error;
  }
}

// Send email notification for new lead
export async function sendLeadNotificationEmail(lead: Lead): Promise<void> {
  try {
    const ownerEmail = await getVenueOwnerEmail(lead.venue_id);
    const venueName = await getVenueDisplayName(lead.venue_id);

    if (ownerEmail) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.tourbots.ai';
        const leadUrl = `${baseUrl}/app/dashboard`;
        const settingsUrl = `${baseUrl}/app/dashboard`;

        await resend.emails.send({
          from: 'TourBots AI <leads@tourbots.ai>',
          to: [ownerEmail],
          subject: `New Lead Captured: ${lead.visitor_name || 'New Visitor'}`,
          react: NewLeadNotificationEmail({
            lead,
            venueName,
            leadUrl,
            settingsUrl
          }),
        });
        console.log(`New lead notification sent to ${ownerEmail} with score: ${lead.lead_score}`);
      } catch (emailError) {
        console.error('Failed to send new lead notification email:', emailError);
        // Do not throw - email failure shouldn't block lead process
      }
    }
  } catch (error) {
    console.error('Error in sendLeadNotificationEmail:', error);
    // Do not throw - email failure shouldn't block lead process
  }
}

// Get leads for a venue with filters and pagination
export async function getLeads(
  venueId: string, 
  filters: LeadFilters = {}, 
  page: number = 1, 
  limit: number = 50
): Promise<LeadListResponse> {
  try {
    console.log('Fetching leads for venue:', venueId, 'with filters:', filters);

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.in('lead_status', filters.status);
    }

    if (filters.chatbot_type && filters.chatbot_type.length > 0) {
      query = query.in('chatbot_type', filters.chatbot_type);
    }

    if (filters.interest_level && filters.interest_level.length > 0) {
      query = query.in('interest_level', filters.interest_level);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    if (filters.lead_score_min) {
      query = query.gte('lead_score', filters.lead_score_min);
    }

    if (filters.lead_score_max) {
      query = query.lte('lead_score', filters.lead_score_max);
    }

    // Search in name and email
    if (filters.search) {
      query = query.or(`visitor_name.ilike.%${filters.search}%,visitor_email.ilike.%${filters.search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} leads out of ${count || 0} total`);

    return {
      leads: data || [],
      total: count || 0,
      page,
      limit
    };
  } catch (error) {
    console.error('Error in getLeads:', error);
    throw error;
  }
}

// Get a single lead by ID
export async function getLeadById(leadId: string, venueId: string): Promise<Lead | null> {
  try {
    console.log('Fetching lead:', leadId, 'for venue:', venueId);

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('venue_id', venueId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      console.error('Error fetching lead:', error);
      throw error;
    }

    console.log('Lead fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in getLeadById:', error);
    throw error;
  }
}

// Update a lead
export async function updateLead(leadId: string, venueId: string, updates: Partial<Lead>): Promise<Lead | null> {
  try {
    console.log('Updating lead:', leadId, 'with data:', updates);

    const { data, error } = await supabase
      .from('leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .eq('venue_id', venueId)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      throw error;
    }

    console.log('Lead updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in updateLead:', error);
    throw error;
  }
}

// Delete a lead
export async function deleteLead(leadId: string, venueId: string): Promise<boolean> {
  try {
    console.log('Deleting lead:', leadId, 'for venue:', venueId);

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)
      .eq('venue_id', venueId);

    if (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }

    console.log('Lead deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteLead:', error);
    throw error;
  }
}

// Bulk update lead statuses
export async function bulkUpdateLeadStatus(
  leadIds: string[], 
  venueId: string, 
  status: Lead['lead_status']
): Promise<Lead[]> {
  try {
    console.log('Bulk updating lead status for leads:', leadIds, 'to status:', status);

    const { data, error } = await supabase
      .from('leads')
      .update({
        lead_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('venue_id', venueId)
      .in('id', leadIds)
      .select();

    if (error) {
      console.error('Error bulk updating leads:', error);
      throw error;
    }

    console.log(`Bulk updated ${data?.length || 0} leads`);
    return data || [];
  } catch (error) {
    console.error('Error in bulkUpdateLeadStatus:', error);
    throw error;
  }
}

// Get lead analytics for a venue
export async function getLeadAnalytics(venueId: string): Promise<LeadAnalytics | null> {
  try {
    console.log('Fetching lead analytics for venue:', venueId);

    const { data, error } = await supabase
      .from('lead_analytics')
      .select('*')
      .eq('venue_id', venueId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No leads yet, return zero analytics
        return {
          venue_id: venueId,
          total_leads: 0,
          leads_this_month: 0,
          converted_leads: 0,
          tour_leads: 0,
          avg_lead_score: 0,
          high_interest_leads: 0,
          conversion_rate: 0
        };
      }
      console.error('Error fetching lead analytics:', error);
      throw error;
    }

    console.log('Lead analytics fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in getLeadAnalytics:', error);
    throw error;
  }
}

// Get recent leads for dashboard
export async function getRecentLeads(venueId: string, limit: number = 10): Promise<Lead[]> {
  try {
    console.log('Fetching recent leads for venue:', venueId);

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent leads:', error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} recent leads`);
    return data || [];
  } catch (error) {
    console.error('Error in getRecentLeads:', error);
    throw error;
  }
}

// Get leads by conversation ID (for chatbot integration)
export async function getLeadByConversationId(conversationId: string, venueId: string): Promise<Lead | null> {
  try {
    console.log('Fetching lead by conversation ID:', conversationId);

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('venue_id', venueId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      console.error('Error fetching lead by conversation ID:', error);
      throw error;
    }

    console.log('Lead found for conversation:', data);
    return data;
  } catch (error) {
    console.error('Error in getLeadByConversationId:', error);
    throw error;
  }
}

// Export leads data for CSV/Excel
export async function exportLeads(venueId: string, filters: LeadFilters = {}): Promise<Lead[]> {
  try {
    console.log('Exporting leads for venue:', venueId, 'with filters:', filters);

    let query = supabase
      .from('leads')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false });

    // Apply same filters as getLeads but without pagination
    if (filters.status && filters.status.length > 0) {
      query = query.in('lead_status', filters.status);
    }

    if (filters.chatbot_type && filters.chatbot_type.length > 0) {
      query = query.in('chatbot_type', filters.chatbot_type);
    }

    if (filters.interest_level && filters.interest_level.length > 0) {
      query = query.in('interest_level', filters.interest_level);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    if (filters.lead_score_min) {
      query = query.gte('lead_score', filters.lead_score_min);
    }

    if (filters.lead_score_max) {
      query = query.lte('lead_score', filters.lead_score_max);
    }

    if (filters.search) {
      query = query.or(`visitor_name.ilike.%${filters.search}%,visitor_email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error exporting leads:', error);
      throw error;
    }

    console.log(`Exported ${data?.length || 0} leads`);
    return data || [];
  } catch (error) {
    console.error('Error in exportLeads:', error);
    throw error;
  }
} 