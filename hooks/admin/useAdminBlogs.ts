import { useState, useEffect, useCallback } from 'react';
import { Blog, ResourceFilters } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

interface UseAdminBlogsReturn {
  blogs: Blog[];
  tags: string[];
  isLoading: boolean;
  error: string | null;
  filters: ResourceFilters;
  selectedBlogs: string[];
  totalCount: number;
  refetch: () => Promise<void>;
  updateFilters: (newFilters: Partial<ResourceFilters>) => void;
  clearFilters: () => void;
  selectBlog: (blogId: string) => void;
  selectAllBlogs: () => void;
  clearSelection: () => void;
  bulkPublish: () => Promise<void>;
  bulkUnpublish: () => Promise<void>;
  bulkDelete: () => Promise<void>;
  deleteBlog: (blogId: string) => Promise<void>;
  createBlog: (blogData: any) => Promise<Blog | null>;
  updateBlog: (blogId: string, blogData: any) => Promise<Blog | null>;
}

const defaultFilters: ResourceFilters = {
  search: '',
  tags: [],
  published: undefined,
  limit: 50,
  offset: 0,
};

export function useAdminBlogs(): UseAdminBlogsReturn {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ResourceFilters>(defaultFilters);
  const [selectedBlogs, setSelectedBlogs] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  
  const { toast } = useToast();

  const fetchBlogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.tags && filters.tags.length > 0) queryParams.append('tags', filters.tags.join(','));
      if (filters.published !== undefined) queryParams.append('published', filters.published.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());

      const response = await fetch(`/api/admin/resources/blogs?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch blogs');
      }

      setBlogs(data.blogs);
      setTotalCount(data.count);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching blogs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/resources/blogs?tags_only=true');
      const data = await response.json();

      if (response.ok) {
        setTags(data.tags || []);
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const refetch = useCallback(async () => {
    await Promise.all([fetchBlogs(), fetchTags()]);
  }, [fetchBlogs, fetchTags]);

  const updateFilters = useCallback((newFilters: Partial<ResourceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 })); // Reset offset when filters change
    setSelectedBlogs([]); // Clear selection when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSelectedBlogs([]);
  }, []);

  const selectBlog = useCallback((blogId: string) => {
    setSelectedBlogs(prev => {
      if (prev.includes(blogId)) {
        return prev.filter(id => id !== blogId);
      } else {
        return [...prev, blogId];
      }
    });
  }, []);

  const selectAllBlogs = useCallback(() => {
    setSelectedBlogs(blogs.map(blog => blog.id));
  }, [blogs]);

  const clearSelection = useCallback(() => {
    setSelectedBlogs([]);
  }, []);

  const bulkPublish = useCallback(async () => {
    if (selectedBlogs.length === 0) return;

    try {
      const response = await fetch('/api/admin/resources/blogs/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogIds: selectedBlogs,
          updates: { is_published: true }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish blogs');
      }

      toast({
        title: "Blogs Published",
        description: `Successfully published ${selectedBlogs.length} blog(s).`,
      });

      await refetch();
      setSelectedBlogs([]);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to publish blogs.",
        variant: "destructive",
      });
    }
  }, [selectedBlogs, refetch, toast]);

  const bulkUnpublish = useCallback(async () => {
    if (selectedBlogs.length === 0) return;

    try {
      const response = await fetch('/api/admin/resources/blogs/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogIds: selectedBlogs,
          updates: { is_published: false }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unpublish blogs');
      }

      toast({
        title: "Blogs Unpublished",
        description: `Successfully unpublished ${selectedBlogs.length} blog(s).`,
      });

      await refetch();
      setSelectedBlogs([]);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to unpublish blogs.",
        variant: "destructive",
      });
    }
  }, [selectedBlogs, refetch, toast]);

  const bulkDelete = useCallback(async () => {
    if (selectedBlogs.length === 0) return;

    try {
      const deletePromises = selectedBlogs.map(blogId =>
        fetch(`/api/admin/resources/blogs/${blogId}`, { method: 'DELETE' })
      );

      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter(response => !response.ok);

      if (failedDeletes.length > 0) {
        throw new Error(`Failed to delete ${failedDeletes.length} blog(s)`);
      }

      toast({
        title: "Blogs Deleted",
        description: `Successfully deleted ${selectedBlogs.length} blog(s).`,
      });

      await refetch();
      setSelectedBlogs([]);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete blogs.",
        variant: "destructive",
      });
    }
  }, [selectedBlogs, refetch, toast]);

  const deleteBlog = useCallback(async (blogId: string) => {
    try {
      const response = await fetch(`/api/admin/resources/blogs/${blogId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete blog');
      }

      toast({
        title: "Blog Deleted",
        description: "Blog has been deleted successfully.",
      });

      await refetch();
      setSelectedBlogs(prev => prev.filter(id => id !== blogId));
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete blog.",
        variant: "destructive",
      });
    }
  }, [refetch, toast]);

  const createBlog = useCallback(async (blogData: any): Promise<Blog | null> => {
    try {
      const response = await fetch('/api/admin/resources/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create blog');
      }

      toast({
        title: "Blog Created",
        description: "Blog has been created successfully.",
      });

      await refetch();
      return data.blog;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create blog.",
        variant: "destructive",
      });
      return null;
    }
  }, [refetch, toast]);

  const updateBlog = useCallback(async (blogId: string, blogData: any): Promise<Blog | null> => {
    try {
      const response = await fetch(`/api/admin/resources/blogs/${blogId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update blog');
      }

      toast({
        title: "Blog Updated",
        description: "Blog has been updated successfully.",
      });

      await refetch();
      return data.blog;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update blog.",
        variant: "destructive",
      });
      return null;
    }
  }, [refetch, toast]);

  return {
    blogs,
    tags,
    isLoading,
    error,
    filters,
    selectedBlogs,
    totalCount,
    refetch,
    updateFilters,
    clearFilters,
    selectBlog,
    selectAllBlogs,
    clearSelection,
    bulkPublish,
    bulkUnpublish,
    bulkDelete,
    deleteBlog,
    createBlog,
    updateBlog,
  };
} 