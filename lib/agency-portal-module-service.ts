import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { getChatbotCustomisation, upsertChatbotCustomisation } from '@/lib/server/chatbot-customisation-db';
import {
  DEFAULT_GENERAL_INFORMATION_FIELDS,
  DEFAULT_GENERAL_INFORMATION_SECTION_KEY,
  DEFAULT_GENERAL_INFORMATION_SECTION_TITLE,
} from '@/lib/chatbot-training-defaults';

export async function getScopedTourChatbotConfig(venueId: string, tourId: string) {
  const { data, error } = await supabase
    .from('chatbot_configs')
    .select(`
      id,
      venue_id,
      tour_id,
      chatbot_type,
      chatbot_name,
      welcome_message,
      instruction_prompt,
      personality_prompt,
      guardrail_prompt,
      guardrails_enabled,
      is_active,
      updated_at
    `)
    .eq('venue_id', venueId)
    .eq('tour_id', tourId)
    .eq('chatbot_type', 'tour')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getScopedTourChatbotConfigId(venueId: string, tourId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('chatbot_configs')
    .select('id')
    .eq('venue_id', venueId)
    .eq('tour_id', tourId)
    .eq('chatbot_type', 'tour')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id || null;
}

type FieldType = 'text' | 'textarea' | 'url' | 'phone' | 'email';

function normaliseKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

async function getSectionsWithFields(chatbotConfigId: string) {
  const { data: sections, error: sectionsError } = await supabase
    .from('chatbot_info_sections')
    .select('*')
    .eq('chatbot_config_id', chatbotConfigId)
    .order('display_order', { ascending: true });

  if (sectionsError) throw sectionsError;
  if (!sections || sections.length === 0) return [];

  const sectionIds = sections.map((section) => section.id);
  const { data: fields, error: fieldsError } = await supabase
    .from('chatbot_info_fields')
    .select('*')
    .in('section_id', sectionIds)
    .order('display_order', { ascending: true });

  if (fieldsError) throw fieldsError;

  return sections.map((section) => ({
    ...section,
    fields: (fields || []).filter((field) => field.section_id === section.id),
  }));
}

async function ensureDefaultGeneralSection(chatbotConfigId: string) {
  const existing = await getSectionsWithFields(chatbotConfigId);
  if (existing.length > 0) return existing;

  const { data: insertedSection, error: sectionError } = await supabase
    .from('chatbot_info_sections')
    .insert([
      {
        chatbot_config_id: chatbotConfigId,
        section_key: DEFAULT_GENERAL_INFORMATION_SECTION_KEY,
        section_title: DEFAULT_GENERAL_INFORMATION_SECTION_TITLE,
        display_order: 0,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (sectionError || !insertedSection) {
    throw sectionError || new Error('Failed to create default general information section.');
  }

  const { error: fieldsInsertError } = await supabase.from('chatbot_info_fields').insert(
    DEFAULT_GENERAL_INFORMATION_FIELDS.map((field) => ({
      section_id: insertedSection.id,
      field_key: field.field_key,
      field_label: field.field_label,
      field_type: field.field_type,
      field_value: '',
      display_order: field.display_order,
      is_required: false,
    }))
  );

  if (fieldsInsertError) throw fieldsInsertError;

  return getSectionsWithFields(chatbotConfigId);
}

export async function updateScopedTourChatbotConfig(
  venueId: string,
  tourId: string,
  updates: {
    chatbot_name?: string;
    welcome_message?: string;
    instruction_prompt?: string;
    personality_prompt?: string;
    guardrail_prompt?: string;
    guardrails_enabled?: boolean;
    is_active?: boolean;
  }
) {
  const { data, error } = await supabase
    .from('chatbot_configs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('venue_id', venueId)
    .eq('tour_id', tourId)
    .eq('chatbot_type', 'tour')
    .select(`
      id,
      venue_id,
      tour_id,
      chatbot_type,
      chatbot_name,
      welcome_message,
      instruction_prompt,
      personality_prompt,
      guardrail_prompt,
      guardrails_enabled,
      is_active,
      updated_at
    `)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getScopedTourCustomisation(venueId: string, tourId: string) {
  return getChatbotCustomisation(venueId, 'tour', tourId);
}

export async function updateScopedTourCustomisation(
  venueId: string,
  tourId: string,
  customisation: Record<string, unknown>
) {
  const blockedKeys = new Set([
    'id',
    'venue_id',
    'tour_id',
    'chatbot_type',
    'created_at',
    'updated_at',
  ]);

  const safeCustomisation = Object.entries(customisation).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (!blockedKeys.has(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});

  return upsertChatbotCustomisation(venueId, 'tour', tourId, safeCustomisation);
}

export async function getScopedTourAnalyticsStats(venueId: string, tourId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('conversation_id, session_id, message_type')
    .eq('venue_id', venueId)
    .eq('tour_id', tourId)
    .eq('chatbot_type', 'tour');

  if (error) {
    throw error;
  }

  const rows = data || [];
  const uniqueConversations = new Set(rows.map((row) => row.conversation_id).filter(Boolean));
  const uniqueSessions = new Set(rows.map((row) => row.session_id).filter(Boolean));
  const totalMessages = rows.filter((row) => row.message_type === 'visitor').length;

  return {
    totalMessages,
    totalConversations: uniqueConversations.size,
    totalSessions: uniqueSessions.size,
  };
}

export async function getScopedTourAnalyticsSessions(venueId: string, tourId: string, limit = 50) {
  const { data, error } = await supabase
    .from('conversations')
    .select('session_id, conversation_id, created_at, message_type')
    .eq('venue_id', venueId)
    .eq('tour_id', tourId)
    .eq('chatbot_type', 'tour')
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) {
    throw error;
  }

  const map = new Map<
    string,
    { sessionId: string; conversationId: string | null; lastMessageAt: string | null; messageCount: number }
  >();

  for (const row of data || []) {
    if (!row.session_id) continue;
    const existing = map.get(row.session_id);
    if (!existing) {
      map.set(row.session_id, {
        sessionId: row.session_id,
        conversationId: row.conversation_id || null,
        lastMessageAt: row.created_at || null,
        messageCount: 1,
      });
      continue;
    }

    existing.messageCount += 1;
    if (!existing.lastMessageAt || (row.created_at && row.created_at > existing.lastMessageAt)) {
      existing.lastMessageAt = row.created_at;
    }
  }

  return Array.from(map.values())
    .sort((a, b) => (b.lastMessageAt || '').localeCompare(a.lastMessageAt || ''))
    .slice(0, Math.max(1, Math.min(limit, 100)));
}

export async function getScopedTourAnalyticsSessionMessages(
  venueId: string,
  tourId: string,
  sessionId: string
) {
  const { data, error } = await supabase
    .from('conversations')
    .select(
      'id, conversation_id, session_id, message_position, message_type, message, response, created_at, response_time_ms'
    )
    .eq('venue_id', venueId)
    .eq('tour_id', tourId)
    .eq('chatbot_type', 'tour')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getScopedTourInformationSections(venueId: string, tourId: string) {
  const chatbotConfigId = await getScopedTourChatbotConfigId(venueId, tourId);
  if (!chatbotConfigId) return [];
  return ensureDefaultGeneralSection(chatbotConfigId);
}

export async function updateScopedTourInformationSections(
  venueId: string,
  tourId: string,
  sections: Array<{
    id?: string;
    section_key: string;
    section_title: string;
    display_order: number;
    is_active: boolean;
    fields: Array<{
      id?: string;
      field_key: string;
      field_label: string;
      field_type: FieldType;
      field_value?: string | null;
      display_order: number;
      is_required: boolean;
    }>;
  }>
) {
  const chatbotConfigId = await getScopedTourChatbotConfigId(venueId, tourId);
  if (!chatbotConfigId) {
    throw new Error('Tour chatbot configuration not found.');
  }

  const safeSections = (sections || []).map((section, index) => ({
    ...section,
    section_key: normaliseKey(section.section_key || section.section_title || `section_${index + 1}`),
    section_title: section.section_title?.trim() || `Section ${index + 1}`,
    display_order: Number.isFinite(section.display_order) ? section.display_order : index,
    is_active: section.is_active !== false,
    fields: (section.fields || []).map((field, fieldIndex) => ({
      ...field,
      field_key: normaliseKey(field.field_key || field.field_label || `field_${fieldIndex + 1}`),
      field_label: field.field_label?.trim() || `Field ${fieldIndex + 1}`,
      field_type: (field.field_type || 'text') as FieldType,
      field_value: field.field_value ?? '',
      display_order: Number.isFinite(field.display_order) ? field.display_order : fieldIndex,
      is_required: field.is_required === true,
    })),
  }));

  const { data: existingSections, error: existingError } = await supabase
    .from('chatbot_info_sections')
    .select('id')
    .eq('chatbot_config_id', chatbotConfigId);
  if (existingError) throw existingError;

  const existingIds = (existingSections || []).map((row) => row.id);
  if (existingIds.length > 0) {
    const { error: deleteFieldsError } = await supabase
      .from('chatbot_info_fields')
      .delete()
      .in('section_id', existingIds);
    if (deleteFieldsError) throw deleteFieldsError;

    const { error: deleteSectionsError } = await supabase
      .from('chatbot_info_sections')
      .delete()
      .eq('chatbot_config_id', chatbotConfigId);
    if (deleteSectionsError) throw deleteSectionsError;
  }

  if (safeSections.length === 0) {
    return ensureDefaultGeneralSection(chatbotConfigId);
  }

  const insertedSections: Array<{ id: string; fields: typeof safeSections[number]['fields'] }> = [];
  for (const section of safeSections) {
    const { data: createdSection, error: createSectionError } = await supabase
      .from('chatbot_info_sections')
      .insert([
        {
          chatbot_config_id: chatbotConfigId,
          section_key: section.section_key,
          section_title: section.section_title,
          display_order: section.display_order,
          is_active: section.is_active,
        },
      ])
      .select('id')
      .single();
    if (createSectionError || !createdSection) {
      throw createSectionError || new Error('Failed to create chatbot information section.');
    }
    insertedSections.push({ id: createdSection.id, fields: section.fields });
  }

  for (const section of insertedSections) {
    if (section.fields.length === 0) continue;
    const { error: createFieldsError } = await supabase
      .from('chatbot_info_fields')
      .insert(
        section.fields.map((field) => ({
          section_id: section.id,
          field_key: field.field_key,
          field_label: field.field_label,
          field_type: field.field_type,
          field_value: field.field_value ?? '',
          display_order: field.display_order,
          is_required: field.is_required,
        }))
      );
    if (createFieldsError) throw createFieldsError;
  }

  return getSectionsWithFields(chatbotConfigId);
}

export async function getScopedTourTriggers(venueId: string, tourId: string) {
  const chatbotConfigId = await getScopedTourChatbotConfigId(venueId, tourId);
  if (!chatbotConfigId) {
    return {
      triggers: [],
      tourPoints: [],
      tourModels: [],
    };
  }

  const [{ data: triggers, error: triggersError }, { data: tourPoints, error: tourPointsError }, { data: tours, error: toursError }] = await Promise.all([
    supabase
      .from('chatbot_triggers')
      .select('*')
      .eq('chatbot_config_id', chatbotConfigId)
      .order('display_order', { ascending: true }),
    supabase
      .from('tour_points')
      .select('id, name')
      .eq('tour_id', tourId)
      .order('created_at', { ascending: true }),
    supabase
      .from('tours')
      .select('id, title, matterport_tour_id, parent_tour_id, tour_type')
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true }),
  ]);

  if (triggersError) throw triggersError;
  if (tourPointsError) throw tourPointsError;
  if (toursError) throw toursError;

  const primaryCount = (tours || []).filter((tour) => tour.tour_type === 'primary' || !tour.tour_type).length;
  const shouldFallbackLegacySecondary = primaryCount <= 1;
  const tourModels = (tours || [])
    .filter((tour) => {
      if (tour.id === tourId) return true;
      if (tour.tour_type !== 'secondary') return false;
      if (tour.parent_tour_id) return tour.parent_tour_id === tourId;
      return shouldFallbackLegacySecondary;
    })
    .map((tour) => ({
      id: tour.id,
      name: tour.title,
      matterport_tour_id: tour.matterport_tour_id,
    }));

  return {
    triggers: triggers || [],
    tourPoints: tourPoints || [],
    tourModels,
  };
}

