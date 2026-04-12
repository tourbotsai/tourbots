import { ChatbotTrigger } from '@/lib/types';

export interface TriggerEvaluationContext {
  message: string;
  userMessageCount: number;
}

export function normaliseTriggerKeywords(rawKeywords?: string[] | null): string[] {
  return (rawKeywords || [])
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);
}

export function doesTriggerMatch(trigger: ChatbotTrigger, context: TriggerEvaluationContext): boolean {
  if (!trigger.is_active) {
    return false;
  }

  if (trigger.condition_type === 'message_count') {
    const threshold = Number(trigger.condition_message_count || 0);
    return threshold > 0 && context.userMessageCount >= threshold;
  }

  const message = context.message.toLowerCase();
  const keywords = normaliseTriggerKeywords(trigger.condition_keywords);
  if (keywords.length === 0) {
    return false;
  }

  return keywords.some((keyword) => message.includes(keyword));
}

export function findMatchedTrigger(
  triggers: ChatbotTrigger[],
  context: TriggerEvaluationContext
): ChatbotTrigger | null {
  const orderedTriggers = [...triggers].sort((a, b) => a.display_order - b.display_order);
  for (const trigger of orderedTriggers) {
    if (doesTriggerMatch(trigger, context)) {
      return trigger;
    }
  }

  return null;
}
