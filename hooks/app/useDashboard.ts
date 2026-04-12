import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';
import type {
  DashboardOverview,
  QuickStats,
  RevenueMetrics,
  VisitorAnalytics,
  ActivityItem,
  PerformanceMetrics,
  ActionItem
} from '@/lib/dashboard-service';

interface DashboardData {
  overview: DashboardOverview | null;
  quickStats: QuickStats | null;
  revenueMetrics: RevenueMetrics | null;
  visitorAnalytics: VisitorAnalytics | null;
  recentActivity: ActivityItem[];
  performanceMetrics: PerformanceMetrics | null;
  actionItems: ActionItem[];
}

interface DashboardLoadingState {
  overview: boolean;
  quickStats: boolean;
  revenueMetrics: boolean;
  visitorAnalytics: boolean;
  recentActivity: boolean;
  performanceMetrics: boolean;
  actionItems: boolean;
}

interface DashboardErrorState {
  overview: string | null;
  quickStats: string | null;
  revenueMetrics: string | null;
  visitorAnalytics: string | null;
  recentActivity: string | null;
  performanceMetrics: string | null;
  actionItems: string | null;
}

export function useDashboard() {
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();
  
  // Data state
  const [data, setData] = useState<DashboardData>({
    overview: null,
    quickStats: null,
    revenueMetrics: null,
    visitorAnalytics: null,
    recentActivity: [],
    performanceMetrics: null,
    actionItems: []
  });

  // Loading state
  const [loading, setLoading] = useState<DashboardLoadingState>({
    overview: false,
    quickStats: false,
    revenueMetrics: false,
    visitorAnalytics: false,
    recentActivity: false,
    performanceMetrics: false,
    actionItems: false
  });

  // Error state
  const [errors, setErrors] = useState<DashboardErrorState>({
    overview: null,
    quickStats: null,
    revenueMetrics: null,
    visitorAnalytics: null,
    recentActivity: null,
    performanceMetrics: null,
    actionItems: null
  });

  // Last refresh timestamp for caching
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const setAllSectionsLoading = useCallback((loadingValue: boolean) => {
    setLoading({
      overview: loadingValue,
      quickStats: loadingValue,
      revenueMetrics: loadingValue,
      visitorAnalytics: loadingValue,
      recentActivity: loadingValue,
      performanceMetrics: loadingValue,
      actionItems: loadingValue,
    });
  }, []);

  // Fetch all dashboard data
  const fetchAllData = useCallback(async (venueId: string, force = false) => {
    // Check if we need to refresh (cache for 5 minutes)
    const now = new Date();
    const shouldRefresh = force || !lastRefresh || (now.getTime() - lastRefresh.getTime()) > 5 * 60 * 1000;
    
    if (!shouldRefresh) {
      return;
    }

    setAllSectionsLoading(true);
    setErrors({
      overview: null,
      quickStats: null,
      revenueMetrics: null,
      visitorAnalytics: null,
      recentActivity: null,
      performanceMetrics: null,
      actionItems: null,
    });

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/app/dashboard?venueId=${encodeURIComponent(venueId)}`, {
        headers,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to fetch dashboard data');
      }

      setData({
        overview: payload.overview || null,
        quickStats: payload.quickStats || null,
        revenueMetrics: payload.revenueMetrics || null,
        visitorAnalytics: payload.visitorAnalytics || null,
        recentActivity: payload.recentActivity || [],
        performanceMetrics: payload.performanceMetrics || null,
        actionItems: payload.actionItems || [],
      });
    } catch (error: any) {
      const message = error?.message || 'Failed to fetch dashboard data';
      setErrors({
        overview: message,
        quickStats: message,
        revenueMetrics: message,
        visitorAnalytics: message,
        recentActivity: message,
        performanceMetrics: message,
        actionItems: message,
      });
    } finally {
      setAllSectionsLoading(false);
    }

    setLastRefresh(now);
  }, [
    getAuthHeaders,
    lastRefresh,
    setAllSectionsLoading,
  ]);

  // Refresh specific sections
  const refreshOverview = useCallback(() => {
    if (user?.venue_id) {
      fetchAllData(user.venue_id, true);
    }
  }, [user?.venue_id, fetchAllData]);

  const refreshQuickStats = useCallback(() => {
    if (user?.venue_id) {
      fetchAllData(user.venue_id, true);
    }
  }, [user?.venue_id, fetchAllData]);

  const refreshRevenueMetrics = useCallback(() => {
    if (user?.venue_id) {
      fetchAllData(user.venue_id, true);
    }
  }, [user?.venue_id, fetchAllData]);

  const refreshVisitorAnalytics = useCallback(() => {
    if (user?.venue_id) {
      fetchAllData(user.venue_id, true);
    }
  }, [user?.venue_id, fetchAllData]);

  const refreshRecentActivity = useCallback(() => {
    if (user?.venue_id) {
      fetchAllData(user.venue_id, true);
    }
  }, [user?.venue_id, fetchAllData]);

  const refreshPerformanceMetrics = useCallback(() => {
    if (user?.venue_id) {
      fetchAllData(user.venue_id, true);
    }
  }, [user?.venue_id, fetchAllData]);

  const refreshActionItems = useCallback(() => {
    if (user?.venue_id) {
      fetchAllData(user.venue_id, true);
    }
  }, [user?.venue_id, fetchAllData]);

  // Force refresh all data
  const refreshAll = useCallback(() => {
    if (user?.venue_id) {
      fetchAllData(user.venue_id, true);
    }
  }, [user?.venue_id, fetchAllData]);

  // Auto-fetch data when user/venue is available
  useEffect(() => {
    if (user?.venue_id) {
      fetchAllData(user.venue_id);
    }
  }, [user?.venue_id, fetchAllData]);

  // Calculate overall loading state
  const isLoading = Object.values(loading).some(Boolean);
  
  // Calculate if we have any data
  const hasData = data.overview !== null || 
                  data.quickStats !== null || 
                  data.revenueMetrics !== null || 
                  data.visitorAnalytics !== null || 
                  data.recentActivity.length > 0 || 
                  data.performanceMetrics !== null || 
                  data.actionItems.length > 0;

  // Calculate if we have any errors
  const hasErrors = Object.values(errors).some(error => error !== null);

  // Get setup completion status
  const getSetupCompletion = useCallback(() => {
    if (!data.actionItems) return { completed: 0, total: 0, percentage: 0 };
    
    const setupItems = data.actionItems.filter(item => item.type === 'setup');
    const completedSetup = setupItems.filter(item => item.completed);
    
    return {
      completed: completedSetup.length,
      total: setupItems.length,
      percentage: setupItems.length > 0 ? Math.round((completedSetup.length / setupItems.length) * 100) : 100
    };
  }, [data.actionItems]);

  return {
    // Data
    data,
    
    // Loading states
    loading,
    isLoading,
    
    // Error states
    errors,
    hasErrors,
    
    // Status
    hasData,
    lastRefresh,
    
    // Actions
    refreshAll,
    refreshOverview,
    refreshQuickStats,
    refreshRevenueMetrics,
    refreshVisitorAnalytics,
    refreshRecentActivity,
    refreshPerformanceMetrics,
    refreshActionItems,
    
    // Individual fetch functions (for manual calls)
    fetchOverview: () => user?.venue_id && fetchAllData(user.venue_id, true),
    fetchQuickStats: () => user?.venue_id && fetchAllData(user.venue_id, true),
    fetchRevenueMetrics: () => user?.venue_id && fetchAllData(user.venue_id, true),
    fetchVisitorAnalytics: () => user?.venue_id && fetchAllData(user.venue_id, true),
    fetchRecentActivity: () => user?.venue_id && fetchAllData(user.venue_id, true),
    fetchPerformanceMetrics: () => user?.venue_id && fetchAllData(user.venue_id, true),
    fetchActionItems: () => user?.venue_id && fetchAllData(user.venue_id, true),
    
    // Utilities
    getSetupCompletion
  };
} 