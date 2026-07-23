import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import {
  authenticateChatbotRoute,
  ensureIntegrationAdmin,
  logChatbotAudit,
} from '@/lib/chatbot-route-auth';
import { assertSafeWebhookUrl } from '@/lib/chatbot-webhook-ssrf';
import {
  ChatbotCustomAction,
  ChatbotCustomActionConditionType,
  ChatbotCustomActionMode,
} from '@/lib/types';

const actionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  action_key: z
    .string()
    .regex(/^[a-z][a-z0-9_]{1,63}$/, 'action_key must be lowercase snake_case'),
  mode: z.enum(['write', 'query']),
  is_active: z.boolean(),
  description: z.string().max(1000).optional().nullable(),
  webhook_url: z.string().url(),
  condition_type: z.enum(['keywords', 'intent', 'message_count']),
  condition_keywords: z.array(z.string()).optional().nullable(),
  condition_intent: z.string().max(500).optional().nullable(),
  condition_message_count: z.number().int().min(1).max(100).optional().nullable(),
  display_order: z.number().int().min(0).optional(),
  rotate_secret: z.boolean().optional(),
});

const putSchema = z.object({
  chatbotConfigId: z.string().uuid(),
  actions: z.array(actionSchema).max(20),
});

async function resolveConfig(chatbotConfigId: string, venueId: string, role?: string) {
  let query = supabase
    .from('chatbot_configs')
    .select('id, venue_id, tour_id')
    .eq('id', chatbotConfigId);

  if (role !== 'platform_admin') {
    query = query.eq('venue_id', venueId);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) {
    throw new Error('Chatbot configuration not found');
  }
  return data as { id: string; venue_id: string; tour_id: string | null };
}

function sanitiseKeywords(input?: string[] | null): string[] {
  return (input || []).map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function sanitiseMode(input: string): ChatbotCustomActionMode {
  return input === 'query' ? 'query' : 'write';
}

function sanitiseConditionType(input: string): ChatbotCustomActionConditionType {
  if (input === 'keywords' || input === 'message_count') return input;
  return 'intent';
}

async function loadActions(chatbotConfigId: string): Promise<ChatbotCustomAction[]> {
  const { data, error } = await supabase
    .from('chatbot_custom_actions')
    .select('*')
    .eq('chatbot_config_id', chatbotConfigId)
    .order('display_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as ChatbotCustomAction[];
}

function serialiseActions(
  actions: ChatbotCustomAction[],
  rotatedKeys = new Set<string>()
): ChatbotCustomAction[] {
  return actions.map((action) => ({
    ...action,
    can_rotate_secret: Boolean(action.signing_secret),
    signing_secret: rotatedKeys.has(action.action_key) ? action.signing_secret : undefined,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const chatbotConfigId = new URL(request.url).searchParams.get('chatbotConfigId');
    if (!chatbotConfigId) {
      return NextResponse.json({ error: 'chatbotConfigId is required' }, { status: 400 });
    }

    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;
    const authorisationError = ensureIntegrationAdmin(authResult);
    if (authorisationError) return authorisationError;

    await resolveConfig(chatbotConfigId, authResult.venueId, authResult.role);
    const actions = await loadActions(chatbotConfigId);

    return NextResponse.json({ actions: serialiseActions(actions) });
  } catch (error: unknown) {
    console.error('GET custom actions error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load custom actions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;
    const authorisationError = ensureIntegrationAdmin(authResult);
    if (authorisationError) return authorisationError;

    const body = await request.json();
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Invalid input: ${parsed.error.errors.map((e) => e.message).join(', ')}` },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const config = await resolveConfig(data.chatbotConfigId, authResult.venueId, authResult.role);
    const existingActionKeys = new Set(
      (await loadActions(config.id)).map((action) => action.action_key)
    );

    const keys = data.actions.map((action) => action.action_key);
    if (new Set(keys).size !== keys.length) {
      return NextResponse.json({ error: 'action_key values must be unique' }, { status: 400 });
    }

    for (const action of data.actions) {
      await assertSafeWebhookUrl(action.webhook_url.trim());
    }

    const actionPayload = data.actions.map((action, index) => {
      const key = action.action_key.trim();

      return {
        name: action.name.trim(),
        action_key: key,
        mode: sanitiseMode(action.mode),
        is_active: action.is_active,
        description: (action.description || '').trim() || null,
        webhook_url: action.webhook_url.trim(),
        condition_type: sanitiseConditionType(action.condition_type),
        condition_keywords:
          action.condition_type === 'keywords' ? sanitiseKeywords(action.condition_keywords) : [],
        condition_intent:
          action.condition_type === 'intent'
            ? (action.condition_intent || '').trim() || null
            : null,
        condition_message_count:
          action.condition_type === 'message_count'
            ? action.condition_message_count || 1
            : null,
        display_order: action.display_order ?? index,
        rotate_secret: action.rotate_secret === true,
      };
    });

    const { data: savedActions, error: replaceError } = await supabase.rpc(
      'replace_chatbot_custom_actions',
      {
        p_chatbot_config_id: config.id,
        p_venue_id: config.venue_id,
        p_tour_id: config.tour_id,
        p_actions: actionPayload,
      }
    );
    if (replaceError) throw new Error(replaceError.message);
    const actions = (savedActions || []) as ChatbotCustomAction[];

    logChatbotAudit('custom_actions_updated', authResult, {
      chatbot_config_id: config.id,
      count: actions.length,
    });

    return NextResponse.json({
      actions: serialiseActions(
        actions,
        new Set(
          data.actions
            .filter((action) => action.rotate_secret || !existingActionKeys.has(action.action_key))
            .map((action) => action.action_key)
        )
      ),
    });
  } catch (error: unknown) {
    console.error('PUT custom actions error:', error);
    const message = error instanceof Error ? error.message : 'Failed to save custom actions';
    const status = message.includes('Webhook') || message.includes('private') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
