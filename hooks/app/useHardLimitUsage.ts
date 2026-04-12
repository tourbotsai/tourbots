import { useState, useEffect, useCallback } from 'react';
import { HardLimitConfig, HardLimitUsage, HardLimitStatus } from '@/lib/types';
import { createHardLimitStatus } from '@/lib/utils/hard-limit-calculations';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

interface UseHardLimitUsageProps {
  venueId: string;
  chatbotType: 'tour';
  enabled?: boolean;
}

export function useHardLimitUsage({ venueId, chatbotType, enabled = true }: UseHardLimitUsageProps) {
  const [config, setConfig] = useState<HardLimitConfig | null>(null);
  const [usage, setUsage] = useState<HardLimitUsage | null>(null);
  const [status, setStatus] = useState<HardLimitStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuthHeaders();

  const fetchHardLimitData = useCallback(async () => {
    if (!venueId || !enabled) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/app/chatbots/hard-limits?venueId=${venueId}&chatbotType=${chatbotType}`, {
        headers: await getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch hard limit data');
      }
      
      const data = await response.json();
      
      setConfig(data.config);
      setUsage(data.usage);
      setStatus(data.status);
      
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching hard limit data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [venueId, chatbotType, enabled, getAuthHeaders]);

  const refreshUsage = useCallback(async () => {
    return await fetchHardLimitData();
  }, [fetchHardLimitData]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    fetchHardLimitData();
  }, [fetchHardLimitData]);

  // Periodic refresh every 5 minutes if enabled and config is active
  useEffect(() => {
    if (!enabled || !config?.enabled) return;

    const interval = setInterval(() => {
      fetchHardLimitData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [enabled, config?.enabled, fetchHardLimitData]);

  // Helper functions for UI
  const isApproachingAnyLimit = useCallback(() => {
    if (!status) return false;
    return status.isApproachingLimit;
  }, [status]);

  const hasExceededAnyLimit = useCallback(() => {
    if (!usage || !config?.enabled) return false;
    
    return (
      usage.daily_messages_used >= config.dailyMessages ||
      usage.weekly_messages_used >= config.weeklyMessages ||
      usage.monthly_messages_used >= config.monthlyMessages ||
      usage.yearly_messages_used >= config.yearlyMessages
    );
  }, [usage, config]);

  const getMostCriticalLimit = useCallback(() => {
    if (!usage || !config?.enabled) return null;

    const limits = [
      { 
        period: 'daily', 
        used: usage.daily_messages_used, 
        limit: config.dailyMessages,
        percentage: (usage.daily_messages_used / config.dailyMessages) * 100
      },
      { 
        period: 'weekly', 
        used: usage.weekly_messages_used, 
        limit: config.weeklyMessages,
        percentage: (usage.weekly_messages_used / config.weeklyMessages) * 100
      },
      { 
        period: 'monthly', 
        used: usage.monthly_messages_used, 
        limit: config.monthlyMessages,
        percentage: (usage.monthly_messages_used / config.monthlyMessages) * 100
      },
      { 
        period: 'yearly', 
        used: usage.yearly_messages_used, 
        limit: config.yearlyMessages,
        percentage: (usage.yearly_messages_used / config.yearlyMessages) * 100
      }
    ];

    return limits.reduce((prev, current) => 
      current.percentage > prev.percentage ? current : prev
    );
  }, [usage, config]);

  const getRemainingMessages = useCallback(() => {
    if (!usage || !config?.enabled) return null;

    return {
      daily: Math.max(0, config.dailyMessages - usage.daily_messages_used),
      weekly: Math.max(0, config.weeklyMessages - usage.weekly_messages_used),
      monthly: Math.max(0, config.monthlyMessages - usage.monthly_messages_used),
      yearly: Math.max(0, config.yearlyMessages - usage.yearly_messages_used),
    };
  }, [usage, config]);

  const getMinimumRemaining = useCallback(() => {
    const remaining = getRemainingMessages();
    if (!remaining) return null;
    
    return Math.min(
      remaining.daily,
      remaining.weekly,
      remaining.monthly,
      remaining.yearly
    );
  }, [getRemainingMessages]);

  // Alert states
  const shouldShowWarning = useCallback(() => {
    const mostCritical = getMostCriticalLimit();
    return mostCritical ? mostCritical.percentage >= 80 : false;
  }, [getMostCriticalLimit]);

  const shouldShowCritical = useCallback(() => {
    const mostCritical = getMostCriticalLimit();
    return mostCritical ? mostCritical.percentage >= 95 : false;
  }, [getMostCriticalLimit]);

  const shouldShowBlocked = useCallback(() => {
    return hasExceededAnyLimit();
  }, [hasExceededAnyLimit]);

  return {
    // Data
    config,
    usage,
    status,
    
    // Loading states
    isLoading,
    error,
    
    // Actions
    fetchHardLimitData,
    refreshUsage,
    
    // Helper functions
    isApproachingAnyLimit,
    hasExceededAnyLimit,
    getMostCriticalLimit,
    getRemainingMessages,
    getMinimumRemaining,
    
    // Alert states
    shouldShowWarning,
    shouldShowCritical,
    shouldShowBlocked,
  };
} 