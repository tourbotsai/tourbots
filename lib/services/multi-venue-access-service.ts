import { supabase } from '@/lib/supabase';

export interface AccessibleVenue {
  venue_id: string;
  venue_name: string;
  venue_slug: string;
  venue_address: string | null;
  venue_city: string | null;
  venue_email: string | null;
  venue_logo_url: string | null;
  venue_in_setup: boolean;
  subscription_status: string | null;
  subscription_plan: string | null;
  user_role: string;
  tour_count: number;
  lead_count: number;
  leads_this_month: number;
  access_granted_at: string;
}

export async function getUserAccessibleVenues(userId: string): Promise<AccessibleVenue[]> {
  try {
    const { data: accessEntries, error: accessError } = await supabase
      .from('user_venue_access')
      .select('venue_id, role, created_at')
      .eq('user_id', userId);

    if (accessError) throw accessError;
    if (!accessEntries || accessEntries.length === 0) return [];

    const venueIds = accessEntries.map(entry => entry.venue_id);

    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select(`
        id,
        name,
        slug,
        address,
        city,
        email,
        logo_url,
        in_setup,
        subscription_status,
        subscription_plan
      `)
      .in('id', venueIds)
      .eq('is_active', true);

    if (venuesError) throw venuesError;
    if (!venues) return [];

    const { data: tourCounts } = await supabase
      .from('tours')
      .select('venue_id')
      .in('venue_id', venueIds);

    const { data: leadCounts } = await supabase
      .from('leads')
      .select('venue_id, created_at')
      .in('venue_id', venueIds);

    const result: AccessibleVenue[] = venues.map(venue => {
      const accessEntry = accessEntries.find(e => e.venue_id === venue.id)!;
      const tours = tourCounts?.filter(t => t.venue_id === venue.id) || [];
      const leads = leadCounts?.filter(l => l.venue_id === venue.id) || [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentLeads = leads.filter(l => new Date(l.created_at) >= thirtyDaysAgo);

      return {
        venue_id: venue.id,
        venue_name: venue.name,
        venue_slug: venue.slug,
        venue_address: venue.address,
        venue_city: venue.city,
        venue_email: venue.email,
        venue_logo_url: venue.logo_url,
        venue_in_setup: venue.in_setup,
        subscription_status: venue.subscription_status,
        subscription_plan: venue.subscription_plan,
        user_role: accessEntry.role,
        tour_count: tours.length,
        lead_count: leads.length,
        leads_this_month: recentLeads.length,
        access_granted_at: accessEntry.created_at,
      };
    });

    return result.sort((a, b) => a.venue_name.localeCompare(b.venue_name));
  } catch (error: any) {
    console.error('Error fetching accessible venues:', error);
    throw new Error(`Failed to fetch accessible venues: ${error.message}`);
  }
}

export async function switchUserActiveVenue(
  userId: string,
  newVenueId: string
): Promise<boolean> {
  try {
    const { data: access, error: accessError } = await supabase
      .from('user_venue_access')
      .select('id')
      .eq('user_id', userId)
      .eq('venue_id', newVenueId)
      .single();

    if (accessError || !access) {
      throw new Error('User does not have access to this venue');
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ venue_id: newVenueId, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) throw updateError;

    return true;
  } catch (error: any) {
    console.error('Error switching venue:', error);
    throw new Error(`Failed to switch venue: ${error.message}`);
  }
}

export async function addVenueAccessToUser(
  userId: string,
  venueId: string,
  role: 'owner' | 'admin' | 'manager' | 'viewer' = 'admin',
  createdBy: string
): Promise<void> {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, venue_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name')
      .eq('id', venueId)
      .single();

    if (venueError || !venue) {
      throw new Error('Venue not found');
    }

    const { error: insertError } = await supabase
      .from('user_venue_access')
      .insert({
        user_id: userId,
        venue_id: venueId,
        role,
        created_by: createdBy,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error('User already has access to this venue');
      }
      throw insertError;
    }

    if (!user.venue_id) {
      await supabase
        .from('users')
        .update({ venue_id: venueId })
        .eq('id', userId);
    }
  } catch (error: any) {
    console.error('Error adding venue access:', error);
    throw new Error(`Failed to add venue access: ${error.message}`);
  }
}

export async function lookupUserByEmail(email: string): Promise<{
  exists: boolean;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    venue_count: number;
    venues: Array<{
      venue_id: string;
      venue_name: string;
      role: string;
    }>;
  };
}> {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    if (!user) {
      return { exists: false };
    }

    const { data: venueAccess } = await supabase
      .from('user_venue_access')
      .select(`
        venue_id,
        role,
        venues!fk_user_venue_access_venue (
          name
        )
      `)
      .eq('user_id', user.id);

    const venues = venueAccess?.map(access => ({
      venue_id: access.venue_id,
      venue_name: (access.venues as any)?.name || 'Unknown',
      role: access.role,
    })) || [];

    return {
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        venue_count: venues.length,
        venues,
      },
    };
  } catch (error: any) {
    console.error('Error looking up user:', error);
    throw new Error(`Failed to lookup user: ${error.message}`);
  }
}

export async function getVenueAccessUsers(venueId: string): Promise<Array<{
  user_id: string;
  user_name: string;
  user_email: string;
  role: string;
  is_primary: boolean;
  access_granted_at: string;
}>> {
  try {
    const { data: accessEntries, error } = await supabase
      .from('user_venue_access')
      .select(`
        user_id,
        role,
        created_at,
        users!fk_user_venue_access_user (
          id,
          first_name,
          last_name,
          email,
          venue_id
        )
      `)
      .eq('venue_id', venueId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!accessEntries) return [];

    return accessEntries.map(entry => {
      const user = entry.users as any;
      return {
        user_id: entry.user_id,
        user_name: `${user.first_name} ${user.last_name}`.trim(),
        user_email: user.email,
        role: entry.role,
        is_primary: user.venue_id === venueId,
        access_granted_at: entry.created_at,
      };
    });
  } catch (error: any) {
    console.error('Error fetching venue access users:', error);
    throw new Error(`Failed to fetch venue users: ${error.message}`);
  }
}
