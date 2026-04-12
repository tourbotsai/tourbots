import { useState, useEffect } from 'react';
import { Blog } from '@/lib/types';

interface UseBlogReturn {
  blog: Blog | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
}

export function useBlog(slug: string): UseBlogReturn {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    const fetchBlog = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setNotFound(false);

        const response = await fetch(`/api/public/resources/blogs/${encodeURIComponent(slug)}`);
        const payload = await response.json();

        if (response.status === 404) {
          setNotFound(true);
          setBlog(null);
          return;
        }

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'Failed to fetch blog');
        }

        const blogData: Blog | null = payload.blog || null;
        
        if (!blogData) {
          setNotFound(true);
          setBlog(null);
        } else {
          setBlog(blogData);
          // Increment view count in the background
          fetch(`/api/public/resources/blogs/views/${blogData.id}`, {
            method: 'POST',
          }).catch(err => {
            console.warn('Failed to increment blog views:', err);
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch blog');
        setBlog(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  return {
    blog,
    isLoading,
    error,
    notFound,
  };
} 