"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Plus,
  Save,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useChatbotLeadForm } from "@/hooks/app/useChatbotLeadForm";
import { useChatbotIntegrations } from "@/hooks/app/useChatbotIntegrations";
import {
  ChatbotLeadFormConditionType,
  ChatbotLeadFormField,
  ChatbotLeadFormFieldOption,
  ChatbotLeadFormFieldType,
} from "@/lib/types";
import { ChatbotLeadsTable } from "./chatbot-leads-table";

interface EditableField {
  localId: string;
  field_key: string;
  label: string;
  field_type: ChatbotLeadFormFieldType;
  placeholder: string;
  options: ChatbotLeadFormFieldOption[];
  is_required: boolean;
  display_order: number;
}

interface ChatbotLeadFormCardProps {
  chatbotConfigId?: string | null;
}

function createLocalId() {
  return `field_${Math.random().toString(36).slice(2, 10)}`;
}

function toEditableFields(fields: ChatbotLeadFormField[] | undefined | null): EditableField[] {
  if (!fields || fields.length === 0) {
    return [
      {
        localId: createLocalId(),
        field_key: "name",
        label: "Name",
        field_type: "text",
        placeholder: "Your name",
        options: [],
        is_required: true,
        display_order: 0,
      },
      {
        localId: createLocalId(),
        field_key: "email",
        label: "Email",
        field_type: "email",
        placeholder: "you@example.com",
        options: [],
        is_required: true,
        display_order: 1,
      },
      {
        localId: createLocalId(),
        field_key: "phone",
        label: "Phone",
        field_type: "phone",
        placeholder: "Optional",
        options: [],
        is_required: false,
        display_order: 2,
      },
    ];
  }

  return fields.map((field, index) => ({
    localId: field.id || createLocalId(),
    field_key: field.field_key,
    label: field.label,
    field_type: field.field_type,
    placeholder: field.placeholder || "",
    options: field.options || [],
    is_required: field.is_required,
    display_order: field.display_order ?? index,
  }));
}

export function ChatbotLeadFormCard({ chatbotConfigId }: ChatbotLeadFormCardProps) {
  const { toast } = useToast();
  const { form, defaults, isLoading, isSaving, saveForm } = useChatbotLeadForm(chatbotConfigId);
  const {
    endpoint,
    isLoading: isWebhookLoading,
    isSaving: isWebhookSaving,
    saveEndpoint,
    deleteEndpoint,
  } = useChatbotIntegrations(chatbotConfigId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [leadsOpen, setLeadsOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [isEnabled, setIsEnabled] = useState(false);
  const [introMessage, setIntroMessage] = useState("");
  const [submitLabel, setSubmitLabel] = useState("Send");
  const [successMessage, setSuccessMessage] = useState("Thanks — we'll be in touch shortly.");
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState("");
  const [consentLabel, setConsentLabel] = useState("By submitting, you agree to our privacy policy.");
  const [conditionType, setConditionType] = useState<ChatbotLeadFormConditionType>("intent");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [conditionIntent, setConditionIntent] = useState(
    "Visitor wants to leave contact details, enquire, book, or get a callback"
  );
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [fields, setFields] = useState<EditableField[]>(() => toEditableFields(null));

  const [leadWebhookUrl, setLeadWebhookUrl] = useState("");
  const [leadWebhookEnabled, setLeadWebhookEnabled] = useState(false);

  useEffect(() => {
    if (!form && !defaults) return;
    setIsEnabled(form?.is_enabled ?? false);
    setIntroMessage(form?.intro_message || "");
    setSubmitLabel(form?.submit_label || "Send");
    setSuccessMessage(form?.success_message || defaults?.success_message || "Thanks — we'll be in touch shortly.");
    setPrivacyPolicyUrl(form?.privacy_policy_url || "");
    setConsentLabel(
      form?.consent_checkbox_label ||
        defaults?.consent_checkbox_label ||
        "By submitting, you agree to our privacy policy."
    );
    setConditionType(form?.condition_type === "keywords" ? "keywords" : "intent");
    setKeywordsInput((form?.condition_keywords || []).join(", "));
    setConditionIntent(
      form?.condition_intent ||
        "Visitor wants to leave contact details, enquire, book, or get a callback"
    );
    setEmailNotificationsEnabled(form?.email_notifications_enabled ?? false);
    setNotificationEmail(form?.notification_email || "");
    setFields(toEditableFields(form?.fields?.length ? form.fields : defaults?.fields));
  }, [form, defaults]);

  useEffect(() => {
    const subscribed = endpoint?.subscribed_events || [];
    const leadOn = Boolean(endpoint?.is_enabled && subscribed.includes("lead.created"));
    setLeadWebhookUrl(endpoint?.url || "");
    setLeadWebhookEnabled(leadOn);
  }, [endpoint]);

  const canSave = useMemo(() => Boolean(chatbotConfigId) && fields.length > 0, [chatbotConfigId, fields.length]);

  const updateField = (localId: string, patch: Partial<EditableField>) => {
    setFields((prev) => prev.map((field) => (field.localId === localId ? { ...field, ...patch } : field)));
  };

  const moveField = (index: number, direction: -1 | 1) => {
    setFields((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next.map((field, i) => ({ ...field, display_order: i }));
    });
  };

  const addField = () => {
    setFields((prev) => [
      ...prev,
      {
        localId: createLocalId(),
        field_key: `custom_${prev.length + 1}`,
        label: `Field ${prev.length + 1}`,
        field_type: "text",
        placeholder: "",
        options: [],
        is_required: false,
        display_order: prev.length,
      },
    ]);
  };

  const handleSave = async () => {
    try {
      await saveForm({
        form: {
          is_enabled: isEnabled,
          intro_message: introMessage,
          submit_label: submitLabel,
          success_message: successMessage,
          privacy_policy_url: privacyPolicyUrl,
          consent_checkbox_label: consentLabel,
          condition_type: conditionType,
          condition_keywords: keywordsInput
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          condition_intent: conditionIntent,
          email_notifications_enabled: emailNotificationsEnabled,
          notification_email: notificationEmail,
          once_per_conversation: true,
        },
        fields: fields.map((field, index) => ({
          field_key: field.field_key,
          label: field.label,
          field_type: field.field_type,
          placeholder: field.placeholder,
          options: field.field_type === "select" ? field.options : null,
          is_required: field.is_required,
          display_order: index,
        })),
      });
      toast({ title: "Lead form saved", description: "Your lead form settings have been updated." });
    } catch (err: unknown) {
      toast({
        title: "Could not save lead form",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveLeadWebhook = async () => {
    if (!leadWebhookEnabled) {
      try {
        if (endpoint) {
          await deleteEndpoint();
        }
        setLeadWebhookUrl("");
        toast({ title: "Lead webhook disabled" });
      } catch (err: unknown) {
        toast({
          title: "Could not disable webhook",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    if (!leadWebhookUrl.trim()) {
      toast({
        title: "Webhook URL required",
        description: "Paste a Zapier, Make, or n8n HTTPS URL.",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveEndpoint({
        url: leadWebhookUrl.trim(),
        is_enabled: true,
        subscribed_events: ["lead.created"],
      });
      toast({
        title: "Lead webhook saved",
        description: "New leads will be posted to this URL.",
      });
    } catch (err: unknown) {
      toast({
        title: "Could not save webhook",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const content = (
    <div className="space-y-5">
      {!chatbotConfigId ? (
        <p className="text-sm text-slate-500">
          Create and save your chatbot in the Configuration section first to manage the lead form.
        </p>
      ) : isLoading ? (
        <p className="text-sm text-slate-500">Loading lead form...</p>
      ) : (
        <>
          {/* Status */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-input dark:bg-background">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Lead form</p>
              <p className="text-xs text-slate-500">
                {isEnabled ? "Enabled — can appear in chat" : "Disabled — hidden from chat"}
              </p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          {/* Form copy */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Form copy</h4>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Intro message</Label>
              <Input
                className="h-9"
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                placeholder="Leave your details and we'll get back to you."
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Submit button</Label>
                <Input className="h-9" value={submitLabel} onChange={(e) => setSubmitLabel(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Success message</Label>
                <Input className="h-9" value={successMessage} onChange={(e) => setSuccessMessage(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Fields — single list, one dense row each */}
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fields</h4>
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={addField}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add field
              </Button>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-input">
              <div className="hidden grid-cols-[minmax(0,1.1fr)_120px_minmax(0,1.2fr)_72px_88px] gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:border-input dark:bg-background sm:grid">
                <span>Label</span>
                <span>Type</span>
                <span>Placeholder</span>
                <span className="text-center">Required</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-input">
                {fields.map((field, index) => (
                  <div key={field.localId} className="space-y-2 px-3 py-2">
                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1.1fr)_120px_minmax(0,1.2fr)_72px_88px]">
                      <Input
                        className="h-8 text-sm"
                        value={field.label}
                        onChange={(e) => updateField(field.localId, { label: e.target.value })}
                        placeholder="Label"
                      />
                      <Select
                        value={field.field_type}
                        onValueChange={(value) =>
                          updateField(field.localId, { field_type: value as ChatbotLeadFormFieldType })
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                        </SelectContent>
                      </Select>
                      {field.field_type === "select" ? (
                        <p className="text-xs text-slate-400 sm:px-1">Options below</p>
                      ) : (
                        <Input
                          className="h-8 text-sm"
                          value={field.placeholder}
                          onChange={(e) => updateField(field.localId, { placeholder: e.target.value })}
                          placeholder="Placeholder"
                        />
                      )}
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={field.is_required}
                          onCheckedChange={(checked) => updateField(field.localId, { is_required: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveField(index, -1)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveField(index, 1)}
                          disabled={index === fields.length - 1}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setFields((prev) => prev.filter((item) => item.localId !== field.localId))}
                          disabled={fields.length <= 1}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    {field.field_type === "select" ? (
                      <div className="flex flex-wrap items-center gap-1.5 pl-0 sm:pl-0">
                        {field.options.map((option, optionIndex) => (
                          <div
                            key={`${field.localId}_opt_${optionIndex}`}
                            className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50/50 pr-0.5 dark:border-input dark:bg-background"
                          >
                            <Input
                              className="h-7 w-[110px] border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                              value={option.label}
                              placeholder="Option"
                              onChange={(e) => {
                                const next = [...field.options];
                                next[optionIndex] = {
                                  ...next[optionIndex],
                                  label: e.target.value,
                                  value:
                                    next[optionIndex].value ||
                                    e.target.value.toLowerCase().replace(/\s+/g, "_"),
                                };
                                updateField(field.localId, { options: next });
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                updateField(field.localId, {
                                  options: field.options.filter((_, i) => i !== optionIndex),
                                })
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() =>
                            updateField(field.localId, {
                              options: [
                                ...field.options,
                                { value: `option_${field.options.length + 1}`, label: "Option" },
                              ],
                            })
                          }
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Option
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Behaviour */}
          <section className="space-y-2 border-t border-slate-100 pt-5 dark:border-input">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">When to show</h4>
            <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-start">
              <Select
                value={conditionType}
                onValueChange={(value) => setConditionType(value as ChatbotLeadFormConditionType)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intent">Intent</SelectItem>
                  <SelectItem value="keywords">Keywords</SelectItem>
                </SelectContent>
              </Select>
              {conditionType === "keywords" ? (
                <Input
                  className="h-9"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="book, enquire, callback"
                />
              ) : (
                <Textarea
                  value={conditionIntent}
                  onChange={(e) => setConditionIntent(e.target.value)}
                  placeholder="Visitor wants to book a viewing or leave contact details"
                  rows={2}
                  className="min-h-[72px] text-sm"
                />
              )}
            </div>
          </section>

          {/* Privacy */}
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Privacy</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Privacy policy URL</Label>
                <Input
                  className="h-9"
                  value={privacyPolicyUrl}
                  onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                  placeholder={defaults?.privacy_policy_url || "https://tourbots.ai/legal"}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Consent checkbox text</Label>
                <Input
                  className="h-9"
                  value={consentLabel}
                  onChange={(e) => setConsentLabel(e.target.value)}
                  placeholder="By submitting, you agree to our privacy policy."
                />
              </div>
            </div>
          </section>

          {/* Email */}
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email notifications</h4>
            <div className="rounded-lg border border-slate-200 dark:border-input">
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Send an alert when a visitor submits the form
                </p>
                <Switch checked={emailNotificationsEnabled} onCheckedChange={setEmailNotificationsEnabled} />
              </div>
              {emailNotificationsEnabled ? (
                <div className="border-t border-slate-100 px-3 py-2.5 dark:border-input">
                  <Label className="mb-1.5 block text-xs text-slate-500">Notify</Label>
                  <Input
                    className="h-9"
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="Defaults to venue email if left blank"
                  />
                </div>
              ) : null}
            </div>
          </section>

          {/* Advanced — lead webhook only */}
          <section className="space-y-2">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-left dark:border-input dark:bg-background"
              onClick={() => setAdvancedOpen((prev) => !prev)}
            >
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Advanced
                </h4>
                <p className="mt-0.5 text-xs text-slate-500">
                  Optional Zapier / Make / n8n webhook when a lead is submitted
                </p>
              </div>
              {advancedOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
              )}
            </button>

            {advancedOpen ? (
              <div className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-input">
                <p className="text-xs text-slate-500">
                  Paste a Catch Hook (Zapier), Custom webhook (Make), or Webhook (n8n) URL.
                  TourBots will POST lead details there when someone submits this form. This is
                  separate from Custom Actions (availability, bookings, etc.).
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Send lead to webhook on submit
                  </p>
                  <Switch
                    checked={leadWebhookEnabled}
                    onCheckedChange={setLeadWebhookEnabled}
                    disabled={isWebhookLoading}
                  />
                </div>
                {leadWebhookEnabled ? (
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Webhook URL</Label>
                    <Input
                      className="h-9 font-mono text-sm"
                      value={leadWebhookUrl}
                      onChange={(e) => setLeadWebhookUrl(e.target.value)}
                      placeholder="https://hooks.zapier.com/hooks/catch/…"
                    />
                    {endpoint?.signing_secret ? (
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Signing secret</Label>
                        <Input
                          readOnly
                          className="h-9 font-mono text-xs"
                          value={endpoint.signing_secret}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!chatbotConfigId || isWebhookSaving || isWebhookLoading}
                  onClick={() => void handleSaveLeadWebhook()}
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {isWebhookSaving ? "Saving…" : "Save lead webhook"}
                </Button>
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  );

  return (
    <>
      <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-sm dark:border-input dark:bg-background">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:border dark:border-input dark:bg-background dark:text-slate-300 dark:ring-0">
                  <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <span>Lead Form</span>
              </CardTitle>
              <CardDescription className="mt-1 text-xs sm:text-sm">
                Push a contact form into the chat when visitors want to enquire.
              </CardDescription>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                onClick={() => setLeadsOpen(true)}
                disabled={!chatbotConfigId}
              >
                View all leads
              </Button>
              <Button type="button" onClick={handleSave} disabled={!canSave || isSaving || !isExpanded}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="col-span-2 border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800 sm:col-span-1"
                onClick={() => setIsExpanded((prev) => !prev)}
              >
                {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                {isExpanded ? "Collapse" : "Expand"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {isExpanded ? <CardContent>{content}</CardContent> : null}
      </Card>

      <ChatbotLeadsTable
        open={leadsOpen}
        onOpenChange={setLeadsOpen}
        chatbotConfigId={chatbotConfigId}
      />
    </>
  );
}
