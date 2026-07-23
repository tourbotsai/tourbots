"use client";

import { useEffect, useState } from 'react';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

export function usePreviewEmbedToken(
  venueId?: string | null,
  embedId?: string | null,
  agencyShareSlug?: string | null
) {
  const { getAuthHeaders } = useAuthHeaders();
  const [embedToken, setEmbedToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEmbedToken(null);

    if (!venueId || !embedId) return;

    void (async () => {
      try {
        const response = await fetch(
          agencyShareSlug
            ? '/api/public/agency-portal/preview-token'
            : '/api/app/chatbots/preview-token',
          {
          method: 'POST',
            headers: agencyShareSlug
              ? { 'Content-Type': 'application/json' }
              : await getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ venueId, embedId, shareSlug: agencyShareSlug }),
          }
        );
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && typeof data.embedToken === 'string') {
          setEmbedToken(data.embedToken);
        }
      } catch (error) {
        console.error('Failed to load chatbot preview capability:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [agencyShareSlug, embedId, getAuthHeaders, venueId]);

  return embedToken;
}
