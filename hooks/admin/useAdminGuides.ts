import { useState, useEffect, useCallback } from 'react';
import { Guide, ResourceFilters } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

interface UseAdminGuidesReturn {
  guides: Guide[];
  tags: string[];
  isLoading: boolean;
  error: string | null;
  filters: ResourceFilters;
  selectedGuides: string[];
  totalCount: number;
  refetch: () => Promise<void>;
  updateFilters: (newFilters: Partial<ResourceFilters>) => void;
  clearFilters: () => void;
  selectGuide: (guideId: string) => void;
  selectAllGuides: () => void;
  clearSelection: () => void;
  bulkPublish: () => Promise<void>;
  bulkUnpublish: () => Promise<void>;
  bulkDelete: () => Promise<void>;
  deleteGuide: (guideId: string) => Promise<void>;
  createGuide: (guideData: any) => Promise<Guide | null>;
  updateGuide: (guideId: string, guideData: any) => Promise<Guide | null>;
}

const defaultFilters: ResourceFilters = {
  search: '',
  tags: [],
  difficulty: undefined,
  published: undefined,
  limit: 50,
  offset: 0,
};

export function useAdminGuides(): UseAdminGuidesReturn {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ResourceFilters>(defaultFilters);
  const [selectedGuides, setSelectedGuides] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  
  const { toast } = useToast();

  const fetchGuides = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.tags && filters.tags.length > 0) queryParams.append('tags', filters.tags.join(','));
      if (filters.difficulty) queryParams.append('difficulty', filters.difficulty);
      if (filters.published !== undefined) queryParams.append('published', filters.published.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());

      const response = await fetch(`/api/admin/resources/guides?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch guides');
      }

      setGuides(data.guides);
      setTotalCount(data.count);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching guides:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/resources/guides?tags_only=true');
      const data = await response.json();

      if (response.ok) {
        setTags(data.tags || []);
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  }, []);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const refetch = useCallback(async () => {
    await Promise.all([fetchGuides(), fetchTags()]);
  }, [fetchGuides, fetchTags]);

  const updateFilters = useCallback((newFilters: Partial<ResourceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 })); // Reset offset when filters change
    setSelectedGuides([]); // Clear selection when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSelectedGuides([]);
  }, []);

  const selectGuide = useCallback((guideId: string) => {
    setSelectedGuides(prev => {
      if (prev.includes(guideId)) {
        return prev.filter(id => id !== guideId);
      } else {
        return [...prev, guideId];
      }
    });
  }, []);

  const selectAllGuides = useCallback(() => {
    setSelectedGuides(guides.map(guide => guide.id));
  }, [guides]);

  const clearSelection = useCallback(() => {
    setSelectedGuides([]);
  }, []);

  const bulkPublish = useCallback(async () => {
    if (selectedGuides.length === 0) return;

    try {
      const response = await fetch('/api/admin/resources/guides/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideIds: selectedGuides,
          updates: { is_published: true }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish guides');
      }

      toast({
        title: "Guides Published",
        description: `Successfully published ${selectedGuides.length} guide(s).`,
      });

      await refetch();
      setSelectedGuides([]);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to publish guides.",
        variant: "destructive",
      });
    }
  }, [selectedGuides, refetch, toast]);

  const bulkUnpublish = useCallback(async () => {
    if (selectedGuides.length === 0) return;

    try {
      const response = await fetch('/api/admin/resources/guides/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideIds: selectedGuides,
          updates: { is_published: false }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unpublish guides');
      }

      toast({
        title: "Guides Unpublished",
        description: `Successfully unpublished ${selectedGuides.length} guide(s).`,
      });

      await refetch();
      setSelectedGuides([]);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to unpublish guides.",
        variant: "destructive",
      });
    }
  }, [selectedGuides, refetch, toast]);

  const bulkDelete = useCallback(async () => {
    if (selectedGuides.length === 0) return;

    try {
      const deletePromises = selectedGuides.map(guideId =>
        fetch(`/api/admin/resources/guides/${guideId}`, { method: 'DELETE' })
      );

      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter(response => !response.ok);

      if (failedDeletes.length > 0) {
        throw new Error(`Failed to delete ${failedDeletes.length} guide(s)`);
      }

      toast({
        title: "Guides Deleted",
        description: `Successfully deleted ${selectedGuides.length} guide(s).`,
      });

      await refetch();
      setSelectedGuides([]);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete guides.",
        variant: "destructive",
      });
    }
  }, [selectedGuides, refetch, toast]);

  const deleteGuide = useCallback(async (guideId: string) => {
    try {
      const response = await fetch(`/api/admin/resources/guides/${guideId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete guide');
      }

      toast({
        title: "Guide Deleted",
        description: "Guide has been deleted successfully.",
      });

      await refetch();
      setSelectedGuides(prev => prev.filter(id => id !== guideId));
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete guide.",
        variant: "destructive",
      });
    }
  }, [refetch, toast]);

  const createGuide = useCallback(async (guideData: any): Promise<Guide | null> => {
    try {
      const response = await fetch('/api/admin/resources/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guideData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create guide');
      }

      toast({
        title: "Guide Created",
        description: "Guide has been created successfully.",
      });

      await refetch();
      return data.guide;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create guide.",
        variant: "destructive",
      });
      return null;
    }
  }, [refetch, toast]);

  const updateGuide = useCallback(async (guideId: string, guideData: any): Promise<Guide | null> => {
    try {
      const response = await fetch(`/api/admin/resources/guides/${guideId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guideData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update guide');
      }

      toast({
        title: "Guide Updated",
        description: "Guide has been updated successfully.",
      });

      await refetch();
      return data.guide;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update guide.",
        variant: "destructive",
      });
      return null;
    }
  }, [refetch, toast]);

  return {
    guides,
    tags,
    isLoading,
    error,
    filters,
    selectedGuides,
    totalCount,
    refetch,
    updateFilters,
    clearFilters,
    selectGuide,
    selectAllGuides,
    clearSelection,
    bulkPublish,
    bulkUnpublish,
    bulkDelete,
    deleteGuide,
    createGuide,
    updateGuide,
  };
} 