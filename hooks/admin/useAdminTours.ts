import { useState, useEffect } from 'react';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

interface VenueWithTour {
  id: string;
  [key: string]: any;
}

export function useAdminTours() {
  const [venues, setVenues] = useState<VenueWithTour[]>([]);
  const [stats, setStats] = useState({
    totalVenues: 0,
    activeTours: 0,
    pendingTours: 0,
    totalViews: 0,
    recentViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuthHeaders();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/tours', {
        headers: await getAuthHeaders(),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to fetch tours data');
      }

      setVenues(payload.venues || []);
      setStats(payload.stats || {
        totalVenues: 0,
        activeTours: 0,
        pendingTours: 0,
        totalViews: 0,
        recentViews: 0,
      });
    } catch (err: any) {
      console.error('Error fetching admin tours data:', err);
      setError(err.message || 'Failed to fetch tours data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredStats = async (filteredVenues: VenueWithTour[]) => {
    try {
      const venueIds = filteredVenues.map((v) => v.id);
      const response = await fetch('/api/admin/tours/stats', {
        method: 'POST',
        headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ venueIds }),
      });
      const filteredStats = await response.json();
      if (!response.ok) {
        throw new Error(filteredStats?.error || 'Failed to fetch filtered stats');
      }
      
      return {
        ...stats,
        totalViews: filteredStats.totalViews,
        recentViews: filteredStats.recentViews,
      };
    } catch (err: any) {
      console.error('Error fetching filtered stats:', err);
      return stats;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshData = () => {
    fetchData();
  };

  return {
    venues,
    stats,
    loading,
    error,
    refreshData,
    getFilteredStats,
  };
}
