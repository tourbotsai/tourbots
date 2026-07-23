import { ChatbotLeadForm, ChatbotLeadFormField } from '@/lib/types';

const DEFAULT_PRIVACY_URL = 'https://tourbots.ai/legal';

export function resolveLeadFormPrivacyUrl(form: Pick<ChatbotLeadForm, 'privacy_policy_url'>): string {
  return (form.privacy_policy_url || '').trim() || DEFAULT_PRIVACY_URL;
}

export function buildLeadFormInstructions(params: {
  form: ChatbotLeadForm;
  fields: ChatbotLeadFormField[];
}): string {
  const { form, fields } = params;
  if (!form.is_enabled || fields.length === 0) return '';

  let appliesWhen: string;
  if (form.condition_type === 'keywords') {
    const keywords = (form.condition_keywords || []).join(', ');
    appliesWhen = keywords
      ? `the user's intent matches: ${keywords}`
      : 'the visitor wants to leave contact details';
  } else {
    appliesWhen =
      (form.condition_intent || '').trim() ||
      'the visitor wants to leave contact details, enquire, book, or get a callback';
  }

  return `

LEAD FORM (owner-configured):
You may call the show_lead_form tool when ${appliesWhen}.
Do NOT show the form on every message. Fire at most once per conversation unless the visitor explicitly asks again.
When you show the form: give ONE short conversational line, then call show_lead_form. Do not invent a markdown form — the UI will render it.
`;
}

export function serialiseLeadFormFieldsForClient(fields: ChatbotLeadFormField[]) {
  return fields
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((field) => ({
      field_key: field.field_key,
      label: field.label,
      field_type: field.field_type,
      placeholder: field.placeholder || null,
      options: field.field_type === 'select' ? field.options || [] : null,
      is_required: field.is_required,
    }));
}
