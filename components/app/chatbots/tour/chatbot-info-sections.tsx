"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot, ChevronDown, ChevronUp, Plus, Save, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useChatbotInfoSections } from "@/hooks/app/useChatbotInfoSections";

type FieldType = 'text' | 'textarea' | 'url' | 'phone' | 'email';

interface EditableField {
  id?: string;
  field_key: string;
  field_label: string;
  field_type: FieldType;
  field_value: string;
  display_order: number;
  is_required: boolean;
}

interface EditableSection {
  id?: string;
  section_key: string;
  section_title: string;
  display_order: number;
  is_active: boolean;
  fields: EditableField[];
}

interface ChatbotInfoSectionsProps {
  chatbotConfigId?: string | null;
}

const GENERAL_INFO_SECTION_KEY = "general_information";
const GENERAL_DESCRIPTION_KEY = "general_description";
const ADDRESS_KEY = "address";
const PHONE_KEY = "phone";

function toKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function inferFieldType(label: string): FieldType {
  const normalised = label.toLowerCase();
  if (normalised.includes("email")) return "email";
  if (normalised.includes("phone")) return "phone";
  if (normalised.includes("website") || normalised.includes("url")) return "url";
  if (normalised.includes("address") || normalised.includes("description") || normalised.includes("notes")) return "textarea";
  return "text";
}

export function ChatbotInfoSections({ chatbotConfigId }: ChatbotInfoSectionsProps) {
  const { toast } = useToast();
  const { sections, isLoading, isSaving, saveSections } = useChatbotInfoSections(chatbotConfigId);
  const [draftSections, setDraftSections] = useState<EditableSection[]>([]);
  const [isBlockExpanded, setIsBlockExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const safeSections = Array.isArray(sections) ? sections : [];
    const mapped = safeSections.map((section, sectionIndex) => {
      let fields: EditableField[] = (section.fields || []).map((field, fieldIndex) => ({
        id: field.id,
        field_key: field.field_key,
        field_label: field.field_label,
        field_type: field.field_type,
        field_value: field.field_value || "",
        display_order: field.display_order ?? fieldIndex,
        is_required: field.is_required,
      }));

      if (section.section_key === GENERAL_INFO_SECTION_KEY) {
        const hasGeneralDescription = fields.some((field) => field.field_key === GENERAL_DESCRIPTION_KEY);
        if (!hasGeneralDescription) {
          const phoneIndex = fields.findIndex((field) => field.field_key === PHONE_KEY);
          const addressIndex = fields.findIndex((field) => field.field_key === ADDRESS_KEY);
          const insertIndex = phoneIndex >= 0 ? phoneIndex : (addressIndex >= 0 ? addressIndex + 1 : fields.length);

          fields.splice(insertIndex, 0, {
            field_key: GENERAL_DESCRIPTION_KEY,
            field_label: "General Description",
            field_type: "textarea",
            field_value: "",
            display_order: insertIndex,
            is_required: false,
          });
        }

        fields = fields.map((field, index) => {
          if (field.field_key === GENERAL_DESCRIPTION_KEY) {
            return {
              ...field,
              field_label: "General Description",
              field_type: "textarea",
              display_order: index,
            };
          }
          return {
            ...field,
            display_order: index,
          };
        });
      }

      return {
        id: section.id,
        section_key: section.section_key,
        section_title: section.section_title,
        display_order: section.display_order ?? sectionIndex,
        is_active: section.is_active,
        fields,
      };
    });

    setDraftSections(mapped);
  }, [sections]);

  const canSave = useMemo(() => Boolean(chatbotConfigId && draftSections.length > 0), [chatbotConfigId, draftSections.length]);

  const getSectionExpandKey = (section: EditableSection, index: number) => `${section.id || section.section_key || "section"}-${index}`;

  const isSectionExpanded = (section: EditableSection, index: number) => {
    const key = getSectionExpandKey(section, index);
    return expandedSections[key] ?? true;
  };

  const toggleSection = (section: EditableSection, index: number) => {
    const key = getSectionExpandKey(section, index);
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? true),
    }));
  };

  const updateSection = (sectionIndex: number, updates: Partial<EditableSection>) => {
    setDraftSections((prev) =>
      prev.map((section, index) => (index === sectionIndex ? { ...section, ...updates } : section))
    );
  };

  const updateField = (sectionIndex: number, fieldIndex: number, updates: Partial<EditableField>) => {
    setDraftSections((prev) =>
      prev.map((section, index) => {
        if (index !== sectionIndex) {
          return section;
        }

        return {
          ...section,
          fields: section.fields.map((field, idx) => (idx === fieldIndex ? { ...field, ...updates } : field)),
        };
      })
    );
  };

  const addSection = () => {
    const nextIndex = draftSections.length;
    setDraftSections((prev) => [
      ...prev,
      {
        section_key: `section_${nextIndex + 1}`,
        section_title: `Section ${nextIndex + 1}`,
        display_order: nextIndex,
        is_active: true,
        fields: [],
      },
    ]);
  };

  const deleteSection = (sectionIndex: number) => {
    setDraftSections((prev) => prev.filter((_, index) => index !== sectionIndex));
  };

  const addField = (sectionIndex: number) => {
    setDraftSections((prev) =>
      prev.map((section, index) => {
        if (index !== sectionIndex) {
          return section;
        }

        const nextFieldIndex = section.fields.length;
        return {
          ...section,
          fields: [
            ...section.fields,
            {
              field_key: `field_${nextFieldIndex + 1}`,
              field_label: `Field ${nextFieldIndex + 1}`,
              field_type: "text",
              field_value: "",
              display_order: nextFieldIndex,
              is_required: false,
            },
          ],
        };
      })
    );
  };

  const deleteField = (sectionIndex: number, fieldIndex: number) => {
    setDraftSections((prev) =>
      prev.map((section, index) => {
        if (index !== sectionIndex) {
          return section;
        }
        return {
          ...section,
          fields: section.fields.filter((_, idx) => idx !== fieldIndex),
        };
      })
    );
  };

  const handleSave = async () => {
    if (!chatbotConfigId) {
      return;
    }

    try {
      await saveSections({
        sections: draftSections.map((section, sectionIndex) => ({
          id: section.id,
          section_key: toKey(section.section_key || section.section_title || `section_${sectionIndex + 1}`),
          section_title: section.section_title.trim() || `Section ${sectionIndex + 1}`,
          display_order: sectionIndex,
          is_active: section.is_active,
          fields: section.fields.map((field, fieldIndex) => ({
            id: field.id,
            field_key: toKey(field.field_label || field.field_key || `field_${fieldIndex + 1}`),
            field_label: field.field_label.trim() || `Field ${fieldIndex + 1}`,
            field_type: field.field_type || inferFieldType(field.field_label),
            field_value: field.field_value || "",
            display_order: fieldIndex,
            is_required: field.is_required,
          })),
        })),
      });

      toast({
        title: "Saved",
        description: "Chatbot information sections updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save chatbot information sections",
        variant: "destructive",
      });
    }
  };

  if (!chatbotConfigId) {
    return (
      <Card className="dark:border-input dark:bg-background">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:border dark:border-input dark:bg-background dark:text-slate-300 dark:ring-0">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <span>Chatbot Information</span>
          </CardTitle>
          <CardDescription>Select a tour and create a chatbot first to manage information sections.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="dark:border-input dark:bg-background">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:border dark:border-input dark:bg-background dark:text-slate-300 dark:ring-0">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <span>Chatbot Information Sections</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Add flexible sections and fields for tour-specific information the chatbot can use.
            </CardDescription>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
            <Button type="button" variant="outline" className="dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800" onClick={addSection} disabled={!isBlockExpanded}>
              <Plus className="mr-2 h-4 w-4" />
              <span className="sm:hidden">Add Section</span>
              <span className="hidden sm:inline">Add New Section</span>
            </Button>
            <Button type="button" onClick={handleSave} disabled={!canSave || isSaving || !isBlockExpanded}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : <><span className="sm:hidden">Save</span><span className="hidden sm:inline">Save Sections</span></>}
            </Button>
            <Button type="button" variant="outline" className="col-span-2 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800 sm:col-span-1" onClick={() => setIsBlockExpanded((prev) => !prev)}>
              {isBlockExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
              {isBlockExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isBlockExpanded ? <CardContent className="space-y-4 dark:border-t dark:border-input">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading chatbot information sections...</p>
        ) : null}

        {draftSections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sections found yet. Add your first section to start building chatbot context.
          </p>
        ) : null}

        {draftSections.map((section, sectionIndex) => (
          <div key={`${section.id || "new"}-${sectionIndex}`} className="rounded-md bg-slate-50/60 p-4 space-y-4 dark:border dark:border-input dark:bg-background">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={section.section_title}
                  onChange={(event) => updateSection(sectionIndex, { section_title: event.target.value })}
                  placeholder="e.g. General Information"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggleSection(section, sectionIndex)}
              >
                {isSectionExpanded(section, sectionIndex) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={() => deleteSection(sectionIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {isSectionExpanded(section, sectionIndex) ? <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {section.fields.map((field, fieldIndex) => (
                  <div key={`${field.id || "new"}-${fieldIndex}`} className="space-y-2 rounded-md bg-white p-3 dark:border dark:border-input dark:bg-background">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={field.field_label}
                        onChange={(event) => updateField(sectionIndex, fieldIndex, { field_label: event.target.value })}
                        placeholder="Field name"
                        className="max-w-[220px]"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteField(sectionIndex, fieldIndex)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>

                    {field.field_type === "textarea" ? (
                      <Textarea
                        value={field.field_value}
                        onChange={(event) => updateField(sectionIndex, fieldIndex, { field_value: event.target.value })}
                        placeholder="Enter value"
                      />
                    ) : (
                      <Input
                        value={field.field_value}
                        onChange={(event) => updateField(sectionIndex, fieldIndex, {
                          field_value: event.target.value,
                          field_type: inferFieldType(field.field_label),
                        })}
                        placeholder="Enter value"
                      />
                    )}
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" className="dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800" onClick={() => addField(sectionIndex)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Field
              </Button>
            </div> : null}
          </div>
        ))}
      </CardContent> : null}
    </Card>
  );
}
