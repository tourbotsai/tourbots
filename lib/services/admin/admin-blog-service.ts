import { supabaseServiceRole as supabase } from '../../supabase-service-role';
import { Blog, ResourceFilters } from '../../types';

// Admin-specific interface for creating/updating blogs
export interface AdminBlogData {
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
  // New scheduling fields
  scheduled_publish_at?: string | null;
  is_scheduled?: boolean;
  schedule_timezone?: string;
  reading_time_minutes?: number | null;
}

// Get all blogs for admin (including unpublished)
export async function getAllBlogs(filters: ResourceFilters = {}): Promise<Blog[]> {
  try {
    let query = supabase
      .from('blogs')
      .select('*');

    // Apply filters
    if (filters.published !== undefined) {
      query = query.eq('is_published', filters.published);
    }

    if (filters.scheduled !== undefined) {
      query = query.eq('is_scheduled', filters.scheduled);
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
      console.error('Error fetching blogs:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllBlogs:', error);
    throw error;
  }
}

// Get a single blog by ID for admin
export async function getBlogById(blogId: string): Promise<Blog | null> {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', blogId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      console.error('Error fetching blog:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getBlogById:', error);
    throw error;
  }
}

// Create a new blog
export async function createBlog(blogData: AdminBlogData): Promise<Blog> {
  try {
    // Auto-generate reading time if not provided
    if (!blogData.reading_time_minutes && blogData.content) {
      const wordsPerMinute = 200;
      const wordCount = blogData.content.split(' ').length;
      blogData.reading_time_minutes = Math.ceil(wordCount / wordsPerMinute);
    }

    // If publishing, set published_at to now if not provided
    if (blogData.is_published && !blogData.published_at) {
      blogData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('blogs')
      .insert([blogData])
      .select()
      .single();

    if (error) {
      console.error('Error creating blog:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createBlog:', error);
    throw error;
  }
}

// Update an existing blog
export async function updateBlog(blogId: string, blogData: Partial<AdminBlogData>): Promise<Blog> {
  try {
    // Auto-generate reading time if content changed and not explicitly set
    if (blogData.content && !blogData.reading_time_minutes) {
      const wordsPerMinute = 200;
      const wordCount = blogData.content.split(' ').length;
      blogData.reading_time_minutes = Math.ceil(wordCount / wordsPerMinute);
    }

    // If publishing for the first time, set published_at
    if (blogData.is_published && !blogData.published_at) {
      const { data: currentBlog } = await supabase
        .from('blogs')
        .select('is_published, published_at')
        .eq('id', blogId)
        .single();

      if (currentBlog && !currentBlog.is_published) {
        blogData.published_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('blogs')
      .update(blogData)
      .eq('id', blogId)
      .select()
      .single();

    if (error) {
      console.error('Error updating blog:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateBlog:', error);
    throw error;
  }
}

// Delete a blog
export async function deleteBlog(blogId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', blogId);

    if (error) {
      console.error('Error deleting blog:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteBlog:', error);
    throw error;
  }
}

// Bulk update blogs (e.g., publish/unpublish multiple)
export async function bulkUpdateBlogs(blogIds: string[], updates: Partial<AdminBlogData>): Promise<void> {
  try {
    const { error } = await supabase
      .from('blogs')
      .update(updates)
      .in('id', blogIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error bulk updating blogs:', error);
    throw error;
  }
}

// Check if slug is unique (excluding current blog if updating)
export async function checkSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('blogs')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.length === 0;
  } catch (error) {
    console.error('Error checking slug uniqueness:', error);
    throw error;
  }
}

// Generate a unique slug from title
export async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  try {
    // Basic slug generation
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let counter = 1;

    // Check uniqueness and append number if needed
    while (!(await checkSlugUnique(slug, excludeId))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  } catch (error) {
    console.error('Error in generateUniqueSlug:', error);
    throw error;
  }
}

// Get all blog tags for filtering
export async function getAllBlogTags(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('blogs')
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
    console.error('Error fetching blog tags:', error);
    throw error;
  }
}

// Get blogs that are scheduled to be published
export async function getScheduledBlogs(): Promise<Blog[]> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('is_scheduled', true)
      .eq('is_published', false)
      .lte('scheduled_publish_at', now)
      .order('scheduled_publish_at', { ascending: true });

    if (error) {
      console.error('Error fetching scheduled blogs:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getScheduledBlogs:', error);
    throw error;
  }
}

// Publish a scheduled blog
export async function publishScheduledBlog(blogId: string): Promise<Blog> {
  try {
    const updateData = {
      is_published: true,
      is_scheduled: false,
      published_at: new Date().toISOString(),
      scheduled_publish_at: null
    };
    
    const { data, error } = await supabase
      .from('blogs')
      .update(updateData)
      .eq('id', blogId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error publishing scheduled blog:', error.message);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from blog update');
    }

    return data;
  } catch (error) {
    console.error('💥 Error in publishScheduledBlog:', error instanceof Error ? error.message : error);
    throw error;
  }
}

// Schedule a blog for future publishing
export async function scheduleBlog(
  blogId: string, 
  scheduledPublishAt: string,
  timezone: string = 'Europe/London'
): Promise<Blog> {
  try {
    const updateData = {
      is_scheduled: true,
      is_published: false,
      scheduled_publish_at: scheduledPublishAt,
      schedule_timezone: timezone,
      published_at: null
    };

    const { data, error } = await supabase
      .from('blogs')
      .update(updateData)
      .eq('id', blogId)
      .select()
      .single();

    if (error) {
      console.error('Error scheduling blog:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in scheduleBlog:', error);
    throw error;
  }
}

// Cancel scheduled publishing
export async function cancelScheduledBlog(blogId: string): Promise<Blog> {
  try {
    const updateData = {
      is_scheduled: false,
      scheduled_publish_at: null,
      schedule_timezone: null
    };

    const { data, error } = await supabase
      .from('blogs')
      .update(updateData)
      .eq('id', blogId)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling scheduled blog:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in cancelScheduledBlog:', error);
    throw error;
  }
} 