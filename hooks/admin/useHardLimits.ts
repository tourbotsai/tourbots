import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { HardLimitConfig, HardLimitUsage } from '@/lib/types';
import { createHardLimitStatus } from '@/lib/utils/hard-limit-calculations';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

export function useHardLimits() {
  const [hardLimitStatuses, setHardLimitStatuses] = useState<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuthHeaders();

  const fetchHardLimitStatus = useCallback(async (venueId: string, chatbotType: 'tour') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/app/chatbots/hard-limits?venueId=${venueId}&chatbotType=${chatbotType}`, {
        headers: await getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch hard limit status');
      }
      
      const data = await response.json();
      const key = `${venueId}-${chatbotType}`;
      
      setHardLimitStatuses(prev => ({
        ...prev,
        [key]: data
      }));
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const updateHardLimitConfig = useCallback(async (
    configId: string, 
    hardLimitConfig: HardLimitConfig
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: updateError } = await supabase
        .from('chatbot_configs')
        .update({
          hard_limits_enabled: hardLimitConfig.enabled,
          hard_limit_daily_messages: hardLimitConfig.dailyMessages,
          hard_limit_weekly_messages: hardLimitConfig.weeklyMessages,
          hard_limit_monthly_messages: hardLimitConfig.monthlyMessages,
          hard_limit_yearly_messages: hardLimitConfig.yearlyMessages,
          updated_at: new Date().toISOString()
        })
        .eq('id', configId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetHardLimitUsage = useCallback(async (
    venueId: string,
    chatbotType: 'tour',
    resetType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all' = 'all'
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/app/chatbots/hard-limits', {
        method: 'POST',
        headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          venueId,
          chatbotType,
          resetType
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset usage');
      }
      
      const data = await response.json();
      
      // Update local cache
      const key = `${venueId}-${chatbotType}`;
      setHardLimitStatuses(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          usage: data.usage
        }
      }));
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const getAllHardLimitStatuses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get all chatbot configs
      const { data: configs, error: configError } = await supabase
        .from('chatbot_configs')
        .select(`
          id,
          venue_id,
          chatbot_type,
          hard_limits_enabled,
          hard_limit_daily_messages,
          hard_limit_weekly_messages,
          hard_limit_monthly_messages,
          hard_limit_yearly_messages,
          venues (
            id,
            name,
            slug
          )
        `)
        .not('hard_limits_enabled', 'is', null)
        .eq('hard_limits_enabled', true);

      if (configError) throw configError;

      const statusPromises = configs?.map(async (config: any) => {
        try {
          const response = await fetch(`/api/app/chatbots/hard-limits?venueId=${config.venue_id}&chatbotType=${config.chatbot_type}`, {
            headers: await getAuthHeaders(),
          });
          if (response.ok) {
            const data = await response.json();
            return {
              ...config,
              hardLimitStatus: data
            };
          }
        } catch (error) {
          console.error(`Failed to fetch hard limits for ${config.venue_id}-${config.chatbot_type}:`, error);
        }
        return null;
      }) || [];

      const results = await Promise.all(statusPromises);
      const validResults = results.filter(Boolean);
      
      // Update local cache
      const newStatuses: { [key: string]: any } = {};
      validResults.forEach(result => {
        if (result) {
          const key = `${result.venue_id}-${result.chatbot_type}`;
          newStatuses[key] = result.hardLimitStatus;
        }
      });
      
      setHardLimitStatuses(newStatuses);
      
      return validResults;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const getHardLimitAlertsCount = useCallback(() => {
    let alertCount = 0;
    
    Object.values(hardLimitStatuses).forEach((status: any) => {
      if (status?.status?.isApproachingLimit || 
          (status?.usage && status?.config?.enabled)) {
        const { usage, config } = status;
        if (usage && config) {
          // Check if any usage is above 80% threshold
          const usagePercentages = [
            (usage.daily_messages_used / config.dailyMessages) * 100,
            (usage.weekly_messages_used / config.weeklyMessages) * 100,
            (usage.monthly_messages_used / config.monthlyMessages) * 100,
            (usage.yearly_messages_used / config.yearlyMessages) * 100,
          ];
          
          if (Math.max(...usagePercentages) >= 80) {
            alertCount++;
          }
        }
      }
    });
    
    return alertCount;
  }, [hardLimitStatuses]);

  return {
    hardLimitStatuses,
    isLoading,
    error,
    fetchHardLimitStatus,
    updateHardLimitConfig,
    resetHardLimitUsage,
    getAllHardLimitStatuses,
    getHardLimitAlertsCount
  };
} 