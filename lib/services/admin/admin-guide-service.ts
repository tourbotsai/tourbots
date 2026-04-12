import { supabaseServiceRole as supabase } from '../../supabase-service-role';
import { Guide, ResourceFilters } from '../../types';

// Admin-specific interface for creating/updating guides
export interface AdminGuideData {
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
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_published: boolean;
  published_at?: string | null;
  reading_time_minutes?: number | null;
}

// Get all guides for admin (including unpublished)
export async function getAllGuides(filters: ResourceFilters = {}): Promise<Guide[]> {
  try {
    let query = supabase
      .from('guides')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters.difficulty) {
      query = query.eq('difficulty_level', filters.difficulty);
    }

    if (filters.published !== undefined) {
      query = query.eq('is_published', filters.published);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching guides:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllGuides:', error);
    throw error;
  }
}

// Get a single guide by ID for admin
export async function getGuideById(guideId: string): Promise<Guide | null> {
  try {
    const { data, error } = await supabase
      .from('guides')
      .select('*')
      .eq('id', guideId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      console.error('Error fetching guide:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getGuideById:', error);
    throw error;
  }
}

// Create a new guide
export async function createGuide(guideData: AdminGuideData): Promise<Guide> {
  try {
    // Auto-generate reading time if not provided
    if (!guideData.reading_time_minutes && guideData.content) {
      const wordsPerMinute = 200;
      const wordCount = guideData.content.split(' ').length;
      guideData.reading_time_minutes = Math.ceil(wordCount / wordsPerMinute);
    }

    // If publishing, set published_at to now if not provided
    if (guideData.is_published && !guideData.published_at) {
      guideData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('guides')
      .insert([guideData])
      .select()
      .single();

    if (error) {
      console.error('Error creating guide:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createGuide:', error);
    throw error;
  }
}

// Update an existing guide
export async function updateGuide(guideId: string, guideData: Partial<AdminGuideData>): Promise<Guide> {
  try {
    // Auto-generate reading time if content changed and not explicitly set
    if (guideData.content && !guideData.reading_time_minutes) {
      const wordsPerMinute = 200;
      const wordCount = guideData.content.split(' ').length;
      guideData.reading_time_minutes = Math.ceil(wordCount / wordsPerMinute);
    }

    // If publishing for the first time, set published_at
    if (guideData.is_published && !guideData.published_at) {
      const { data: currentGuide } = await supabase
        .from('guides')
        .select('is_published, published_at')
        .eq('id', guideId)
        .single();

      if (currentGuide && !currentGuide.is_published) {
        guideData.published_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('guides')
      .update(guideData)
      .eq('id', guideId)
      .select()
      .single();

    if (error) {
      console.error('Error updating guide:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateGuide:', error);
    throw error;
  }
}

// Delete a guide
export async function deleteGuide(guideId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('guides')
      .delete()
      .eq('id', guideId);

    if (error) {
      console.error('Error deleting guide:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteGuide:', error);
    throw error;
  }
}

// Bulk update guides (e.g., publish/unpublish multiple)
export async function bulkUpdateGuides(guideIds: string[], updates: Partial<AdminGuideData>): Promise<void> {
  try {
    const { error } = await supabase
      .from('guides')
      .update(updates)
      .in('id', guideIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error bulk updating guides:', error);
    throw error;
  }
}

// Check if slug is unique (excluding current guide if updating)
export async function checkGuideSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('guides')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.length === 0;
  } catch (error) {
    console.error('Error checking guide slug uniqueness:', error);
    throw error;
  }
}

// Generate a unique slug from title
export async function generateUniqueGuideSlug(title: string, excludeId?: string): Promise<string> {
  try {
    // Basic slug generation
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let counter = 1;

    // Check uniqueness and append number if needed
    while (!(await checkGuideSlugUnique(slug, excludeId))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  } catch (error) {
    console.error('Error in generateUniqueGuideSlug:', error);
    throw error;
  }
}

// Get all unique tags from all guides (including unpublished)
export async function getAllGuideTags(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('guides')
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
    console.error('Error fetching guide tags:', error);
    throw error;
  }
} 