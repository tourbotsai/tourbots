"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChatbotCustomAction,
  ChatbotIntegrationEndpoint,
} from "@/lib/types";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";

export function useChatbotIntegrations(chatbotConfigId?: string | null) {
  const [endpoint, setEndpoint] = useState<ChatbotIntegrationEndpoint | null>(null);
  const [actions, setActions] = useState<ChatbotCustomAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuthHeaders();

  const fetchAll = useCallback(async () => {
    if (!chatbotConfigId) {
      setEndpoint(null);
      setActions([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const qs = encodeURIComponent(chatbotConfigId);
      const [endpointRes, actionsRes] = await Promise.all([
        fetch(`/api/app/chatbots/integrations/endpoint?chatbotConfigId=${qs}`, { headers }),
        fetch(`/api/app/chatbots/integrations/custom-actions?chatbotConfigId=${qs}`, {
          headers,
        }),
      ]);
      const endpointData = await endpointRes.json();
      const actionsData = await actionsRes.json();
      if (!endpointRes.ok) {
        throw new Error(endpointData?.error || "Failed to load webhook endpoint");
      }
      if (!actionsRes.ok) {
        throw new Error(actionsData?.error || "Failed to load custom actions");
      }
      setEndpoint(endpointData.endpoint || null);
      setActions(actionsData.actions || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load integrations");
      setEndpoint(null);
      setActions([]);
    } finally {
      setIsLoading(false);
    }
  }, [chatbotConfigId, getAuthHeaders]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const saveEndpoint = async (payload: {
    url: string;
    is_enabled: boolean;
    subscribed_events: string[];
    rotate_secret?: boolean;
  }) => {
    if (!chatbotConfigId) throw new Error("Chatbot configuration is required");
    setIsSaving(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/app/chatbots/integrations/endpoint", {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ chatbotConfigId, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save webhook");
      setEndpoint(data.endpoint || null);
      return data.endpoint as ChatbotIntegrationEndpoint;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save webhook";
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEndpoint = async () => {
    if (!chatbotConfigId) throw new Error("Chatbot configuration is required");
    setIsSaving(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/app/chatbots/integrations/endpoint?chatbotConfigId=${encodeURIComponent(chatbotConfigId)}`,
        { method: "DELETE", headers }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to remove webhook");
      setEndpoint(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove webhook";
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const saveActions = async (
    nextActions: Array<
      Partial<ChatbotCustomAction> & {
        webhook_url?: string | null;
        rotate_secret?: boolean;
      }
    >
  ) => {
    if (!chatbotConfigId) throw new Error("Chatbot configuration is required");
    setIsSaving(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/app/chatbots/integrations/custom-actions", {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ chatbotConfigId, actions: nextActions }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save custom actions");
      setActions(data.actions || []);
      return data.actions as ChatbotCustomAction[];
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save custom actions";
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    endpoint,
    actions,
    isLoading,
    isSaving,
    error,
    refetch: fetchAll,
    saveEndpoint,
    deleteEndpoint,
    saveActions,
  };
}
