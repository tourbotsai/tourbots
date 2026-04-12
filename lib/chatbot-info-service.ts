import { supabaseServiceRole as supabase } from './supabase-service-role';
import { ChatbotInfoSection } from './types';

export async function getChatbotInfoSections(chatbotConfigId: string): Promise<ChatbotInfoSection[]> {
  const { data: sections, error: sectionError } = await supabase
    .from('chatbot_info_sections')
    .select('*')
    .eq('chatbot_config_id', chatbotConfigId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (sectionError) {
    throw sectionError;
  }

  if (!sections || sections.length === 0) {
    return [];
  }

  const sectionIds = sections.map((section) => section.id);
  const { data: fields, error: fieldsError } = await supabase
    .from('chatbot_info_fields')
    .select('*')
    .in('section_id', sectionIds)
    .order('display_order', { ascending: true });

  if (fieldsError) {
    throw fieldsError;
  }

  return sections.map((section) => ({
    ...section,
    fields: (fields || []).filter((field) => field.section_id === section.id),
  }));
}

export function formatChatbotInfoSectionsForPrompt(sections: ChatbotInfoSection[]): string {
  if (!sections.length) {
    return '';
  }

  const sectionBlocks = sections
    .map((section) => {
      const fieldLines = (section.fields || [])
        .filter((field) => field.field_value && String(field.field_value).trim() !== '')
        .map((field) => `${field.field_label}: ${field.field_value}`);

      if (!fieldLines.length) {
        return null;
      }

      return `${section.section_title.toUpperCase()}:\n${fieldLines.join('\n')}`;
    })
    .filter(Boolean);

  if (!sectionBlocks.length) {
    return '';
  }

  return `\n\nVENUE INFORMATION:\n${sectionBlocks.join('\n\n')}`;
}
