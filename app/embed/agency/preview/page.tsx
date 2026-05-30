import { AgencyPortalShell } from '../[shareSlug]/agency-portal-shell';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import {
  getScopedTourAnalyticsStats,
  getScopedTourAnalyticsTrend,
  getScopedTourConversations,
  getScopedTourEmbedStats,
} from '@/lib/agency-portal-module-service';

export const dynamic = 'force-dynamic';

function toBool(value: string | undefined, fallback = true): boolean {
  if (value === undefined) return fallback;
  return value === 'true';
}

export default async function AgencyEmbedDraftPreviewPage({
  searchParams,
}: {
  searchParams: {
    shareSlug?: string;
    tourId?: string;
    agencyName?: string;
    agencyLogoUrl?: string;
    tourTitle?: string;
    primaryColour?: string;
    secondaryColour?: string;
    backgroundColour?: string;
    showHeader?: string;
    tour?: string;
    settings?: string;
    customisation?: string;
    analytics?: string;
    tourSetup?: string;
    tourMenu?: string;
    settingsConfig?: string;
    settingsInformation?: string;
    settingsDocuments?: string;
    settingsTriggers?: string;
  };
}) {
  const shareSlug = searchParams.shareSlug || 'draft-share';
  const tourId = searchParams.tourId || null;
  const agencyName = searchParams.agencyName || 'Agency Portal';
  const agencyLogoUrl = searchParams.agencyLogoUrl || null;
  const tourTitle = searchParams.tourTitle || 'Tour';
  const primaryColour = searchParams.primaryColour || '#1E40AF';
  const secondaryColour = searchParams.secondaryColour || '#0F172A';
  const backgroundColour = searchParams.backgroundColour || null;
  const showHeader = toBool(searchParams.showHeader, true);

  async function getPreviewData() {
    if (!tourId) {
      return {
        settings: null,
        informationSections: [],
        triggers: [],
        customisation: null,
        analyticsStats: null,
        analyticsTrend: [],
        analyticsEmbedStats: [],
        analyticsConversations: [],
      };
    }

    const configResult = await supabase
      .from('chatbot_configs')
      .select('id, venue_id, chatbot_name, welcome_message, instruction_prompt, personality_prompt, guardrail_prompt, guardrails_enabled, is_active')
      .eq('tour_id', tourId)
      .eq('chatbot_type', 'tour')
      .order('created_at', { ascending: false })
      .limit(1);
    const config = (configResult?.data && configResult.data[0]) || null;

    if (!config?.id) {
      const { data: triggersByTourOnly } = await supabase
        .from('chatbot_triggers')
        .select('*')
        .eq('tour_id', tourId)
        .order('display_order', { ascending: true });
      return {
        settings: null,
        informationSections: [],
        triggers: triggersByTourOnly || [],
        customisation: null,
        analyticsStats: null,
        analyticsTrend: [],
        analyticsEmbedStats: [],
        analyticsConversations: [],
      };
    }

    const venueId: string | null = config.venue_id || null;

    const { data: sections } = await supabase
      .from('chatbot_info_sections')
      .select('*')
      .eq('chatbot_config_id', config.id)
      .order('display_order', { ascending: true });

    const sectionIds = (sections || []).map((section) => section.id);
    const fieldsPromise =
      sectionIds.length > 0
        ? supabase
            .from('chatbot_info_fields')
            .select('*')
            .in('section_id', sectionIds)
            .order('display_order', { ascending: true })
        : Promise.resolve({ data: [] as any[] });

    const [
      { data: fields },
      { data: triggersByConfig },
      customisationResult,
      analyticsStats,
      analyticsTrend,
      analyticsEmbedStats,
      analyticsConversations,
    ] = await Promise.all([
      fieldsPromise,
      supabase
        .from('chatbot_triggers')
        .select('*')
        .eq('chatbot_config_id', config.id)
        .order('display_order', { ascending: true }),
      supabase
        .from('chatbot_customisations')
        .select('*')
        .eq('tour_id', tourId)
        .eq('chatbot_type', 'tour')
        .order('created_at', { ascending: false })
        .limit(1),
      venueId
        ? getScopedTourAnalyticsStats(venueId, tourId)
        : Promise.resolve(null),
      venueId
        ? getScopedTourAnalyticsTrend(venueId, tourId, 90)
        : Promise.resolve([]),
      venueId
        ? getScopedTourEmbedStats(venueId, tourId)
        : Promise.resolve([]),
      venueId
        ? getScopedTourConversations(venueId, tourId)
        : Promise.resolve([]),
    ]);

    let triggers = triggersByConfig || [];
    if (triggers.length === 0) {
      const { data: triggersByTour } = await supabase
        .from('chatbot_triggers')
        .select('*')
        .eq('tour_id', tourId)
        .order('display_order', { ascending: true });
      triggers = triggersByTour || [];
    }

    const informationSections = (sections || []).map((section) => ({
      ...section,
      fields: (fields || []).filter((field) => field.section_id === section.id),
    }));

    return {
      settings: config
        ? {
            id: config.id,
            chatbot_name: config.chatbot_name || '',
            welcome_message: config.welcome_message,
            instruction_prompt: config.instruction_prompt,
            personality_prompt: config.personality_prompt,
            guardrail_prompt: config.guardrail_prompt,
            guardrails_enabled: Boolean(config.guardrails_enabled),
            is_active: Boolean(config.is_active),
          }
        : null,
      informationSections,
      triggers,
      customisation: (customisationResult?.data && customisationResult.data[0]) || null,
      analyticsStats,
      analyticsTrend,
      analyticsEmbedStats,
      analyticsConversations,
    };
  }

  const data = await getPreviewData();

  return (
    <AgencyPortalShell
      shareSlug={shareSlug}
      tourId={tourId}
      shareActive={true}
      agencyName={agencyName}
      agencyLogoUrl={agencyLogoUrl}
      tourTitle={tourTitle}
      showHeader={showHeader}
      primaryColour={primaryColour}
      secondaryColour={secondaryColour}
      backgroundColour={backgroundColour}
      modules={{
        tour: toBool(searchParams.tour, true),
        settings: toBool(searchParams.settings, true),
        customisation: toBool(searchParams.customisation, true),
        analytics: toBool(searchParams.analytics, true),
      }}
      tourBlocks={{
        setup: toBool(searchParams.tourSetup, true),
        menu: toBool(searchParams.tourMenu, true),
      }}
      settingsBlocks={{
        config: toBool(searchParams.settingsConfig, true),
        information: toBool(searchParams.settingsInformation, true),
        documents: toBool(searchParams.settingsDocuments, true),
        triggers: toBool(searchParams.settingsTriggers, true),
      }}
      previewOnly={true}
      previewSettings={data.settings}
      previewInformationSections={data.informationSections}
      previewTriggers={data.triggers}
      previewCustomisation={data.customisation}
      previewAnalyticsStats={data.analyticsStats}
      previewAnalyticsTrend={data.analyticsTrend}
      previewAnalyticsEmbedStats={data.analyticsEmbedStats}
      previewAnalyticsConversations={data.analyticsConversations}
    />
  );
}

