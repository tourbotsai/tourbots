import { useState, useCallback, useEffect } from 'react';
import { ChatbotConfig } from '@/lib/types';
import { useUser } from '@/hooks/useUser';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

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

export const useTourChatbotConfig = (tourId?: string | null) => {
  const [tourConfig, setTourConfig] = useState<ChatbotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();

  const fetchConfig = useCallback(async () => {
    if (!tourId) {
      setTourConfig(null);
      return;
    }

    const isPortal = isAgencyPortalPath();
    if (!isPortal && !user?.venue?.id) {
      // User context has not finished resolving yet.
      // Skip this fetch to avoid noisy `venueId=undefined` requests.
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const shareSlug = getAgencyShareSlug();
      const url = isPortal
        ? `/api/public/agency-portal/chatbot-config?tourId=${tourId}${shareSlug ? `&shareSlug=${encodeURIComponent(shareSlug)}` : ''}`
        : `/api/app/chatbots/config?venueId=${user?.venue?.id}&tourId=${tourId}`;
      const headers = isPortal ? {} : await getAuthHeaders();
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tour chatbot config');
      }

      setTourConfig(data || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [tourId, user?.venue?.id, getAuthHeaders]);

  // Auto-fetch config when user/tour is available
  useEffect(() => {
    if (tourId) {
      fetchConfig();
    } else {
      setTourConfig(null);
    }
  }, [fetchConfig, tourId]);

  const updateConfig = useCallback(async (configId: string, updates: Partial<ChatbotConfig>) => {
    if (!isAgencyPortalPath() && !user?.venue?.id) {
      throw new Error('No venue found for user');
    }

    setIsLoading(true);
    setError(null);
    try {
      const isPortal = isAgencyPortalPath();
      const shareSlug = getAgencyShareSlug();
      const response = await fetch(isPortal ? `/api/public/agency-portal/chatbot-config` : `/api/app/chatbots/config`, {
        method: 'PUT',
        headers: isPortal
          ? {
              'Content-Type': 'application/json',
              'x-csrf-token': getCookieValue('tb_agency_csrf'),
            }
          : await getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(isPortal ? { shareSlug, configId, updates } : { configId, updates }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update tour chatbot config');
      }

      setTourConfig(prev => (prev?.id === configId ? { ...prev, ...updates } : prev));
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.venue?.id, getAuthHeaders]);

  const createConfig = useCallback(async (config: Partial<ChatbotConfig>) => {
    if (!tourId) {
      throw new Error('Tour is required');
    }

    setIsLoading(true);
    setError(null);
    try {
      const configWithType = { ...config, chatbot_type: 'tour' as const };
      const isPortal = isAgencyPortalPath();
      const shareSlug = getAgencyShareSlug();
      
      const response = await fetch(isPortal ? `/api/public/agency-portal/chatbot-config` : `/api/app/chatbots/config`, {
        method: 'POST',
        headers: isPortal
          ? {
              'Content-Type': 'application/json',
              'x-csrf-token': getCookieValue('tb_agency_csrf'),
            }
          : await getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(
          isPortal
            ? { shareSlug, tourId, config: configWithType }
            : { venueId: user?.venue?.id, tourId, config: configWithType }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tour chatbot config');
      }

      setTourConfig(data);
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [tourId, user?.venue?.id, getAuthHeaders]);

  const deleteConfig = useCallback(async (configId: string) => {
    if (isAgencyPortalPath()) {
      throw new Error('Deleting chatbot config is not available in Agency Portal.');
    }

    if (!user?.venue?.id) {
      throw new Error('No venue found for user');
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/app/chatbots/config`, {
        method: 'DELETE',
        headers: await getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ configId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete tour chatbot config');
      }

      if (tourConfig?.id === configId) {
        setTourConfig(null);
      }
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [tourConfig?.id, user?.venue?.id, getAuthHeaders]);

  return {
    tourConfig,
    isLoading,
    error,
    fetchConfig,
    updateConfig,
    createConfig,
    deleteConfig,
  };
}; 