import { useState, useCallback } from 'react';
import { ChatbotConfigService, ChatbotConfigResponse } from '@/lib/services/chatbot-config-service';
import { useUser } from '@/hooks/useUser';

export const useChatbotConfigOnly = () => {
  const [configs, setConfigs] = useState<ChatbotConfigResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const fetchConfigs = useCallback(async (chatbotType?: 'tour') => {
    if (!user?.venue?.id) {
      setError('No venue found for user');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await ChatbotConfigService.getAppConfig(user.venue.id, chatbotType);
      setConfigs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.venue?.id]);

  return {
    configs,
    isLoading,
    error,
    fetchConfigs,
  };
};

export const usePublicChatbotConfig = (venueId: string, type: 'tour' = 'tour') => {
  const [config, setConfig] = useState<ChatbotConfigResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!venueId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await ChatbotConfigService.getPublicConfig(venueId, type);
      setConfig(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [venueId, type]);

  return {
    config,
    isLoading,
    error,
    fetchConfig,
  };
}; 