import { supabaseServiceRole as supabase } from '../../supabase-service-role';
import { Ebook, ResourceFilters } from '../../types';

// Admin-specific interface for creating/updating ebooks
export interface AdminEbookData {
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
  is_published: boolean;
  published_at?: string | null;
  reading_time_minutes?: number | null;
}

// Get all ebooks for admin (including unpublished)
export async function getAllEbooks(filters: ResourceFilters = {}): Promise<Ebook[]> {
  try {
    let query = supabase
      .from('ebooks')
      .select('*');

    // Apply filters
    if (filters.published !== undefined) {
      query = query.eq('is_published', filters.published);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.containedBy('tags', filters.tags);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
    }

    // Sort by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching ebooks:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllEbooks:', error);
    throw error;
  }
}

// Get a single ebook by ID for admin
export async function getEbookById(ebookId: string): Promise<Ebook | null> {
  try {
    const { data, error } = await supabase
      .from('ebooks')
      .select('*')
      .eq('id', ebookId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      console.error('Error fetching ebook:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getEbookById:', error);
    throw error;
  }
}

// Create a new ebook
export async function createEbook(ebookData: AdminEbookData): Promise<Ebook> {
  try {
    // Auto-generate reading time if not provided
    if (!ebookData.reading_time_minutes && ebookData.content) {
      const wordsPerMinute = 200;
      const wordCount = ebookData.content.split(' ').length;
      ebookData.reading_time_minutes = Math.ceil(wordCount / wordsPerMinute);
    }

    // If publishing, set published_at to now if not provided
    if (ebookData.is_published && !ebookData.published_at) {
      ebookData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('ebooks')
      .insert([ebookData])
      .select()
      .single();

    if (error) {
      console.error('Error creating ebook:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createEbook:', error);
    throw error;
  }
}

// Update an existing ebook
export async function updateEbook(ebookId: string, ebookData: Partial<AdminEbookData>): Promise<Ebook> {
  try {
    // Auto-generate reading time if content changed and not explicitly set
    if (ebookData.content && !ebookData.reading_time_minutes) {
      const wordsPerMinute = 200;
      const wordCount = ebookData.content.split(' ').length;
      ebookData.reading_time_minutes = Math.ceil(wordCount / wordsPerMinute);
    }

    // If publishing for the first time, set published_at
    if (ebookData.is_published && !ebookData.published_at) {
      const { data: currentEbook } = await supabase
        .from('ebooks')
        .select('is_published, published_at')
        .eq('id', ebookId)
        .single();

      if (currentEbook && !currentEbook.is_published) {
        ebookData.published_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('ebooks')
      .update(ebookData)
      .eq('id', ebookId)
      .select()
      .single();

    if (error) {
      console.error('Error updating ebook:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateEbook:', error);
    throw error;
  }
}

// Delete an ebook
export async function deleteEbook(ebookId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('ebooks')
      .delete()
      .eq('id', ebookId);

    if (error) {
      console.error('Error deleting ebook:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteEbook:', error);
    throw error;
  }
}

// Bulk update ebooks (e.g., publish/unpublish multiple)
export async function bulkUpdateEbooks(ebookIds: string[], updates: Partial<AdminEbookData>): Promise<void> {
  try {
    const { error } = await supabase
      .from('ebooks')
      .update(updates)
      .in('id', ebookIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error bulk updating ebooks:', error);
    throw error;
  }
}

// Check if slug is unique (excluding current ebook if updating)
export async function checkEbookSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('ebooks')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.length === 0;
  } catch (error) {
    console.error('Error checking ebook slug uniqueness:', error);
    throw error;
  }
}

// Generate a unique slug from title
export async function generateUniqueEbookSlug(title: string, excludeId?: string): Promise<string> {
  try {
    // Basic slug generation
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let counter = 1;

    // Check uniqueness and append number if needed
    while (!(await checkEbookSlugUnique(slug, excludeId))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  } catch (error) {
    console.error('Error in generateUniqueEbookSlug:', error);
    throw error;
  }
}

// Get all ebook tags for filtering
export async function getAllEbookTags(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('ebooks')
      .select('tags')
      .not('tags', 'is', null);

    if (error) throw error;

    const allTags = new Set<string>();
    data.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => allTags.add(tag));
      }
    });

    return Array.from(allTags).sort();
  } catch (error) {
    console.error('Error fetching ebook tags:', error);
    throw error;
  }
} 