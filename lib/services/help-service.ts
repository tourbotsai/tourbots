import { supabase } from '../supabase';
import { HelpArticle, HelpArticleFilters, HelpCategory } from '../types';

// Get all published help articles with optional filtering
export async function getHelpArticles(filters: HelpArticleFilters = {}): Promise<HelpArticle[]> {
  try {
    let query = supabase
      .from('help_articles')
      .select('*')
      .eq('is_published', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching help articles:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getHelpArticles:', error);
    throw error;
  }
}

// Get a single help article by slug
export async function getHelpArticleBySlug(slug: string): Promise<HelpArticle | null> {
  try {
    const { data, error } = await supabase
      .from('help_articles')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      console.error('Error fetching help article:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getHelpArticleBySlug:', error);
    throw error;
  }
}

// Increment help article view count
export async function incrementHelpArticleViews(articleId: string): Promise<void> {
  try {
    // First get current view count
    const { data: currentArticle } = await supabase
      .from('help_articles')
      .select('view_count')
      .eq('id', articleId)
      .single();

    if (currentArticle) {
      const { error } = await supabase
        .from('help_articles')
        .update({ view_count: (currentArticle.view_count || 0) + 1 })
        .eq('id', articleId);

      if (error) {
        console.error('Error incrementing help article views:', error);
        // Don't throw here - view count is not critical
      }
    }
  } catch (error) {
    console.error('Error in incrementHelpArticleViews:', error);
    // Don't throw here - view count is not critical
  }
}

// Get featured help articles (highest priority articles)
export async function getFeaturedHelpArticles(limit: number = 6): Promise<HelpArticle[]> {
  try {
    const { data, error } = await supabase
      .from('help_articles')
      .select('*')
      .eq('is_published', true)
      .order('priority', { ascending: false })
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured help articles:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getFeaturedHelpArticles:', error);
    throw error;
  }
}

// Get help articles by category
export async function getHelpArticlesByCategory(category: string, limit?: number): Promise<HelpArticle[]> {
  try {
    let query = supabase
      .from('help_articles')
      .select('*')
      .eq('is_published', true)
      .eq('category', category)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching help articles by category:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getHelpArticlesByCategory:', error);
    throw error;
  }
}

// Get help categories with article counts
export async function getHelpCategories(): Promise<HelpCategory[]> {
  try {
    const categories = [
      { 
        id: 'getting-started', 
        name: 'Getting Started', 
        slug: 'getting-started',
        description: 'Everything you need to get started quickly',
        icon: '🚀',
        sort_order: 1 
      },
      { 
        id: 'tours', 
        name: 'Virtual Tours', 
        slug: 'tours',
        description: 'Creating and managing your virtual tours',
        icon: '🏃‍♂️',
        sort_order: 2 
      },
      { 
        id: 'chatbots', 
        name: 'AI Chatbots', 
        slug: 'chatbots',
        description: 'Setting up and customising your AI bots',
        icon: '🤖',
        sort_order: 3 
      },
      { 
        id: 'analytics', 
        name: 'Analytics & Leads', 
        slug: 'analytics',
        description: 'Understanding metrics and managing data well',
        icon: '📊',
        sort_order: 4 
      },
      { 
        id: 'billing', 
        name: 'Billing & Plans', 
        slug: 'billing',
        description: 'Subscription plans, billing, and payments',
        icon: '💳',
        sort_order: 5 
      },
      { 
        id: 'troubleshooting', 
        name: 'Troubleshooting', 
        slug: 'troubleshooting',
        description: 'Solutions to common issues and all problems',
        icon: '🔧',
        sort_order: 6 
      }
    ];

    // Get article counts for each category
    const { data: articleCounts, error } = await supabase
      .from('help_articles')
      .select('category')
      .eq('is_published', true);

    if (error) {
      console.error('Error fetching article counts:', error);
      throw error;
    }

    // Count articles per category
    const counts = articleCounts?.reduce((acc: Record<string, number>, article) => {
      acc[article.category] = (acc[article.category] || 0) + 1;
      return acc;
    }, {}) || {};

    // Add counts to categories
    return categories.map(category => ({
      ...category,
      article_count: counts[category.id] || 0
    }));
  } catch (error) {
    console.error('Error in getHelpCategories:', error);
    throw error;
  }
}

// Get all unique tags from published help articles
export async function getHelpArticleTags(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('help_articles')
      .select('tags')
      .eq('is_published', true);

    if (error) {
      console.error('Error fetching help article tags:', error);
      throw error;
    }

    // Flatten and deduplicate tags
    const allTags = data?.flatMap(article => article.tags || []) || [];
    return Array.from(new Set(allTags)).sort();
  } catch (error) {
    console.error('Error in getHelpArticleTags:', error);
    throw error;
  }
}

// Get popular help articles (most viewed)
export async function getPopularHelpArticles(limit: number = 5): Promise<HelpArticle[]> {
  try {
    const { data, error } = await supabase
      .from('help_articles')
      .select('*')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching popular help articles:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPopularHelpArticles:', error);
    throw error;
  }
}

// Search help articles
export async function searchHelpArticles(query: string, limit: number = 10): Promise<HelpArticle[]> {
  try {
    const { data, error } = await supabase
      .from('help_articles')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching help articles:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchHelpArticles:', error);
    throw error;
  }
} 