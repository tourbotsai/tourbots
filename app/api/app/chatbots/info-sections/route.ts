import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import {
  authenticateChatbotRoute,
  getScopedChatbotConfig,
  logChatbotAudit,
} from '@/lib/chatbot-route-auth';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';
import {
  DEFAULT_GENERAL_INFORMATION_FIELDS,
  DEFAULT_GENERAL_INFORMATION_SECTION_KEY,
  DEFAULT_GENERAL_INFORMATION_SECTION_TITLE,
} from '@/lib/chatbot-training-defaults';

type FieldType = 'text' | 'textarea' | 'url' | 'phone' | 'email';

interface IncomingField {
  id?: string;
  field_key: string;
  field_label: string;
  field_type: FieldType;
  field_value?: string | null;
  display_order: number;
  is_required: boolean;
}

interface IncomingSection {
  id?: string;
  section_key: string;
  section_title: string;
  display_order: number;
  is_active: boolean;
  fields: IncomingField[];
}

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

  if (sectionsError) {
    throw new Error(sectionsError.message);
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
    throw new Error(fieldsError.message);
  }

  return sections.map((section) => ({
    ...section,
    fields: (fields || []).filter((field) => field.section_id === section.id),
  }));
}

async function ensureDefaultGeneralSection(chatbotConfigId: string) {
  const existing = await getSectionsWithFields(chatbotConfigId);
  if (existing.length > 0) {
    return existing;
  }

  const { data: insertedSection, error: sectionError } = await supabase
    .from('chatbot_info_sections')
    .insert([{
      chatbot_config_id: chatbotConfigId,
      section_key: DEFAULT_GENERAL_INFORMATION_SECTION_KEY,
      section_title: DEFAULT_GENERAL_INFORMATION_SECTION_TITLE,
      display_order: 0,
      is_active: true,
    }])
    .select()
    .single();

  if (sectionError || !insertedSection) {
    throw new Error(sectionError?.message || 'Failed to create default section');
  }

  const { error: fieldsInsertError } = await supabase
    .from('chatbot_info_fields')
    .insert(DEFAULT_GENERAL_INFORMATION_FIELDS.map((field) => ({
      section_id: insertedSection.id,
      field_key: field.field_key,
      field_label: field.field_label,
      field_type: field.field_type,
      field_value: '',
      display_order: field.display_order,
      is_required: false,
    })));

  if (fieldsInsertError) {
    throw new Error(fieldsInsertError.message);
  }

  return getSectionsWithFields(chatbotConfigId);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatbotConfigId = searchParams.get('chatbotConfigId');

    if (!chatbotConfigId) {
      return NextResponse.json({ error: 'chatbotConfigId is required' }, { status: 400 });
    }

    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) {
      const portalSession = await requireAgencyPortalSession(request, {
        requiredModule: 'settings',
      });
      if (portalSession instanceof NextResponse) return portalSession;

      const { data: portalScopedConfig, error: portalScopedConfigError } = await supabase
        .from('chatbot_configs')
        .select('id')
        .eq('id', chatbotConfigId)
        .eq('venue_id', portalSession.venueId)
        .eq('tour_id', portalSession.tourId)
        .maybeSingle();

      if (portalScopedConfigError || !portalScopedConfig) {
        return NextResponse.json({ error: 'Chatbot configuration not found for venue' }, { status: 404 });
      }
    } else {
      const scopedConfig = await getScopedChatbotConfig(chatbotConfigId, authResult.venueId);
      if (!scopedConfig) {
        return NextResponse.json({ error: 'Chatbot configuration not found for venue' }, { status: 404 });
      }
    }

    const sections = await ensureDefaultGeneralSection(chatbotConfigId);
    return NextResponse.json(sections);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch chatbot information sections' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { chatbotConfigId, sections } = await request.json() as {
      chatbotConfigId?: string;
      sections?: IncomingSection[];
    };

    if (!chatbotConfigId) {
      return NextResponse.json({ error: 'chatbotConfigId is required' }, { status: 400 });
    }

    const authResult = await authenticateChatbotRoute(request);
    const isPortalSession = authResult instanceof NextResponse;

    if (isPortalSession) {
      const portalSession = await requireAgencyPortalSession(request, {
        requiredModule: 'settings',
        requireCsrf: true,
      });
      if (portalSession instanceof NextResponse) return portalSession;

      const { data: portalScopedConfig, error: portalScopedConfigError } = await supabase
        .from('chatbot_configs')
        .select('id')
        .eq('id', chatbotConfigId)
        .eq('venue_id', portalSession.venueId)
        .eq('tour_id', portalSession.tourId)
        .maybeSingle();

      if (portalScopedConfigError || !portalScopedConfig) {
        return NextResponse.json({ error: 'Chatbot configuration not found for venue' }, { status: 404 });
      }
    } else {
      const scopedConfig = await getScopedChatbotConfig(chatbotConfigId, authResult.venueId);
      if (!scopedConfig) {
        return NextResponse.json({ error: 'Chatbot configuration not found for venue' }, { status: 404 });
      }
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

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const existingIds = (existingSections || []).map((row) => row.id);
    if (existingIds.length > 0) {
      const { error: deleteFieldsError } = await supabase
        .from('chatbot_info_fields')
        .delete()
        .in('section_id', existingIds);
      if (deleteFieldsError) {
        return NextResponse.json({ error: deleteFieldsError.message }, { status: 500 });
      }

      const { error: deleteSectionsError } = await supabase
        .from('chatbot_info_sections')
        .delete()
        .eq('chatbot_config_id', chatbotConfigId);
      if (deleteSectionsError) {
        return NextResponse.json({ error: deleteSectionsError.message }, { status: 500 });
      }
    }

    if (safeSections.length === 0) {
      const defaults = await ensureDefaultGeneralSection(chatbotConfigId);
      return NextResponse.json(defaults);
    }

    const insertedSections: Array<{ id: string; fields: IncomingField[] }> = [];
    for (const section of safeSections) {
      const { data: createdSection, error: createSectionError } = await supabase
        .from('chatbot_info_sections')
        .insert([{
          chatbot_config_id: chatbotConfigId,
          section_key: section.section_key,
          section_title: section.section_title,
          display_order: section.display_order,
          is_active: section.is_active,
        }])
        .select('id')
        .single();

      if (createSectionError || !createdSection) {
        return NextResponse.json(
          { error: createSectionError?.message || 'Failed to create section' },
          { status: 500 }
        );
      }

      insertedSections.push({ id: createdSection.id, fields: section.fields });
    }

    for (const insertedSection of insertedSections) {
      if (!insertedSection.fields.length) {
        continue;
      }

      const { error: createFieldsError } = await supabase
        .from('chatbot_info_fields')
        .insert(insertedSection.fields.map((field) => ({
          section_id: insertedSection.id,
          field_key: field.field_key,
          field_label: field.field_label,
          field_type: field.field_type,
          field_value: field.field_value ?? '',
          display_order: field.display_order,
          is_required: field.is_required,
        })));

      if (createFieldsError) {
        return NextResponse.json({ error: createFieldsError.message }, { status: 500 });
      }
    }

    const updated = await getSectionsWithFields(chatbotConfigId);
    if (!(authResult instanceof NextResponse)) {
      logChatbotAudit('chatbot_info_sections_updated', authResult, {
        chatbot_config_id: chatbotConfigId,
        section_count: updated.length,
      });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to save chatbot information sections' },
      { status: 500 }
    );
  }
}
