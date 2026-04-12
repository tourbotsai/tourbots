import { supabase } from './supabase';
import { Tour, Venue } from './types';

// Extended venue type with tour information for admin view
export interface VenueWithTour extends Venue {
  tour?: Tour | null;
  tourStatus: 'active' | 'pending';
  lastTourUpdate?: string | null;
}

// Create a new tour
export async function createTour({
  venue_id,
  parent_tour_id = null,
  title,
  description = null,
  matterport_tour_id,
  matterport_url,
  thumbnail_url = null,
}: {
  venue_id: string;
  parent_tour_id?: string | null;
  title: string;
  description?: string | null;
  matterport_tour_id: string;
  matterport_url: string;
  thumbnail_url?: string | null;
}): Promise<Tour | null> {
  const { data, error } = await supabase
    .from('tours')
    .insert([
      {
        venue_id,
        parent_tour_id,
        title,
        description,
        matterport_tour_id,
        matterport_url,
        thumbnail_url,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update an existing tour
export async function updateTour(
  tourId: string,
  updates: Partial<Omit<Tour, 'id' | 'venue_id' | 'created_at' | 'updated_at'>>
): Promise<Tour | null> {
  const { data, error } = await supabase
    .from('tours')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', tourId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete a tour
export async function deleteTour(tourId: string): Promise<void> {
  const { error } = await supabase
    .from('tours')
    .delete()
    .eq('id', tourId);

  if (error) throw error;
}

// Get tour by ID
export async function getTourById(tourId: string): Promise<Tour | null> {
  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .eq('id', tourId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    throw error;
  }
  return data;
}

export async function getTourByVenueId(venueId: string): Promise<Tour | null> {
  return getPrimaryTourByVenueId(venueId);
}

export async function getPrimaryTourByVenueId(venueId: string): Promise<Tour | null> {
  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .or('tour_type.eq.primary,tour_type.is.null') // Handles both new multi-model venues and legacy rows without tour_type
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    throw error;
  }
  return data;
}

// Get ALL tours for a venue (primary + secondary)
export async function getAllToursForVenue(venueId: string): Promise<Tour[]> {
  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Get tour by model ID (for ?model= parameter in embeds)
export async function getTourByModelId(
  venueId: string, 
  modelId: string
): Promise<Tour | null> {
  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .eq('venue_id', venueId)
    .eq('matterport_tour_id', modelId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// Create secondary tour (for additional locations)
export async function createSecondaryTour({
  venue_id,
  parent_tour_id,
  title,
  description = null,
  matterport_tour_id,
  matterport_url,
  navigation_keywords = [],
  display_order = 2,
  thumbnail_url = null,
}: {
  venue_id: string;
  parent_tour_id: string;
  title: string;
  description?: string | null;
  matterport_tour_id: string;
  matterport_url: string;
  navigation_keywords?: string[];
  display_order?: number;
  thumbnail_url?: string | null;
}): Promise<Tour | null> {
  const { data, error } = await supabase
    .from('tours')
    .insert([
      {
        venue_id,
        parent_tour_id,
        title,
        description,
        matterport_tour_id,
        matterport_url,
        thumbnail_url,
        tour_type: 'secondary',
        display_order,
        navigation_keywords,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update secondary tour
export async function updateSecondaryTour(
  tourId: string,
  updates: Partial<Omit<Tour, 'id' | 'venue_id' | 'created_at' | 'updated_at' | 'tour_type'>>
): Promise<Tour | null> {
  const { data, error } = await supabase
    .from('tours')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', tourId)
    .eq('tour_type', 'secondary') // Safety: only update secondary tours
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete secondary tour (with protection against deleting primary)
export async function deleteSecondaryTour(tourId: string, venueId: string): Promise<void> {
  // First check this is actually a secondary tour
  const { data: tour } = await supabase
    .from('tours')
    .select('tour_type')
    .eq('id', tourId)
    .eq('venue_id', venueId)
    .single();

  if (tour?.tour_type === 'primary') {
    throw new Error('Cannot delete primary tour. Edit it instead.');
  }

  const { error } = await supabase
    .from('tours')
    .delete()
    .eq('id', tourId)
    .eq('venue_id', venueId)
    .eq('tour_type', 'secondary');

  if (error) throw error;
}

export async function getAllVenuesWithTours(): Promise<VenueWithTour[]> {
  const { data, error } = await supabase
    .from('venues')
    .select(`
      *,
      tours (*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Transform the data to include tour status
  return data.map((venueRow) => {
    const activeTour = venueRow.tours?.find((tour: Tour) => tour.is_active);
    return {
      ...venueRow,
      tour: activeTour || null,
      tourStatus: activeTour ? 'active' : 'pending',
      lastTourUpdate: activeTour?.updated_at || null,
    };
  });
}

// Get tour statistics for admin dashboard
export async function getTourStats(): Promise<{
  totalVenues: number;
  activeTours: number;
  pendingTours: number;
  totalViews: number;
  recentViews: number;
}> {
  const { count: totalVenues, error: venuesCountError } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (venuesCountError) throw venuesCountError;

  // Get active tours count
  const { count: activeTours, error: activeToursError } = await supabase
    .from('tours')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (activeToursError) throw activeToursError;

  // Get total views from embed_stats (more accurate than tour.view_count)
  const { data: embedStats, error: embedError } = await supabase
    .from('embed_stats')
    .select('views_count')
    .eq('embed_type', 'tour');

  if (embedError) throw embedError;

  const totalViews = embedStats?.reduce((sum, stat) => sum + (stat.views_count || 0), 0) || 0;

  // Get recent views (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentEmbedStats, error: recentError } = await supabase
    .from('embed_stats')
    .select('views_count')
    .eq('embed_type', 'tour')
    .gte('last_viewed_at', sevenDaysAgo.toISOString());

  if (recentError) throw recentError;

  const recentViews = recentEmbedStats?.reduce((sum, stat) => sum + (stat.views_count || 0), 0) || 0;

  return {
    totalVenues: totalVenues || 0,
    activeTours: activeTours || 0,
    pendingTours: (totalVenues || 0) - (activeTours || 0),
    totalViews,
    recentViews,
  };
}

// Get filtered tour statistics for admin dashboard
export async function getFilteredTourStats(venueIds?: string[]): Promise<{
  totalViews: number;
  recentViews: number;
}> {
  let embedQuery = supabase
    .from('embed_stats')
    .select('views_count, venue_id')
    .eq('embed_type', 'tour');

  let recentEmbedQuery = supabase
    .from('embed_stats')
    .select('views_count, venue_id')
    .eq('embed_type', 'tour');

  // Filter by venue IDs if provided
  if (venueIds && venueIds.length > 0) {
    embedQuery = embedQuery.in('venue_id', venueIds);
    recentEmbedQuery = recentEmbedQuery.in('venue_id', venueIds);
  }

  const { data: embedStats, error: embedError } = await embedQuery;
  if (embedError) throw embedError;

  const totalViews = embedStats?.reduce((sum, stat) => sum + (stat.views_count || 0), 0) || 0;

  // Get recent views (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentEmbedStats, error: recentError } = await recentEmbedQuery
    .gte('last_viewed_at', sevenDaysAgo.toISOString());

  if (recentError) throw recentError;

  const recentViews = recentEmbedStats?.reduce((sum, stat) => sum + (stat.views_count || 0), 0) || 0;

  return {
    totalViews,
    recentViews,
  };
}

export async function createPrimaryTour({
  venue_id,
  title,
  description = null,
  matterport_tour_id,
  matterport_url,
  thumbnail_url = null,
}: {
  venue_id: string;
  title: string;
  description?: string | null;
  matterport_tour_id: string;
  matterport_url: string;
  thumbnail_url?: string | null;
}): Promise<Tour | null> {
  return createTour({
    venue_id,
    title,
    description,
    matterport_tour_id,
    matterport_url,
    thumbnail_url,
    parent_tour_id: null,
  });
}

export async function upsertTourForVenue({
  venue_id,
  title,
  description = null,
  matterport_tour_id,
  matterport_url,
  thumbnail_url = null,
}: {
  venue_id: string;
  title: string;
  description?: string | null;
  matterport_tour_id: string;
  matterport_url: string;
  thumbnail_url?: string | null;
}): Promise<Tour | null> {
  const existingTour = await getTourByVenueId(venue_id);

  if (existingTour) {
    // Update existing tour
    return updateTour(existingTour.id, {
      title,
      description,
      matterport_tour_id,
      matterport_url,
      thumbnail_url,
    });
  } else {
    // Create new tour
    return createTour({
      venue_id,
      title,
      description,
      matterport_tour_id,
      matterport_url,
      thumbnail_url,
    });
  }
}

// Increment view count for a tour
export async function incrementTourViews(tourId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_tour_views', {
    tour_id: tourId
  });

  if (error) throw error;
} 

// Add function to sync tours.view_count with embed_stats
export async function syncTourViewCounts(): Promise<void> {
  try {
    console.log('🔄 Syncing tour view counts from embed_stats...');

    // Get view counts from embed_stats grouped by venue_id
    const { data: embedCounts, error: embedError } = await supabase
      .from('embed_stats')
      .select('venue_id')
      .eq('embed_type', 'tour');

    if (embedError) throw embedError;

    const venueViewCounts = embedCounts?.reduce((acc: any, stat) => {
      acc[stat.venue_id] = (acc[stat.venue_id] || 0) + 1;
      return acc;
    }, {}) || {};

    for (const [venueId, viewCount] of Object.entries(venueViewCounts)) {
      const { error } = await supabase
        .from('tours')
        .update({ view_count: viewCount as number })
        .eq('venue_id', venueId);

      if (error) {
        console.error(`Error updating view count for venue ${venueId}:`, error);
      }
    }

    const { error: resetError } = await supabase
      .from('tours')
      .update({ view_count: 0 })
      .not('venue_id', 'in', `(${Object.keys(venueViewCounts).map(id => `'${id}'`).join(',')})`);

    if (resetError) {
      console.error('Error resetting view counts for venues with no views:', resetError);
    }

    console.log('✅ Tour view counts synced successfully');
  } catch (error) {
    console.error('❌ Error syncing tour view counts:', error);
  }
} 