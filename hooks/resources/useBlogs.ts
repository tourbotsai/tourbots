import { useState, useEffect, useCallback } from 'react';
import { Blog, ResourceFilters } from '@/lib/types';

interface UseBlogsReturn {
  blogs: Blog[];
  tags: string[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  totalCount: number;
  updateFilters: (filters: Partial<ResourceFilters>) => void;
}

export function useBlogs(initialFilters: ResourceFilters = {}): UseBlogsReturn {
  const [blogs, setBlogs] = useState<Blog[]>([]);
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

  const fetchBlogs = useCallback(async (reset: boolean = false) => {
    try {
      setError(null);
      if (reset) {
        setIsLoading(true);
      }

      const currentFilters = reset ? { ...filters, offset: 0 } : filters;
      const params = new URLSearchParams();
      if (currentFilters.search) params.set('search', currentFilters.search);
      if (currentFilters.tags?.length) params.set('tags', currentFilters.tags.join(','));
      if (currentFilters.limit) params.set('limit', String(currentFilters.limit));
      if (typeof currentFilters.offset === 'number') params.set('offset', String(currentFilters.offset));

      const [blogsResponse, tagsResponse] = await Promise.all([
        fetch(`/api/public/resources/blogs?${params.toString()}`),
        fetch('/api/public/resources/blogs/tags'),
      ]);

      const blogsPayload = await blogsResponse.json();
      const tagsPayload = await tagsResponse.json();

      if (!blogsResponse.ok || !blogsPayload?.success) {
        throw new Error(blogsPayload?.error || 'Failed to fetch blogs');
      }

      if (!tagsResponse.ok || !tagsPayload?.success) {
        throw new Error(tagsPayload?.error || 'Failed to fetch blog tags');
      }

      const blogsData: Blog[] = blogsPayload.blogs || [];
      const tagsData: string[] = tagsPayload.tags || [];

      if (reset) {
        setBlogs(blogsData);
        setTotalCount(blogsData.length);
      } else {
        setBlogs(prev => [...prev, ...blogsData]);
      }
      
      setTags(tagsData);
      setHasMore(blogsData.length === (currentFilters.limit || 12));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch blogs');
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
    await fetchBlogs(true);
  }, [fetchBlogs]);

  // Update filters from outside
  const updateFilters = useCallback((newFilters: Partial<ResourceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
  }, []);

  useEffect(() => {
    fetchBlogs(true);
  }, [filters.search, filters.tags, filters.limit]);

  useEffect(() => {
    if (filters.offset && filters.offset > 0) {
      fetchBlogs(false);
    }
  }, [filters.offset]);

  return {
    blogs,
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