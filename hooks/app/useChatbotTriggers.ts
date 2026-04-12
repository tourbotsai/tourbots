"use client";

import { useEffect, useState } from "react";
import { ChatbotTrigger, ChatbotTriggerTourModelOption, ChatbotTriggerTourPointOption } from "@/lib/types";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";

interface SavePayload {
  triggers: Partial<ChatbotTrigger>[];
}

interface UseChatbotTriggersOptions {
  enabled?: boolean;
  initialTriggers?: ChatbotTrigger[];
  initialTourPoints?: ChatbotTriggerTourPointOption[];
  initialTourModels?: ChatbotTriggerTourModelOption[];
}

function isAgencyPortalPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/embed/agency/');
}

function getAgencyShareSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const parts = window.location.pathname.split('/').filter(Boolean);
  const agencyIndex = parts.findIndex((part) => part === 'agency');
  if (agencyIndex === -1) return null;
  const candidate = parts[agencyIndex + 1];
  if (!candidate || candidate === 'preview') return null;
  return candidate;
}

function getCookieValue(name: string): string {
  if (typeof document === 'undefined') return '';
  const escapedName = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

export function useChatbotTriggers(
  chatbotConfigId?: string | null,
  options: UseChatbotTriggersOptions = {}
) {
  const {
    enabled = true,
    initialTriggers = [],
    initialTourPoints = [],
    initialTourModels = [],
  } = options;
  const [triggers, setTriggers] = useState<ChatbotTrigger[]>(initialTriggers);
  const [tourPoints, setTourPoints] = useState<ChatbotTriggerTourPointOption[]>(initialTourPoints);
  const [tourModels, setTourModels] = useState<ChatbotTriggerTourModelOption[]>(initialTourModels);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuthHeaders();

  const fetchTriggers = async () => {
    if (!enabled) {
      return;
    }
    if (!chatbotConfigId) {
      setTriggers([]);
      setTourPoints([]);
      setTourModels([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const isPortal = isAgencyPortalPath();
      const shareSlug = getAgencyShareSlug();
      const query = new URLSearchParams({ chatbotConfigId });
      if (isPortal && shareSlug) {
        query.set('shareSlug', shareSlug);
      }
      const response = await fetch(
        isPortal ? `/api/public/agency-portal/triggers?${query.toString()}` : `/api/app/chatbots/triggers?${query.toString()}`,
        {
          headers: isPortal ? {} : await getAuthHeaders(),
          credentials: isPortal ? 'include' : undefined,
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch chatbot triggers");
      }

      setTriggers(data.triggers || []);
      setTourPoints(data.tourPoints || []);
      setTourModels(data.tourModels || []);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch chatbot triggers");
    } finally {
      setIsLoading(false);
    }
  };

  const saveTriggers = async (payload: SavePayload) => {
    if (!enabled) {
      throw new Error("Saving is disabled in read-only mode");
    }
    if (!chatbotConfigId) {
      throw new Error("chatbotConfigId is required");
    }

    setIsSaving(true);
    setError(null);
    try {
      const isPortal = isAgencyPortalPath();
      const shareSlug = getAgencyShareSlug();
      const response = await fetch("/api/app/chatbots/triggers", {
        method: "PUT",
        headers: isPortal
          ? {
              "Content-Type": "application/json",
              "x-csrf-token": getCookieValue("tb_agency_csrf"),
            }
          : await getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: isPortal ? "include" : undefined,
        body: JSON.stringify({
          shareSlug,
          chatbotConfigId,
          triggers: payload.triggers,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save chatbot triggers");
      }

      setTriggers(data.triggers || []);
      return data.triggers || [];
    } catch (err: any) {
      const message = err?.message || "Failed to save chatbot triggers";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      return;
    }
    fetchTriggers();
  }, [chatbotConfigId, enabled]);

  return {
    triggers,
    tourPoints,
    tourModels,
    isLoading,
    isSaving,
    error,
    fetchTriggers,
    saveTriggers,
  };
}
