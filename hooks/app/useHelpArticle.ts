import { useState, useEffect } from 'react';
import { HelpArticle } from '@/lib/types';
import { 
  getHelpArticleBySlug, 
  incrementHelpArticleViews
} from '@/lib/services/help-service';

interface UseHelpArticleReturn {
  article: HelpArticle | null;
  isLoading: boolean;
  error: string | null;
}

export function useHelpArticle(slug: string): UseHelpArticleReturn {
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setError(null);
        setIsLoading(true);
        
        const articleData = await getHelpArticleBySlug(slug);
        setArticle(articleData);

        // Increment view count in background if article exists
        if (articleData) {
          incrementHelpArticleViews(articleData.id).catch(err => {
            console.warn('Failed to increment view count:', err);
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch help article');
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  return {
    article,
    isLoading,
    error,
  };
} 