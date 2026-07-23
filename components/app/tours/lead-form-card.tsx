"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/lib/types";

interface LeadFormCardProps {
  message: ChatMessage;
  venueId: string;
  chatbotConfigId?: string | null;
  tourId?: string | null;
  conversationId?: string | null;
  sessionId?: string | null;
  embedId?: string | null;
  embedToken?: string | null;
  pageUrl?: string | null;
  domain?: string | null;
  bubbleStyle?: React.CSSProperties;
  textColor?: string;
  buttonBackground?: string;
  buttonTextColor?: string;
  onSubmitted: (messageId: string) => void;
}

export function LeadFormCard({
  message,
  venueId,
  chatbotConfigId,
  tourId,
  conversationId,
  sessionId,
  embedId,
  embedToken,
  pageUrl,
  domain,
  bubbleStyle,
  textColor,
  buttonBackground,
  buttonTextColor,
  onSubmitted,
}: LeadFormCardProps) {
  const leadForm = message.leadForm;
  const [values, setValues] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSubmitted = leadForm?.status === "submitted";

  const canSubmit = useMemo(() => {
    if (!leadForm || isSubmitted || isSubmitting || !consent) return false;
    return leadForm.fields.every((field) => {
      if (!field.is_required) return true;
      return Boolean((values[field.field_key] || "").trim());
    });
  }, [consent, isSubmitting, isSubmitted, leadForm, values]);

  if (!leadForm) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !chatbotConfigId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/tour-chatbot/${venueId}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotConfigId,
          leadFormId: leadForm.formId,
          conversationId: conversationId || null,
          sessionId: sessionId || null,
          embedId: embedId || null,
          embedToken: embedToken || null,
          values,
          consent: true,
          pageUrl: pageUrl || (typeof window !== "undefined" ? window.location.href : null),
          domain: domain || (typeof window !== "undefined" ? window.location.hostname : null),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit");
      }
      onSubmitted(message.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full max-w-full rounded-2xl border border-slate-200/80 p-3 shadow-sm dark:border-input"
      style={bubbleStyle}
    >
      {leadForm.introMessage ? (
        <p className="mb-3 text-sm" style={{ color: textColor }}>
          {leadForm.introMessage}
        </p>
      ) : null}

      {isSubmitted ? (
        <p className="text-sm font-medium" style={{ color: textColor }}>
          {leadForm.successMessage}
        </p>
      ) : (
        <form className="space-y-2.5" onSubmit={handleSubmit}>
          {leadForm.fields.map((field) => (
            <div key={field.field_key} className="space-y-1">
              <label className="block text-xs font-medium" style={{ color: textColor }}>
                {field.label}
                {field.is_required ? <span className="ml-0.5 text-red-500">*</span> : null}
              </label>
              {field.field_type === "textarea" ? (
                <Textarea
                  rows={3}
                  value={values[field.field_key] || ""}
                  placeholder={field.placeholder || undefined}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.field_key]: e.target.value }))}
                  className="min-h-[72px] bg-white/90 text-sm dark:bg-background"
                  required={field.is_required}
                />
              ) : field.field_type === "select" ? (
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-white/90 px-3 py-1 text-sm shadow-sm dark:bg-background"
                  value={values[field.field_key] || ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.field_key]: e.target.value }))}
                  required={field.is_required}
                >
                  <option value="">Select...</option>
                  {(field.options || []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type={
                    field.field_type === "email"
                      ? "email"
                      : field.field_type === "phone"
                        ? "tel"
                        : "text"
                  }
                  value={values[field.field_key] || ""}
                  placeholder={field.placeholder || undefined}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.field_key]: e.target.value }))}
                  className="bg-white/90 text-sm dark:bg-background"
                  required={field.is_required}
                />
              )}
            </div>
          ))}

          <label className="flex items-start gap-2 pt-1 text-xs" style={{ color: textColor }}>
            <input
              type="checkbox"
              className="mt-0.5"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
            />
            <span>
              {leadForm.consentCheckboxLabel}{' '}
              <a
                href={leadForm.privacyPolicyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View privacy policy
              </a>
            </span>
          </label>

          {error ? <p className="text-xs text-red-500">{error}</p> : null}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="h-9 w-full text-sm"
            style={{
              backgroundColor: buttonBackground,
              color: buttonTextColor,
            }}
          >
            {isSubmitting ? "Sending..." : leadForm.submitLabel}
          </Button>
        </form>
      )}
    </div>
  );
}
