import { useState, useEffect } from 'react';
import { Guide } from '@/lib/types';

interface UseGuideReturn {
  guide: Guide | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
}

export function useGuide(slug: string): UseGuideReturn {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    const fetchGuide = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setNotFound(false);

        const response = await fetch(`/api/public/resources/guides/${encodeURIComponent(slug)}`);
        const payload = await response.json();

        if (response.status === 404) {
          setNotFound(true);
          setGuide(null);
          return;
        }

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'Failed to fetch guide');
        }

        const guideData: Guide | null = payload.guide || null;
        
        if (!guideData) {
          setNotFound(true);
          setGuide(null);
        } else {
          setGuide(guideData);
          // Increment view count in the background
          fetch(`/api/public/resources/guides/views/${guideData.id}`, {
            method: 'POST',
          }).catch(err => {
            console.warn('Failed to increment guide views:', err);
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch guide');
        setGuide(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuide();
  }, [slug]);

  return {
    guide,
    isLoading,
    error,
    notFound,
  };
} 