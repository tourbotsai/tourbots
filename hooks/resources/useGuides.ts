import { useState, useEffect, useCallback } from 'react';
import { Guide, ResourceFilters } from '@/lib/types';

interface UseGuidesReturn {
  guides: Guide[];
  tags: string[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  totalCount: number;
  updateFilters: (filters: Partial<ResourceFilters>) => void;
}

export function useGuides(initialFilters: ResourceFilters = {}): UseGuidesReturn {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<ResourceFilters>({
    limit: 12,
    offset: 0,
    ...initialFilters,
  });

  const fetchGuides = useCallback(async (reset: boolean = false) => {
    try {
      setError(null);
      if (reset) {
        setIsLoading(true);
      }

      const currentFilters = reset ? { ...filters, offset: 0 } : filters;
      const params = new URLSearchParams();
      if (currentFilters.search) params.set('search', currentFilters.search);
      if (currentFilters.tags?.length) params.set('tags', currentFilters.tags.join(','));
      if (currentFilters.difficulty) params.set('difficulty', currentFilters.difficulty);
      if (currentFilters.limit) params.set('limit', String(currentFilters.limit));
      if (typeof currentFilters.offset === 'number') params.set('offset', String(currentFilters.offset));

      const [guidesResponse, tagsResponse] = await Promise.all([
        fetch(`/api/public/resources/guides?${params.toString()}`),
        fetch('/api/public/resources/guides/tags'),
      ]);

      const guidesPayload = await guidesResponse.json();
      const tagsPayload = await tagsResponse.json();

      if (!guidesResponse.ok || !guidesPayload?.success) {
        throw new Error(guidesPayload?.error || 'Failed to fetch guides');
      }

      if (!tagsResponse.ok || !tagsPayload?.success) {
        throw new Error(tagsPayload?.error || 'Failed to fetch guide tags');
      }

      const guidesData: Guide[] = guidesPayload.guides || [];
      const tagsData: string[] = tagsPayload.tags || [];

      if (reset) {
        setGuides(guidesData);
        setTotalCount(guidesData.length);
      } else {
        setGuides(prev => [...prev, ...guidesData]);
      }
      
      setTags(tagsData);
      setHasMore(guidesData.length === (currentFilters.limit || 12));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch guides');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    setFilters(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 12),
    }));
  }, [hasMore, isLoading]);

  const refetch = useCallback(async () => {
    await fetchGuides(true);
  }, [fetchGuides]);

  // Update filters from outside
  const updateFilters = useCallback((newFilters: Partial<ResourceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
  }, []);

  useEffect(() => {
    fetchGuides(true);
  }, [filters.search, filters.tags, filters.difficulty, filters.limit]);

  useEffect(() => {
    if (filters.offset && filters.offset > 0) {
      fetchGuides(false);
    }
  }, [filters.offset]);

  return {
    guides,
    tags,
    isLoading,
    error,
    refetch,
    hasMore,
    loadMore,
    totalCount,
    updateFilters,
  };
} 