import { useState, useCallback } from 'react';
import { ChatbotConfig } from '@/lib/types';
import { useUser } from '@/hooks/useUser';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

export const useChatbotConfig = () => {
  const [configs, setConfigs] = useState<ChatbotConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();

  const fetchConfigs = useCallback(async (chatbotType?: 'tour') => {
    if (!user?.venue?.id) {
      setError('No venue found for user');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/app/chatbots/config?venueId=${user.venue.id}`;
      if (chatbotType) {
        url += `&chatbotType=${chatbotType}`;
      }
      
      const response = await fetch(url, { headers: await getAuthHeaders() });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch chatbot configs');
      }

      setConfigs(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.venue?.id, getAuthHeaders]);

  const updateConfig = useCallback(async (configId: string, updates: Partial<ChatbotConfig>) => {
    if (!user?.venue?.id) {
      throw new Error('No venue found for user');
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/app/chatbots/config`, {
        method: 'PUT',
        headers: await getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ configId, updates }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update chatbot config');
      }

      // Update local state
      setConfigs(prev => prev.map(config => 
        config.id === configId ? { ...config, ...updates } : config
      ));
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.venue?.id, getAuthHeaders]);

  const createConfig = useCallback(async (config: Partial<ChatbotConfig>) => {
    if (!user?.venue?.id) {
      throw new Error('No venue found for user');
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/app/chatbots/config`, {
        method: 'POST',
        headers: await getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ venueId: user.venue.id, config }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create chatbot config');
      }

      // Add to local state
      setConfigs(prev => [data, ...prev]);
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.venue?.id, getAuthHeaders]);

  const deleteConfig = useCallback(async (configId: string) => {
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
        throw new Error(data.error || 'Failed to delete chatbot config');
      }

      // Remove from local state
      setConfigs(prev => prev.filter(config => config.id !== configId));
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.venue?.id, getAuthHeaders]);

  return {
    configs,
    isLoading,
    error,
    fetchConfigs,
    updateConfig,
    createConfig,
    deleteConfig,
  };
}; 