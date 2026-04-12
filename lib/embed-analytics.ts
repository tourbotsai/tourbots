import { supabaseServiceRole as supabase } from './supabase-service-role';

// Cache for recent tracking to prevent spam
const recentTrackingMap = new Map<string, number>();
const TRACKING_COOLDOWN = 30000; // 30 seconds

// Helper functions
function isInternalDashboardPage(pageUrl: string): boolean {
  return pageUrl.includes('/app/tours') ||
    pageUrl.includes('/app/chatbots') ||
    pageUrl.includes('/app/settings') ||
    pageUrl.includes('/app/dashboard');
}

function isInternalEmbedId(embedId: string): boolean {
  const internalPrefixes = [
    'demo-widget-',
    'tour-widget-',
    'playground-widget-',
    'preview-widget-',
    'config-'
  ];
  return internalPrefixes.some(prefix => embedId.startsWith(prefix));
}

function isEmbedPage(pageUrl: string): boolean {
  return pageUrl.includes('/embed/');
}

function cleanupRecentTracking(): void {
  const now = Date.now();
  const cutoff = now - TRACKING_COOLDOWN;
  const entries = Array.from(recentTrackingMap.entries());
  for (const [key, timestamp] of entries) {
    if (timestamp < cutoff) {
      recentTrackingMap.delete(key);
    }
  }
}

function normaliseEmbedType(raw: string): 'tour' | 'chatbot' {
  if (raw === 'tour' || raw === 'chatbot') return raw;
  return 'tour';
}

export async function trackEmbedView(
  embedId: string, 
  venueId: string, 
  type: string,
  domain?: string,
  pageUrl?: string,
  chatbotType?: 'tour',
  userAgent?: string,
  tourId?: string
) {
  try {
    // 1. Block internal dashboard page tracking
    if (pageUrl && isInternalDashboardPage(pageUrl)) {
      return;
    }

    // 2. Block demo/config/playground embed IDs
    if (isInternalEmbedId(embedId)) {
      return;
    }

    // 3. Allow ALL other tracking (external domains + your own embed pages)

    // 4. Prevent duplicate tracking (30-second cooldown)
    const embedTypeForKey = normaliseEmbedType(type);
    const trackingKey = `${embedId}-${venueId}-${embedTypeForKey}`;
    const lastTracked = recentTrackingMap.get(trackingKey);
    const now = Date.now();
    
    if (lastTracked && (now - lastTracked) < TRACKING_COOLDOWN) {
      return;
    }

    // Update tracking timestamp
    recentTrackingMap.set(trackingKey, now);

    // Clean up old entries periodically
    if (Math.random() < 0.1) { // 10% chance
      cleanupRecentTracking();
    }

    const embedType = embedTypeForKey;
    const resolvedChatbotType = chatbotType ?? null;

    // Record the legitimate embed view
    const { error } = await supabase
      .from('embed_stats')
      .insert([{
        embed_id: embedId,
        venue_id: venueId,
        embed_type: embedType,
        domain: domain || null,
        page_url: pageUrl || null,
        chatbot_type: resolvedChatbotType,
        tour_id: tourId || null,
        user_agent: userAgent || null,
        views_count: 1,
      }]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('❌ Error tracking embed view:', error);
  }
}

function isPlainNumberRecord(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every(
    (v) => typeof v === 'number' && Number.isFinite(v)
  );
}

export async function trackEmbedTourMove(params: {
  embedId: string;
  venueId: string;
  tourId?: string | null;
  sweepId: string;
  position: Record<string, number>;
  rotation: Record<string, number>;
  domain?: string | null;
  pageUrl?: string | null;
  userAgent?: string | null;
  matterportModelId?: string | null;
}) {
  try {
    const {
      embedId,
      venueId,
      tourId,
      sweepId,
      position,
      rotation,
      domain,
      pageUrl,
      userAgent,
      matterportModelId,
    } = params;

    if (pageUrl && isInternalDashboardPage(pageUrl)) {
      return;
    }

    if (isInternalEmbedId(embedId)) {
      return;
    }

    if (!sweepId || typeof sweepId !== 'string' || sweepId.length > 256) {
      return;
    }

    if (!isPlainNumberRecord(position) || !isPlainNumberRecord(rotation)) {
      return;
    }

    const { error } = await supabase.from('embed_tour_moves').insert({
      embed_id: embedId,
      venue_id: venueId,
      tour_id: tourId || null,
      sweep_id: sweepId,
      position,
      rotation,
      domain: domain || null,
      page_url: pageUrl || null,
      user_agent: userAgent || null,
      matterport_model_id: matterportModelId || null,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error tracking embed tour move:', error);
  }
}

export async function getEmbedAnalytics(venueId: string, tourId?: string | null) {
  try {
    const withTourScope = <T extends { eq: Function }>(query: T): T => {
      if (tourId) {
        return query.eq('tour_id', tourId) as T;
      }
      return query;
    };

    // Get total count first
    const { count: totalCount, error: countError } = await withTourScope(supabase
      .from('embed_stats')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId));

    if (countError) throw countError;

    // Get counts by type using separate efficient queries (tour product only)
    const [tourViewsResult, tourChatResult] = await Promise.all([
      withTourScope(supabase
        .from('embed_stats')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId)
        .eq('embed_type', 'tour')),
      withTourScope(supabase
        .from('embed_stats')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId)
        .eq('embed_type', 'chatbot')
        .eq('chatbot_type', 'tour')),
    ]);

    // Get unique domains count
    const { data: domainData, error: domainError } = await withTourScope(supabase
      .from('embed_stats')
      .select('domain')
      .eq('venue_id', venueId)
      .not('domain', 'is', null));

    if (domainError) throw domainError;

    const uniqueDomains = Array.from(new Set(domainData?.map(d => d.domain).filter(Boolean))).length;

    // For detailed data (when actually needed), fetch a reasonable sample
    const { data: sampleData, error: sampleError } = await withTourScope(supabase
      .from('embed_stats')
      .select('*')
      .eq('venue_id', venueId)
        .order('created_at', { ascending: false })
      .limit(500)); // Get recent 500 records for detailed analysis

    if (sampleError) throw sampleError;

    const tourViews = tourViewsResult.count || 0;
    const tourChatViews = tourChatResult.count || 0;
    const totalViews = totalCount || 0;

    console.log(`📊 Embed analytics (COUNT-BASED) - Total: ${totalViews}, Tour views: ${tourViews}, Tour chat: ${tourChatViews}, Unique domains: ${uniqueDomains}`);

    return {
      data: sampleData || [],
      summary: {
        totalViews,
        tourViews,
        tourChatViews,
        totalChatViews: tourChatViews,
        uniqueDomains
      }
    };
  } catch (error) {
    console.error('❌ Error fetching embed analytics (count-based):', error);
    return { 
      data: [], 
      summary: { 
        totalViews: 0, 
        tourViews: 0, 
        tourChatViews: 0, 
        totalChatViews: 0, 
        uniqueDomains: 0 
      } 
    };
  }
}

export async function getTourEmbedAnalytics(venueId: string, tourId?: string | null) {
  return getEmbedAnalytics(venueId, tourId);
} 