import { useState, useCallback, useEffect } from 'react';
import { Conversation } from '@/lib/types';
import { useUser } from '@/hooks/useUser';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

export function useTourChatbotAnalytics(selectedTourId?: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();

  const fetchConversations = useCallback(async (sessionId?: string) => {
    if (!user?.venue?.id) return;
    
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/app/chatbots/analytics?venueId=${user.venue.id}&chatbotType=tour`;
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
  }, [user?.venue?.id, selectedTourId, getAuthHeaders]);

  // Auto-fetch conversations when user/venue is available
  useEffect(() => {
    if (user?.venue?.id) {
      fetchConversations();
    }
  }, [fetchConversations, user?.venue?.id]);

  const getConversationStats = useCallback(async () => {
    if (!user?.venue?.id) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const tourParam = selectedTourId ? `&tourId=${selectedTourId}` : '';
      const url = `/api/app/chatbots/analytics?venueId=${user.venue.id}&type=stats&chatbotType=tour${tourParam}`;
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
  }, [user?.venue?.id, selectedTourId, getAuthHeaders]);

  const getSessionMessages = useCallback(async (sessionId: string) => {
    if (!user?.venue?.id) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const tourParam = selectedTourId ? `&tourId=${selectedTourId}` : '';
      const url = `/api/app/chatbots/analytics?venueId=${user.venue.id}&type=session&sessionId=${sessionId}&chatbotType=tour${tourParam}`;
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
  }, [user?.venue?.id, selectedTourId, getAuthHeaders]);

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
    getConversationStats,
    getSessionMessages,
  };
} 