import { useState, useCallback } from 'react';
import { AdminVenueCreationRequest } from '@/lib/types';

export function useVenueCreation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createVenueAccount = useCallback(async (request: AdminVenueCreationRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/venues/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create venue account');
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleSetupMode = useCallback(async (venueId: string, enableSetupMode: boolean, notes?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/venues/${venueId}/setup-mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableSetupMode, notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle setup mode');
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createVenueAccount,
    toggleSetupMode,
    isLoading,
    error,
  };
}
