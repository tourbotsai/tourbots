import { useState, useCallback } from 'react';
import { Conversation } from '@/lib/types';
import { useUser } from '@/hooks/useUser';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

export function useChatbotAnalytics() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();

  const fetchConversations = useCallback(async (sessionId?: string, chatbotType?: 'tour') => {
    if (!user?.venue?.id) return;
    
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/app/chatbots/analytics?venueId=${user.venue.id}`;
      if (sessionId) {
        url += `&sessionId=${sessionId}`;
      }
      if (chatbotType) {
        url += `&chatbotType=${chatbotType}`;
      }
      
      const response = await fetch(url, { headers: await getAuthHeaders() });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch conversations');
      }

      setConversations(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.venue?.id, getAuthHeaders]);

  const getConversationStats = useCallback(async (chatbotType?: 'tour') => {
    if (!user?.venue?.id) return;
    
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/app/chatbots/analytics?venueId=${user.venue.id}&type=stats`;
      if (chatbotType) {
        url += `&chatbotType=${chatbotType}`;
      }
      
      const response = await fetch(url, { headers: await getAuthHeaders() });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.venue?.id, getAuthHeaders]);

  const getSessionMessages = useCallback(async (sessionId: string, chatbotType?: 'tour') => {
    if (!user?.venue?.id) return;
    
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/app/chatbots/analytics?venueId=${user.venue.id}&type=session&sessionId=${sessionId}`;
      if (chatbotType) {
        url += `&chatbotType=${chatbotType}`;
      }
      
      const response = await fetch(url, { headers: await getAuthHeaders() });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch session messages');
      }

      return data || [];
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.venue?.id, getAuthHeaders]);

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
    getConversationStats,
    getSessionMessages,
  };
} 