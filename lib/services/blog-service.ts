import { supabase } from '../supabase';
import { Blog, ResourceFilters } from '../types';

// Primary new table for frontend blog content.
// Falls back to legacy 'blogs' until migration is complete.
const FRONTEND_BLOG_TABLE = 'resource_blog_posts';
const LEGACY_BLOG_TABLE = 'blogs';

type RawBlog = Record<string, any>;

function toBlog(raw: RawBlog): Blog {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt ?? raw.summary ?? null,
    content: raw.content ?? raw.body_markdown ?? '',
    cover_image: raw.cover_image ?? raw.cover_image_url ?? null,
    header_image: raw.header_image ?? raw.header_image_url ?? null,
    additional_images: raw.additional_images ?? raw.gallery_images ?? [],
    meta_title: raw.meta_title ?? null,
    meta_description: raw.meta_description ?? null,
    tags: raw.tags ?? [],
    is_published: raw.is_published ?? raw.is_live ?? false,
    published_at: raw.published_at ?? raw.published_on ?? null,
    scheduled_publish_at: raw.scheduled_publish_at ?? null,
    is_scheduled: raw.is_scheduled ?? false,
    schedule_timezone: raw.schedule_timezone ?? undefined,
    view_count: raw.view_count ?? raw.views ?? 0,
    reading_time_minutes: raw.reading_time_minutes ?? raw.estimated_read_minutes ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

function isMissingTable(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === '42P01' ||
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('schema cache')
  );
}

async function queryBlogsTable(
  tableName: string,
  filters: ResourceFilters = {}
): Promise<RawBlog[]> {
  let query = supabase
    .from(tableName)
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
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
    throw error;
  }

  return data || [];
}

async function queryBlogBySlug(tableName: string, slug: string): Promise<RawBlog | null> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

async function fetchFromPrimaryThenLegacy<T>(
  primary: () => Promise<T>,
  legacy: () => Promise<T>
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    if (!isMissingTable(error)) throw error;
    return legacy();
  }
}

export async function getBlogs(filters: ResourceFilters = {}): Promise<Blog[]> {
  try {
    const rows = await fetchFromPrimaryThenLegacy(
      () => queryBlogsTable(FRONTEND_BLOG_TABLE, filters),
      () => queryBlogsTable(LEGACY_BLOG_TABLE, filters)
    );
    return rows.map(toBlog);
  } catch (error) {
    console.error('Error in getBlogs:', error);
    throw error;
  }
}

export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  try {
    const row = await fetchFromPrimaryThenLegacy(
      () => queryBlogBySlug(FRONTEND_BLOG_TABLE, slug),
      () => queryBlogBySlug(LEGACY_BLOG_TABLE, slug)
    );
    return row ? toBlog(row) : null;
  } catch (error) {
    console.error('Error in getBlogBySlug:', error);
    throw error;
  }
}

export async function incrementBlogViews(blogId: string): Promise<void> {
  try {
    const updateViews = async (tableName: string) => {
      const { data: currentBlog, error: fetchError } = await supabase
        .from(tableName)
        .select('view_count')
        .eq('id', blogId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentBlog) return;

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ view_count: (currentBlog.view_count || 0) + 1 })
        .eq('id', blogId);

      if (updateError) throw updateError;
    };

    await fetchFromPrimaryThenLegacy(
      () => updateViews(FRONTEND_BLOG_TABLE),
      () => updateViews(LEGACY_BLOG_TABLE)
    );
  } catch (error) {
    // View count is non-critical; keep this non-blocking.
    console.warn('incrementBlogViews warning:', error);
  }
}

export async function getFeaturedBlogs(limit: number = 3): Promise<Blog[]> {
  try {
    const fetchFeatured = async (tableName: string): Promise<RawBlog[]> => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    };

    const rows = await fetchFromPrimaryThenLegacy(
      () => fetchFeatured(FRONTEND_BLOG_TABLE),
      () => fetchFeatured(LEGACY_BLOG_TABLE)
    );
    return rows.map(toBlog);
  } catch (error) {
    console.error('Error in getFeaturedBlogs:', error);
    throw error;
  }
}

export async function getBlogTags(): Promise<string[]> {
  try {
    const fetchTags = async (tableName: string): Promise<string[]> => {
      const { data, error } = await supabase
        .from(tableName)
        .select('tags')
        .eq('is_published', true);

      if (error) throw error;
      const allTags = data?.flatMap((blog: any) => blog.tags || []) || [];
      return Array.from(new Set(allTags)).sort();
    };

    return await fetchFromPrimaryThenLegacy(
      () => fetchTags(FRONTEND_BLOG_TABLE),
      () => fetchTags(LEGACY_BLOG_TABLE)
    );
  } catch (error) {
    console.error('Error in getBlogTags:', error);
    throw error;
  }
}