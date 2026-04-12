import { AgencyPortalShell } from '../[shareSlug]/agency-portal-shell';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

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
    showHeader?: string;
    tour?: string;
    settings?: string;
    customisation?: string;
    analytics?: string;
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
  const showHeader = toBool(searchParams.showHeader, true);

  async function getPreviewData() {
    if (!tourId) {
      return {
        settings: null,
        informationSections: [],
        triggers: [],
        customisation: null,
        analyticsStats: null,
        analyticsSessions: [],
        sessionMessages: [],
      };
    }

    const configResult = await supabase
      .from('chatbot_configs')
      .select('id, chatbot_name, welcome_message, instruction_prompt, personality_prompt, guardrail_prompt, guardrails_enabled, is_active')
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
        analyticsSessions: [],
        sessionMessages: [],
      };
    }

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

    const [{ data: fields }, { data: triggersByConfig }, customisationResult, conversationsResult] = await Promise.all([
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
      supabase
        .from('conversations')
        .select('id, conversation_id, session_id, message_type, message, response, created_at')
        .eq('tour_id', tourId)
        .eq('chatbot_type', 'tour')
        .order('created_at', { ascending: false })
        .limit(2000),
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

    const conversationRows = conversationsResult?.data || [];
    const uniqueConversations = new Set(conversationRows.map((row) => row.conversation_id).filter(Boolean));
    const uniqueSessions = new Set(conversationRows.map((row) => row.session_id).filter(Boolean));
    const totalMessages = conversationRows.filter((row) => row.message_type === 'visitor').length;

    const sessionsMap = new Map<
      string,
      { sessionId: string; conversationId: string | null; lastMessageAt: string | null; messageCount: number }
    >();
    for (const row of conversationRows) {
      if (!row.session_id) continue;
      const existing = sessionsMap.get(row.session_id);
      if (!existing) {
        sessionsMap.set(row.session_id, {
          sessionId: row.session_id,
          conversationId: row.conversation_id || null,
          lastMessageAt: row.created_at || null,
          messageCount: 1,
        });
      } else {
        existing.messageCount += 1;
        if (!existing.lastMessageAt || (row.created_at && row.created_at > existing.lastMessageAt)) {
          existing.lastMessageAt = row.created_at;
        }
      }
    }

    const analyticsSessions = Array.from(sessionsMap.values())
      .sort((a, b) => (b.lastMessageAt || '').localeCompare(a.lastMessageAt || ''))
      .slice(0, 30);
    const firstSessionId = analyticsSessions[0]?.sessionId;
    const sessionMessages = firstSessionId
      ? conversationRows
          .filter((row) => row.session_id === firstSessionId)
          .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
      : [];

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
      analyticsStats: {
        totalMessages,
        totalConversations: uniqueConversations.size,
        totalSessions: uniqueSessions.size,
      },
      analyticsSessions,
      sessionMessages,
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
      modules={{
        tour: toBool(searchParams.tour, true),
        settings: toBool(searchParams.settings, true),
        customisation: toBool(searchParams.customisation, true),
        analytics: toBool(searchParams.analytics, true),
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
      previewAnalyticsSessions={data.analyticsSessions}
      previewSessionMessages={data.sessionMessages}
    />
  );
}

