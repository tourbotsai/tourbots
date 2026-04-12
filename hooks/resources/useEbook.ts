import { useState, useEffect } from 'react';
import { Ebook } from '@/lib/types';
import { getEbookBySlug, incrementEbookViews } from '@/lib/services/ebook-service';

interface UseEbookReturn {
  ebook: Ebook | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
}

export function useEbook(slug: string): UseEbookReturn {
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    const fetchEbook = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setNotFound(false);

        const ebookData = await getEbookBySlug(slug);
        
        if (!ebookData) {
          setNotFound(true);
          setEbook(null);
        } else {
          setEbook(ebookData);
          // Increment view count in the background
          incrementEbookViews(ebookData.id).catch(err => {
            console.warn('Failed to increment ebook views:', err);
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch ebook');
        setEbook(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEbook();
  }, [slug]);

  return {
    ebook,
    isLoading,
    error,
    notFound,
  };
} 