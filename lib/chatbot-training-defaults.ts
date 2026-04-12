/**
 * Canonical “factory” training layout for tour chatbots (Chatbot Information Sections).
 * Keep in sync with ensureDefaultGeneralSection in app/api/app/chatbots/info-sections/route.ts.
 */

export const DEFAULT_GENERAL_INFORMATION_SECTION_KEY = 'general_information' as const;
export const DEFAULT_GENERAL_INFORMATION_SECTION_TITLE = 'General Information';

export type DefaultInfoFieldTemplate = {
  field_key: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'url' | 'phone' | 'email';
  display_order: number;
};

/** Insert payload for the default General Information block (empty values). */
export const DEFAULT_GENERAL_INFORMATION_FIELDS: readonly DefaultInfoFieldTemplate[] = [
  { field_key: 'company_name', field_label: 'Company Name', field_type: 'text', display_order: 0 },
  { field_key: 'website', field_label: 'Website', field_type: 'url', display_order: 1 },
  { field_key: 'address', field_label: 'Address', field_type: 'textarea', display_order: 2 },
  { field_key: 'general_description', field_label: 'General Description', field_type: 'textarea', display_order: 3 },
  { field_key: 'phone', field_label: 'Phone', field_type: 'phone', display_order: 4 },
  { field_key: 'email', field_label: 'Email', field_type: 'email', display_order: 5 },
] as const;

type SectionRow = {
  id: string;
  section_key: string;
  section_title: string | null;
};

type FieldRow = {
  section_id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  field_value: string | null;
  display_order?: number | null;
  is_required?: boolean | null;
};

/**
 * True when the active sections/fields still match the auto-created General Information template
 * (one section, default keys/labels/types, all values empty, no required flags).
 */
export function matchesDefaultGeneralInformationTraining(
  sections: ReadonlyArray<SectionRow>,
  fields: ReadonlyArray<FieldRow>
): boolean {
  if (sections.length === 0) return true;

  if (sections.length !== 1) return false;

  const section = sections[0];
  if (section.section_key !== DEFAULT_GENERAL_INFORMATION_SECTION_KEY) return false;
  if ((section.section_title || '').trim() !== DEFAULT_GENERAL_INFORMATION_SECTION_TITLE) return false;

  const sectionFields = fields.filter((f) => f.section_id === section.id);
  if (sectionFields.length !== DEFAULT_GENERAL_INFORMATION_FIELDS.length) return false;

  const sorted = [...sectionFields].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );

  for (let i = 0; i < DEFAULT_GENERAL_INFORMATION_FIELDS.length; i += 1) {
    const exp = DEFAULT_GENERAL_INFORMATION_FIELDS[i];
    const f = sorted[i];
    if (!f || f.field_key !== exp.field_key) return false;
    if ((f.field_label || '').trim() !== exp.field_label) return false;
    if (f.field_type !== exp.field_type) return false;
    if (String(f.field_value || '').trim() !== '') return false;
    if (f.is_required) return false;
  }

  return true;
}

type SectionWithConfig = SectionRow & {
  chatbot_config_id: string;
  is_active: boolean;
};

/**
 * True if any active chatbot for the venue has customised information sections vs the default template.
 */
export function venueHasAnyCustomisedTourTraining(
  activeChatbotConfigIds: string[],
  allSections: ReadonlyArray<SectionWithConfig>,
  allFields: ReadonlyArray<FieldRow>
): boolean {
  if (activeChatbotConfigIds.length === 0) return false;

  for (const configId of activeChatbotConfigIds) {
    const sections = allSections
      .filter((s) => s.chatbot_config_id === configId && s.is_active)
      .map(({ id, section_key, section_title }) => ({ id, section_key, section_title }));

    const sectionIds = new Set(sections.map((s) => s.id));
    const fields = allFields.filter((f) => sectionIds.has(f.section_id));

    if (!matchesDefaultGeneralInformationTraining(sections, fields)) {
      return true;
    }
  }

  return false;
}
