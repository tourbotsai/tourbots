import { supabase } from '../supabase';
import { Guide, ResourceFilters } from '../types';

// Primary new table for frontend guide content.
// Falls back to legacy 'guides' until migration is complete.
const FRONTEND_GUIDE_TABLE = 'resource_guides';
const LEGACY_GUIDE_TABLE = 'guides';

type RawGuide = Record<string, any>;

function toGuide(raw: RawGuide): Guide {
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
    difficulty_level: raw.difficulty_level ?? raw.level ?? 'beginner',
    is_published: raw.is_published ?? raw.is_live ?? false,
    published_at: raw.published_at ?? raw.published_on ?? null,
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

async function queryGuidesTable(
  tableName: string,
  filters: ResourceFilters = {}
): Promise<RawGuide[]> {
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

  if (filters.difficulty) {
    query = query.eq('difficulty_level', filters.difficulty);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function queryGuideBySlug(tableName: string, slug: string): Promise<RawGuide | null> {
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

// Get all published guides with optional filtering
export async function getGuides(filters: ResourceFilters = {}): Promise<Guide[]> {
  try {
    const rows = await fetchFromPrimaryThenLegacy(
      () => queryGuidesTable(FRONTEND_GUIDE_TABLE, filters),
      () => queryGuidesTable(LEGACY_GUIDE_TABLE, filters)
    );
    return rows.map(toGuide);
  } catch (error) {
    console.error('Error in getGuides:', error);
    throw error;
  }
}

// Get a single guide by slug
export async function getGuideBySlug(slug: string): Promise<Guide | null> {
  try {
    const row = await fetchFromPrimaryThenLegacy(
      () => queryGuideBySlug(FRONTEND_GUIDE_TABLE, slug),
      () => queryGuideBySlug(LEGACY_GUIDE_TABLE, slug)
    );
    return row ? toGuide(row) : null;
  } catch (error) {
    console.error('Error in getGuideBySlug:', error);
    throw error;
  }
}

// Increment guide view count
export async function incrementGuideViews(guideId: string): Promise<void> {
  try {
    const updateViews = async (tableName: string) => {
      const { data: currentGuide, error: fetchError } = await supabase
        .from(tableName)
        .select('view_count')
        .eq('id', guideId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentGuide) return;

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ view_count: (currentGuide.view_count || 0) + 1 })
        .eq('id', guideId);

      if (updateError) throw updateError;
    };

    await fetchFromPrimaryThenLegacy(
      () => updateViews(FRONTEND_GUIDE_TABLE),
      () => updateViews(LEGACY_GUIDE_TABLE)
    );
  } catch (error) {
    // View count is non-critical; keep this non-blocking.
    console.warn('incrementGuideViews warning:', error);
  }
}

// Get featured guides (most viewed or recent)
export async function getFeaturedGuides(limit: number = 3): Promise<Guide[]> {
  try {
    const fetchFeatured = async (tableName: string): Promise<RawGuide[]> => {
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
      () => fetchFeatured(FRONTEND_GUIDE_TABLE),
      () => fetchFeatured(LEGACY_GUIDE_TABLE)
    );
    return rows.map(toGuide);
  } catch (error) {
    console.error('Error in getFeaturedGuides:', error);
    throw error;
  }
}

// Get guides by difficulty level
export async function getGuidesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced', limit: number = 6): Promise<Guide[]> {
  try {
    const fetchByDifficulty = async (tableName: string): Promise<RawGuide[]> => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('is_published', true)
        .eq('difficulty_level', difficulty)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    };

    const rows = await fetchFromPrimaryThenLegacy(
      () => fetchByDifficulty(FRONTEND_GUIDE_TABLE),
      () => fetchByDifficulty(LEGACY_GUIDE_TABLE)
    );
    return rows.map(toGuide);
  } catch (error) {
    console.error('Error in getGuidesByDifficulty:', error);
    throw error;
  }
}

// Get all unique tags from published guides
export async function getGuideTags(): Promise<string[]> {
  try {
    const fetchTags = async (tableName: string): Promise<string[]> => {
      const { data, error } = await supabase
        .from(tableName)
        .select('tags')
        .eq('is_published', true);

      if (error) throw error;
      const allTags = data?.flatMap((guide: any) => guide.tags || []) || [];
      return Array.from(new Set(allTags)).sort();
    };

    return await fetchFromPrimaryThenLegacy(
      () => fetchTags(FRONTEND_GUIDE_TABLE),
      () => fetchTags(LEGACY_GUIDE_TABLE)
    );
  } catch (error) {
    console.error('Error in getGuideTags:', error);
    throw error;
  }
} 