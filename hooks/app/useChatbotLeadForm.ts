"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChatbotLeadForm,
  ChatbotLeadFormField,
} from "@/lib/types";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";

interface LeadFormDefaults {
  privacy_policy_url: string;
  consent_checkbox_label: string;
  success_message: string;
  fields: ChatbotLeadFormField[];
}

export function useChatbotLeadForm(chatbotConfigId?: string | null) {
  const [form, setForm] = useState<ChatbotLeadForm | null>(null);
  const [defaults, setDefaults] = useState<LeadFormDefaults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuthHeaders();

  const fetchForm = useCallback(async () => {
    if (!chatbotConfigId) {
      setForm(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/app/chatbots/lead-form?chatbotConfigId=${encodeURIComponent(chatbotConfigId)}`,
        { headers }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load lead form");
      }
      setForm(data.form || null);
      setDefaults(data.defaults || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load lead form");
      setForm(null);
    } finally {
      setIsLoading(false);
    }
  }, [chatbotConfigId, getAuthHeaders]);

  useEffect(() => {
    void fetchForm();
  }, [fetchForm]);

  const saveForm = async (payload: {
    form: Partial<ChatbotLeadForm>;
    fields: Partial<ChatbotLeadFormField>[];
  }) => {
    if (!chatbotConfigId) {
      throw new Error("Chatbot configuration is required");
    }

    setIsSaving(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/app/chatbots/lead-form", {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatbotConfigId,
          form: payload.form,
          fields: payload.fields,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save lead form");
      }
      setForm(data.form || null);
      return data.form as ChatbotLeadForm;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save lead form";
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    form,
    defaults,
    isLoading,
    isSaving,
    error,
    refetch: fetchForm,
    saveForm,
  };
}
