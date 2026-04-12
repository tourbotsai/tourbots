import { useState, useCallback } from 'react';
import { ChatbotConfig } from '@/lib/types';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

export function useChatbotConfig() {
  const [configs, setConfigs] = useState<ChatbotConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuthHeaders();

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/chatbots/config', {
        headers: await getAuthHeaders(),
      });
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
  }, [getAuthHeaders]);

  const updateConfig = useCallback(async (configId: string, updates: Partial<ChatbotConfig>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/chatbots/config', {
        method: 'PUT',
        headers: await getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          configId,
          updates,
        }),
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
  }, [getAuthHeaders]);

  const createConfig = useCallback(async (venueId: string, config: Partial<ChatbotConfig>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/chatbots/config', {
        method: 'POST',
        headers: await getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          venueId,
          config,
        }),
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
  }, [getAuthHeaders]);

  return {
    configs,
    isLoading,
    error,
    fetchConfigs,
    updateConfig,
    createConfig,
  };
} 