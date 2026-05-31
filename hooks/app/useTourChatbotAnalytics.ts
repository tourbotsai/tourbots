import { useState, useCallback, useEffect } from 'react';
import { Conversation } from '@/lib/types';
import { useUser } from '@/hooks/useUser';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

export function useTourChatbotAnalytics(selectedTourId?: string | null, forcedVenueId?: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();

  // When a venue is forced (e.g. a platform admin viewing another account),
  // scope requests to that venue rather than the signed-in user's own.
  const effectiveVenueId = forcedVenueId || user?.venue?.id;

  const fetchConversations = useCallback(async (sessionId?: string) => {
    if (!effectiveVenueId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/app/chatbots/analytics?venueId=${effectiveVenueId}&chatbotType=tour`;
      if (selectedTourId) {
        url += `&tourId=${selectedTourId}`;
      }
      if (sessionId) {
        url += `&sessionId=${sessionId}`;
      }
      
      const response = await fetch(url, { headers: await getAuthHeaders() });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tour conversations');
      }

      setConversations(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveVenueId, selectedTourId, getAuthHeaders]);

  // Auto-fetch conversations when user/venue is available
  useEffect(() => {
    if (effectiveVenueId) {
      fetchConversations();
    }
  }, [fetchConversations, effectiveVenueId]);

  const getConversationStats = useCallback(async () => {
    if (!effectiveVenueId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const tourParam = selectedTourId ? `&tourId=${selectedTourId}` : '';
      const url = `/api/app/chatbots/analytics?venueId=${effectiveVenueId}&type=stats&chatbotType=tour${tourParam}`;
      const response = await fetch(url, { headers: await getAuthHeaders() });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tour stats');
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [effectiveVenueId, selectedTourId, getAuthHeaders]);

  const getSessionMessages = useCallback(async (sessionId: string) => {
    if (!effectiveVenueId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const tourParam = selectedTourId ? `&tourId=${selectedTourId}` : '';
      const url = `/api/app/chatbots/analytics?venueId=${effectiveVenueId}&type=session&sessionId=${sessionId}&chatbotType=tour${tourParam}`;
      const response = await fetch(url, { headers: await getAuthHeaders() });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tour session messages');
      }

      return data || [];
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [effectiveVenueId, selectedTourId, getAuthHeaders]);

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
    getConversationStats,
    getSessionMessages,
  };
} 