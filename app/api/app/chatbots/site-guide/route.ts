import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import {
  authenticateChatbotRoute,
  getScopedChatbotConfig,
  logChatbotAudit,
} from '@/lib/chatbot-route-auth';
import {
  SITE_GUIDE_MAX_PAGES,
  SITE_GUIDE_MAX_SECTIONS,
  normaliseAnchor,
  normaliseCataloguePath,
  normaliseHandoffMode,
  normaliseIframeSelector,
  normaliseSiteOrigin,
} from '@/lib/site-guide';

export const dynamic = 'force-dynamic';

async function loadGuide(venueId: string, chatbotConfigId: string) {
  const [{ data: guide }, { data: pages }, { data: sections }, { data: tours }] = await Promise.all([
    supabase
      .from('website_site_guides')
      .select('site_origin, enabled')
      .eq('chatbot_config_id', chatbotConfigId)
      .eq('venue_id', venueId)
      .maybeSingle(),
    supabase
      .from('website_site_pages')
      .select('id, title, path, description, sort_order, tour_id, tour_iframe_selector, handoff_mode')
      .eq('chatbot_config_id', chatbotConfigId)
      .eq('venue_id', venueId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('website_site_sections')
      .select('id, page_id, title, anchor, description, sort_order')
      .eq('chatbot_config_id', chatbotConfigId)
      .eq('venue_id', venueId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('tours')
      .select('id, title')
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .order('title', { ascending: true }),
  ]);

  return {
    siteOrigin: guide?.site_origin || '',
    enabled: guide?.enabled ?? false,
    pages: (pages || []).map((page) => ({
      id: page.id,
      title: page.title,
      path: page.path,
      description: page.description || '',
      tourId: page.tour_id || '',
      tourIframeSelector: page.tour_iframe_selector || '',
      handoffMode: page.handoff_mode,
      sections: (sections || [])
        .filter((section) => section.page_id === page.id)
        .map((section) => ({
          id: section.id,
          title: section.title,
          anchor: section.anchor,
          description: section.description || '',
        })),
    })),
    tours: (tours || []).map((tour) => ({ id: tour.id, title: tour.title })),
  };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateChatbotRoute(request);
  if (auth instanceof NextResponse) return auth;

  const chatbotConfigId = request.nextUrl.searchParams.get('chatbotConfigId') || '';
  if (!chatbotConfigId) {
    return NextResponse.json({ error: 'Chatbot configuration is required' }, { status: 400 });
  }

  const config = await getScopedChatbotConfig(chatbotConfigId, auth.venueId, auth.role);
  if (!config || config.chatbot_type !== 'website') {
    return NextResponse.json({ error: 'Website chatbot not found' }, { status: 404 });
  }

  const payload = await loadGuide(config.venue_id, config.id);
  return NextResponse.json(payload);
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateChatbotRoute(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const chatbotConfigId = typeof body?.chatbotConfigId === 'string' ? body.chatbotConfigId : '';
  if (!chatbotConfigId) {
    return NextResponse.json({ error: 'Chatbot configuration is required' }, { status: 400 });
  }

  const config = await getScopedChatbotConfig(chatbotConfigId, auth.venueId, auth.role);
  if (!config || config.chatbot_type !== 'website') {
    return NextResponse.json({ error: 'Website chatbot not found' }, { status: 404 });
  }

  const siteOrigin = normaliseSiteOrigin(body?.siteOrigin);
  if (!siteOrigin) {
    return NextResponse.json({ error: 'Enter the site origin, for example https://www.example.com' }, { status: 400 });
  }

  const rawPages = Array.isArray(body?.pages) ? body.pages : [];
  if (rawPages.length > SITE_GUIDE_MAX_PAGES) {
    return NextResponse.json({ error: `A site guide can list at most ${SITE_GUIDE_MAX_PAGES} pages` }, { status: 400 });
  }

  const pages = [];
  for (const raw of rawPages) {
    const path = normaliseCataloguePath(raw?.path, siteOrigin);
    const title = typeof raw?.title === 'string' ? raw.title.trim() : '';
    if (!title || title.length > 120) {
      return NextResponse.json({ error: 'Each page needs a title of up to 120 characters' }, { status: 400 });
    }
    if (!path) {
      return NextResponse.json({ error: `“${title}” needs a path on ${siteOrigin}` }, { status: 400 });
    }
    const sectionsIn = Array.isArray(raw?.sections) ? raw.sections : [];
    if (sectionsIn.length > SITE_GUIDE_MAX_SECTIONS) {
      return NextResponse.json({ error: `“${title}” can list at most ${SITE_GUIDE_MAX_SECTIONS} sections` }, { status: 400 });
    }
    const sections = [];
    for (const section of sectionsIn) {
      const sectionTitle = typeof section?.title === 'string' ? section.title.trim() : '';
      const anchor = normaliseAnchor(section?.anchor);
      if (!sectionTitle || !anchor) {
        return NextResponse.json({ error: `Each section on “${title}” needs a title and a valid anchor` }, { status: 400 });
      }
      sections.push({
        title: sectionTitle,
        anchor,
        description: typeof section?.description === 'string' ? section.description.trim().slice(0, 400) : '',
      });
    }
    const selector = normaliseIframeSelector(raw?.tourIframeSelector);
    if (raw?.tourIframeSelector && String(raw.tourIframeSelector).trim() && !selector) {
      return NextResponse.json({ error: `The tour frame selector on “${title}” is not valid` }, { status: 400 });
    }
    pages.push({
      title,
      path,
      description: typeof raw?.description === 'string' ? raw.description.trim().slice(0, 400) : '',
      tour_id: typeof raw?.tourId === 'string' ? raw.tourId : '',
      tour_iframe_selector: selector || '',
      handoff_mode: normaliseHandoffMode(raw?.handoffMode),
      sections,
    });
  }

  const { error } = await supabase.rpc('replace_website_site_guide', {
    p_chatbot_config_id: config.id,
    p_venue_id: config.venue_id,
    p_site_origin: siteOrigin,
    p_enabled: Boolean(body?.enabled),
    p_pages: pages,
  });

  if (error) {
    console.error('replace_website_site_guide failed:', error);
    return NextResponse.json({ error: error.message || 'Could not save the site guide' }, { status: 400 });
  }

  logChatbotAudit('site_guide_replace', auth, {
    chatbot_config_id: config.id,
    page_count: pages.length,
    enabled: Boolean(body?.enabled),
  });

  const payload = await loadGuide(config.venue_id, config.id);
  return NextResponse.json(payload);
}
