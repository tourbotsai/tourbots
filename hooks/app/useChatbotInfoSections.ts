import { useCallback, useEffect, useState } from 'react';
import { ChatbotInfoSection } from '@/lib/types';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

interface ChatbotInfoSectionsPayload {
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
      field_type: 'text' | 'textarea' | 'url' | 'phone' | 'email';
      field_value?: string | null;
      display_order: number;
      is_required: boolean;
    }>;
  }>;
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

export function useChatbotInfoSections(chatbotConfigId?: string | null) {
  const [sections, setSections] = useState<ChatbotInfoSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuthHeaders();

  const coerceSections = useCallback((payload: unknown): ChatbotInfoSection[] => {
    if (Array.isArray(payload)) {
      return payload as ChatbotInfoSection[];
    }

    if (
      payload &&
      typeof payload === 'object' &&
      'sections' in payload &&
      Array.isArray((payload as { sections?: unknown }).sections)
    ) {
      return (payload as { sections: ChatbotInfoSection[] }).sections;
    }

    return [];
  }, []);

  const fetchSections = useCallback(async () => {
    if (!chatbotConfigId) {
      setSections([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const isPortal = isAgencyPortalPath();
      const shareSlug = getAgencyShareSlug();
      const query = new URLSearchParams({
        chatbotConfigId,
      });
      if (isPortal && shareSlug) {
        query.set('shareSlug', shareSlug);
      }
      const response = await fetch(
        isPortal ? `/api/public/agency-portal/information?${query.toString()}` : `/api/app/chatbots/info-sections?${query.toString()}`,
        {
          headers: isPortal ? {} : await getAuthHeaders(),
          credentials: isPortal ? 'include' : undefined,
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch chatbot information sections');
      }

      setSections(coerceSections(data));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [chatbotConfigId, getAuthHeaders, coerceSections]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const saveSections = useCallback(async (payload: ChatbotInfoSectionsPayload) => {
    if (!chatbotConfigId) {
      throw new Error('Chatbot configuration is required');
    }

    setIsSaving(true);
    setError(null);
    try {
      const isPortal = isAgencyPortalPath();
      const shareSlug = getAgencyShareSlug();
      const response = await fetch(isPortal ? '/api/public/agency-portal/information' : '/api/app/chatbots/info-sections', {
        method: 'PUT',
        headers: isPortal
          ? {
              'Content-Type': 'application/json',
              'x-csrf-token': getCookieValue('tb_agency_csrf'),
            }
          : await getAuthHeaders({
              'Content-Type': 'application/json',
            }),
        credentials: isPortal ? 'include' : undefined,
        body: JSON.stringify(
          isPortal
            ? {
                shareSlug,
                chatbotConfigId,
                sections: payload.sections,
              }
            : {
                chatbotConfigId,
                sections: payload.sections,
              }
        ),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save chatbot information sections');
      }

      setSections(coerceSections(data));
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [chatbotConfigId, getAuthHeaders, coerceSections]);

  return {
    sections,
    isLoading,
    isSaving,
    error,
    fetchSections,
    saveSections,
  };
}
