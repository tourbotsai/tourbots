import { useState, useCallback, useEffect, useMemo } from 'react';
import { VenueInformation } from '@/lib/types';
import { useUser } from '@/hooks/useUser';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';
import {
  getVenueInformationCompleteness,
  formatVenueInformationForPrompt,
} from '@/lib/venue-information-service';

export const useVenueInformation = () => {
  const [venueInformation, setVenueInformation] = useState<VenueInformation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();

  const venueId = user?.venue?.id;

  const fetchVenueInformationPayload = useCallback(async (method: 'GET' | 'PUT', body?: Record<string, unknown>) => {
    if (!venueId) throw new Error('No venue found for user');
    const url = method === 'GET'
      ? `/api/app/venue-information?venueId=${encodeURIComponent(venueId)}`
      : '/api/app/venue-information';
    const response = await fetch(url, {
      method,
      headers: await getAuthHeaders({
        ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      }),
      ...(method !== 'GET' ? { body: JSON.stringify({ venueId, ...(body || {}) }) } : {}),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to fetch venue information');
    }
    return payload as VenueInformation | null;
  }, [getAuthHeaders, venueId]);

  const fetchVenueInformation = useCallback(async () => {
    if (!venueId) {
      setError('No venue found for user');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchVenueInformationPayload('GET');
      setVenueInformation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchVenueInformationPayload, venueId]);

  useEffect(() => {
    if (venueId) {
      fetchVenueInformation();
    }
  }, [fetchVenueInformation, venueId]);

  const updateVenueInformation = useCallback(async (
    updates: Partial<Omit<VenueInformation, 'id' | 'venue_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!venueId) {
      throw new Error('No venue found for user');
    }

    setIsLoading(true);
    setError(null);
    try {
      const updatedInformation = await fetchVenueInformationPayload('PUT', { information: updates });
      setVenueInformation(updatedInformation);
      return updatedInformation;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchVenueInformationPayload, venueId]);

  const createVenueInformation = useCallback(async (
    information: Partial<Omit<VenueInformation, 'id' | 'venue_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!venueId) {
      throw new Error('No venue found for user');
    }

    setIsLoading(true);
    setError(null);
    try {
      const newInformation = await fetchVenueInformationPayload('PUT', { information });
      setVenueInformation(newInformation);
      return newInformation;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchVenueInformationPayload, venueId]);

  const completionPercentage = useMemo(
    () => getVenueInformationCompleteness(venueInformation),
    [venueInformation]
  );

  const hasVenueInformation = useMemo(() => !!venueInformation, [venueInformation]);

  const formattedForPrompt = useMemo(
    () => (venueInformation ? formatVenueInformationForPrompt(venueInformation) : ''),
    [venueInformation]
  );

  return {
    venueInformation,
    isLoading,
    error,
    fetchVenueInformation,
    updateVenueInformation,
    createVenueInformation,
    completionPercentage,
    hasVenueInformation,
    formattedForPrompt,
  };
};
