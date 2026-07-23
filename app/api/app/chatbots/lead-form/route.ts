import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import {
  authenticateChatbotRoute,
  logChatbotAudit,
} from '@/lib/chatbot-route-auth';
import {
  ChatbotLeadForm,
  ChatbotLeadFormConditionType,
  ChatbotLeadFormField,
  ChatbotLeadFormFieldOption,
  ChatbotLeadFormFieldType,
} from '@/lib/types';

const DEFAULT_PRIVACY_URL = 'https://tourbots.ai/legal';
const DEFAULT_CONSENT_LABEL = 'By submitting, you agree to our privacy policy.';
const DEFAULT_SUCCESS = "Thanks — we'll be in touch shortly.";

function sanitiseConditionType(input?: string): ChatbotLeadFormConditionType {
  if (input === 'keywords') return 'keywords';
  return 'intent';
}

function sanitiseFieldType(input?: string): ChatbotLeadFormFieldType {
  if (input === 'email' || input === 'phone' || input === 'textarea' || input === 'select') {
    return input;
  }
  return 'text';
}

function sanitiseKeywords(input?: string[] | null): string[] {
  return (input || []).map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function sanitiseOptions(input: unknown): ChatbotLeadFormFieldOption[] | null {
  if (!Array.isArray(input)) return null;
  const options = input
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const value = String((item as ChatbotLeadFormFieldOption).value || '').trim();
      const label = String((item as ChatbotLeadFormFieldOption).label || value).trim();
      if (!value || !label) return null;
      return { value, label };
    })
    .filter(Boolean) as ChatbotLeadFormFieldOption[];
  return options.length > 0 ? options : null;
}

function slugifyFieldKey(label: string, index: number): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
  return base || `custom_${index + 1}`;
}

function defaultFields(): Omit<ChatbotLeadFormField, 'id' | 'lead_form_id'>[] {
  return [
    {
      field_key: 'name',
      label: 'Name',
      field_type: 'text',
      placeholder: 'Your name',
      options: null,
      is_required: true,
      display_order: 0,
    },
    {
      field_key: 'email',
      label: 'Email',
      field_type: 'email',
      placeholder: 'you@example.com',
      options: null,
      is_required: true,
      display_order: 1,
    },
    {
      field_key: 'phone',
      label: 'Phone',
      field_type: 'phone',
      placeholder: 'Optional',
      options: null,
      is_required: false,
      display_order: 2,
    },
  ];
}

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

async function loadFormWithFields(chatbotConfigId: string): Promise<ChatbotLeadForm | null> {
  const { data: form, error } = await supabase
    .from('chatbot_lead_forms')
    .select('*')
    .eq('chatbot_config_id', chatbotConfigId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!form) return null;

  const { data: fields, error: fieldsError } = await supabase
    .from('chatbot_lead_form_fields')
    .select('*')
    .eq('lead_form_id', form.id)
    .order('display_order', { ascending: true });

  if (fieldsError) throw new Error(fieldsError.message);

  return {
    ...(form as ChatbotLeadForm),
    fields: (fields || []) as ChatbotLeadFormField[],
  };
}

export async function GET(request: NextRequest) {
  try {
    const chatbotConfigId = new URL(request.url).searchParams.get('chatbotConfigId');
    if (!chatbotConfigId) {
      return NextResponse.json({ error: 'chatbotConfigId is required' }, { status: 400 });
    }

    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    await resolveConfig(chatbotConfigId, authResult.venueId, authResult.role);
    const form = await loadFormWithFields(chatbotConfigId);

    return NextResponse.json({
      form,
      defaults: {
        privacy_policy_url: DEFAULT_PRIVACY_URL,
        consent_checkbox_label: DEFAULT_CONSENT_LABEL,
        success_message: DEFAULT_SUCCESS,
        fields: defaultFields(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load lead form';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const chatbotConfigId = body?.chatbotConfigId as string | undefined;
    const payload = body?.form as Partial<ChatbotLeadForm> | undefined;
    const incomingFields = (body?.fields || payload?.fields || []) as Partial<ChatbotLeadFormField>[];

    if (!chatbotConfigId) {
      return NextResponse.json({ error: 'chatbotConfigId is required' }, { status: 400 });
    }

    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const config = await resolveConfig(chatbotConfigId, authResult.venueId, authResult.role);
    const conditionType = sanitiseConditionType(payload?.condition_type);
    const conditionKeywords = sanitiseKeywords(payload?.condition_keywords);
    const conditionIntent = (payload?.condition_intent || '').trim();

    if (conditionType === 'keywords' && conditionKeywords.length === 0) {
      return NextResponse.json({ error: 'Keywords are required for keyword-based show mode' }, { status: 400 });
    }
    if (conditionType === 'intent' && !conditionIntent) {
      return NextResponse.json({ error: 'Intent description is required for intent-based show mode' }, { status: 400 });
    }

    const fieldsToSave = (incomingFields.length > 0 ? incomingFields : defaultFields()).map((field, index) => {
      const fieldType = sanitiseFieldType(field.field_type);
      const label = (field.label || `Field ${index + 1}`).trim();
      const reserved = ['name', 'email', 'phone'].includes((field.field_key || '').trim());
      const fieldKey = reserved
        ? (field.field_key as string)
        : (field.field_key || '').trim() || `custom_${slugifyFieldKey(label, index)}`;
      const options = fieldType === 'select' ? sanitiseOptions(field.options) : null;

      return {
        field_key: fieldKey,
        label,
        field_type: fieldType,
        placeholder: (field.placeholder || '').trim() || null,
        options,
        is_required: field.is_required === true,
        display_order: Number.isFinite(field.display_order) ? Number(field.display_order) : index,
      };
    });

    if (fieldsToSave.length === 0) {
      return NextResponse.json({ error: 'At least one field is required' }, { status: 400 });
    }

    const fieldKeys = fieldsToSave.map((field) => field.field_key);
    if (new Set(fieldKeys).size !== fieldKeys.length) {
      return NextResponse.json({ error: 'Field keys must be unique' }, { status: 400 });
    }

    for (const field of fieldsToSave) {
      if (!field.label) {
        return NextResponse.json({ error: 'Each field requires a label' }, { status: 400 });
      }
      if (field.field_type === 'select' && (!field.options || field.options.length < 2)) {
        return NextResponse.json(
          { error: `Select field "${field.label}" needs at least two options` },
          { status: 400 }
        );
      }
    }

    const formRow = {
      chatbot_config_id: chatbotConfigId,
      venue_id: config.venue_id,
      tour_id: config.tour_id || null,
      is_enabled: payload?.is_enabled === true,
      intro_message: (payload?.intro_message || '').trim() || null,
      submit_label: (payload?.submit_label || 'Send').trim() || 'Send',
      success_message: (payload?.success_message || DEFAULT_SUCCESS).trim() || DEFAULT_SUCCESS,
      privacy_policy_url: (payload?.privacy_policy_url || '').trim() || null,
      consent_checkbox_label:
        (payload?.consent_checkbox_label || DEFAULT_CONSENT_LABEL).trim() || DEFAULT_CONSENT_LABEL,
      condition_type: conditionType,
      condition_keywords: conditionType === 'keywords' ? conditionKeywords : [],
      condition_intent: conditionType === 'intent' ? conditionIntent : null,
      email_notifications_enabled: payload?.email_notifications_enabled === true,
      notification_email: (payload?.notification_email || '').trim() || null,
      once_per_conversation: payload?.once_per_conversation !== false,
      updated_at: new Date().toISOString(),
    };

    const { error: replaceError } = await supabase.rpc('replace_chatbot_lead_form', {
      p_chatbot_config_id: chatbotConfigId,
      p_venue_id: config.venue_id,
      p_form: formRow,
      p_fields: fieldsToSave,
    });
    if (replaceError) throw new Error(replaceError.message);

    logChatbotAudit('chatbot_lead_form_updated', authResult, {
      chatbot_config_id: chatbotConfigId,
      field_count: fieldsToSave.length,
    });

    const form = await loadFormWithFields(chatbotConfigId);
    return NextResponse.json({ form });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save lead form';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
