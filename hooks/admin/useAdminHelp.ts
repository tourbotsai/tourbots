import { useState, useEffect, useCallback } from 'react';
import { HelpArticle, HelpArticleFilters } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

interface UseAdminHelpReturn {
  articles: HelpArticle[];
  tags: string[];
  isLoading: boolean;
  error: string | null;
  filters: HelpArticleFilters;
  selectedArticles: string[];
  totalCount: number;
  refetch: () => Promise<void>;
  updateFilters: (newFilters: Partial<HelpArticleFilters>) => void;
  clearFilters: () => void;
  selectArticle: (articleId: string) => void;
  selectAllArticles: () => void;
  clearSelection: () => void;
  bulkPublish: () => Promise<void>;
  bulkUnpublish: () => Promise<void>;
  bulkDelete: () => Promise<void>;
  deleteArticle: (articleId: string) => Promise<void>;
  createArticle: (articleData: any) => Promise<HelpArticle | null>;
  updateArticle: (articleId: string, articleData: any) => Promise<HelpArticle | null>;
}

const defaultFilters: HelpArticleFilters = {
  search: '',
  tags: [],
  category: undefined,
  limit: 50,
  offset: 0,
};

export function useAdminHelp(): UseAdminHelpReturn {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HelpArticleFilters>(defaultFilters);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  
  const { toast } = useToast();

  const fetchArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.tags && filters.tags.length > 0) queryParams.append('tags', filters.tags.join(','));
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());

      const response = await fetch(`/api/admin/help?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch help articles');
      }

      setArticles(data.articles);
      setTotalCount(data.count);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching help articles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/help?tags_only=true');
      const data = await response.json();

      if (response.ok) {
        setTags(data.tags || []);
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const refetch = useCallback(async () => {
    await Promise.all([fetchArticles(), fetchTags()]);
  }, [fetchArticles, fetchTags]);

  const updateFilters = useCallback((newFilters: Partial<HelpArticleFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 })); // Reset offset when filters change
    setSelectedArticles([]); // Clear selection when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSelectedArticles([]);
  }, []);

  const selectArticle = useCallback((articleId: string) => {
    setSelectedArticles(prev => {
      if (prev.includes(articleId)) {
        return prev.filter(id => id !== articleId);
      } else {
        return [...prev, articleId];
      }
    });
  }, []);

  const selectAllArticles = useCallback(() => {
    setSelectedArticles(articles.map(article => article.id));
  }, [articles]);

  const clearSelection = useCallback(() => {
    setSelectedArticles([]);
  }, []);

  const bulkPublish = useCallback(async () => {
    if (selectedArticles.length === 0) return;

    try {
      const response = await fetch('/api/admin/help/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleIds: selectedArticles,
          updates: { is_published: true }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish help articles');
      }

      toast({
        title: "Help Articles Published",
        description: `Successfully published ${selectedArticles.length} help article(s).`,
      });

      await refetch();
      setSelectedArticles([]);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to publish help articles.",
        variant: "destructive",
      });
    }
  }, [selectedArticles, refetch, toast]);

  const bulkUnpublish = useCallback(async () => {
    if (selectedArticles.length === 0) return;

    try {
      const response = await fetch('/api/admin/help/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleIds: selectedArticles,
          updates: { is_published: false }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unpublish help articles');
      }

      toast({
        title: "Help Articles Unpublished",
        description: `Successfully unpublished ${selectedArticles.length} help article(s).`,
      });

      await refetch();
      setSelectedArticles([]);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to unpublish help articles.",
        variant: "destructive",
      });
    }
  }, [selectedArticles, refetch, toast]);

  const bulkDelete = useCallback(async () => {
    if (selectedArticles.length === 0) return;

    try {
      // Delete articles one by one (could be optimized with a bulk delete endpoint)
      const deletePromises = selectedArticles.map(articleId =>
        fetch(`/api/admin/help/${articleId}`, { method: 'DELETE' })
      );

      const responses = await Promise.all(deletePromises);
      
      // Check if all deletions were successful
      const failed = responses.some(response => !response.ok);
      if (failed) {
        throw new Error('Some help articles could not be deleted');
      }

      toast({
        title: "Help Articles Deleted",
        description: `Successfully deleted ${selectedArticles.length} help article(s).`,
      });

      await refetch();
      setSelectedArticles([]);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete help articles.",
        variant: "destructive",
      });
    }
  }, [selectedArticles, refetch, toast]);

  const deleteArticle = useCallback(async (articleId: string) => {
    try {
      const response = await fetch(`/api/admin/help/${articleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete help article');
      }

      toast({
        title: "Help Article Deleted",
        description: "Help article has been successfully deleted.",
      });

      await refetch();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete help article.",
        variant: "destructive",
      });
    }
  }, [refetch, toast]);

  const createArticle = useCallback(async (articleData: any): Promise<HelpArticle | null> => {
    try {
      const response = await fetch('/api/admin/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create help article');
      }

      toast({
        title: "Help Article Created",
        description: "Help article has been successfully created.",
      });

      await refetch();
      return data.article;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create help article.",
        variant: "destructive",
      });
      return null;
    }
  }, [refetch, toast]);

  const updateArticle = useCallback(async (articleId: string, articleData: any): Promise<HelpArticle | null> => {
    try {
      const response = await fetch(`/api/admin/help/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update help article');
      }

      toast({
        title: "Help Article Updated",
        description: "Help article has been successfully updated.",
      });

      await refetch();
      return data.article;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update help article.",
        variant: "destructive",
      });
      return null;
    }
  }, [refetch, toast]);

  return {
    articles,
    tags,
    isLoading,
    error,
    filters,
    selectedArticles,
    totalCount,
    refetch,
    updateFilters,
    clearFilters,
    selectArticle,
    selectAllArticles,
    clearSelection,
    bulkPublish,
    bulkUnpublish,
    bulkDelete,
    deleteArticle,
    createArticle,
    updateArticle,
  };
} 