import { useState, useEffect, useCallback } from 'react';
import { HelpArticle, HelpArticleFilters, HelpCategory } from '@/lib/types';
import { 
  getHelpArticles, 
  getHelpArticleTags, 
  getHelpCategories,
  getFeaturedHelpArticles 
} from '@/lib/services/help-service';

interface UseHelpArticlesReturn {
  articles: HelpArticle[];
  featuredArticles: HelpArticle[];
  categories: HelpCategory[];
  tags: string[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  totalCount: number;
  updateFilters: (filters: Partial<HelpArticleFilters>) => void;
}

export function useHelpArticles(initialFilters: HelpArticleFilters = {}): UseHelpArticlesReturn {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<HelpArticle[]>([]);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<HelpArticleFilters>({
    limit: 12,
    offset: 0,
    ...initialFilters,
  });

  const fetchArticles = useCallback(async (reset: boolean = false) => {
    try {
      setError(null);
      if (reset) {
        setIsLoading(true);
      }

      const currentFilters = reset ? { ...filters, offset: 0 } : filters;
      const [articlesData, tagsData, categoriesData, featuredData] = await Promise.all([
        getHelpArticles(currentFilters),
        getHelpArticleTags(),
        getHelpCategories(),
        reset ? getFeaturedHelpArticles() : Promise.resolve(featuredArticles)
      ]);

      if (reset) {
        setArticles(articlesData);
        setTotalCount(articlesData.length);
        setFeaturedArticles(featuredData);
      } else {
        setArticles(prev => [...prev, ...articlesData]);
      }
      
      setTags(tagsData);
      setCategories(categoriesData);
      setHasMore(articlesData.length === (currentFilters.limit || 12));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch help articles');
    } finally {
      setIsLoading(false);
    }
  }, [filters, featuredArticles]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    setFilters(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 12),
    }));
  }, [hasMore, isLoading]);

  const refetch = useCallback(async () => {
    await fetchArticles(true);
  }, [fetchArticles]);

  // Update filters from outside
  const updateFilters = useCallback((newFilters: Partial<HelpArticleFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
  }, []);

  useEffect(() => {
    fetchArticles(true);
  }, [filters.search, filters.category, filters.tags, filters.limit]);

  useEffect(() => {
    if (filters.offset && filters.offset > 0) {
      fetchArticles(false);
    }
  }, [filters.offset]);

  return {
    articles,
    featuredArticles,
    categories,
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