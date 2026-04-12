import { supabase } from '../supabase';
import { LeadActivity } from '../types';

// Create a new lead activity
export async function createLeadActivity(
  leadId: string,
  activityType: LeadActivity['activity_type'],
  description?: string,
  performedBy?: string,
  metadata?: any
): Promise<LeadActivity | null> {
  try {
    console.log('Creating lead activity:', { leadId, activityType, description });

    const { data, error } = await supabase
      .from('lead_activities')
      .insert([{
        lead_id: leadId,
        activity_type: activityType,
        description: description || null,
        performed_by: performedBy || null,
        metadata: metadata || null,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating lead activity:', error);
      throw error;
    }

    console.log('Lead activity created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createLeadActivity:', error);
    throw error;
  }
}

// Get all activities for a lead
export async function getLeadActivities(leadId: string): Promise<LeadActivity[]> {
  try {
    console.log('Fetching activities for lead:', leadId);

    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lead activities:', error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} activities for lead:`, leadId);
    return data || [];
  } catch (error) {
    console.error('Error in getLeadActivities:', error);
    throw error;
  }
}

// Get activities for multiple leads (for dashboard)
export async function getMultipleLeadActivities(leadIds: string[]): Promise<LeadActivity[]> {
  try {
    console.log('Fetching activities for multiple leads:', leadIds);

    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .in('lead_id', leadIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching multiple lead activities:', error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} activities for ${leadIds.length} leads`);
    return data || [];
  } catch (error) {
    console.error('Error in getMultipleLeadActivities:', error);
    throw error;
  }
}

// Get recent activities for a venue (for dashboard)
export async function getRecentLeadActivities(venueId: string, limit: number = 20): Promise<LeadActivity[]> {
  try {
    console.log('Fetching recent lead activities for venue:', venueId);

    // First get all lead IDs for this venue
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id')
      .eq('venue_id', venueId);

    if (leadsError) {
      console.error('Error fetching leads for venue:', leadsError);
      throw leadsError;
    }

    if (!leads || leads.length === 0) {
      console.log('No leads found for venue:', venueId);
      return [];
    }

    const leadIds = leads.map(lead => lead.id);

    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .in('lead_id', leadIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent lead activities:', error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} recent activities for venue:`, venueId);
    return data || [];
  } catch (error) {
    console.error('Error in getRecentLeadActivities:', error);
    throw error;
  }
}

// Log email sent activity
export async function logEmailSent(
  leadId: string,
  emailSubject: string,
  performedBy: string,
  metadata?: any
): Promise<LeadActivity | null> {
  try {
    return await createLeadActivity(
      leadId,
      'email_sent',
      `Email sent: ${emailSubject}`,
      performedBy,
      { emailSubject, ...metadata }
    );
  } catch (error) {
    console.error('Error in logEmailSent:', error);
    throw error;
  }
}

// Log call made activity
export async function logCallMade(
  leadId: string,
  callDuration?: number,
  callOutcome?: string,
  performedBy?: string,
  metadata?: any
): Promise<LeadActivity | null> {
  try {
    const description = callDuration 
      ? `Call made (${callDuration}min)${callOutcome ? ` - ${callOutcome}` : ''}`
      : 'Call made';

    return await createLeadActivity(
      leadId,
      'call_made',
      description,
      performedBy,
      { callDuration, callOutcome, ...metadata }
    );
  } catch (error) {
    console.error('Error in logCallMade:', error);
    throw error;
  }
}

// Log note added activity
export async function logNoteAdded(
  leadId: string,
  noteContent: string,
  performedBy: string,
  metadata?: any
): Promise<LeadActivity | null> {
  try {
    return await createLeadActivity(
      leadId,
      'note_added',
      'Note added',
      performedBy,
      { noteContent, ...metadata }
    );
  } catch (error) {
    console.error('Error in logNoteAdded:', error);
    throw error;
  }
}

// Log status change activity
export async function logStatusChange(
  leadId: string,
  fromStatus: string,
  toStatus: string,
  performedBy?: string,
  metadata?: any
): Promise<LeadActivity | null> {
  try {
    return await createLeadActivity(
      leadId,
      'status_changed',
      `Status changed from ${fromStatus} to ${toStatus}`,
      performedBy,
      { fromStatus, toStatus, ...metadata }
    );
  } catch (error) {
    console.error('Error in logStatusChange:', error);
    throw error;
  }
}

// Log lead creation activity (called automatically by database trigger)
export async function logLeadCreated(
  leadId: string,
  chatbotType: string,
  metadata?: any
): Promise<LeadActivity | null> {
  try {
    return await createLeadActivity(
      leadId,
      'lead_created',
      `New lead captured from ${chatbotType} chatbot`,
      undefined,
      { chatbotType, ...metadata }
    );
  } catch (error) {
    console.error('Error in logLeadCreated:', error);
    throw error;
  }
}

// Get activity statistics for a venue
export async function getActivityStatistics(venueId: string, days: number = 30): Promise<{
  totalActivities: number;
  activitiesByType: Record<string, number>;
  activitiesPerDay: Array<{ date: string; count: number }>;
}> {
  try {
    console.log('Fetching activity statistics for venue:', venueId, 'for last', days, 'days');

    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // First get all lead IDs for this venue
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id')
      .eq('venue_id', venueId);

    if (leadsError) {
      console.error('Error fetching leads for venue:', leadsError);
      throw leadsError;
    }

    if (!leads || leads.length === 0) {
      return {
        totalActivities: 0,
        activitiesByType: {},
        activitiesPerDay: []
      };
    }

    const leadIds = leads.map(lead => lead.id);

    // Get activities in date range
    const { data: activities, error } = await supabase
      .from('lead_activities')
      .select('activity_type, created_at')
      .in('lead_id', leadIds)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching activity statistics:', error);
      throw error;
    }

    // Process statistics
    const totalActivities = activities?.length || 0;
    
    const activitiesByType: Record<string, number> = {};
    const activitiesPerDay: Record<string, number> = {};

    activities?.forEach(activity => {
      // Count by type
      activitiesByType[activity.activity_type] = (activitiesByType[activity.activity_type] || 0) + 1;
      
      // Count by day
      const date = new Date(activity.created_at).toISOString().split('T')[0];
      activitiesPerDay[date] = (activitiesPerDay[date] || 0) + 1;
    });

    // Convert activities per day to array format
    const activitiesPerDayArray = Object.entries(activitiesPerDay).map(([date, count]) => ({
      date,
      count
    }));

    console.log('Activity statistics calculated:', {
      totalActivities,
      activitiesByType,
      activitiesPerDayCount: activitiesPerDayArray.length
    });

    return {
      totalActivities,
      activitiesByType,
      activitiesPerDay: activitiesPerDayArray
    };
  } catch (error) {
    console.error('Error in getActivityStatistics:', error);
    throw error;
  }
}

// Delete activities for a lead (when lead is deleted)
export async function deleteLeadActivities(leadId: string): Promise<boolean> {
  try {
    console.log('Deleting activities for lead:', leadId);

    const { error } = await supabase
      .from('lead_activities')
      .delete()
      .eq('lead_id', leadId);

    if (error) {
      console.error('Error deleting lead activities:', error);
      throw error;
    }

    console.log('Lead activities deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteLeadActivities:', error);
    throw error;
  }
} 