import { supabaseServiceRole as supabase } from '../../supabase-service-role';
import { HelpArticle, HelpArticleFilters } from '../../types';

// Admin-specific interface for creating/updating help articles
export interface AdminHelpArticleData {
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image?: string | null;
  header_image?: string | null;
  additional_images?: string[];
  meta_title?: string | null;
  meta_description?: string | null;
  tags?: string[];
  category: 'getting-started' | 'tours' | 'chatbots' | 'analytics' | 'billing' | 'troubleshooting';
  priority: number;
  is_published: boolean;
  published_at?: string | null;
  reading_time_minutes?: number | null;
}

// Get all help articles for admin (including unpublished)
export async function getAllHelpArticles(filters: HelpArticleFilters = {}): Promise<HelpArticle[]> {
  try {
    let query = supabase
      .from('help_articles')
      .select('*')
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
    console.error('Error in getAllHelpArticles:', error);
    throw error;
  }
}

// Get a single help article by ID for admin
export async function getHelpArticleById(articleId: string): Promise<HelpArticle | null> {
  try {
    const { data, error } = await supabase
      .from('help_articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      console.error('Error fetching help article:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getHelpArticleById:', error);
    throw error;
  }
}

// Create a new help article
export async function createHelpArticle(articleData: AdminHelpArticleData): Promise<HelpArticle> {
  try {
    // Auto-generate reading time if not provided
    if (!articleData.reading_time_minutes && articleData.content) {
      const wordsPerMinute = 200;
      const wordCount = articleData.content.split(' ').length;
      articleData.reading_time_minutes = Math.ceil(wordCount / wordsPerMinute);
    }

    // If publishing, set published_at to now if not provided
    if (articleData.is_published && !articleData.published_at) {
      articleData.published_at = new Date().toISOString();
    }

    // Set default priority if not provided
    if (articleData.priority === undefined) {
      articleData.priority = 0;
    }

    const { data, error } = await supabase
      .from('help_articles')
      .insert([articleData])
      .select()
      .single();

    if (error) {
      console.error('Error creating help article:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createHelpArticle:', error);
    throw error;
  }
}

// Update an existing help article
export async function updateHelpArticle(articleId: string, articleData: Partial<AdminHelpArticleData>): Promise<HelpArticle> {
  try {
    // Auto-generate reading time if content changed and not explicitly set
    if (articleData.content && !articleData.reading_time_minutes) {
      const wordsPerMinute = 200;
      const wordCount = articleData.content.split(' ').length;
      articleData.reading_time_minutes = Math.ceil(wordCount / wordsPerMinute);
    }

    // If publishing for the first time, set published_at
    if (articleData.is_published && !articleData.published_at) {
      const { data: currentArticle } = await supabase
        .from('help_articles')
        .select('is_published, published_at')
        .eq('id', articleId)
        .single();

      if (currentArticle && !currentArticle.is_published) {
        articleData.published_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('help_articles')
      .update(articleData)
      .eq('id', articleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating help article:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateHelpArticle:', error);
    throw error;
  }
}

// Delete a help article
export async function deleteHelpArticle(articleId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('help_articles')
      .delete()
      .eq('id', articleId);

    if (error) {
      console.error('Error deleting help article:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteHelpArticle:', error);
    throw error;
  }
}

// Bulk update help articles (e.g., publish/unpublish multiple)
export async function bulkUpdateHelpArticles(articleIds: string[], updates: Partial<AdminHelpArticleData>): Promise<void> {
  try {
    const { error } = await supabase
      .from('help_articles')
      .update(updates)
      .in('id', articleIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error bulk updating help articles:', error);
    throw error;
  }
}

// Check if slug is unique (excluding current article if updating)
export async function checkSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('help_articles')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data?.length || 0) === 0;
  } catch (error) {
    console.error('Error checking slug uniqueness:', error);
    throw error;
  }
}

// Generate a unique slug from title
export async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  try {
    // Create base slug from title
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    let slug = baseSlug;
    let counter = 1;

    // Keep trying until we find a unique slug
    while (!(await checkSlugUnique(slug, excludeId))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  } catch (error) {
    console.error('Error generating unique slug:', error);
    throw error;
  }
}

// Get all unique tags from help articles
export async function getAllHelpTags(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('help_articles')
      .select('tags');

    if (error) throw error;

    // Flatten and deduplicate tags
    const allTags = data?.flatMap(article => article.tags || []) || [];
    return Array.from(new Set(allTags)).sort();
  } catch (error) {
    console.error('Error fetching help tags:', error);
    throw error;
  }
} 