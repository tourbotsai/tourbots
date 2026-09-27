import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import {
  SiteGuide,
  SiteGuideHandoffMode,
  SiteGuidePage,
  SiteGuidePoint,
  normaliseHandoffMode,
} from '@/lib/site-guide';

function asVector(value: unknown, keys: Array<'x' | 'y' | 'z'>): { x: number; y: number; z: number } | { x: number; y: number } | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const coords: Record<string, number> = {};
  for (const key of keys) {
    const number = Number(record[key]);
    if (!Number.isFinite(number)) return null;
    coords[key] = number;
  }
  return coords as { x: number; y: number; z: number };
}

/**
 * Load a website bot's site guide. Returns null when it is missing, disabled,
 * empty, or the tables are unavailable, so chat keeps today's behaviour.
 */
export async function loadWebsiteSiteGuide(
  venueId: string,
  chatbotConfigId: string,
): Promise<SiteGuide | null> {
  try {
    const { data: guide, error: guideError } = await supabase
      .from('website_site_guides')
      .select('site_origin, enabled')
      .eq('chatbot_config_id', chatbotConfigId)
      .eq('venue_id', venueId)
      .maybeSingle();

    if (guideError || !guide || !guide.enabled) return null;

    const { data: pages, error: pagesError } = await supabase
      .from('website_site_pages')
      .select('id, title, path, description, sort_order, tour_id, tour_iframe_selector, handoff_mode')
      .eq('chatbot_config_id', chatbotConfigId)
      .eq('venue_id', venueId)
      .order('sort_order', { ascending: true });

    if (pagesError || !pages || pages.length === 0) return null;

    const pageIds = pages.map((page) => page.id);
    const tourIds = Array.from(new Set(pages.map((page) => page.tour_id).filter(Boolean))) as string[];

    const [{ data: sections }, { data: tours }, { data: points }] = await Promise.all([
      supabase
        .from('website_site_sections')
        .select('id, page_id, title, anchor, description, sort_order')
        .in('page_id', pageIds)
        .order('sort_order', { ascending: true }),
      tourIds.length
        ? supabase.from('tours').select('id, title').in('id', tourIds).eq('venue_id', venueId)
        : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
      tourIds.length
        ? supabase
            .from('tour_points')
            .select('id, tour_id, name, sweep_id, position, rotation')
            .in('tour_id', tourIds)
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    ]);

    const tourTitle = new Map((tours || []).map((tour) => [tour.id, tour.title]));
    const pointsByTour = new Map<string, SiteGuidePoint[]>();
    for (const point of points || []) {
      const tourId = String(point.tour_id);
      const list = pointsByTour.get(tourId) || [];
      list.push({
        id: String(point.id),
        name: String(point.name),
        sweepId: String(point.sweep_id),
        position: asVector(point.position, ['x', 'y', 'z']) as SiteGuidePoint['position'],
        rotation: asVector(point.rotation, ['x', 'y']) as SiteGuidePoint['rotation'],
      });
      pointsByTour.set(tourId, list);
    }

    const mappedPages: SiteGuidePage[] = pages.map((page) => ({
      id: page.id,
      title: page.title,
      path: page.path,
      description: page.description,
      sortOrder: page.sort_order,
      tourId: page.tour_id,
      tourTitle: page.tour_id ? tourTitle.get(page.tour_id) || null : null,
      tourIframeSelector: page.tour_iframe_selector,
      handoffMode: normaliseHandoffMode(page.handoff_mode) as SiteGuideHandoffMode,
      sections: (sections || [])
        .filter((section) => section.page_id === page.id)
        .map((section) => ({
          id: section.id,
          title: section.title,
          anchor: section.anchor,
          description: section.description,
          sortOrder: section.sort_order,
        })),
      points: page.tour_id ? pointsByTour.get(page.tour_id) || [] : [],
    }));

    return {
      enabled: true,
      siteOrigin: guide.site_origin,
      pages: mappedPages,
    };
  } catch (error) {
    console.error('Site guide load failed:', error);
    return null;
  }
}
