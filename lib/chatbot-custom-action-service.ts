import { ChatbotCustomAction } from '@/lib/types';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import {
  dispatchChatbotWebhook,
  WebhookDispatchResult,
} from '@/lib/chatbot-webhook-dispatch';

export async function getActiveCustomActions(
  chatbotConfigId: string
): Promise<ChatbotCustomAction[]> {
  const { data, error } = await supabase
    .from('chatbot_custom_actions')
    .select('*')
    .eq('chatbot_config_id', chatbotConfigId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to load custom actions:', error);
    return [];
  }

  return (data || []) as ChatbotCustomAction[];
}

function appliesWhenFor(action: ChatbotCustomAction): string {
  if (action.condition_type === 'intent') {
    return (action.condition_intent || '').trim() || action.description || action.name;
  }
  if (action.condition_type === 'message_count') {
    return `the visitor has sent at least ${action.condition_message_count || 0} message(s)`;
  }
  const keywords = (action.condition_keywords || []).join(', ');
  return keywords || action.description || action.name;
}

/**
 * Prompt section describing owner-configured custom actions (Zapier/Make/n8n).
 */
export function buildCustomActionInstructions(params: {
  actions: ChatbotCustomAction[];
  userMessageCount: number;
}): string {
  const { actions, userMessageCount } = params;
  if (!actions.length) return '';

  const intentOrKeyword = actions.filter(
    (action) =>
      action.condition_type === 'intent' ||
      (action.condition_type === 'keywords' && (action.condition_keywords?.length || 0) > 0)
  );

  const dueMessageCount = actions.filter(
    (action) =>
      action.condition_type === 'message_count' &&
      Number(action.condition_message_count || 0) > 0 &&
      userMessageCount >= Number(action.condition_message_count)
  );

  if (!intentOrKeyword.length && !dueMessageCount.length) return '';

  const linesFor = (list: ChatbotCustomAction[]) =>
    list
      .map((action) => {
        const modeNote =
          action.mode === 'query'
            ? 'This is a QUERY action: call run_custom_action, wait for the tool result, then answer the visitor using that data in the SAME reply. Do not invent availability or other facts.'
            : 'This is a WRITE action: tell the visitor you have passed their request to the booking/CRM system (do not claim it is fully confirmed), then call run_custom_action.';

        return [
          `- Action "${action.name}" (action_key: "${action.action_key}", mode: ${action.mode}) — applies when: ${appliesWhenFor(action)}.`,
          action.description ? `  Description: ${action.description}` : null,
          `  ${modeNote}`,
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n\n');

  const sections: string[] = [];

  if (intentOrKeyword.length) {
    sections.push(
      `CUSTOM ACTIONS (owner-configured integrations):
Using your judgement about the user's intent, decide whether any of these actions apply. Fire at most one custom action per reply, and only when clearly relevant. Call the run_custom_action tool with the exact action_key listed.

${linesFor(intentOrKeyword)}`
    );
  }

  if (dueMessageCount.length) {
    sections.push(
      `CUSTOM ACTIONS DUE NOW:
The user has sent ${userMessageCount} message(s), so consider calling these write/query actions in THIS reply when appropriate.

${linesFor(dueMessageCount)}`
    );
  }

  return `\n\n${sections.join('\n\n')}\n`;
}

export async function resolveCustomActionWebhook(params: {
  action: ChatbotCustomAction;
}): Promise<{ url: string; signingSecret: string; endpointId: string | null } | null> {
  const url = (params.action.webhook_url || '').trim();
  const signingSecret = (params.action.signing_secret || '').trim();

  if (!url || !signingSecret) {
    return null;
  }

  return {
    url,
    signingSecret,
    endpointId: null,
  };
}

export async function executeCustomAction(params: {
  action: ChatbotCustomAction;
  venueId: string;
  conversationId?: string | null;
  sessionId?: string | null;
  toolArgs: Record<string, unknown>;
  visitorMessage?: string | null;
}): Promise<WebhookDispatchResult & { resolved: boolean }> {
  const target = await resolveCustomActionWebhook({ action: params.action });
  if (!target) {
    return {
      ok: false,
      status: null,
      responseJson: null,
      responseText: null,
      errorMessage:
        'No webhook URL configured on this custom action. Add a Make/Zapier/n8n URL on the action itself.',
      durationMs: 0,
      deliveryId: null,
      resolved: false,
    };
  }

  const event =
    params.action.mode === 'query' ? 'custom_action.query' : 'custom_action.fired';

  const body = {
    event,
    mode: params.action.mode,
    action_key: params.action.action_key,
    action_name: params.action.name,
    venue_id: params.venueId,
    chatbot_config_id: params.action.chatbot_config_id,
    conversation_id: params.conversationId || null,
    session_id: params.sessionId || null,
    tool_args: params.toolArgs,
    visitor: {
      message: params.visitorMessage || null,
    },
    timestamp: new Date().toISOString(),
  };

  const result = await dispatchChatbotWebhook({
    venueId: params.venueId,
    chatbotConfigId: params.action.chatbot_config_id,
    endpointId: target.endpointId,
    customActionId: params.action.id,
    event,
    mode: params.action.mode,
    url: target.url,
    signingSecret: target.signingSecret,
    body,
  });

  return { ...result, resolved: true };
}
