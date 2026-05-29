import { ChatbotTrigger } from '@/lib/types';

export function normaliseTriggerKeywords(rawKeywords?: string[] | null): string[] {
  return (rawKeywords || [])
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);
}

export interface ResolvedTrigger {
  trigger: ChatbotTrigger;
  /**
   * Plain-language description of the action the AI must take after replying
   * (e.g. "call open_url ..."), or null when the trigger only needs a reply.
   */
  actionInstruction: string | null;
}

function responseInstructionFor(trigger: ChatbotTrigger): string {
  const message = (trigger.action_message || '').trim();
  if (!message) {
    return 'Respond helpfully to the user.';
  }
  if (trigger.response_mode === 'exact') {
    return `Reply with EXACTLY this wording, verbatim and unchanged: "${message}"`;
  }
  const guidance = (trigger.response_guidance || '').trim();
  const base = `Work this information into your reply naturally, in your own words: "${message}"`;
  return guidance ? `${base} Guidance on how to use it: ${guidance}` : base;
}

/**
 * Build the AI-driven trigger section of the system prompt.
 *
 * Rather than matching triggers server-side with regex, we describe the
 * owner-configured triggers to the model and let it decide, from the user's
 * intent, whether any apply. Message-count triggers are evaluated server-side
 * (the caller passes only those due now) but still delivered by the model so
 * they read naturally and can combine with tool actions.
 */
function appliesWhenFor(trigger: ChatbotTrigger): string {
  if (trigger.condition_type === 'intent') {
    const intent = (trigger.condition_intent || '').trim();
    return intent || 'the topic described in its response';
  }
  const keywords = normaliseTriggerKeywords(trigger.condition_keywords).join(', ');
  return keywords || 'the topic described in its response';
}

export function buildTriggerInstructions(params: {
  intentTriggers: ResolvedTrigger[];
  dueMessageCountTriggers: ResolvedTrigger[];
  userMessageCount: number;
}): string {
  const { intentTriggers, dueMessageCountTriggers, userMessageCount } = params;

  if (intentTriggers.length === 0 && dueMessageCountTriggers.length === 0) {
    return '';
  }

  const sections: string[] = [];

  if (intentTriggers.length > 0) {
    const lines = intentTriggers.map(({ trigger, actionInstruction }) => {
      const parts = [
        `- Trigger "${trigger.name}" — applies when the user's intent matches: ${appliesWhenFor(trigger)}.`,
        `  Response: ${responseInstructionFor(trigger)}`,
        `  Action: ${actionInstruction || 'No extra action — just deliver the response above.'}`,
      ];
      return parts.join('\n');
    });

    sections.push(
      `CONFIGURED TRIGGERS (owner-defined):
Using your own judgement about the user's intent, decide whether any of these triggers apply to the user's latest message. The "applies when" text (keywords or an intent description) is a hint about meaning, NOT literal text to match — only fire a trigger when the user genuinely means it (for example, do not fire a "personal training" trigger just because an unrelated word happens to contain those letters). Fire at most one of these triggers per reply, and only when it is clearly relevant. When a trigger applies, deliver its response as instructed and perform its action by calling the matching tool.

${lines.join('\n\n')}`
    );
  }

  if (dueMessageCountTriggers.length > 0) {
    const lines = dueMessageCountTriggers.map(({ trigger, actionInstruction }) => {
      const parts = [
        `- Trigger "${trigger.name}": ${responseInstructionFor(trigger)}`,
        `  Action: ${actionInstruction || 'No extra action — just deliver the response above.'}`,
      ];
      return parts.join('\n');
    });

    sections.push(
      `TRIGGERS DUE NOW:
The user has now sent ${userMessageCount} message(s), so the following must be delivered in THIS reply regardless of what the user asked. Weave it in naturally alongside any answer to their message.

${lines.join('\n\n')}`
    );
  }

  return `\n\n${sections.join('\n\n')}\n`;
}
