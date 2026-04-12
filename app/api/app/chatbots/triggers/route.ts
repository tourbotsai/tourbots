import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { ChatbotTrigger, ChatbotTriggerActionType, ChatbotTriggerConditionType } from '@/lib/types';
import {
  authenticateChatbotRoute,
  logChatbotAudit,
} from '@/lib/chatbot-route-auth';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';

type IncomingTrigger = Partial<ChatbotTrigger>;

function sanitiseKeywords(input?: string[] | null): string[] {
  return (input || []).map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function sanitiseConditionType(input?: string): ChatbotTriggerConditionType {
  return input === 'message_count' ? 'message_count' : 'keywords';
}

function sanitiseActionType(input?: string): ChatbotTriggerActionType {
  if (input === 'open_url' || input === 'navigate_tour_point' || input === 'switch_tour_model') {
    return input;
  }
  return 'ai_message';
}

async function resolveConfig(chatbotConfigId: string, venueId: string) {
  const { data, error } = await supabase
    .from('chatbot_configs')
    .select('id, venue_id, tour_id')
    .eq('id', chatbotConfigId)
    .eq('venue_id', venueId)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Chatbot configuration not found');
  }

  return data;
}

async function getTriggers(chatbotConfigId: string) {
  const { data, error } = await supabase
    .from('chatbot_triggers')
    .select('*')
    .eq('chatbot_config_id', chatbotConfigId)
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

function getScopedTourModels(
  tours: Array<{
    id: string;
    title: string;
    matterport_tour_id: string;
    parent_tour_id: string | null;
    tour_type: string | null;
  }>,
  scopedTourId: string
) {
  const primaryCount = tours.filter((tour) => tour.tour_type === 'primary' || !tour.tour_type).length;
  const shouldFallbackLegacySecondary = primaryCount <= 1;

  return tours
    .filter((tour) => {
      if (tour.id === scopedTourId) return true;
      if (tour.tour_type !== 'secondary') return false;
      if (tour.parent_tour_id) return tour.parent_tour_id === scopedTourId;
      return shouldFallbackLegacySecondary;
    })
    .map((tour) => ({
      id: tour.id,
      name: tour.title,
      matterport_tour_id: tour.matterport_tour_id,
    }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatbotConfigId = searchParams.get('chatbotConfigId');

    if (!chatbotConfigId) {
      return NextResponse.json({ error: 'chatbotConfigId is required' }, { status: 400 });
    }

    const authResult = await authenticateChatbotRoute(request);
    let config: { id: string; venue_id: string; tour_id: string } | null = null;

    if (authResult instanceof NextResponse) {
      const portalSession = await requireAgencyPortalSession(request, {
        requiredModule: 'settings',
      });
      if (portalSession instanceof NextResponse) return portalSession;

      const { data: portalScopedConfig, error: portalScopedConfigError } = await supabase
        .from('chatbot_configs')
        .select('id, venue_id, tour_id')
        .eq('id', chatbotConfigId)
        .eq('venue_id', portalSession.venueId)
        .eq('tour_id', portalSession.tourId)
        .maybeSingle();
      if (portalScopedConfigError || !portalScopedConfig) {
        return NextResponse.json({ error: 'Chatbot configuration not found' }, { status: 404 });
      }
      config = portalScopedConfig;
    } else {
      config = await resolveConfig(chatbotConfigId, authResult.venueId);
    }

    const [triggersResult, pointsResult, toursResult] = await Promise.all([
      getTriggers(chatbotConfigId),
      supabase
        .from('tour_points')
        .select('id, name')
        .eq('tour_id', config.tour_id)
        .order('created_at', { ascending: true }),
      supabase
        .from('tours')
        .select('id, title, matterport_tour_id, parent_tour_id, tour_type')
        .eq('venue_id', config.venue_id)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ]);

    const { data: points, error: pointsError } = pointsResult;
    const { data: tours, error: toursError } = toursResult;
    if (pointsError) {
      return NextResponse.json({ error: pointsError.message }, { status: 500 });
    }
    if (toursError) {
      return NextResponse.json({ error: toursError.message }, { status: 500 });
    }

    const tourModels = getScopedTourModels(tours || [], config.tour_id);

    return NextResponse.json({
      triggers: triggersResult,
      tourPoints: points || [],
      tourModels,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch chatbot triggers' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { chatbotConfigId, triggers } = (await request.json()) as {
      chatbotConfigId?: string;
      triggers?: IncomingTrigger[];
    };

    if (!chatbotConfigId) {
      return NextResponse.json({ error: 'chatbotConfigId is required' }, { status: 400 });
    }

    const authResult = await authenticateChatbotRoute(request);
    let config: { id: string; venue_id: string; tour_id: string } | null = null;

    if (authResult instanceof NextResponse) {
      const portalSession = await requireAgencyPortalSession(request, {
        requiredModule: 'settings',
        requireCsrf: true,
      });
      if (portalSession instanceof NextResponse) return portalSession;

      const { data: portalScopedConfig, error: portalScopedConfigError } = await supabase
        .from('chatbot_configs')
        .select('id, venue_id, tour_id')
        .eq('id', chatbotConfigId)
        .eq('venue_id', portalSession.venueId)
        .eq('tour_id', portalSession.tourId)
        .maybeSingle();
      if (portalScopedConfigError || !portalScopedConfig) {
        return NextResponse.json({ error: 'Chatbot configuration not found' }, { status: 404 });
      }
      config = portalScopedConfig;
    } else {
      config = await resolveConfig(chatbotConfigId, authResult.venueId);
    }
    const safeTriggers = (triggers || []).map((trigger, index) => {
      const conditionType = sanitiseConditionType(trigger.condition_type);
      const actionType = sanitiseActionType(trigger.action_type);
      const conditionKeywords = sanitiseKeywords(trigger.condition_keywords);
      const conditionMessageCount = Number(trigger.condition_message_count || 0);

      return {
        chatbot_config_id: chatbotConfigId,
        venue_id: config.venue_id,
        tour_id: config.tour_id,
        name: (trigger.name || `Trigger ${index + 1}`).trim(),
        display_order: Number.isFinite(trigger.display_order) ? Number(trigger.display_order) : index,
        is_active: trigger.is_active !== false,
        condition_type: conditionType,
        condition_keywords: conditionType === 'keywords' ? conditionKeywords : [],
        condition_message_count: conditionType === 'message_count' && conditionMessageCount > 0 ? conditionMessageCount : null,
        action_type: actionType,
        action_message: (trigger.action_message || '').trim(),
        action_url: actionType === 'open_url' ? (trigger.action_url || '').trim() || null : null,
        action_tour_point_id: actionType === 'navigate_tour_point' ? trigger.action_tour_point_id || null : null,
        action_tour_model_id: actionType === 'switch_tour_model' ? trigger.action_tour_model_id || null : null,
      };
    });

    for (const trigger of safeTriggers) {
      if (!trigger.name || !trigger.action_message) {
        return NextResponse.json(
          { error: 'Each trigger requires a name and action message' },
          { status: 400 }
        );
      }

      if (trigger.condition_type === 'keywords' && trigger.condition_keywords.length === 0) {
        return NextResponse.json(
          { error: 'Keyword-based triggers require at least one keyword' },
          { status: 400 }
        );
      }

      if (trigger.condition_type === 'message_count' && !trigger.condition_message_count) {
        return NextResponse.json(
          { error: 'Message-count triggers require a message count' },
          { status: 400 }
        );
      }

      if (trigger.action_type === 'switch_tour_model' && !trigger.action_tour_model_id) {
        return NextResponse.json(
          { error: 'Model-switch triggers require a selected model' },
          { status: 400 }
        );
      }
    }

    const modelIds = Array.from(
      new Set(
        safeTriggers
          .filter((trigger) => trigger.action_type === 'switch_tour_model' && trigger.action_tour_model_id)
          .map((trigger) => trigger.action_tour_model_id as string)
      )
    );

    if (modelIds.length > 0) {
      const { data: matchedModels, error: matchedModelsError } = await supabase
        .from('tours')
        .select('id')
        .eq('venue_id', config.venue_id)
        .eq('is_active', true)
        .in('id', modelIds);

      if (matchedModelsError) {
        return NextResponse.json({ error: matchedModelsError.message }, { status: 500 });
      }

      const matchedModelIds = new Set((matchedModels || []).map((model) => model.id));
      const hasInvalidModelId = modelIds.some((id) => !matchedModelIds.has(id));
      if (hasInvalidModelId) {
        return NextResponse.json(
          { error: 'One or more selected models are invalid for this venue' },
          { status: 400 }
        );
      }
    }

    const { error: deleteError } = await supabase
      .from('chatbot_triggers')
      .delete()
      .eq('chatbot_config_id', chatbotConfigId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (safeTriggers.length > 0) {
      const { error: insertError } = await supabase
        .from('chatbot_triggers')
        .insert(safeTriggers);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    const saved = await getTriggers(chatbotConfigId);
    if (!(authResult instanceof NextResponse)) {
      logChatbotAudit('chatbot_triggers_updated', authResult, { chatbot_config_id: chatbotConfigId, trigger_count: saved.length });
    }
    return NextResponse.json({ triggers: saved });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to save chatbot triggers' },
      { status: 500 }
    );
  }
}
